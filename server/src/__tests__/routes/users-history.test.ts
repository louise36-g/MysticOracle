/**
 * Users History Routes Tests
 * Tests for:
 *   GET /me/readings/all  — Unified reading history (all types)
 *   GET /me/readings      — Tarot-only reading history (legacy)
 *   GET /me/transactions  — Transaction history
 *   GET /me/transactions/:id/invoice — Invoice HTML
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// ============================================
// MOCKS — must come before any imports that
// trigger module resolution of the mocked deps
// ============================================

// Mock auth middleware so requireAuth just stamps req.auth
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn((_req: any, _res: any, next: any) => {
    _req.auth = { userId: 'user-123', sessionId: 'sess-1' };
    next();
  }),
}));

// Mock all Prisma models used by history.ts
vi.mock('../../db/prisma.js', () => ({
  default: {
    reading: { findMany: vi.fn(), count: vi.fn() },
    birthCardSynthesis: { findUnique: vi.fn() },
    personalYearReading: { findMany: vi.fn() },
    thresholdReading: { findMany: vi.fn() },
    transaction: { findMany: vi.fn(), count: vi.fn() },
  },
}));

// Mock shared service dependencies pulled in by shared.ts
vi.mock('../../services/CreditService.js', () => ({
  creditService: { addCredits: vi.fn() },
  CREDIT_COSTS: {},
}));

vi.mock('../../services/AchievementService.js', () => ({
  AchievementService: class {
    checkAndUnlockAchievements = vi.fn();
  },
}));

vi.mock('../../services/email.js', () => ({
  sendEmail: vi.fn(),
}));

// Use real ApplicationError classes (needed for NotFoundError 404 path)
vi.mock('../../shared/errors/ApplicationError.js', async () => {
  const actual = await vi.importActual('../../shared/errors/ApplicationError.js');
  return actual;
});

// Pass-through validateQuery — let real paginationQuerySchema accept any valid params
vi.mock('../../middleware/validateQuery.js', () => ({
  validateQuery: vi.fn(() => (_req: any, _res: any, next: any) => next()),
  paginationQuerySchema: {},
}));

// Use real pagination helpers so response shape is accurate
vi.mock('../../shared/pagination/pagination.js', async () => {
  const actual = await vi.importActual('../../shared/pagination/pagination.js');
  return actual;
});

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  debug: { log: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock invoiceService (dynamic import inside handler)
vi.mock('../../services/invoiceService.js', () => ({
  invoiceService: { generateInvoiceHtml: vi.fn() },
}));

// Mock generated Prisma enum values
vi.mock('../../generated/prisma/client.js', () => ({
  TransactionType: { PURCHASE: 'PURCHASE' },
  PaymentStatus: { COMPLETED: 'COMPLETED' },
}));

// ============================================
// IMPORTS — after all vi.mock() calls
// ============================================

import historyRouter from '../../routes/users/history.js';
import prisma from '../../db/prisma.js';
import { invoiceService } from '../../services/invoiceService.js';
import { ApplicationError } from '../../shared/errors/ApplicationError.js';

// ============================================
// TYPED MOCK HANDLES
// ============================================

const mockedPrisma = prisma as unknown as {
  reading: { findMany: Mock; count: Mock };
  birthCardSynthesis: { findUnique: Mock };
  personalYearReading: { findMany: Mock };
  thresholdReading: { findMany: Mock };
  transaction: { findMany: Mock; count: Mock };
};

const mockedInvoiceService = invoiceService as unknown as {
  generateInvoiceHtml: Mock;
};

// ============================================
// APP FACTORY
// ============================================

function buildApp() {
  const app = express();
  app.use(express.json());
  // history.ts uses req.auth — set by the mocked requireAuth, but also
  // set here as fallback for any request that bypasses auth middleware.
  app.use((req: any, _res: any, next: any) => {
    if (!req.auth) req.auth = { userId: 'user-123', sessionId: 'sess-1' };
    next();
  });
  app.use('/', historyRouter);

  // Error handler mirrors production shape
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err instanceof ApplicationError ? err.statusCode : 500;
    res.status(statusCode).json({ error: err.message || 'Internal server error' });
  });

  return app;
}

// ============================================
// HELPERS
// ============================================

/** Build a minimal tarot Reading fixture */
function makeTarotReading(overrides: Record<string, unknown> = {}) {
  return {
    id: 'reading-1',
    userId: 'user-123',
    spreadType: 'three-card',
    interpretationStyle: 'classic',
    question: null,
    cards: [],
    interpretation: 'Your reading...',
    userReflection: null,
    hasClarification: false,
    clarificationCard: null,
    clarificationCard2: null,
    creditCost: 1,
    createdAt: new Date('2026-01-10T10:00:00Z'),
    followUps: [],
    ...overrides,
  };
}

/** Build a minimal BirthCardSynthesis fixture */
function makeBirthSynthesis(overrides: Record<string, unknown> = {}) {
  return {
    id: 'birth-1',
    userId: 'user-123',
    personalityCardId: 1,
    soulCardId: 2,
    zodiacSign: 'aries',
    synthesisEn: 'Your birth cards reveal...',
    synthesisFr: null,
    createdAt: new Date('2026-01-05T08:00:00Z'),
    ...overrides,
  };
}

/** Build a minimal PersonalYearReading fixture */
function makePersonalYearReading(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pyear-1',
    userId: 'user-123',
    year: 2026,
    personalYearNumber: 3,
    personalYearCardId: 5,
    personalityCardId: 1,
    soulCardId: 2,
    zodiacSign: 'aries',
    synthesisEn: 'This year brings...',
    synthesisFr: null,
    createdAt: new Date('2026-01-08T12:00:00Z'),
    ...overrides,
  };
}

/** Build a minimal ThresholdReading fixture */
function makeThresholdReading(overrides: Record<string, unknown> = {}) {
  return {
    id: 'thresh-1',
    userId: 'user-123',
    transitionYear: 2026,
    outgoingYearNumber: 2,
    outgoingYearCardId: 3,
    incomingYearNumber: 3,
    incomingYearCardId: 4,
    personalityCardId: 1,
    soulCardId: 2,
    synthesisEn: 'A threshold awaits...',
    synthesisFr: null,
    createdAt: new Date('2026-01-07T09:00:00Z'),
    ...overrides,
  };
}

/** Build a minimal Transaction fixture */
function makeTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn-1',
    userId: 'user-123',
    type: 'CREDIT_USAGE',
    amount: 1,
    paymentStatus: null,
    createdAt: new Date('2026-01-10T10:00:00Z'),
    ...overrides,
  };
}

// ============================================
// TEST SUITES
// ============================================

describe('Users History Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  // ============================================
  // GET /me/readings — Tarot-only (legacy)
  // ============================================
  describe('GET /me/readings', () => {
    it('returns paginated tarot readings with default pagination', async () => {
      const readings = [makeTarotReading(), makeTarotReading({ id: 'reading-2' })];
      mockedPrisma.reading.findMany.mockResolvedValue(readings);
      mockedPrisma.reading.count.mockResolvedValue(2);

      const res = await request(app).get('/me/readings');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.page).toBe(1);
    });

    it('calls prisma with userId and correct order', async () => {
      mockedPrisma.reading.findMany.mockResolvedValue([]);
      mockedPrisma.reading.count.mockResolvedValue(0);

      await request(app).get('/me/readings');

      expect(mockedPrisma.reading.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          orderBy: { createdAt: 'desc' },
          include: { followUps: true },
        })
      );
      expect(mockedPrisma.reading.count).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('returns valid paginated response when there are no readings', async () => {
      mockedPrisma.reading.findMany.mockResolvedValue([]);
      mockedPrisma.reading.count.mockResolvedValue(0);

      const res = await request(app).get('/me/readings');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
      expect(res.body.pagination.totalPages).toBe(0);
      expect(res.body.pagination.hasMore).toBe(false);
    });

    it('respects the limit query parameter', async () => {
      mockedPrisma.reading.findMany.mockResolvedValue([makeTarotReading()]);
      mockedPrisma.reading.count.mockResolvedValue(10);

      const res = await request(app).get('/me/readings?limit=1');

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(1);
      expect(res.body.pagination.total).toBe(10);
      expect(mockedPrisma.reading.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1, skip: 0 })
      );
    });

    it('respects the page query parameter', async () => {
      mockedPrisma.reading.findMany.mockResolvedValue([]);
      mockedPrisma.reading.count.mockResolvedValue(40);

      const res = await request(app).get('/me/readings?page=2&limit=20');

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(mockedPrisma.reading.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, skip: 20 })
      );
    });

    it('returns 500 when prisma throws', async () => {
      mockedPrisma.reading.findMany.mockRejectedValue(new Error('DB connection lost'));
      mockedPrisma.reading.count.mockResolvedValue(0);

      const res = await request(app).get('/me/readings');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB connection lost');
    });
  });

  // ============================================
  // GET /me/readings/all — Unified history
  // ============================================
  describe('GET /me/readings/all', () => {
    it('returns all reading types merged and sorted by createdAt desc', async () => {
      const tarot = makeTarotReading({ createdAt: new Date('2026-01-10T10:00:00Z') });
      const birth = makeBirthSynthesis({ createdAt: new Date('2026-01-09T08:00:00Z') });
      const pyear = makePersonalYearReading({ createdAt: new Date('2026-01-08T12:00:00Z') });
      const thresh = makeThresholdReading({ createdAt: new Date('2026-01-07T09:00:00Z') });

      mockedPrisma.reading.findMany.mockResolvedValue([tarot]);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(birth);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([pyear]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([thresh]);

      const res = await request(app).get('/me/readings/all');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.data).toHaveLength(4);

      // Verify descending sort: tarot (Jan 10) first, threshold (Jan 7) last
      expect(res.body.data[0].readingType).toBe('tarot');
      expect(res.body.data[1].readingType).toBe('birth_synthesis');
      expect(res.body.data[2].readingType).toBe('personal_year');
      expect(res.body.data[3].readingType).toBe('threshold');
    });

    it('assigns the correct readingType discriminator to each entry', async () => {
      const tarot = makeTarotReading();
      const birth = makeBirthSynthesis();
      const pyear = makePersonalYearReading({ createdAt: new Date('2026-01-06T00:00:00Z') });
      const thresh = makeThresholdReading({ createdAt: new Date('2026-01-05T00:00:00Z') });

      mockedPrisma.reading.findMany.mockResolvedValue([tarot]);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(birth);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([pyear]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([thresh]);

      const res = await request(app).get('/me/readings/all');

      const types = res.body.data.map((r: any) => r.readingType);
      expect(types).toContain('tarot');
      expect(types).toContain('birth_synthesis');
      expect(types).toContain('personal_year');
      expect(types).toContain('threshold');
    });

    it('assigns fixed creditCost of 2 to birth_synthesis', async () => {
      mockedPrisma.reading.findMany.mockResolvedValue([]);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(makeBirthSynthesis());
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([]);

      const res = await request(app).get('/me/readings/all');
      const birthEntry = res.body.data.find((r: any) => r.readingType === 'birth_synthesis');

      expect(birthEntry).toBeDefined();
      expect(birthEntry.creditCost).toBe(2);
    });

    it('assigns fixed creditCost of 3 to personal_year', async () => {
      mockedPrisma.reading.findMany.mockResolvedValue([]);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(null);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([makePersonalYearReading()]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([]);

      const res = await request(app).get('/me/readings/all');
      const entry = res.body.data.find((r: any) => r.readingType === 'personal_year');

      expect(entry).toBeDefined();
      expect(entry.creditCost).toBe(3);
    });

    it('assigns fixed creditCost of 3 to threshold', async () => {
      mockedPrisma.reading.findMany.mockResolvedValue([]);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(null);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([makeThresholdReading()]);

      const res = await request(app).get('/me/readings/all');
      const entry = res.body.data.find((r: any) => r.readingType === 'threshold');

      expect(entry).toBeDefined();
      expect(entry.creditCost).toBe(3);
    });

    it('maps tarot followUps into the unified entry', async () => {
      const followUp = {
        id: 'fu-1',
        question: 'Tell me more',
        answer: 'The cards say...',
        creditCost: 1,
        createdAt: new Date('2026-01-10T11:00:00Z'),
      };
      const tarot = makeTarotReading({ followUps: [followUp] });

      mockedPrisma.reading.findMany.mockResolvedValue([tarot]);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(null);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([]);

      const res = await request(app).get('/me/readings/all');
      const tarotEntry = res.body.data.find((r: any) => r.readingType === 'tarot');

      expect(tarotEntry.followUps).toHaveLength(1);
      expect(tarotEntry.followUps[0].id).toBe('fu-1');
      expect(tarotEntry.followUps[0].question).toBe('Tell me more');
    });

    // --- type=tarot filter ---

    it('filters to tarot only when type=tarot is passed', async () => {
      const tarot = makeTarotReading();
      mockedPrisma.reading.findMany.mockResolvedValue([tarot]);
      // birth/year/threshold should NOT be called with type=tarot
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(makeBirthSynthesis());
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([makePersonalYearReading()]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([makeThresholdReading()]);

      const res = await request(app).get('/me/readings/all?type=tarot');

      expect(res.status).toBe(200);
      // With type=tarot, birth/year/threshold queries resolve to [] / null
      expect(res.body.data.every((r: any) => r.readingType === 'tarot')).toBe(true);
      expect(mockedPrisma.birthCardSynthesis.findUnique).not.toHaveBeenCalled();
      expect(mockedPrisma.personalYearReading.findMany).not.toHaveBeenCalled();
      expect(mockedPrisma.thresholdReading.findMany).not.toHaveBeenCalled();
    });

    it('only queries tarot DB model when type=tarot', async () => {
      mockedPrisma.reading.findMany.mockResolvedValue([]);

      await request(app).get('/me/readings/all?type=tarot');

      expect(mockedPrisma.reading.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-123' } })
      );
      expect(mockedPrisma.birthCardSynthesis.findUnique).not.toHaveBeenCalled();
    });

    // --- type=birth_cards filter ---

    it('filters to birth_cards only when type=birth_cards is passed', async () => {
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(makeBirthSynthesis());
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([makePersonalYearReading()]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([makeThresholdReading()]);
      // tarot should NOT be queried
      mockedPrisma.reading.findMany.mockResolvedValue([makeTarotReading()]);

      const res = await request(app).get('/me/readings/all?type=birth_cards');

      expect(res.status).toBe(200);
      const types = res.body.data.map((r: any) => r.readingType);
      expect(types).not.toContain('tarot');
      expect(mockedPrisma.reading.findMany).not.toHaveBeenCalled();
    });

    it('only queries birth/year/threshold DB models when type=birth_cards', async () => {
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(null);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([]);

      await request(app).get('/me/readings/all?type=birth_cards');

      expect(mockedPrisma.reading.findMany).not.toHaveBeenCalled();
      expect(mockedPrisma.birthCardSynthesis.findUnique).toHaveBeenCalled();
    });

    // --- Exclusion logic for incomplete records ---

    it('excludes birth synthesis when both synthesisEn and synthesisFr are null', async () => {
      const emptySynthesis = makeBirthSynthesis({ synthesisEn: null, synthesisFr: null });
      mockedPrisma.reading.findMany.mockResolvedValue([]);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(emptySynthesis);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([]);

      const res = await request(app).get('/me/readings/all');

      expect(res.status).toBe(200);
      const types = res.body.data.map((r: any) => r.readingType);
      expect(types).not.toContain('birth_synthesis');
    });

    it('includes birth synthesis when synthesisFr is set but synthesisEn is null', async () => {
      const frenchOnly = makeBirthSynthesis({ synthesisEn: null, synthesisFr: 'Vos cartes...' });
      mockedPrisma.reading.findMany.mockResolvedValue([]);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(frenchOnly);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([]);

      const res = await request(app).get('/me/readings/all');

      const types = res.body.data.map((r: any) => r.readingType);
      expect(types).toContain('birth_synthesis');
    });

    it('excludes personal year reading when both synthesis fields are null', async () => {
      const empty = makePersonalYearReading({ synthesisEn: null, synthesisFr: null });
      mockedPrisma.reading.findMany.mockResolvedValue([]);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(null);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([empty]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([]);

      const res = await request(app).get('/me/readings/all');

      const types = res.body.data.map((r: any) => r.readingType);
      expect(types).not.toContain('personal_year');
    });

    it('excludes threshold reading when both synthesis fields are null', async () => {
      const empty = makeThresholdReading({ synthesisEn: null, synthesisFr: null });
      mockedPrisma.reading.findMany.mockResolvedValue([]);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(null);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([empty]);

      const res = await request(app).get('/me/readings/all');

      const types = res.body.data.map((r: any) => r.readingType);
      expect(types).not.toContain('threshold');
    });

    // --- Empty state ---

    it('returns valid paginated response with empty data when user has no readings', async () => {
      mockedPrisma.reading.findMany.mockResolvedValue([]);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(null);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([]);

      const res = await request(app).get('/me/readings/all');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
      expect(res.body.pagination.hasMore).toBe(false);
    });

    // --- Pagination ---

    it('applies pagination to the merged list', async () => {
      // Build 3 tarot readings spread across dates
      const readings = [
        makeTarotReading({ id: 'r1', createdAt: new Date('2026-01-10T10:00:00Z') }),
        makeTarotReading({ id: 'r2', createdAt: new Date('2026-01-09T10:00:00Z') }),
        makeTarotReading({ id: 'r3', createdAt: new Date('2026-01-08T10:00:00Z') }),
      ];
      mockedPrisma.reading.findMany.mockResolvedValue(readings);
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(null);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([]);

      // Request page 2 with limit 2 — should get the 3rd reading
      const res = await request(app).get('/me/readings/all?page=2&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe('r3');
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.hasMore).toBe(false);
    });

    // --- Error handling ---

    it('returns 500 when a prisma query throws', async () => {
      mockedPrisma.reading.findMany.mockRejectedValue(new Error('Prisma exploded'));
      mockedPrisma.birthCardSynthesis.findUnique.mockResolvedValue(null);
      mockedPrisma.personalYearReading.findMany.mockResolvedValue([]);
      mockedPrisma.thresholdReading.findMany.mockResolvedValue([]);

      const res = await request(app).get('/me/readings/all');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Prisma exploded');
    });
  });

  // ============================================
  // GET /me/transactions
  // ============================================
  describe('GET /me/transactions', () => {
    it('returns paginated transaction list with default pagination', async () => {
      const txns = [makeTransaction(), makeTransaction({ id: 'txn-2' })];
      mockedPrisma.transaction.findMany.mockResolvedValue(txns);
      mockedPrisma.transaction.count.mockResolvedValue(2);

      const res = await request(app).get('/me/transactions');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('calls prisma with the correct userId where clause', async () => {
      mockedPrisma.transaction.findMany.mockResolvedValue([]);
      mockedPrisma.transaction.count.mockResolvedValue(0);

      await request(app).get('/me/transactions');

      expect(mockedPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-123' }),
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('applies the OR filter that excludes non-completed PURCHASE transactions', async () => {
      mockedPrisma.transaction.findMany.mockResolvedValue([]);
      mockedPrisma.transaction.count.mockResolvedValue(0);

      await request(app).get('/me/transactions');

      const callArgs = mockedPrisma.transaction.findMany.mock.calls[0][0];
      const where = callArgs.where;

      // The where clause must include an OR with both conditions
      expect(where.OR).toBeDefined();
      expect(where.OR).toHaveLength(2);

      // First condition: non-PURCHASE types are allowed through
      expect(where.OR[0]).toEqual({ type: { not: 'PURCHASE' } });

      // Second condition: only COMPLETED PURCHASE transactions
      expect(where.OR[1]).toEqual({
        type: 'PURCHASE',
        paymentStatus: 'COMPLETED',
      });
    });

    it('uses default limit of 50 for transactions', async () => {
      mockedPrisma.transaction.findMany.mockResolvedValue([]);
      mockedPrisma.transaction.count.mockResolvedValue(0);

      await request(app).get('/me/transactions');

      const callArgs = mockedPrisma.transaction.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(50);
    });

    it('returns valid response with empty transaction list', async () => {
      mockedPrisma.transaction.findMany.mockResolvedValue([]);
      mockedPrisma.transaction.count.mockResolvedValue(0);

      const res = await request(app).get('/me/transactions');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
      expect(res.body.pagination.hasMore).toBe(false);
    });

    it('returns 500 when prisma throws', async () => {
      mockedPrisma.transaction.findMany.mockRejectedValue(new Error('Connection reset'));

      const res = await request(app).get('/me/transactions');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Connection reset');
    });
  });

  // ============================================
  // GET /me/transactions/:id/invoice
  // ============================================
  describe('GET /me/transactions/:id/invoice', () => {
    it('returns HTML invoice with correct Content-Type header for a valid transaction', async () => {
      const html = '<html><body><h1>Invoice</h1></body></html>';
      mockedInvoiceService.generateInvoiceHtml.mockResolvedValue(html);

      const res = await request(app).get('/me/transactions/txn-abc/invoice');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toBe(html);
    });

    it('passes transactionId and userId to invoiceService', async () => {
      mockedInvoiceService.generateInvoiceHtml.mockResolvedValue('<html>Invoice</html>');

      await request(app).get('/me/transactions/txn-xyz/invoice');

      expect(mockedInvoiceService.generateInvoiceHtml).toHaveBeenCalledWith(
        'txn-xyz',
        'user-123',
        expect.any(String)
      );
    });

    it('defaults to fr language when no language param is provided', async () => {
      mockedInvoiceService.generateInvoiceHtml.mockResolvedValue('<html>Facture</html>');

      await request(app).get('/me/transactions/txn-1/invoice');

      expect(mockedInvoiceService.generateInvoiceHtml).toHaveBeenCalledWith(
        'txn-1',
        'user-123',
        'fr'
      );
    });

    it('passes the language param when provided as en', async () => {
      mockedInvoiceService.generateInvoiceHtml.mockResolvedValue('<html>Invoice</html>');

      await request(app).get('/me/transactions/txn-1/invoice?language=en');

      expect(mockedInvoiceService.generateInvoiceHtml).toHaveBeenCalledWith(
        'txn-1',
        'user-123',
        'en'
      );
    });

    it('passes the language param when provided as fr', async () => {
      mockedInvoiceService.generateInvoiceHtml.mockResolvedValue('<html>Facture</html>');

      await request(app).get('/me/transactions/txn-1/invoice?language=fr');

      expect(mockedInvoiceService.generateInvoiceHtml).toHaveBeenCalledWith(
        'txn-1',
        'user-123',
        'fr'
      );
    });

    it('sets Content-Disposition header with the transaction id in the filename', async () => {
      mockedInvoiceService.generateInvoiceHtml.mockResolvedValue('<html>Invoice</html>');

      const res = await request(app).get('/me/transactions/txn-abc/invoice');

      expect(res.headers['content-disposition']).toContain('txn-abc');
    });

    it('returns 404 when invoiceService returns null (transaction not found)', async () => {
      mockedInvoiceService.generateInvoiceHtml.mockResolvedValue(null);

      const res = await request(app).get('/me/transactions/no-such-txn/invoice');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/invoice not found/i);
    });

    it('returns 500 when invoiceService throws', async () => {
      mockedInvoiceService.generateInvoiceHtml.mockRejectedValue(
        new Error('PDF generation failed')
      );

      const res = await request(app).get('/me/transactions/txn-1/invoice');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('PDF generation failed');
    });
  });
});
