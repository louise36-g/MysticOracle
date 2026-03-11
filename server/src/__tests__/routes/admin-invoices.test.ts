/**
 * Admin Invoices Routes Tests
 * Tests for:
 *   GET /           — List invoices with pagination, search, date range, amount, provider, sort
 *   GET /stats      — Accounting summary stats and period comparison
 *   GET /export     — CSV and JSON export with filters
 *   GET /:id        — Single invoice details (via invoiceService.getInvoiceData)
 *   GET /:id/html   — Invoice HTML (via invoiceService.generateInvoiceHtml)
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock fs before shared.ts loads (logger uses fs at module level)
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

// Mock Prisma — every model + method used by the route file
vi.mock('../../db/prisma.js', () => ({
  default: {
    transaction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Mock services pulled in transitively via shared.ts
vi.mock('../../services/cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    flushPattern: vi.fn(),
  },
}));

vi.mock('../../services/aiSettings.js', () => ({
  clearAISettingsCache: vi.fn(),
}));

vi.mock('../../services/CreditService.js', () => ({
  creditService: { addCredits: vi.fn() },
}));

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn((_req: any, _res: any, next: any) => next()),
  requireAdmin: vi.fn((_req: any, _res: any, next: any) => next()),
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  debug: { log: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock invoice service
vi.mock('../../services/invoiceService.js', () => ({
  invoiceService: {
    getInvoiceData: vi.fn(),
    generateInvoiceHtml: vi.fn(),
  },
}));

// All imports AFTER vi.mock() calls
import invoicesRouter from '../../routes/admin/invoices.js';
import prisma from '../../db/prisma.js';
import { invoiceService } from '../../services/invoiceService.js';

// Typed mock helpers
const mockedPrisma = prisma as unknown as {
  transaction: {
    findMany: Mock;
    findFirst: Mock;
    count: Mock;
    aggregate: Mock;
  };
  $queryRaw: Mock;
};

const mockedInvoiceService = invoiceService as unknown as {
  getInvoiceData: Mock;
  generateInvoiceHtml: Mock;
};

// ============================================
// Express app shared across all tests
// ============================================

const app = express();
app.use(express.json());

// Simulate auth middleware injected by the parent admin router
app.use((req: any, _res: any, next: any) => {
  req.auth = { userId: 'admin-1', sessionId: 'sess-1' };
  next();
});

app.use('/', invoicesRouter);

// Error handler — must be registered AFTER routes
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.statusCode || (err.name === 'ZodError' ? 400 : 500);
  const body =
    err.name === 'ZodError'
      ? { error: 'Validation failed', details: err.errors }
      : { error: err.message || 'Internal server error' };
  res.status(status).json(body);
});

// ============================================
// Test data helpers
// ============================================

const FIXED_DATE = new Date('2025-06-15T10:00:00.000Z');

const createMockTransaction = (overrides: Record<string, unknown> = {}) => ({
  id: 'txn-abc-12345',
  type: 'PURCHASE',
  paymentStatus: 'COMPLETED',
  amount: 100,
  paymentAmount: 9.99,
  currency: 'EUR',
  paymentProvider: 'STRIPE',
  paymentId: 'pi_test_123',
  description: '100 credits',
  userId: 'user-xyz-99999',
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  user: {
    id: 'user-xyz-99999',
    username: 'testuser',
    email: 'user@example.com',
  },
  ...overrides,
});

const makeAggregateResult = (amount: number | null, count: number, avg?: number | null) => ({
  _sum: { paymentAmount: amount },
  _count: count,
  _avg: { paymentAmount: avg ?? amount },
});

// ============================================
// GET / — List invoices
// ============================================

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET / — List invoices', () => {
  it('returns paginated invoice list with default params', async () => {
    const tx = createMockTransaction();
    mockedPrisma.transaction.findMany.mockResolvedValue([tx]);
    mockedPrisma.transaction.count.mockResolvedValue(1);

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasMore: false,
      hasPrevious: false,
    });
  });

  it('includes computed invoiceNumber in MO-YYYY-XXXXX format', async () => {
    const tx = createMockTransaction({ id: 'txn-abc-12345', createdAt: new Date('2025-06-15') });
    mockedPrisma.transaction.findMany.mockResolvedValue([tx]);
    mockedPrisma.transaction.count.mockResolvedValue(1);

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    // id.slice(-5) = '12345', year = 2025
    expect(res.body.data[0].invoiceNumber).toBe('MO-2025-12345');
  });

  it('passes search term to the OR filter on findMany', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([]);
    mockedPrisma.transaction.count.mockResolvedValue(0);

    await request(app).get('/?search=alice');

    expect(mockedPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { id: { contains: 'alice', mode: 'insensitive' } },
            { paymentId: { contains: 'alice', mode: 'insensitive' } },
            { user: { username: { contains: 'alice', mode: 'insensitive' } } },
            { user: { email: { contains: 'alice', mode: 'insensitive' } } },
          ],
        }),
      })
    );
  });

  it('applies dateFrom and dateTo to the createdAt where clause', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([]);
    mockedPrisma.transaction.count.mockResolvedValue(0);

    await request(app).get('/?dateFrom=2025-01-01&dateTo=2025-03-31');

    expect(mockedPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: new Date('2025-01-01'),
          }),
        }),
      })
    );
  });

  it('filters by paymentProvider when provided', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([]);
    mockedPrisma.transaction.count.mockResolvedValue(0);

    await request(app).get('/?paymentProvider=PAYPAL');

    expect(mockedPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentProvider: 'PAYPAL' }),
      })
    );
  });

  it('sorts by paymentAmount when sortBy=amount', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([]);
    mockedPrisma.transaction.count.mockResolvedValue(0);

    await request(app).get('/?sortBy=amount&sortOrder=asc');

    expect(mockedPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { paymentAmount: 'asc' },
      })
    );
  });

  it('sorts by nested user.username when sortBy=username', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([]);
    mockedPrisma.transaction.count.mockResolvedValue(0);

    await request(app).get('/?sortBy=username&sortOrder=desc');

    expect(mockedPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { user: { username: 'desc' } },
      })
    );
  });

  it('returns empty data array with correct pagination when no invoices exist', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([]);
    mockedPrisma.transaction.count.mockResolvedValue(0);

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
    expect(res.body.pagination.totalPages).toBe(0);
  });

  it('returns 400 when paymentProvider has an invalid value', async () => {
    const res = await request(app).get('/?paymentProvider=BITCOIN');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 when sortBy has an invalid value', async () => {
    const res = await request(app).get('/?sortBy=id');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('coerces page=0 to page=1 and returns 200', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([]);
    mockedPrisma.transaction.count.mockResolvedValue(0);

    const res = await request(app).get('/?page=0');

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  it('returns 500 when prisma throws', async () => {
    mockedPrisma.transaction.findMany.mockRejectedValue(new Error('DB connection lost'));
    mockedPrisma.transaction.count.mockResolvedValue(0);

    const res = await request(app).get('/');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB connection lost');
  });

  it('converts Decimal paymentAmount to number in response', async () => {
    // Simulate a Prisma Decimal-like object (has toString/valueOf)
    const decimalLike = { toNumber: () => 14.99, toString: () => '14.99', valueOf: () => 14.99 };
    const tx = createMockTransaction({ paymentAmount: decimalLike });
    mockedPrisma.transaction.findMany.mockResolvedValue([tx]);
    mockedPrisma.transaction.count.mockResolvedValue(1);

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    // Number(decimalLike) coerces via valueOf
    expect(typeof res.body.data[0].amount).toBe('number');
  });

  it('uses EUR as default currency when transaction currency is null', async () => {
    const tx = createMockTransaction({ currency: null });
    mockedPrisma.transaction.findMany.mockResolvedValue([tx]);
    mockedPrisma.transaction.count.mockResolvedValue(1);

    const res = await request(app).get('/');

    expect(res.body.data[0].currency).toBe('EUR');
  });
});

// ============================================
// GET /stats — Accounting statistics
// ============================================

describe('GET /stats — Accounting statistics', () => {
  const setupStatsMocks = ({
    total = makeAggregateResult(1000, 10, 100),
    stripe = makeAggregateResult(800, 8),
    paypal = makeAggregateResult(200, 2),
    monthly = [{ month: '2025-06', revenue: 500, count: BigInt(5) }],
    recent = [createMockTransaction()],
  } = {}) => {
    mockedPrisma.transaction.aggregate
      .mockResolvedValueOnce(total) // totalStats
      .mockResolvedValueOnce(stripe) // stripeStats
      .mockResolvedValueOnce(paypal); // paypalStats
    mockedPrisma.$queryRaw.mockResolvedValue(monthly);
    mockedPrisma.transaction.findMany.mockResolvedValue(recent);
  };

  it('returns summary, byProvider, monthlyRevenue, and recentInvoices', async () => {
    setupStatsMocks();

    const res = await request(app).get('/stats');

    expect(res.status).toBe(200);
    expect(res.body.summary).toMatchObject({
      totalRevenue: 1000,
      totalInvoices: 10,
      averageAmount: 100,
      currency: 'EUR',
    });
    expect(res.body.byProvider.stripe).toMatchObject({ revenue: 800, count: 8 });
    expect(res.body.byProvider.paypal).toMatchObject({ revenue: 200, count: 2 });
    expect(res.body.monthlyRevenue).toHaveLength(1);
    expect(res.body.monthlyRevenue[0]).toMatchObject({
      month: '2025-06',
      revenue: 500,
      count: 5, // BigInt converted to Number
    });
    expect(res.body.recentInvoices).toHaveLength(1);
  });

  it('sets periodComparison to null when only one date bound is provided', async () => {
    setupStatsMocks();

    const res = await request(app).get('/stats?dateFrom=2025-01-01');

    expect(res.status).toBe(200);
    expect(res.body.periodComparison).toBeNull();
  });

  it('includes date filter in baseWhere when dateFrom is provided', async () => {
    setupStatsMocks();

    await request(app).get('/stats?dateFrom=2025-01-01');

    expect(mockedPrisma.transaction.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: new Date('2025-01-01'),
          }),
        }),
      })
    );
  });

  it('calculates periodComparison when both dateFrom and dateTo are provided', async () => {
    setupStatsMocks();
    // Fourth aggregate call = previousStats
    mockedPrisma.transaction.aggregate.mockResolvedValueOnce(makeAggregateResult(500, 5));

    const res = await request(app).get('/stats?dateFrom=2025-01-01&dateTo=2025-03-31');

    expect(res.status).toBe(200);
    expect(res.body.periodComparison).not.toBeNull();
    expect(res.body.periodComparison).toMatchObject({
      previousRevenue: 500,
      previousCount: 5,
    });
  });

  it('computes 100% revenue increase when previous period had zero revenue', async () => {
    setupStatsMocks({
      total: makeAggregateResult(1000, 5, 200),
    });
    // Previous period: zero revenue
    mockedPrisma.transaction.aggregate.mockResolvedValueOnce(makeAggregateResult(0, 0));

    const res = await request(app).get('/stats?dateFrom=2025-01-01&dateTo=2025-03-31');

    expect(res.status).toBe(200);
    expect(res.body.periodComparison.revenueChange).toBe(100);
  });

  it('computes 0% change when both periods are zero', async () => {
    setupStatsMocks({
      total: makeAggregateResult(0, 0, 0),
    });
    mockedPrisma.transaction.aggregate.mockResolvedValueOnce(makeAggregateResult(0, 0));

    const res = await request(app).get('/stats?dateFrom=2025-01-01&dateTo=2025-03-31');

    expect(res.status).toBe(200);
    expect(res.body.periodComparison.revenueChange).toBe(0);
    expect(res.body.periodComparison.countChange).toBe(0);
  });

  it('handles null _sum.paymentAmount gracefully (returns 0)', async () => {
    mockedPrisma.transaction.aggregate
      .mockResolvedValueOnce(makeAggregateResult(null, 0, null))
      .mockResolvedValueOnce(makeAggregateResult(null, 0))
      .mockResolvedValueOnce(makeAggregateResult(null, 0));
    mockedPrisma.$queryRaw.mockResolvedValue([]);
    mockedPrisma.transaction.findMany.mockResolvedValue([]);

    const res = await request(app).get('/stats');

    expect(res.status).toBe(200);
    expect(res.body.summary.totalRevenue).toBe(0);
    expect(res.body.summary.averageAmount).toBe(0);
  });

  it('returns 500 when an aggregate call throws', async () => {
    mockedPrisma.transaction.aggregate.mockRejectedValue(new Error('Aggregate failed'));
    mockedPrisma.$queryRaw.mockResolvedValue([]);
    mockedPrisma.transaction.findMany.mockResolvedValue([]);

    const res = await request(app).get('/stats');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Aggregate failed');
  });
});

// ============================================
// GET /export — Export invoices
// ============================================

describe('GET /export — Export invoices', () => {
  const csvTx = createMockTransaction({
    id: 'txn-export-00001',
    createdAt: new Date('2025-03-01T00:00:00.000Z'),
    user: { username: 'exporter', email: 'export@example.com' },
    description: 'Export test',
    amount: 50,
    paymentAmount: 4.99,
    currency: 'EUR',
    paymentProvider: 'STRIPE',
    paymentId: 'pi_export_1',
  });

  it('exports as CSV by default with BOM and correct Content-Type', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([csvTx]);

    const res = await request(app).get('/export');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/\.csv/);
    // BOM character U+FEFF must be present for Excel compatibility
    expect(res.text.charCodeAt(0)).toBe(0xfeff);
  });

  it('CSV includes all expected column headers', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([csvTx]);

    const res = await request(app).get('/export');

    const firstLine = res.text.replace(/^\uFEFF/, '').split('\n')[0];
    expect(firstLine).toBe(
      'Invoice Number,Date,Username,Email,Description,Credits,Amount,Currency,Payment Provider,Payment ID,Transaction ID'
    );
  });

  it('CSV contains one data row per transaction', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([csvTx]);

    const res = await request(app).get('/export');

    // Lines: BOM+header, data row (no trailing newline check needed)
    const lines = res.text
      .replace(/^\uFEFF/, '')
      .split('\n')
      .filter(Boolean);
    expect(lines).toHaveLength(2); // header + 1 data row
  });

  it('exports as JSON when format=json', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([csvTx]);

    const res = await request(app).get('/export?format=json');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.headers['content-disposition']).toMatch(/\.json/);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  it('JSON export contains expected fields', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([csvTx]);

    const res = await request(app).get('/export?format=json');

    const item = res.body[0];
    expect(item).toMatchObject({
      username: 'exporter',
      email: 'export@example.com',
      currency: 'EUR',
      transactionId: 'txn-export-00001',
    });
    expect(item.invoiceNumber).toMatch(/^MO-\d{4}-\d{5}$/);
    expect(item.amount).toBe('4.99');
  });

  it('applies dateFrom and dateTo filters to the export query', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([]);

    await request(app).get('/export?dateFrom=2025-01-01&dateTo=2025-06-30');

    expect(mockedPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: new Date('2025-01-01'),
          }),
        }),
      })
    );
  });

  it('filters export by paymentProvider', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([]);

    await request(app).get('/export?paymentProvider=STRIPE');

    expect(mockedPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentProvider: 'STRIPE' }),
      })
    );
  });

  it('returns 400 for an invalid format param', async () => {
    const res = await request(app).get('/export?format=xml');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('escapes double-quotes in username and email in CSV output', async () => {
    const tricky = createMockTransaction({
      user: { username: 'user"quotes', email: 'tricky"@example.com' },
    });
    mockedPrisma.transaction.findMany.mockResolvedValue([tricky]);

    const res = await request(app).get('/export');

    expect(res.text).toContain('user""quotes');
    expect(res.text).toContain('tricky""@example.com');
  });

  it('returns empty CSV (headers only) when no matching transactions', async () => {
    mockedPrisma.transaction.findMany.mockResolvedValue([]);

    const res = await request(app).get('/export');

    expect(res.status).toBe(200);
    const lines = res.text
      .replace(/^\uFEFF/, '')
      .split('\n')
      .filter(Boolean);
    expect(lines).toHaveLength(1); // header only
  });

  it('returns 500 when prisma throws during export', async () => {
    mockedPrisma.transaction.findMany.mockRejectedValue(new Error('Export DB error'));

    const res = await request(app).get('/export');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Export DB error');
  });
});

// ============================================
// GET /:id — Single invoice details
// ============================================

describe('GET /:id — Single invoice', () => {
  it('returns invoice details including invoiceData from service', async () => {
    const tx = createMockTransaction({ id: 'txn-single-99999' });
    mockedPrisma.transaction.findFirst.mockResolvedValue(tx);
    mockedInvoiceService.getInvoiceData.mockResolvedValue({
      invoiceNumber: 'MO-2025-SERVICE',
      invoiceDate: '2025-06-15',
    });

    const res = await request(app).get('/txn-single-99999');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('txn-single-99999');
    expect(res.body.invoiceNumber).toBe('MO-2025-SERVICE');
    expect(res.body.invoiceData).toMatchObject({ invoiceDate: '2025-06-15' });
    expect(mockedInvoiceService.getInvoiceData).toHaveBeenCalledWith('txn-single-99999', tx.userId);
  });

  it('falls back to computed invoice number when service returns null invoiceData', async () => {
    const tx = createMockTransaction({
      id: 'txn-fallback-12345',
      createdAt: new Date('2025-08-01'),
    });
    mockedPrisma.transaction.findFirst.mockResolvedValue(tx);
    mockedInvoiceService.getInvoiceData.mockResolvedValue(null);

    const res = await request(app).get('/txn-fallback-12345');

    expect(res.status).toBe(200);
    // Fallback: MO-YYYY-last5ofId (upper)
    expect(res.body.invoiceNumber).toBe('MO-2025-12345');
  });

  it('queries prisma with type=PURCHASE and paymentStatus=COMPLETED', async () => {
    const tx = createMockTransaction();
    mockedPrisma.transaction.findFirst.mockResolvedValue(tx);
    mockedInvoiceService.getInvoiceData.mockResolvedValue(null);

    await request(app).get('/txn-abc-12345');

    expect(mockedPrisma.transaction.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'txn-abc-12345',
          type: 'PURCHASE',
          paymentStatus: 'COMPLETED',
        }),
      })
    );
  });

  it('returns 404 when transaction is not found', async () => {
    mockedPrisma.transaction.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/nonexistent-tx');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/invoice not found/i);
  });

  it('returns 500 when prisma throws', async () => {
    mockedPrisma.transaction.findFirst.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/txn-abc-12345');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB error');
  });

  it('returns 500 when invoiceService.getInvoiceData throws', async () => {
    mockedPrisma.transaction.findFirst.mockResolvedValue(createMockTransaction());
    mockedInvoiceService.getInvoiceData.mockRejectedValue(new Error('Service unavailable'));

    const res = await request(app).get('/txn-abc-12345');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Service unavailable');
  });
});

// ============================================
// GET /:id/html — Invoice HTML
// ============================================

describe('GET /:id/html — Invoice HTML', () => {
  it('returns HTML with correct Content-Type and inline disposition', async () => {
    const tx = createMockTransaction({ id: 'txn-html-55555' });
    mockedPrisma.transaction.findFirst.mockResolvedValue(tx);
    mockedInvoiceService.generateInvoiceHtml.mockResolvedValue('<html><body>Invoice</body></html>');

    const res = await request(app).get('/txn-html-55555/html');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.headers['content-disposition']).toMatch(/inline/);
    expect(res.headers['content-disposition']).toMatch(/invoice-txn-html-55555\.html/);
    expect(res.text).toContain('<html>');
  });

  it('defaults to language "fr" when no language param is provided', async () => {
    const tx = createMockTransaction({ id: 'txn-lang-default' });
    mockedPrisma.transaction.findFirst.mockResolvedValue(tx);
    mockedInvoiceService.generateInvoiceHtml.mockResolvedValue('<html>FR</html>');

    await request(app).get('/txn-lang-default/html');

    expect(mockedInvoiceService.generateInvoiceHtml).toHaveBeenCalledWith(
      'txn-lang-default',
      tx.userId,
      'fr'
    );
  });

  it('passes language "en" to the service when ?language=en', async () => {
    const tx = createMockTransaction({ id: 'txn-lang-en' });
    mockedPrisma.transaction.findFirst.mockResolvedValue(tx);
    mockedInvoiceService.generateInvoiceHtml.mockResolvedValue('<html>EN</html>');

    await request(app).get('/txn-lang-en/html?language=en');

    expect(mockedInvoiceService.generateInvoiceHtml).toHaveBeenCalledWith(
      'txn-lang-en',
      tx.userId,
      'en'
    );
  });

  it('returns 404 when the transaction is not found', async () => {
    mockedPrisma.transaction.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/nonexistent/html');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/invoice not found/i);
    expect(mockedInvoiceService.generateInvoiceHtml).not.toHaveBeenCalled();
  });

  it('returns 404 when generateInvoiceHtml returns null', async () => {
    const tx = createMockTransaction({ id: 'txn-no-html' });
    mockedPrisma.transaction.findFirst.mockResolvedValue(tx);
    mockedInvoiceService.generateInvoiceHtml.mockResolvedValue(null);

    const res = await request(app).get('/txn-no-html/html');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/invoice not found/i);
  });

  it('returns 500 when prisma throws on the html route', async () => {
    mockedPrisma.transaction.findFirst.mockRejectedValue(new Error('HTML DB error'));

    const res = await request(app).get('/txn-abc-12345/html');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('HTML DB error');
  });

  it('returns 500 when generateInvoiceHtml throws', async () => {
    const tx = createMockTransaction({ id: 'txn-html-throw' });
    mockedPrisma.transaction.findFirst.mockResolvedValue(tx);
    mockedInvoiceService.generateInvoiceHtml.mockRejectedValue(new Error('Template render failed'));

    const res = await request(app).get('/txn-html-throw/html');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Template render failed');
  });
});
