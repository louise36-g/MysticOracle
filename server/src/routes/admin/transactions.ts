/**
 * Admin Routes - Transactions & Revenue
 */

import { Router, z, Prisma, prisma } from './shared.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';

const router = Router();

// ============================================
// TRANSACTIONS
// ============================================

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = z
      .object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(50),
        type: z
          .enum([
            'PURCHASE',
            'READING',
            'QUESTION',
            'DAILY_BONUS',
            'ACHIEVEMENT',
            'REFERRAL_BONUS',
            'REFUND',
          ])
          .optional(),
      })
      .parse(req.query);

    const where: Prisma.TransactionWhereInput = {};
    if (params.type) {
      where.type = params.type;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: { select: { username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  })
);

// ============================================
// REVENUE
// ============================================

router.get(
  '/revenue',
  asyncHandler(async (_req, res) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, last30Days, byProvider] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'PURCHASE', paymentStatus: 'COMPLETED' },
        _sum: { paymentAmount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'PURCHASE',
          paymentStatus: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { paymentAmount: true },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ['paymentProvider'],
        where: { type: 'PURCHASE', paymentStatus: 'COMPLETED' },
        _sum: { paymentAmount: true },
        _count: true,
      }),
    ]);

    res.json({
      totalRevenue: total._sum.paymentAmount || 0,
      totalTransactions: total._count,
      last30Days: {
        revenue: last30Days._sum.paymentAmount || 0,
        transactions: last30Days._count,
      },
      byProvider,
    });
  })
);

// ============================================
// REVENUE EXPORT
// ============================================

router.get(
  '/revenue/export',
  asyncHandler(async (req, res) => {
    const params = z
      .object({
        year: z.coerce.number().min(2020).max(2100),
        month: z.coerce.number().min(1).max(12),
      })
      .parse(req.query);

    const revenueExportService = req.container.resolve('revenueExportService');
    const data = await revenueExportService.exportToCSV(params.year, params.month);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
    res.send(data.csv);
  })
);

// Get available months for export
router.get(
  '/revenue/months',
  asyncHandler(async (req, res) => {
    const revenueExportService = req.container.resolve('revenueExportService');
    const months = await revenueExportService.getAvailableMonths();
    res.json({ months });
  })
);

export default router;
