/**
 * Translations Routes Tests
 * Tests translation fetching, caching, and fallback chains
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import express from 'express';
import request from 'supertest';

// Must mock before any imports that use these modules
vi.mock('../../db/prisma.js', () => ({
  default: {
    language: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    cacheVersion: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../services/cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
  CacheService: {
    TTL: {
      TRANSLATIONS: 300,
    },
  },
}));

// Import after mocks are set up
import translationsRouter from '../../routes/translations/public.js';
import prisma from '../../db/prisma.js';
import cacheService from '../../services/cache.js';

const app = express();
app.use(express.json());
app.use('/translations', translationsRouter);

// Type the mocked prisma
const mockedPrisma = prisma as {
  language: {
    findMany: Mock;
    findUnique: Mock;
  };
  cacheVersion: {
    findUnique: Mock;
  };
};

const mockedCacheService = cacheService as {
  get: Mock;
  set: Mock;
};

describe('Translations Public Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /translations/languages', () => {
    const mockLanguages = [
      {
        id: 'lang-1',
        code: 'en',
        name: 'English',
        nativeName: 'English',
        isDefault: true,
      },
      {
        id: 'lang-2',
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        isDefault: false,
      },
    ];

    it('should return list of active languages', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.language.findMany.mockResolvedValue(mockLanguages);

      const res = await request(app).get('/translations/languages');

      expect(res.status).toBe(200);
      expect(res.body.languages).toHaveLength(2);
      expect(res.body.languages[0].code).toBe('en');
      expect(res.body.languages[1].code).toBe('fr');
    });

    it('should return cached languages when available', async () => {
      const cachedData = { languages: mockLanguages };
      mockedCacheService.get.mockResolvedValue(cachedData);

      const res = await request(app).get('/translations/languages');

      expect(res.status).toBe(200);
      expect(res.body.languages).toHaveLength(2);
      expect(mockedPrisma.language.findMany).not.toHaveBeenCalled();
    });

    it('should cache languages after fetching', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.language.findMany.mockResolvedValue(mockLanguages);

      await request(app).get('/translations/languages');

      expect(mockedCacheService.set).toHaveBeenCalledWith(
        'translations:languages',
        { languages: mockLanguages },
        300
      );
    });

    it('should return 500 on database error', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.language.findMany.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/translations/languages');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch languages');
    });

    it('should return empty array when no languages exist', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.language.findMany.mockResolvedValue([]);

      const res = await request(app).get('/translations/languages');

      expect(res.status).toBe(200);
      expect(res.body.languages).toHaveLength(0);
    });
  });

  describe('GET /translations/version', () => {
    it('should return cached version when available', async () => {
      mockedCacheService.get.mockResolvedValue(15);

      const res = await request(app).get('/translations/version');

      expect(res.status).toBe(200);
      expect(res.body.version).toBe(15);
      expect(mockedPrisma.cacheVersion.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('GET /translations/:langCode', () => {
    const mockLanguageWithTranslations = {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      translations: [
        { key: 'nav.home', value: 'Home' },
        { key: 'nav.about', value: 'About' },
        { key: 'common.loading', value: 'Loading...' },
      ],
    };

    it('should return translations for valid language code', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.language.findUnique.mockResolvedValue(mockLanguageWithTranslations);
      mockedPrisma.cacheVersion.findUnique.mockResolvedValue({ version: 5 });

      const res = await request(app).get('/translations/en');

      expect(res.status).toBe(200);
      expect(res.body.language.code).toBe('en');
      expect(res.body.translations).toEqual({
        'nav.home': 'Home',
        'nav.about': 'About',
        'common.loading': 'Loading...',
      });
      expect(res.body.version).toBe(5);
    });

    it('should return cached translations when available', async () => {
      const cachedTranslations = {
        language: { code: 'en', name: 'English', nativeName: 'English' },
        translations: { 'nav.home': 'Home' },
        version: 5,
      };
      mockedCacheService.get.mockResolvedValue(cachedTranslations);

      const res = await request(app).get('/translations/en');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cachedTranslations);
      expect(mockedPrisma.language.findUnique).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent language', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.language.findUnique.mockResolvedValue(null);
      mockedPrisma.cacheVersion.findUnique.mockResolvedValue({ version: 1 });

      const res = await request(app).get('/translations/xyz');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Language not found');
    });

    it('should cache translations after fetching', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.language.findUnique.mockResolvedValue(mockLanguageWithTranslations);
      mockedPrisma.cacheVersion.findUnique.mockResolvedValue({ version: 5 });

      await request(app).get('/translations/en');

      expect(mockedCacheService.set).toHaveBeenCalledWith(
        'translations:en',
        expect.objectContaining({
          language: { code: 'en', name: 'English', nativeName: 'English' },
          translations: {
            'nav.home': 'Home',
            'nav.about': 'About',
            'common.loading': 'Loading...',
          },
          version: 5,
        }),
        300
      );
    });

    it('should default to version 1 when no version exists', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.language.findUnique.mockResolvedValue(mockLanguageWithTranslations);
      mockedPrisma.cacheVersion.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/translations/en');

      expect(res.status).toBe(200);
      expect(res.body.version).toBe(1);
    });

    it('should handle empty translations array', async () => {
      const languageWithNoTranslations = {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        translations: [],
      };
      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.language.findUnique.mockResolvedValue(languageWithNoTranslations);
      mockedPrisma.cacheVersion.findUnique.mockResolvedValue({ version: 1 });

      const res = await request(app).get('/translations/de');

      expect(res.status).toBe(200);
      expect(res.body.translations).toEqual({});
    });

    it('should return 500 on database error', async () => {
      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.language.findUnique.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/translations/en');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch translations');
    });

    it('should fetch French translations correctly', async () => {
      const frenchLanguage = {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        translations: [
          { key: 'nav.home', value: 'Accueil' },
          { key: 'nav.about', value: 'À propos' },
        ],
      };
      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.language.findUnique.mockResolvedValue(frenchLanguage);
      mockedPrisma.cacheVersion.findUnique.mockResolvedValue({ version: 3 });

      const res = await request(app).get('/translations/fr');

      expect(res.status).toBe(200);
      expect(res.body.language.code).toBe('fr');
      expect(res.body.language.nativeName).toBe('Français');
      expect(res.body.translations['nav.home']).toBe('Accueil');
    });
  });

  describe('Caching Behavior', () => {
    it('should use separate cache keys for different languages', async () => {
      const enLanguage = {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        translations: [{ key: 'greeting', value: 'Hello' }],
      };
      const frLanguage = {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        translations: [{ key: 'greeting', value: 'Bonjour' }],
      };

      mockedCacheService.get.mockResolvedValue(null);
      mockedPrisma.cacheVersion.findUnique.mockResolvedValue({ version: 1 });

      // Fetch English
      mockedPrisma.language.findUnique.mockResolvedValue(enLanguage);
      await request(app).get('/translations/en');

      // Fetch French
      mockedPrisma.language.findUnique.mockResolvedValue(frLanguage);
      await request(app).get('/translations/fr');

      // Verify different cache keys used
      expect(mockedCacheService.set).toHaveBeenCalledWith(
        'translations:en',
        expect.anything(),
        expect.anything()
      );
      expect(mockedCacheService.set).toHaveBeenCalledWith(
        'translations:fr',
        expect.anything(),
        expect.anything()
      );
    });
  });
});
