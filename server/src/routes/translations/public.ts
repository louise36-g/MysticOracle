/**
 * Translations Routes - Public endpoints
 * Endpoints for fetching translations (no auth required)
 */

import { Router } from 'express';
import prisma from '../../db/prisma.js';
import cacheService, { CacheService } from '../../services/cache.js';
import type { CachedLanguage, TranslationsResponse } from './shared.js';

const router = Router();

// Get all active languages
router.get('/languages', async (req, res) => {
  try {
    const cacheKey = 'translations:languages';
    const cached = await cacheService.get<{ languages: CachedLanguage[] }>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const languages = await prisma.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        nativeName: true,
        isDefault: true,
      },
    });

    const response = { languages };
    await cacheService.set(cacheKey, response, CacheService.TTL.TRANSLATIONS);
    res.json(response);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// Get current translation version (for client-side cache invalidation)
router.get('/version', async (req, res) => {
  try {
    const cacheKey = 'translations:version';
    const cached = await cacheService.get<number>(cacheKey);
    if (cached !== undefined) {
      return res.json({ version: cached });
    }

    const cacheVersion = await prisma.cacheVersion.findUnique({
      where: { entity: 'translations' },
    });
    const version = cacheVersion?.version || 1;

    await cacheService.set(cacheKey, version, CacheService.TTL.TRANSLATIONS);
    res.json({ version });
  } catch (error) {
    console.error('Error fetching translation version:', error);
    res.status(500).json({ error: 'Failed to fetch version' });
  }
});

// Get all translations for a language
router.get('/:langCode', async (req, res) => {
  try {
    const { langCode } = req.params;
    const cacheKey = `translations:${langCode}`;

    // Check cache first
    const cached = await cacheService.get<TranslationsResponse>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Fetch translations and version in parallel
    const [language, cacheVersion] = await Promise.all([
      prisma.language.findUnique({
        where: { code: langCode },
        include: {
          translations: {
            select: { key: true, value: true },
          },
        },
      }),
      prisma.cacheVersion.findUnique({
        where: { entity: 'translations' },
      }),
    ]);

    if (!language) {
      return res.status(404).json({ error: 'Language not found' });
    }

    // Convert array to key-value object
    const translations: Record<string, string> = {};
    for (const t of language.translations) {
      translations[t.key] = t.value;
    }

    const response = {
      language: {
        code: language.code,
        name: language.name,
        nativeName: language.nativeName,
      },
      translations,
      version: cacheVersion?.version || 1,
    };

    await cacheService.set(cacheKey, response, CacheService.TTL.TRANSLATIONS);
    res.json(response);
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

export default router;
