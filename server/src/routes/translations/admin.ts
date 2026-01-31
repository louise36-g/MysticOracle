/**
 * Translations Routes - Admin endpoints
 * Endpoints for managing translations (requires admin auth)
 */

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../db/prisma.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { debug } from '../../lib/logger.js';
import { invalidateTranslationCache } from './shared.js';
import { defaultTranslations } from './defaults.js';

const router = Router();

// Get all languages with translation count (admin)
router.get('/languages', requireAuth, requireAdmin, async (req, res) => {
  try {
    const languages = await prisma.language.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { translations: true } },
      },
    });
    res.json({ languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

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

router.post('/languages', requireAuth, requireAdmin, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error creating language:', error);
    res.status(500).json({ error: 'Failed to create language' });
  }
});

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

router.patch('/languages/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error updating language:', error);
    res.status(500).json({ error: 'Failed to update language' });
  }
});

// Delete language (and all its translations)
router.delete('/languages/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.language.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting language:', error);
    res.status(500).json({ error: 'Failed to delete language' });
  }
});

// Get all translations for a language (admin - with full details)
router.get('/:langCode', requireAuth, requireAdmin, async (req, res) => {
  try {
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
      return res.status(404).json({ error: 'Language not found' });
    }

    res.json({ language, translations: language.translations });
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

// Create/Update translation (upsert)
const upsertTranslationSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  languageId: z.string().min(1),
});

router.post('/translations', requireAuth, requireAdmin, async (req, res) => {
  try {
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

    // Invalidate cache and bump version
    await invalidateTranslationCache();

    res.json({ success: true, translation });
  } catch (error) {
    console.error('Error upserting translation:', error);
    res.status(500).json({ error: 'Failed to save translation' });
  }
});

// Bulk upsert translations
const bulkUpsertSchema = z.object({
  languageId: z.string().min(1),
  translations: z.record(z.string()), // { key: value }
});

router.post('/translations/bulk', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { languageId, translations } = bulkUpsertSchema.parse(req.body);

    const operations = Object.entries(translations).map(([key, value]) =>
      prisma.translation.upsert({
        where: { key_languageId: { key, languageId } },
        create: { key, value, language: { connect: { id: languageId } } },
        update: { value },
      })
    );

    await prisma.$transaction(operations);

    // Invalidate cache and bump version
    await invalidateTranslationCache();

    res.json({ success: true, count: Object.keys(translations).length });
  } catch (error) {
    console.error('Error bulk upserting translations:', error);
    res.status(500).json({ error: 'Failed to save translations' });
  }
});

// Delete translation
router.delete('/translations/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.translation.delete({ where: { id } });

    // Invalidate cache and bump version
    await invalidateTranslationCache();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting translation:', error);
    res.status(500).json({ error: 'Failed to delete translation' });
  }
});

// Seed default translations
router.post('/seed', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Create default languages
    const enLang = await prisma.language.upsert({
      where: { code: 'en' },
      create: { code: 'en', name: 'English', nativeName: 'English', isDefault: true, sortOrder: 0 },
      update: {},
    });

    const frLang = await prisma.language.upsert({
      where: { code: 'fr' },
      create: { code: 'fr', name: 'French', nativeName: 'Français', sortOrder: 1 },
      update: {},
    });

    // Insert all translations in batches to avoid timeout
    const BATCH_SIZE = 100;
    const entries = Object.entries(defaultTranslations);
    let processedCount = 0;

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const operations = [];

      for (const [key, values] of batch) {
        operations.push(
          prisma.translation.upsert({
            where: { key_languageId: { key, languageId: enLang.id } },
            create: { key, value: values.en, language: { connect: { id: enLang.id } } },
            update: { value: values.en },
          }),
          prisma.translation.upsert({
            where: { key_languageId: { key, languageId: frLang.id } },
            create: { key, value: values.fr, language: { connect: { id: frLang.id } } },
            update: { value: values.fr },
          })
        );
      }

      await prisma.$transaction(operations);
      processedCount += batch.length;
      debug.log(`[Translations] Processed ${processedCount}/${entries.length} keys`);
    }

    // Invalidate cache and bump version
    await invalidateTranslationCache();

    res.json({
      success: true,
      languages: 2,
      translations: Object.keys(defaultTranslations).length * 2,
    });
  } catch (error) {
    console.error('Error seeding translations:', error);
    res.status(500).json({ error: 'Failed to seed translations' });
  }
});

export default router;
