/**
 * Readings Routes Tests
 * Tests for POST /, GET /:id, POST /:id/follow-up, PATCH /:id,
 * GET /horoscope/:sign (via horoscopes router)
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock auth middleware
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn((_req: any, _res: any, next: any) => {
    _req.auth = { userId: 'test-user-123', sessionId: 'test-session' };
    next();
  }),
  optionalAuth: vi.fn((_req: any, _res: any, next: any) => {
    next();
  }),
}));

// Mock idempotency middleware (pass-through)
vi.mock('../../middleware/idempotency.js', () => ({
  idempotent: vi.fn((_req: any, _res: any, next: any) => next()),
}));

// Mock prisma (for horoscope cache)
vi.mock('../../db/prisma.js', () => ({
  default: {
    horoscopeCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  debug: { log: vi.fn() },
  logger: { info: vi.fn(), error: vi.fn() },
}));

// Mock cache service
vi.mock('../../services/cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock horoscope generation
vi.mock('../../routes/horoscopes/generate.js', () => ({
  generateHoroscope: vi.fn(),
}));

// Mock prompt service
vi.mock('../../services/promptService.js', () => ({
  getHoroscopePrompt: vi.fn(),
  getHoroscopeFollowUpPrompt: vi.fn(),
}));

// Mock openRouterService
vi.mock('../../services/openRouterService.js', () => ({
  openRouterService: {
    generateHoroscope: vi.fn(),
    generateHoroscopeFollowUp: vi.fn(),
  },
}));

// Mock planetaryCalculationService
vi.mock('../../services/planetaryCalculationService.js', () => ({
  PlanetaryCalculationService: vi.fn().mockImplementation(() => ({
    calculatePlanetaryData: vi.fn(),
    formatForPrompt: vi.fn(),
  })),
}));

import readingsRouter from '../../routes/readings.js';
import horoscopesRouter from '../../routes/horoscopes/index.js';
import prisma from '../../db/prisma.js';
import cacheService from '../../services/cache.js';
import { generateHoroscope } from '../../routes/horoscopes/generate.js';

const mockedPrisma = prisma as unknown as {
  horoscopeCache: {
    findUnique: Mock;
    upsert: Mock;
  };
};

const mockedCacheService = cacheService as unknown as {
  get: Mock;
  set: Mock;
};

const mockedGenerateHoroscope = generateHoroscope as Mock;

// DI Container mock
const mockUseCases: Record<string, Record<string, Mock>> = {
  createReadingUseCase: { execute: vi.fn() },
  getReadingUseCase: { execute: vi.fn() },
  addFollowUpUseCase: { execute: vi.fn() },
  updateReflectionUseCase: { execute: vi.fn() },
};

describe('Readings Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Inject mock DI container
    app.use((req: any, _res: any, next: any) => {
      req.container = {
        resolve: (name: string) => mockUseCases[name],
      };
      next();
    });
    app.use('/', readingsRouter);

    // Error handler for tests (matches production behavior)
    app.use((err: any, _req: any, res: any, _next: any) => {
      const status = err.statusCode || (err.name === 'ZodError' ? 400 : 500);
      const body =
        err.name === 'ZodError'
          ? { error: 'Validation failed', details: err.errors }
          : { error: err.message || 'Internal server error' };
      res.status(status).json(body);
    });
  });

  // ============================================
  // POST / — Create reading
  // ============================================
  describe('POST /', () => {
    const validBody = {
      spreadType: 'three-card',
      cards: [
        { cardId: 'the-fool', position: 0, isReversed: false },
        { cardId: 'the-magician', position: 1, isReversed: true },
        { cardId: 'the-high-priestess', position: 2 },
      ],
      interpretation: 'Your reading reveals a journey of transformation.',
    };

    it('should return 400 when spreadType is missing', async () => {
      const { spreadType: _spreadType, ...body } = validBody;
      const res = await request(app).post('/').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid request/i);
    });

    it('should return 400 when cards array is empty', async () => {
      const res = await request(app)
        .post('/')
        .send({ ...validBody, cards: [] });
      expect(res.status).toBe(400);
    });

    it('should return 400 when interpretation is missing', async () => {
      const { interpretation: _interpretation, ...body } = validBody;
      const res = await request(app).post('/').send(body);
      expect(res.status).toBe(400);
    });

    it('should return 201 on successful creation', async () => {
      const mockReading = { id: 'reading-1', spreadType: 'three-card' };
      mockUseCases.createReadingUseCase.execute.mockResolvedValue({
        success: true,
        reading: mockReading,
      });

      const res = await request(app).post('/').send(validBody);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockReading);
    });

    it('should return 404 when user not found', async () => {
      mockUseCases.createReadingUseCase.execute.mockResolvedValue({
        success: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });

      const res = await request(app).post('/').send(validBody);
      expect(res.status).toBe(404);
    });

    it('should return 402 when insufficient credits', async () => {
      mockUseCases.createReadingUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Insufficient credits',
        errorCode: 'INSUFFICIENT_CREDITS',
      });

      const res = await request(app).post('/').send(validBody);
      expect(res.status).toBe(402);
    });

    it('should return 400 on validation error from use case', async () => {
      mockUseCases.createReadingUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Invalid spread',
        errorCode: 'VALIDATION_ERROR',
      });

      const res = await request(app).post('/').send(validBody);
      expect(res.status).toBe(400);
    });

    it('should return 500 on unexpected error', async () => {
      mockUseCases.createReadingUseCase.execute.mockRejectedValue(new Error('boom'));

      const res = await request(app).post('/').send(validBody);
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('boom');
    });
  });

  // ============================================
  // GET /:id — Get reading
  // ============================================
  describe('GET /:id', () => {
    it('should return 200 on success', async () => {
      const mockReading = { id: 'reading-1', spreadType: 'celtic-cross' };
      mockUseCases.getReadingUseCase.execute.mockResolvedValue({
        success: true,
        reading: mockReading,
      });

      const res = await request(app).get('/reading-1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockReading);
      expect(mockUseCases.getReadingUseCase.execute).toHaveBeenCalledWith({
        userId: 'test-user-123',
        readingId: 'reading-1',
      });
    });

    it('should return 404 when not found', async () => {
      mockUseCases.getReadingUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Reading not found',
      });

      const res = await request(app).get('/nonexistent');
      expect(res.status).toBe(404);
    });

    it('should return 500 on unexpected error', async () => {
      mockUseCases.getReadingUseCase.execute.mockRejectedValue(new Error('boom'));

      const res = await request(app).get('/reading-1');
      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // POST /:id/follow-up
  // ============================================
  describe('POST /:id/follow-up', () => {
    const validFollowUp = {
      question: 'What about love?',
      answer: 'The stars indicate positive energy.',
    };

    it('should return 400 when question is missing', async () => {
      const res = await request(app).post('/reading-1/follow-up').send({ answer: 'An answer' });
      expect(res.status).toBe(400);
    });

    it('should return 400 when answer is missing', async () => {
      const res = await request(app).post('/reading-1/follow-up').send({ question: 'A question?' });
      expect(res.status).toBe(400);
    });

    it('should return 201 on success', async () => {
      const mockFollowUp = { id: 'followup-1', question: 'What about love?' };
      mockUseCases.addFollowUpUseCase.execute.mockResolvedValue({
        success: true,
        followUp: mockFollowUp,
      });

      const res = await request(app).post('/reading-1/follow-up').send(validFollowUp);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockFollowUp);
    });

    it('should return 404 when reading not found', async () => {
      mockUseCases.addFollowUpUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Reading not found',
        errorCode: 'READING_NOT_FOUND',
      });

      const res = await request(app).post('/reading-1/follow-up').send(validFollowUp);
      expect(res.status).toBe(404);
    });

    it('should return 402 when insufficient credits', async () => {
      mockUseCases.addFollowUpUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Insufficient credits',
        errorCode: 'INSUFFICIENT_CREDITS',
      });

      const res = await request(app).post('/reading-1/follow-up').send(validFollowUp);
      expect(res.status).toBe(402);
    });

    it('should return 500 on unexpected error', async () => {
      mockUseCases.addFollowUpUseCase.execute.mockRejectedValue(new Error('boom'));

      const res = await request(app).post('/reading-1/follow-up').send(validFollowUp);
      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // PATCH /:id — Update reflection
  // ============================================
  describe('PATCH /:id', () => {
    it('should return 400 when userReflection is missing', async () => {
      const res = await request(app).patch('/reading-1').send({});
      expect(res.status).toBe(400);
    });

    it('should return 400 when userReflection exceeds max length', async () => {
      const res = await request(app)
        .patch('/reading-1')
        .send({ userReflection: 'x'.repeat(1001) });
      expect(res.status).toBe(400);
    });

    it('should return 200 on success', async () => {
      const mockReading = { id: 'reading-1', userReflection: 'My thoughts' };
      mockUseCases.updateReflectionUseCase.execute.mockResolvedValue({
        success: true,
        reading: mockReading,
      });

      const res = await request(app).patch('/reading-1').send({ userReflection: 'My thoughts' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reading).toEqual(mockReading);
    });

    it('should return 404 when reading not found', async () => {
      mockUseCases.updateReflectionUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Not found',
        errorCode: 'NOT_FOUND',
      });

      const res = await request(app).patch('/reading-1').send({ userReflection: 'My thoughts' });
      expect(res.status).toBe(404);
    });

    it('should return 500 on unexpected error', async () => {
      mockUseCases.updateReflectionUseCase.execute.mockRejectedValue(new Error('boom'));

      const res = await request(app).patch('/reading-1').send({ userReflection: 'My thoughts' });
      expect(res.status).toBe(500);
    });
  });
});

// ============================================
// Horoscope Routes (separate router)
// ============================================
describe('Horoscope Routes', () => {
  let horoscopeApp: express.Application;

  beforeEach(() => {
    horoscopeApp = express();
    horoscopeApp.use(express.json());
    horoscopeApp.use('/', horoscopesRouter);

    // Error handler for tests
    horoscopeApp.use((err: any, _req: any, res: any, _next: any) => {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Internal server error' });
    });

    vi.clearAllMocks();
    mockedCacheService.get.mockResolvedValue(null);
    mockedCacheService.set.mockResolvedValue(undefined);
  });

  // ============================================
  // GET /:sign — Cached horoscope
  // ============================================
  describe('GET /:sign', () => {
    it('should return cached horoscope from DB when found', async () => {
      const cached = {
        id: 'cache-1',
        sign: 'Aries',
        language: 'en',
        horoscope: 'Today is good',
        createdAt: new Date('2026-03-11T00:00:00Z'),
      };
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(cached);

      const res = await request(horoscopeApp).get('/Aries');

      expect(res.status).toBe(200);
      expect(res.body.horoscope).toBe('Today is good');
      expect(res.body.cached).toBe(true);
    });

    it('should generate horoscope when no cache exists', async () => {
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(null);
      mockedGenerateHoroscope.mockResolvedValue('A fresh horoscope');
      mockedPrisma.horoscopeCache.upsert.mockResolvedValue({});

      const res = await request(horoscopeApp).get('/Aries');

      expect(res.status).toBe(200);
      expect(res.body.horoscope).toBe('A fresh horoscope');
      expect(res.body.cached).toBe(false);
      expect(mockedGenerateHoroscope).toHaveBeenCalledWith('Aries', 'en');
    });

    it('should pass language query param to prisma', async () => {
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(null);
      mockedGenerateHoroscope.mockResolvedValue('Un horoscope');
      mockedPrisma.horoscopeCache.upsert.mockResolvedValue({});

      await request(horoscopeApp).get('/Aries?language=fr');

      expect(mockedPrisma.horoscopeCache.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sign_language_date: expect.objectContaining({
              sign: 'Aries',
              language: 'fr',
            }),
          },
        })
      );
    });

    it('should return 500 on DB error with fallback attempt', async () => {
      mockedPrisma.horoscopeCache.findUnique.mockRejectedValue(new Error('DB error'));

      const res = await request(horoscopeApp).get('/Aries');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });
  });

  // ============================================
  // GET /:sign — Generation and caching
  // ============================================
  describe('GET /:sign (generation)', () => {
    it('should upsert generated horoscope to DB cache', async () => {
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(null);
      mockedGenerateHoroscope.mockResolvedValue('Great day!');
      mockedPrisma.horoscopeCache.upsert.mockResolvedValue({});

      const res = await request(horoscopeApp).get('/Leo');

      expect(res.status).toBe(200);
      expect(res.body.horoscope).toBe('Great day!');
      expect(mockedPrisma.horoscopeCache.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sign_language_date: expect.objectContaining({
              sign: 'Leo',
              language: 'en',
            }),
          },
          create: expect.objectContaining({
            sign: 'Leo',
            language: 'en',
            horoscope: 'Great day!',
          }),
          update: { horoscope: 'Great day!' },
        })
      );
    });

    it('should return 500 when generation fails', async () => {
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(null);
      mockedGenerateHoroscope.mockRejectedValue(new Error('AI service down'));
      // Fallback lookup also fails
      mockedPrisma.horoscopeCache.findUnique.mockRejectedValue(new Error('DB error'));

      const res = await request(horoscopeApp).get('/Leo');

      expect(res.status).toBe(500);
    });
  });
});
