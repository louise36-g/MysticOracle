/**
 * Users Bonus Routes Tests
 * Tests for POST /me/daily-bonus — daily login bonus with streak calculation
 */

import { describe, it, expect, vi, type Mock, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

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
      update: vi.fn(),
    },
  },
}));

// Mock CreditService
vi.mock('../../services/CreditService.js', () => ({
  creditService: {
    addCredits: vi.fn(),
  },
  CREDIT_COSTS: {
    DAILY_BONUS_BASE: 2,
    WEEKLY_STREAK_BONUS: 5,
  },
}));

// Mock AchievementService - use vi.hoisted so the fn is available when vi.mock is hoisted
const { mockCheckAndUnlock } = vi.hoisted(() => ({
  mockCheckAndUnlock: vi.fn(),
}));
vi.mock('../../services/AchievementService.js', () => {
  return {
    AchievementService: class {
      checkAndUnlockAchievements = mockCheckAndUnlock;
    },
  };
});

// Mock ApplicationErrors - use importActual to get real error classes
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

import bonusRouter from '../../routes/users/bonus.js';
import prisma from '../../db/prisma.js';
import { creditService } from '../../services/CreditService.js';
import { ApplicationError } from '../../shared/errors/ApplicationError.js';

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: Mock;
    update: Mock;
  };
};

const mockAddCredits = creditService.addCredits as Mock;

// Simple error handler that mirrors the real one's behavior for ApplicationErrors
function testErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err instanceof ApplicationError ? err.statusCode : 500;
  res.status(statusCode).json({ error: err.message });
}

describe('Users Bonus Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Set "now" to 2026-01-15 12:00:00 UTC
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

    app = express();
    app.use(express.json());
    app.use('/', bonusRouter);
    // Mount error handler since bonus route uses next(error)
    app.use(testErrorHandler);

    mockCheckAndUnlock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('POST /me/daily-bonus', () => {
    // --- Error cases ---

    it('should return 404 when user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/me/daily-bonus');

      expect(res.status).toBe(404);
    });

    it('should return 409 when already claimed today', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        lastLoginDate: new Date('2026-01-15T08:00:00Z'), // same day
        loginStreak: 3,
      });

      const res = await request(app).post('/me/daily-bonus');

      expect(res.status).toBe(409);
    });

    // --- Streak calculation ---

    it('should reset streak to 1 when login is not consecutive', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        lastLoginDate: new Date('2026-01-10T10:00:00Z'), // 5 days ago
        loginStreak: 5,
      });
      mockAddCredits.mockResolvedValue({ success: true, newBalance: 12 });
      mockedPrisma.user.update.mockResolvedValue({});

      const res = await request(app).post('/me/daily-bonus');

      expect(res.status).toBe(200);
      expect(res.body.streak).toBe(1);
    });

    it('should increment streak when login is consecutive', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        lastLoginDate: new Date('2026-01-14T15:00:00Z'), // yesterday
        loginStreak: 3,
      });
      mockAddCredits.mockResolvedValue({ success: true, newBalance: 12 });
      mockedPrisma.user.update.mockResolvedValue({});

      const res = await request(app).post('/me/daily-bonus');

      expect(res.status).toBe(200);
      expect(res.body.streak).toBe(4);
    });

    // --- Credit calculation ---

    it('should award base credits (2) for normal day', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        lastLoginDate: new Date('2026-01-14T15:00:00Z'),
        loginStreak: 2, // will become 3
      });
      mockAddCredits.mockResolvedValue({ success: true, newBalance: 12 });
      mockedPrisma.user.update.mockResolvedValue({});

      const res = await request(app).post('/me/daily-bonus');

      expect(res.body.creditsAwarded).toBe(2);
      expect(mockAddCredits).toHaveBeenCalledWith({
        userId: 'test-user-123',
        amount: 2,
        type: 'DAILY_BONUS',
        description: 'Daily login bonus (3 day streak)',
      });
    });

    it('should award base + weekly bonus (2+5=7) on 7-day streak', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        lastLoginDate: new Date('2026-01-14T15:00:00Z'),
        loginStreak: 6, // will become 7
      });
      mockAddCredits.mockResolvedValue({ success: true, newBalance: 17 });
      mockedPrisma.user.update.mockResolvedValue({});

      const res = await request(app).post('/me/daily-bonus');

      expect(res.body.creditsAwarded).toBe(7);
      expect(mockAddCredits).toHaveBeenCalledWith(expect.objectContaining({ amount: 7 }));
    });

    it('should award weekly bonus on 14-day streak (multiple of 7)', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        lastLoginDate: new Date('2026-01-14T15:00:00Z'),
        loginStreak: 13, // will become 14
      });
      mockAddCredits.mockResolvedValue({ success: true, newBalance: 30 });
      mockedPrisma.user.update.mockResolvedValue({});

      const res = await request(app).post('/me/daily-bonus');

      expect(res.body.creditsAwarded).toBe(7);
    });

    // --- Credit service failure ---

    it('should return 500 when creditService.addCredits fails', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        lastLoginDate: new Date('2026-01-14T15:00:00Z'),
        loginStreak: 2,
      });
      mockAddCredits.mockResolvedValue({ success: false, error: 'DB error' });

      const res = await request(app).post('/me/daily-bonus');

      expect(res.status).toBe(500);
    });

    // --- Streak/date update only after credits confirmed ---

    it('should update streak and lastLoginDate only after credits confirmed', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        lastLoginDate: new Date('2026-01-14T15:00:00Z'),
        loginStreak: 3,
      });
      mockAddCredits.mockResolvedValue({ success: true, newBalance: 12 });
      mockedPrisma.user.update.mockResolvedValue({});

      await request(app).post('/me/daily-bonus');

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-123' },
        data: {
          loginStreak: 4,
          lastLoginDate: expect.any(Date),
        },
      });
    });

    it('should not update user when credits fail', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        lastLoginDate: new Date('2026-01-14T15:00:00Z'),
        loginStreak: 3,
      });
      mockAddCredits.mockResolvedValue({ success: false, error: 'fail' });

      await request(app).post('/me/daily-bonus');

      expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    });

    // --- Achievements ---

    it('should include unlocked achievements in response', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        lastLoginDate: new Date('2026-01-14T15:00:00Z'),
        loginStreak: 6,
      });
      mockAddCredits.mockResolvedValue({ success: true, newBalance: 17 });
      mockedPrisma.user.update.mockResolvedValue({});
      mockCheckAndUnlock.mockResolvedValue([{ achievementId: 'streak_7', reward: 3 }]);

      const res = await request(app).post('/me/daily-bonus');

      expect(res.status).toBe(200);
      expect(res.body.unlockedAchievements).toHaveLength(1);
      expect(res.body.unlockedAchievements[0].achievementId).toBe('streak_7');
      // newBalance should include achievement reward
      expect(res.body.newBalance).toBe(17 + 3);
    });

    it('should still succeed if achievement check throws', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'test-user-123',
        lastLoginDate: new Date('2026-01-14T15:00:00Z'),
        loginStreak: 2,
      });
      mockAddCredits.mockResolvedValue({ success: true, newBalance: 12 });
      mockedPrisma.user.update.mockResolvedValue({});
      mockCheckAndUnlock.mockRejectedValue(new Error('Achievement service down'));

      const res = await request(app).post('/me/daily-bonus');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unlockedAchievements).toEqual([]);
    });
  });
});
