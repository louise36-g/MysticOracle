/**
 * Admin Routes - Transactions & Revenue
 */

import { Router, z, Prisma, prisma } from './shared.js';

const router = Router();

// ============================================
// TRANSACTIONS
// ============================================

router.get('/', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// ============================================
// REVENUE
// ============================================

router.get('/revenue', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ error: 'Failed to fetch revenue' });
  }
});

// ============================================
// REVENUE EXPORT
// ============================================

router.get('/revenue/export', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error exporting revenue:', error);
    res.status(500).json({ error: 'Failed to export revenue' });
  }
});

// Get available months for export
router.get('/revenue/months', async (req, res) => {
  try {
    const revenueExportService = req.container.resolve('revenueExportService');
    const months = await revenueExportService.getAvailableMonths();
    res.json({ months });
  } catch (error) {
    console.error('Error fetching revenue months:', error);
    res.status(500).json({ error: 'Failed to fetch months' });
  }
});

export default router;
