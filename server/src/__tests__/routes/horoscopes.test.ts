/**
 * Horoscope Routes Tests
 * Tests for daily horoscope retrieval and follow-up questions
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock Prisma
vi.mock('../../db/prisma.js', () => ({
  default: {
    horoscopeCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    horoscopeQA: {
      create: vi.fn(),
    },
  },
}));

// Mock cache service
vi.mock('../../services/cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  debug: { log: vi.fn() },
}));

// Mock auth middleware
vi.mock('../../middleware/auth.js', () => ({
  optionalAuth: (_req: any, _res: any, next: any) => next(),
}));

// Mock generate module
vi.mock('../../routes/horoscopes/generate.js', () => ({
  generateHoroscope: vi.fn(),
}));

// Mock prompt service
vi.mock('../../services/promptService.js', () => ({
  getHoroscopePrompt: vi.fn().mockResolvedValue('test prompt'),
  getHoroscopeFollowUpPrompt: vi.fn().mockResolvedValue('test followup prompt'),
}));

// Mock OpenRouter service
vi.mock('../../services/openRouterService.js', () => ({
  openRouterService: {
    generateHoroscope: vi.fn(),
    generateHoroscopeFollowUp: vi.fn(),
  },
}));

// Mock Planetary service
vi.mock('../../services/planetaryCalculationService.js', () => ({
  PlanetaryCalculationService: vi.fn().mockImplementation(() => ({
    calculatePlanetaryData: vi.fn(),
    formatForPrompt: vi.fn(),
  })),
}));

// Import after mocks
import horoscopeRouter from '../../routes/horoscopes/routes.js';
import prisma from '../../db/prisma.js';
import cacheService from '../../services/cache.js';
import { generateHoroscope } from '../../routes/horoscopes/generate.js';
import { openRouterService } from '../../services/openRouterService.js';

// Set up app
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.auth = { userId: 'user-1', sessionId: 'sess-1' };
  next();
});
app.use('/', horoscopeRouter);

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.statusCode || (err.name === 'ZodError' ? 400 : 500);
  const body =
    err.name === 'ZodError'
      ? { error: 'Validation failed', details: err.errors }
      : { error: err.message || 'Internal server error' };
  res.status(status).json(body);
});

// Typed mocks
const mockedPrisma = prisma as unknown as {
  horoscopeCache: {
    findUnique: Mock;
    upsert: Mock;
  };
  horoscopeQA: {
    create: Mock;
  };
};

const mockedCache = cacheService as unknown as {
  get: Mock;
  set: Mock;
};

const mockedGenerate = generateHoroscope as Mock;

const mockedOpenRouter = openRouterService as unknown as {
  generateHoroscopeFollowUp: Mock;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Horoscope Routes', () => {
  describe('GET /:sign', () => {
    it('should return horoscope from memory cache', async () => {
      const cachedData = {
        horoscope: 'Today the stars align for Aries...',
        createdAt: new Date('2026-03-08'),
      };
      mockedCache.get.mockResolvedValue(cachedData);

      const res = await request(app).get('/Aries');

      expect(res.status).toBe(200);
      expect(res.body.horoscope).toBe(cachedData.horoscope);
      expect(res.body.cached).toBe(true);
      expect(mockedPrisma.horoscopeCache.findUnique).not.toHaveBeenCalled();
    });

    it('should return horoscope from DB when memory cache misses', async () => {
      mockedCache.get.mockResolvedValue(null);
      const dbCached = {
        horoscope: 'DB cached horoscope text',
        createdAt: new Date('2026-03-08'),
      };
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(dbCached);

      const res = await request(app).get('/Aries');

      expect(res.status).toBe(200);
      expect(res.body.horoscope).toBe(dbCached.horoscope);
      expect(res.body.cached).toBe(true);
      // Should populate memory cache from DB
      expect(mockedCache.set).toHaveBeenCalled();
    });

    it('should generate new horoscope when no cache exists', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(null);
      mockedGenerate.mockResolvedValue('Freshly generated horoscope for Aries');
      mockedPrisma.horoscopeCache.upsert.mockResolvedValue({});

      const res = await request(app).get('/Aries');

      expect(res.status).toBe(200);
      expect(res.body.horoscope).toBe('Freshly generated horoscope for Aries');
      expect(res.body.cached).toBe(false);
      // Should save to both DB and memory cache
      expect(mockedPrisma.horoscopeCache.upsert).toHaveBeenCalled();
      expect(mockedCache.set).toHaveBeenCalled();
    });

    it('should normalize French sign names', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(null);
      mockedGenerate.mockResolvedValue('Horoscope pour Bélier');
      mockedPrisma.horoscopeCache.upsert.mockResolvedValue({});

      const res = await request(app).get('/Bélier');

      expect(res.status).toBe(200);
      // The sign should be normalized to 'Aries' for cache key
      expect(mockedPrisma.horoscopeCache.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sign_language_date: expect.objectContaining({
              sign: 'Aries',
            }),
          }),
        })
      );
    });

    it('should return 400 for invalid sign', async () => {
      const res = await request(app).get('/InvalidSign');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid sign or language');
    });

    it('should return 503 on planetary calculation failure', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(null);
      mockedGenerate.mockRejectedValue(new Error('PLANETARY_CALCULATION_FAILED'));
      // No yesterday fallback
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/Aries');

      expect(res.status).toBe(503);
      expect(res.body.code).toBe('PLANETARY_CALCULATION_FAILED');
      expect(res.body.retryable).toBe(true);
    });

    it('should return 500 with fallback when generation fails and yesterday exists', async () => {
      // First call: memory cache miss
      mockedCache.get.mockResolvedValue(null);
      // Second call in try block: today's DB cache miss
      // Third call in catch block: yesterday's horoscope
      mockedPrisma.horoscopeCache.findUnique
        .mockResolvedValueOnce(null) // today - miss
        .mockResolvedValueOnce({ horoscope: 'Yesterday horoscope' }); // yesterday - hit
      mockedGenerate.mockRejectedValue(new Error('AI service down'));

      const res = await request(app).get('/Aries');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('AI service down');
      expect(res.body.retryable).toBe(true);
      expect(res.body.fallback).toBeDefined();
      expect(res.body.fallback.horoscope).toBe('Yesterday horoscope');
    });

    it('should return 500 without fallback when both fail', async () => {
      mockedCache.get.mockResolvedValue(null);
      mockedPrisma.horoscopeCache.findUnique
        .mockResolvedValueOnce(null) // today - miss
        .mockResolvedValueOnce(null); // yesterday - miss
      mockedGenerate.mockRejectedValue(new Error('AI service down'));

      const res = await request(app).get('/Aries');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('AI service down');
      expect(res.body.retryable).toBe(true);
    });
  });

  describe('POST /:sign/followup', () => {
    it('should return cached answer when question was already asked', async () => {
      const cachedHoroscope = {
        id: 'horo-1',
        questions: [
          {
            question: 'What about love?',
            answer: 'Love looks promising today.',
          },
        ],
      };
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(cachedHoroscope);

      const res = await request(app).post('/Aries/followup').send({
        question: 'What about love?',
        horoscope: 'Today is a great day...',
      });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBe('Love looks promising today.');
      expect(res.body.cached).toBe(true);
      expect(mockedOpenRouter.generateHoroscopeFollowUp).not.toHaveBeenCalled();
    });

    it('should generate new answer when not cached', async () => {
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue({
        id: 'horo-1',
        questions: [],
      });
      mockedOpenRouter.generateHoroscopeFollowUp.mockResolvedValue(
        'The stars suggest a positive outlook for your career.'
      );
      mockedPrisma.horoscopeQA.create.mockResolvedValue({});

      const res = await request(app).post('/Aries/followup').send({
        question: 'What about my career?',
        horoscope: 'Today is a great day...',
      });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBe('The stars suggest a positive outlook for your career.');
      expect(res.body.cached).toBe(false);
      // Should cache the Q&A
      expect(mockedPrisma.horoscopeQA.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            horoscopeCacheId: 'horo-1',
            question: 'What about my career?',
          }),
        })
      );
    });

    it('should return 400 when question is missing', async () => {
      const res = await request(app).post('/Aries/followup').send({
        horoscope: 'Today is a great day...',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should return 400 when horoscope is missing', async () => {
      const res = await request(app).post('/Aries/followup').send({
        question: 'What about love?',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should pass conversation history to the AI', async () => {
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue({
        id: 'horo-1',
        questions: [],
      });
      mockedOpenRouter.generateHoroscopeFollowUp.mockResolvedValue('Follow up answer');
      mockedPrisma.horoscopeQA.create.mockResolvedValue({});

      const history = [
        { role: 'user', content: 'Tell me about love' },
        { role: 'assistant', content: 'Love is in the air' },
      ];

      const res = await request(app).post('/Aries/followup').send({
        question: 'And career?',
        horoscope: 'Today is a great day...',
        history,
      });

      expect(res.status).toBe(200);
      // OpenRouter should receive conversation history
      expect(mockedOpenRouter.generateHoroscopeFollowUp).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'Tell me about love' }),
        ]),
        expect.any(Object)
      );
    });
  });
});
