/**
 * Users Referral Routes Tests
 *
 * Tests for:
 *   POST /me/redeem-referral — redeem a referral code, award credits to both users
 *   POST /me/referral-invite — send a referral invitation email to a friend
 */

import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Mocks — must be declared before any imports from the modules under test
// ---------------------------------------------------------------------------

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn((_req: any, _res: any, next: any) => {
    _req.auth = { userId: 'user-123', sessionId: 'sess-1' };
    next();
  }),
}));

vi.mock('../../db/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../services/CreditService.js', () => ({
  creditService: {
    addCredits: vi.fn(),
  },
  CREDIT_COSTS: {
    REFERRAL_BONUS: 5,
  },
}));

// Use real ApplicationError classes so statusCode propagates correctly
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

vi.mock('../../services/AchievementService.js', () => ({
  AchievementService: class {
    checkAndUnlockAchievements = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock('../../lib/logger.js', () => ({
  debug: { log: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../services/email.js', () => ({
  sendEmail: vi.fn(),
  sendReferralInviteEmail: vi.fn(),
  sendReferralRedeemedEmail: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

import referralRouter from '../../routes/users/referral.js';
import prisma from '../../db/prisma.js';
import { creditService } from '../../services/CreditService.js';
import { sendReferralInviteEmail, sendReferralRedeemedEmail } from '../../services/email.js';
import { ApplicationError } from '../../shared/errors/ApplicationError.js';

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: Mock;
    update: Mock;
  };
};

const mockAddCredits = creditService.addCredits as Mock;
const mockSendReferralInviteEmail = sendReferralInviteEmail as Mock;
const mockSendReferralRedeemedEmail = sendReferralRedeemedEmail as Mock;

// ---------------------------------------------------------------------------
// Error handler — mirrors production behaviour for ApplicationError and ZodError
// ---------------------------------------------------------------------------

function testErrorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const statusCode =
    err instanceof ApplicationError ? err.statusCode : err.name === 'ZodError' ? 400 : 500;
  const body =
    err.name === 'ZodError'
      ? { error: 'Validation failed', details: err.errors }
      : { error: err.message || 'Internal server error' };
  res.status(statusCode).json(body);
}

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const CURRENT_USER = {
  id: 'user-123',
  username: 'CurrentUser',
  referralCode: 'MYCODE',
  referredById: null,
};

const REFERRER_USER = {
  id: 'referrer-456',
  username: 'ReferrerUser',
  email: 'referrer@example.com',
  language: 'en',
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Users Referral Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/', referralRouter);
    app.use(testErrorHandler);
  });

  // =========================================================================
  // POST /me/redeem-referral
  // =========================================================================

  describe('POST /me/redeem-referral', () => {
    it('should return 200 and award 5 credits to both users on a valid redemption', async () => {
      mockedPrisma.user.findUnique
        .mockResolvedValueOnce(CURRENT_USER) // lookup by id
        .mockResolvedValueOnce(REFERRER_USER); // lookup by referralCode
      mockAddCredits
        .mockResolvedValueOnce({ success: true, newBalance: 15 }) // referee
        .mockResolvedValueOnce({ success: true, newBalance: 20 }); // referrer
      mockedPrisma.user.update.mockResolvedValue({});

      const res = await request(app).post('/me/redeem-referral').send({ code: 'FRIEND' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.creditsAwarded).toBe(5);
      expect(res.body.newBalance).toBe(15);
      expect(res.body.message).toContain('ReferrerUser');

      // Referee addCredits call
      expect(mockAddCredits).toHaveBeenNthCalledWith(1, {
        userId: 'user-123',
        amount: 5,
        type: 'REFERRAL_BONUS',
        description: 'Referral bonus - used code from ReferrerUser',
      });

      // Referrer addCredits call
      expect(mockAddCredits).toHaveBeenNthCalledWith(2, {
        userId: 'referrer-456',
        amount: 5,
        type: 'REFERRAL_BONUS',
        description: 'Referral bonus - MYCODE used your code',
      });

      // referredById must be set
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { referredById: 'referrer-456' },
      });
    });

    it('should normalise the code to uppercase before lookup', async () => {
      mockedPrisma.user.findUnique
        .mockResolvedValueOnce(CURRENT_USER)
        .mockResolvedValueOnce(REFERRER_USER);
      mockAddCredits
        .mockResolvedValueOnce({ success: true, newBalance: 15 })
        .mockResolvedValueOnce({ success: true, newBalance: 20 });
      mockedPrisma.user.update.mockResolvedValue({});

      await request(app).post('/me/redeem-referral').send({ code: 'friend' }); // lowercase — schema must uppercase it

      // The referrer lookup should use the uppercased value
      expect(mockedPrisma.user.findUnique).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ where: { referralCode: 'FRIEND' } })
      );
    });

    it('should send a fire-and-forget email notification to the referrer', async () => {
      mockedPrisma.user.findUnique
        .mockResolvedValueOnce(CURRENT_USER)
        .mockResolvedValueOnce(REFERRER_USER);
      mockAddCredits
        .mockResolvedValueOnce({ success: true, newBalance: 15 })
        .mockResolvedValueOnce({ success: true, newBalance: 20 });
      mockedPrisma.user.update.mockResolvedValue({});

      const res = await request(app).post('/me/redeem-referral').send({ code: 'FRIEND' });

      expect(res.status).toBe(200);
      expect(mockSendReferralRedeemedEmail).toHaveBeenCalledWith(
        'referrer@example.com',
        'ReferrerUser',
        'CurrentUser',
        5,
        'en'
      );
    });

    it('should skip the referrer email when referrer has no email address', async () => {
      const referrerNoEmail = { ...REFERRER_USER, email: null };
      mockedPrisma.user.findUnique
        .mockResolvedValueOnce(CURRENT_USER)
        .mockResolvedValueOnce(referrerNoEmail);
      mockAddCredits
        .mockResolvedValueOnce({ success: true, newBalance: 15 })
        .mockResolvedValueOnce({ success: true, newBalance: 20 });
      mockedPrisma.user.update.mockResolvedValue({});

      const res = await request(app).post('/me/redeem-referral').send({ code: 'FRIEND' });

      expect(res.status).toBe(200);
      expect(mockSendReferralRedeemedEmail).not.toHaveBeenCalled();
    });

    it('should still succeed when the referrer credit award fails (logs warning only)', async () => {
      mockedPrisma.user.findUnique
        .mockResolvedValueOnce(CURRENT_USER)
        .mockResolvedValueOnce(REFERRER_USER);
      mockAddCredits
        .mockResolvedValueOnce({ success: true, newBalance: 15 }) // referee OK
        .mockResolvedValueOnce({ success: false, error: 'DB error' }); // referrer fails
      mockedPrisma.user.update.mockResolvedValue({});

      const res = await request(app).post('/me/redeem-referral').send({ code: 'FRIEND' });

      // Response should succeed — referrer failure is non-fatal
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newBalance).toBe(15);
    });

    it('should return 404 when the current user is not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValueOnce(null);

      const res = await request(app).post('/me/redeem-referral').send({ code: 'FRIEND' });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/User not found/i);
    });

    it('should return 409 when the user has already redeemed a referral code', async () => {
      mockedPrisma.user.findUnique.mockResolvedValueOnce({
        ...CURRENT_USER,
        referredById: 'someone-else',
      });

      const res = await request(app).post('/me/redeem-referral').send({ code: 'FRIEND' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already redeemed/i);
    });

    it('should return 400 when the user submits their own referral code', async () => {
      mockedPrisma.user.findUnique.mockResolvedValueOnce(CURRENT_USER);

      // CURRENT_USER.referralCode === 'MYCODE'
      const res = await request(app).post('/me/redeem-referral').send({ code: 'MYCODE' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/own referral code/i);
    });

    it('should return 404 when the referral code does not match any user', async () => {
      mockedPrisma.user.findUnique
        .mockResolvedValueOnce(CURRENT_USER) // current user found
        .mockResolvedValueOnce(null); // no referrer for this code

      const res = await request(app).post('/me/redeem-referral').send({ code: 'BADCODE' });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/invalid referral code/i);
    });

    it('should return 400 when the code field is missing', async () => {
      const res = await request(app).post('/me/redeem-referral').send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 when the code is an empty string', async () => {
      const res = await request(app).post('/me/redeem-referral').send({ code: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when the code exceeds 20 characters', async () => {
      const res = await request(app)
        .post('/me/redeem-referral')
        .send({ code: 'A'.repeat(21) });

      expect(res.status).toBe(400);
    });

    it('should return 500 when creditService.addCredits fails for the referee', async () => {
      mockedPrisma.user.findUnique
        .mockResolvedValueOnce(CURRENT_USER)
        .mockResolvedValueOnce(REFERRER_USER);
      mockAddCredits.mockResolvedValueOnce({ success: false, error: 'Ledger unavailable' });

      const res = await request(app).post('/me/redeem-referral').send({ code: 'FRIEND' });

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/Ledger unavailable/i);
    });

    it('should not update referredById when the referee credit award fails', async () => {
      mockedPrisma.user.findUnique
        .mockResolvedValueOnce(CURRENT_USER)
        .mockResolvedValueOnce(REFERRER_USER);
      mockAddCredits.mockResolvedValueOnce({ success: false, error: 'fail' });

      await request(app).post('/me/redeem-referral').send({ code: 'FRIEND' });

      expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // POST /me/referral-invite
  // =========================================================================

  describe('POST /me/referral-invite', () => {
    const INVITE_USER = {
      id: 'user-123',
      username: 'CurrentUser',
      referralCode: 'MYCODE',
      language: 'en',
    };

    it('should return 200 and confirm the invitation was sent', async () => {
      mockedPrisma.user.findUnique.mockResolvedValueOnce(INVITE_USER);
      mockSendReferralInviteEmail.mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/me/referral-invite')
        .send({ email: 'friend@example.com', friendName: 'Alice' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/invitation sent/i);
    });

    it('should call sendReferralInviteEmail with the correct arguments', async () => {
      mockedPrisma.user.findUnique.mockResolvedValueOnce(INVITE_USER);
      mockSendReferralInviteEmail.mockResolvedValueOnce(true);

      await request(app)
        .post('/me/referral-invite')
        .send({ email: 'friend@example.com', friendName: 'Alice' });

      expect(mockSendReferralInviteEmail).toHaveBeenCalledWith(
        'friend@example.com',
        'Alice',
        'CurrentUser',
        'MYCODE',
        'en'
      );
    });

    it('should fall back to an empty string when friendName is omitted', async () => {
      mockedPrisma.user.findUnique.mockResolvedValueOnce(INVITE_USER);
      mockSendReferralInviteEmail.mockResolvedValueOnce(true);

      await request(app).post('/me/referral-invite').send({ email: 'friend@example.com' });

      expect(mockSendReferralInviteEmail).toHaveBeenCalledWith(
        'friend@example.com',
        '', // friendName defaults to ''
        'CurrentUser',
        'MYCODE',
        'en'
      );
    });

    it('should pass the fr language when the user has language set to fr', async () => {
      mockedPrisma.user.findUnique.mockResolvedValueOnce({ ...INVITE_USER, language: 'fr' });
      mockSendReferralInviteEmail.mockResolvedValueOnce(true);

      await request(app)
        .post('/me/referral-invite')
        .send({ email: 'ami@example.fr', friendName: 'Pierre' });

      expect(mockSendReferralInviteEmail).toHaveBeenCalledWith(
        'ami@example.fr',
        'Pierre',
        'CurrentUser',
        'MYCODE',
        'fr'
      );
    });

    it('should return 404 when the user is not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/me/referral-invite')
        .send({ email: 'friend@example.com' });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/User not found/i);
    });

    it('should return 500 when sendReferralInviteEmail returns false', async () => {
      mockedPrisma.user.findUnique.mockResolvedValueOnce(INVITE_USER);
      mockSendReferralInviteEmail.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/me/referral-invite')
        .send({ email: 'friend@example.com' });

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/Failed to send invitation email/i);
    });

    it('should return 400 when the email field is missing', async () => {
      const res = await request(app).post('/me/referral-invite').send({ friendName: 'Alice' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when the email address is not valid', async () => {
      const res = await request(app).post('/me/referral-invite').send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when friendName exceeds 50 characters', async () => {
      const res = await request(app)
        .post('/me/referral-invite')
        .send({ email: 'friend@example.com', friendName: 'A'.repeat(51) });

      expect(res.status).toBe(400);
    });
  });
});
