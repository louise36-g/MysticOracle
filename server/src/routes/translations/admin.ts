/**
 * Translations Routes - Admin endpoints
 * Endpoints for managing translations (requires admin auth)
 */

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../db/prisma.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { NotFoundError } from '../../shared/errors/ApplicationError.js';
import { debug } from '../../lib/logger.js';
import { invalidateTranslationCache } from './shared.js';
import { defaultTranslations } from './defaults.js';

const router = Router();

// Get all languages with translation count (admin)
router.get(
  '/languages',
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const languages = await prisma.language.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { translations: true } },
      },
    });
    res.json({ languages });
  })
);

// Create language
const createLanguageSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(5)
    .regex(/^[a-z]{2,5}$/, 'Language code must be lowercase letters'),
  name: z.string().min(1),
  nativeName: z.string().min(1),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

router.post(
  '/languages',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = createLanguageSchema.parse(req.body);

    // If this is set as default, unset other defaults
    if (parsed.isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const language = await prisma.language.create({
      data: {
        code: parsed.code,
        name: parsed.name,
        nativeName: parsed.nativeName,
        isActive: parsed.isActive,
        isDefault: parsed.isDefault,
        sortOrder: parsed.sortOrder,
      },
    });
    res.json({ success: true, language });
  })
);

// Update language schema
const updateLanguageSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(5)
    .regex(/^[a-z]{2,5}$/, 'Language code must be lowercase letters')
    .optional(),
  name: z.string().min(1).optional(),
  nativeName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

router.patch(
  '/languages/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = updateLanguageSchema.parse(req.body);

    if (data.isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const language = await prisma.language.update({
      where: { id },
      data,
    });
    res.json({ success: true, language });
  })
);

// Delete language (and all its translations)
router.delete(
  '/languages/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.language.delete({ where: { id } });
    res.json({ success: true });
  })
);

// Get all translations for a language (admin - with full details)
router.get(
  '/:langCode',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { langCode } = req.params;

    const language = await prisma.language.findUnique({
      where: { code: langCode },
      include: {
        translations: {
          orderBy: { key: 'asc' },
        },
      },
    });

    if (!language) {
      throw new NotFoundError('Language');
    }

    res.json({ language, translations: language.translations });
  })
);

// Create/Update translation (upsert)
const upsertTranslationSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  languageId: z.string().min(1),
});

router.post(
  '/translations',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { key, value, languageId } = upsertTranslationSchema.parse(req.body);

    const translation = await prisma.translation.upsert({
      where: {
        key_languageId: { key, languageId },
      },
      create: {
        key,
        value,
        language: { connect: { id: languageId } },
      },
      update: { value },
    });

    // Invalidate cache and bump version (non-fatal if cache fails)
    await invalidateTranslationCache().catch(err =>
      debug.log('[Translations] Cache invalidation failed:', err)
    );

    res.json({ success: true, translation });
  })
);

// Bulk upsert translations
const bulkUpsertSchema = z.object({
  languageId: z.string().min(1),
  translations: z.record(z.string()), // { key: value }
});

router.post(
  '/translations/bulk',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { languageId, translations } = bulkUpsertSchema.parse(req.body);

    const operations = Object.entries(translations).map(([key, value]) =>
      prisma.translation.upsert({
        where: { key_languageId: { key, languageId } },
        create: { key, value, language: { connect: { id: languageId } } },
        update: { value },
      })
    );

    await prisma.$transaction(operations);

    // Invalidate cache and bump version (non-fatal if cache fails)
    await invalidateTranslationCache().catch(err =>
      debug.log('[Translations] Cache invalidation failed:', err)
    );

    res.json({ success: true, count: Object.keys(translations).length });
  })
);

// Delete translation
router.delete(
  '/translations/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.translation.delete({ where: { id } });

    // Invalidate cache and bump version (non-fatal if cache fails)
    await invalidateTranslationCache().catch(err =>
      debug.log('[Translations] Cache invalidation failed:', err)
    );

    res.json({ success: true });
  })
);

// Seed default translations
router.post(
  '/seed',
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    // Create default languages
    const enLang = await prisma.language.upsert({
      where: { code: 'en' },
      create: { code: 'en', name: 'English', nativeName: 'English', isDefault: true, sortOrder: 0 },
      update: {},
    });

    const frLang = await prisma.language.upsert({
      where: { code: 'fr' },
      create: { code: 'fr', name: 'French', nativeName: 'Francais', sortOrder: 1 },
      update: {},
    });

    // Fetch all existing (key, languageId) pairs in one query so we only INSERT
    // keys that are genuinely missing — skipping the expensive upsert loop for
    // keys already in the DB. This keeps the operation fast even with 1000+ keys.
    const existingRows = await prisma.translation.findMany({
      select: { key: true, languageId: true },
    });
    const existingSet = new Set(existingRows.map(r => `${r.key}|${r.languageId}`));

    const allEntries = Object.entries(defaultTranslations);
    const missingEn = allEntries.filter(([key]) => !existingSet.has(`${key}|${enLang.id}`));
    const missingFr = allEntries.filter(([key]) => !existingSet.has(`${key}|${frLang.id}`));

    debug.log(
      `[Translations] ${allEntries.length} total keys — ${missingEn.length} new EN, ${missingFr.length} new FR`
    );

    // Insert only missing translations in batches
    const BATCH_SIZE = 50;
    const toInsert: { key: string; value: string; languageId: string }[] = [
      ...missingEn.map(([key, values]) => ({ key, value: values.en, languageId: enLang.id })),
      ...missingFr.map(([key, values]) => ({ key, value: values.fr, languageId: frLang.id })),
    ];

    let insertedCount = 0;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      await prisma.translation.createMany({ data: batch, skipDuplicates: true });
      insertedCount += batch.length;
      debug.log(`[Translations] Inserted ${insertedCount}/${toInsert.length}`);
    }

    // Clean up orphaned duplicate keys (e.g. tarot_cards_2, credits_3)
    // These were created by auto-extraction and are no longer referenced in code.
    // Safe: only deletes _N suffixed keys where the base key also exists.
    const validKeys = new Set(Object.keys(defaultTranslations));
    const allTranslations = await prisma.translation.findMany({
      select: { id: true, key: true },
    });

    const duplicatePattern = /_[2-9]$/;
    const orphanedIds: string[] = [];
    for (const t of allTranslations) {
      if (duplicatePattern.test(t.key)) {
        const baseKey = t.key.replace(duplicatePattern, '');
        // Only delete if the base key exists in defaults (safe guard)
        if (validKeys.has(baseKey)) {
          orphanedIds.push(t.id);
        }
      }
    }

    let deletedCount = 0;
    if (orphanedIds.length > 0) {
      const result = await prisma.translation.deleteMany({
        where: { id: { in: orphanedIds } },
      });
      deletedCount = result.count;
      debug.log(`[Translations] Cleaned up ${deletedCount} orphaned duplicate keys`);
    }

    // Invalidate cache and bump version (non-fatal if cache fails)
    await invalidateTranslationCache().catch(err =>
      debug.log('[Translations] Cache invalidation failed:', err)
    );

    res.json({
      success: true,
      languages: 2,
      totalKeys: allEntries.length,
      inserted: insertedCount,
      cleanedUp: deletedCount,
    });
  })
);

export default router;
