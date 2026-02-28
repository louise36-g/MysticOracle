/**
 * Readings Routes Tests
 * Tests for POST /, GET /:id, POST /:id/follow-up, PATCH /:id,
 * GET /horoscope/:sign, POST /horoscope/:sign
 */

import { describe, it, expect, vi, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock auth middleware
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn((_req: any, _res: any, next: any) => {
    _req.auth = { userId: 'test-user-123', sessionId: 'test-session' };
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
  logger: { info: vi.fn() },
}));

import readingsRouter from '../../routes/readings.js';
import prisma from '../../db/prisma.js';

const mockedPrisma = prisma as unknown as {
  horoscopeCache: {
    findUnique: Mock;
    upsert: Mock;
  };
};

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
      const { spreadType, ...body } = validBody;
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
      const { interpretation, ...body } = validBody;
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
      expect(res.body.error).toMatch(/failed to create reading/i);
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

  // ============================================
  // GET /horoscope/:sign — Cached horoscope
  // ============================================
  describe('GET /horoscope/:sign', () => {
    it('should return cached horoscope when found', async () => {
      const cached = {
        id: 'cache-1',
        sign: 'aries',
        language: 'en',
        horoscope: 'Today is good',
        questions: [],
      };
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(cached);

      const res = await request(app).get('/horoscope/aries');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cached);
    });

    it('should return 404 when no cached horoscope', async () => {
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/horoscope/aries');

      expect(res.status).toBe(404);
      expect(res.body.needsGeneration).toBe(true);
    });

    it('should pass language query param to prisma', async () => {
      mockedPrisma.horoscopeCache.findUnique.mockResolvedValue(null);

      await request(app).get('/horoscope/aries?language=fr');

      expect(mockedPrisma.horoscopeCache.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sign_language_date: expect.objectContaining({
              sign: 'aries',
              language: 'fr',
            }),
          },
        })
      );
    });

    it('should return 500 on DB error', async () => {
      mockedPrisma.horoscopeCache.findUnique.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/horoscope/aries');
      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // POST /horoscope/:sign — Cache horoscope
  // ============================================
  describe('POST /horoscope/:sign', () => {
    it('should upsert and return cached horoscope', async () => {
      const cached = { id: 'cache-1', sign: 'leo', horoscope: 'Great day!' };
      mockedPrisma.horoscopeCache.upsert.mockResolvedValue(cached);

      const res = await request(app)
        .post('/horoscope/leo')
        .send({ language: 'en', horoscope: 'Great day!' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cached);
      expect(mockedPrisma.horoscopeCache.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sign_language_date: expect.objectContaining({
              sign: 'leo',
              language: 'en',
            }),
          },
          update: { horoscope: 'Great day!' },
          create: expect.objectContaining({
            sign: 'leo',
            language: 'en',
            horoscope: 'Great day!',
          }),
        })
      );
    });

    it('should return 500 on DB error', async () => {
      mockedPrisma.horoscopeCache.upsert.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/horoscope/leo')
        .send({ language: 'en', horoscope: 'Great day!' });

      expect(res.status).toBe(500);
    });
  });
});
