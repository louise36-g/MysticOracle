/**
 * Users Profile Routes Tests
 * Tests for GET /me, PATCH /me, GET /check-username, GET /me/credits
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
}));

// Mock prisma
vi.mock('../../db/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock shared dependencies
vi.mock('../../services/CreditService.js', () => ({
  creditService: { addCredits: vi.fn() },
  CREDIT_COSTS: { DAILY_BONUS_BASE: 2, WEEKLY_STREAK_BONUS: 5 },
}));

vi.mock('../../services/AchievementService.js', () => ({
  AchievementService: class {
    checkAndUnlockAchievements = vi.fn();
  },
}));

vi.mock('../../shared/errors/ApplicationError.js', async () => {
  const actual = await vi.importActual('../../shared/errors/ApplicationError.js');
  return actual;
});

vi.mock('../../middleware/validateQuery.js', () => ({
  validateQuery: vi.fn(() => (_req: any, _res: any, next: any) => next()),
  paginationQuerySchema: {},
}));

vi.mock('../../shared/pagination/pagination.js', () => ({
  parsePaginationParams: vi.fn(),
  createPaginatedResponse: vi.fn(),
}));

vi.mock('../../lib/logger.js', () => ({
  debug: { log: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../services/email.js', () => ({
  sendEmail: vi.fn(),
}));

import profileRouter from '../../routes/users/profile.js';
import prisma from '../../db/prisma.js';

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: Mock;
    findFirst: Mock;
    update: Mock;
  };
};

describe('Users Profile Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', profileRouter);
  });

  // ============================================
  // GET /me — Get profile
  // ============================================
  describe('GET /me', () => {
    it('should return 200 with user profile including achievements and counts', async () => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'testuser',
        credits: 10,
        achievements: [{ id: 'ach-1', achievementId: 'first_reading' }],
        _count: { readings: 5, referrals: 2 },
      };
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app).get('/me');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('test-user-123');
      expect(res.body.achievements).toHaveLength(1);
      expect(res.body._count.readings).toBe(5);
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-123' },
        include: {
          achievements: true,
          _count: {
            select: {
              readings: true,
              referrals: true,
            },
          },
        },
      });
    });

    it('should return 500 when user not found (throws NotFoundError)', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/me');

      expect(res.status).toBe(500);
    });

    it('should return 500 on DB error', async () => {
      mockedPrisma.user.findUnique.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/me');

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/failed to fetch/i);
    });
  });

  // ============================================
  // PATCH /me — Update preferences
  // ============================================
  describe('PATCH /me', () => {
    it('should return 400 for invalid username characters', async () => {
      const res = await request(app).patch('/me').send({ username: 'invalid user!' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/3-20 characters/);
    });

    it('should return 400 for username too short', async () => {
      const res = await request(app).patch('/me').send({ username: 'ab' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/3-20 characters/);
    });

    it('should return 400 for username too long', async () => {
      const res = await request(app)
        .patch('/me')
        .send({ username: 'a'.repeat(21) });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/3-20 characters/);
    });

    it('should return 400 for reserved username', async () => {
      const res = await request(app).patch('/me').send({ username: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/reserved/i);
    });

    it('should return 400 for reserved username (case-insensitive)', async () => {
      const res = await request(app).patch('/me').send({ username: 'ADMIN' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/reserved/i);
    });

    it('should return 409 when username is already taken', async () => {
      mockedPrisma.user.findFirst.mockResolvedValue({ id: 'other-user', username: 'takenname' });

      const res = await request(app).patch('/me').send({ username: 'takenname' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already taken/i);
    });

    it('should return 200 when updating username successfully', async () => {
      mockedPrisma.user.findFirst.mockResolvedValue(null); // not taken
      mockedPrisma.user.update.mockResolvedValue({
        id: 'test-user-123',
        username: 'newname',
      });

      const res = await request(app).patch('/me').send({ username: 'newname' });

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('newname');
    });

    it('should return 200 when updating language', async () => {
      mockedPrisma.user.update.mockResolvedValue({
        id: 'test-user-123',
        language: 'fr',
      });

      const res = await request(app).patch('/me').send({ language: 'fr' });

      expect(res.status).toBe(200);
      expect(mockedPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ language: 'fr' }),
        })
      );
    });

    it('should return 200 when updating welcomeCompleted', async () => {
      mockedPrisma.user.update.mockResolvedValue({
        id: 'test-user-123',
        welcomeCompleted: true,
      });

      const res = await request(app).patch('/me').send({ welcomeCompleted: true });

      expect(res.status).toBe(200);
      expect(mockedPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ welcomeCompleted: true }),
        })
      );
    });

    it('should exclude current user when checking username uniqueness', async () => {
      mockedPrisma.user.findFirst.mockResolvedValue(null);
      mockedPrisma.user.update.mockResolvedValue({ id: 'test-user-123' });

      await request(app).patch('/me').send({ username: 'myname' });

      expect(mockedPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          username: { equals: 'myname', mode: 'insensitive' },
          NOT: { id: 'test-user-123' },
        },
      });
    });

    it('should return 500 on DB error', async () => {
      mockedPrisma.user.update.mockRejectedValue(new Error('DB error'));

      const res = await request(app).patch('/me').send({ language: 'en' });

      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // GET /check-username
  // ============================================
  describe('GET /check-username', () => {
    it('should return 400 when username param is missing', async () => {
      const res = await request(app).get('/check-username');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });

    it('should return 400 for invalid format', async () => {
      const res = await request(app).get('/check-username?username=a!b');

      expect(res.status).toBe(400);
      expect(res.body.available).toBe(false);
      expect(res.body.reason).toBe('invalid_format');
    });

    it('should return reserved for reserved usernames', async () => {
      const res = await request(app).get('/check-username?username=support');

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
      expect(res.body.reason).toBe('reserved');
    });

    it('should return already_taken when username exists', async () => {
      mockedPrisma.user.findFirst.mockResolvedValue({ id: 'other-user' });

      const res = await request(app).get('/check-username?username=existinguser');

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
      expect(res.body.reason).toBe('already_taken');
    });

    it('should return available when username is free', async () => {
      mockedPrisma.user.findFirst.mockResolvedValue(null);

      const res = await request(app).get('/check-username?username=freshname');

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
    });

    it('should check username case-insensitively', async () => {
      mockedPrisma.user.findFirst.mockResolvedValue(null);

      await request(app).get('/check-username?username=TestName');

      expect(mockedPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          username: { equals: 'TestName', mode: 'insensitive' },
        },
      });
    });
  });

  // ============================================
  // GET /me/credits
  // ============================================
  describe('GET /me/credits', () => {
    it('should return 200 with credit fields', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        credits: 25,
        totalCreditsEarned: 100,
        totalCreditsSpent: 75,
      });

      const res = await request(app).get('/me/credits');

      expect(res.status).toBe(200);
      expect(res.body.credits).toBe(25);
      expect(res.body.totalCreditsEarned).toBe(100);
      expect(res.body.totalCreditsSpent).toBe(75);
    });

    it('should select only credit fields from prisma', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        credits: 0,
        totalCreditsEarned: 0,
        totalCreditsSpent: 0,
      });

      await request(app).get('/me/credits');

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-123' },
        select: {
          credits: true,
          totalCreditsEarned: true,
          totalCreditsSpent: true,
        },
      });
    });

    it('should return 500 when user not found (throws NotFoundError)', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/me/credits');

      expect(res.status).toBe(500);
    });

    it('should return 500 on DB error', async () => {
      mockedPrisma.user.findUnique.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/me/credits');

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/failed to fetch/i);
    });
  });
});
