/**
 * Admin Routes - Invoices & Accounting
 *
 * Endpoints:
 * - GET /invoices - List all invoices with filters
 * - GET /invoices/stats - Get accounting summary stats
 * - GET /invoices/:id - Get single invoice details
 * - GET /invoices/:id/html - Get invoice HTML for viewing/printing
 */

import { Router, z, prisma, Prisma } from './shared.js';
import { invoiceService } from '../../services/invoiceService.js';

const router = Router();

// ============================================
// SCHEMAS
// ============================================

const listInvoicesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(), // Search by username, email, or invoice number
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  paymentProvider: z.enum(['STRIPE', 'PAYPAL']).optional(),
  sortBy: z.enum(['createdAt', 'amount', 'username']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// LIST INVOICES
// ============================================

/**
 * @openapi
 * /api/v1/admin/invoices:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all invoices
 *     description: Get paginated list of all invoices (completed purchases) with filters
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username, email, or transaction ID
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: paymentProvider
 *         schema:
 *           type: string
 *           enum: [stripe, paypal]
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get('/', async (req, res) => {
  try {
    const validation = listInvoicesSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const {
      page,
      limit,
      search,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      paymentProvider,
      sortBy,
      sortOrder,
    } = validation.data;

    // Build where clause for completed purchases only
    const where: Prisma.TransactionWhereInput = {
      type: 'PURCHASE',
      paymentStatus: 'COMPLETED',
    };

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Include the entire end date
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Amount filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.paymentAmount = {};
      if (minAmount !== undefined) {
        where.paymentAmount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.paymentAmount.lte = maxAmount;
      }
    }

    // Payment provider filter
    if (paymentProvider) {
      where.paymentProvider = paymentProvider;
    }

    // Search filter (username, email, or transaction ID)
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { paymentId: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Build orderBy
    type OrderByType = {
      createdAt?: 'asc' | 'desc';
      paymentAmount?: 'asc' | 'desc';
      user?: { username: 'asc' | 'desc' };
    };
    let orderBy: OrderByType;
    if (sortBy === 'amount') {
      orderBy = { paymentAmount: sortOrder };
    } else if (sortBy === 'username') {
      orderBy = { user: { username: sortOrder } };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    // Execute queries
    const [invoices, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Transform for response
    const invoiceList = invoices.map(tx => ({
      id: tx.id,
      invoiceNumber: `MO-${tx.createdAt.getFullYear()}-${tx.id.slice(-5).toUpperCase()}`,
      createdAt: tx.createdAt,
      user: {
        id: tx.user.id,
        username: tx.user.username,
        email: tx.user.email,
      },
      credits: tx.amount,
      amount: tx.paymentAmount ? Number(tx.paymentAmount) : 0,
      currency: tx.currency || 'EUR',
      paymentProvider: tx.paymentProvider,
      paymentId: tx.paymentId,
      description: tx.description,
    }));

    res.json({
      data: invoiceList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Invoices] Error listing invoices:', error);
    res.status(500).json({ error: 'Failed to list invoices' });
  }
});

// ============================================
// ACCOUNTING STATS
// ============================================

/**
 * @openapi
 * /api/v1/admin/invoices/stats:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get accounting statistics
 *     description: Get summary statistics for accounting (total revenue, counts, etc.)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Accounting statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }

    const baseWhere = {
      type: 'PURCHASE' as const,
      paymentStatus: 'COMPLETED' as const,
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    };

    // Get aggregated stats
    const [totalStats, stripeStats, paypalStats, monthlyRevenue, recentInvoices] =
      await Promise.all([
        // Total revenue and count
        prisma.transaction.aggregate({
          where: baseWhere,
          _sum: { paymentAmount: true },
          _count: true,
          _avg: { paymentAmount: true },
        }),

        // Stripe revenue
        prisma.transaction.aggregate({
          where: { ...baseWhere, paymentProvider: 'STRIPE' },
          _sum: { paymentAmount: true },
          _count: true,
        }),

        // PayPal revenue
        prisma.transaction.aggregate({
          where: { ...baseWhere, paymentProvider: 'PAYPAL' },
          _sum: { paymentAmount: true },
          _count: true,
        }),

        // Monthly revenue for last 12 months
        prisma.$queryRaw<Array<{ month: string; revenue: number; count: bigint }>>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
          COALESCE(SUM("paymentAmount"), 0)::float as revenue,
          COUNT(*) as count
        FROM "Transaction"
        WHERE type = 'PURCHASE'
          AND "paymentStatus" = 'COMPLETED'
          AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,

        // Recent 5 invoices
        prisma.transaction.findMany({
          where: baseWhere,
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: {
              select: { username: true, email: true },
            },
          },
        }),
      ]);

    // Calculate period comparison (this period vs previous period)
    let periodComparison = null;
    if (dateFrom && dateTo) {
      const periodLength = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
      const previousFrom = new Date(new Date(dateFrom).getTime() - periodLength);
      const previousTo = new Date(dateFrom);

      const previousStats = await prisma.transaction.aggregate({
        where: {
          type: 'PURCHASE',
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: previousFrom,
            lt: previousTo,
          },
        },
        _sum: { paymentAmount: true },
        _count: true,
      });

      const currentRevenue = Number(totalStats._sum.paymentAmount || 0);
      const previousRevenue = Number(previousStats._sum.paymentAmount || 0);
      const revenueChange =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : currentRevenue > 0
            ? 100
            : 0;

      const currentCount = totalStats._count;
      const previousCount = previousStats._count;
      const countChange =
        previousCount > 0
          ? ((currentCount - previousCount) / previousCount) * 100
          : currentCount > 0
            ? 100
            : 0;

      periodComparison = {
        previousRevenue,
        previousCount,
        revenueChange: Math.round(revenueChange * 10) / 10,
        countChange: Math.round(countChange * 10) / 10,
      };
    }

    res.json({
      summary: {
        totalRevenue: Number(totalStats._sum.paymentAmount || 0),
        totalInvoices: totalStats._count,
        averageAmount: Number(totalStats._avg.paymentAmount || 0),
        currency: 'EUR',
      },
      byProvider: {
        stripe: {
          revenue: Number(stripeStats._sum?.paymentAmount || 0),
          count: stripeStats._count,
        },
        paypal: {
          revenue: Number(paypalStats._sum?.paymentAmount || 0),
          count: paypalStats._count,
        },
      },
      monthlyRevenue: monthlyRevenue.map(m => ({
        month: m.month,
        revenue: m.revenue,
        count: Number(m.count),
      })),
      recentInvoices: recentInvoices.map(tx => ({
        id: tx.id,
        createdAt: tx.createdAt,
        username: tx.user.username,
        amount: Number(tx.paymentAmount || 0),
        credits: tx.amount,
      })),
      periodComparison,
    });
  } catch (error) {
    console.error('[Admin Invoices] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch accounting stats' });
  }
});

// ============================================
// GET SINGLE INVOICE
// ============================================

/**
 * @openapi
 * /api/v1/admin/invoices/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get invoice details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        type: 'PURCHASE',
        paymentStatus: 'COMPLETED',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get full invoice data
    const invoiceData = await invoiceService.getInvoiceData(id, transaction.userId);

    res.json({
      id: transaction.id,
      invoiceNumber:
        invoiceData?.invoiceNumber ||
        `MO-${transaction.createdAt.getFullYear()}-${id.slice(-5).toUpperCase()}`,
      createdAt: transaction.createdAt,
      user: transaction.user,
      credits: transaction.amount,
      amount: transaction.paymentAmount ? Number(transaction.paymentAmount) : 0,
      currency: transaction.currency || 'EUR',
      paymentProvider: transaction.paymentProvider,
      paymentId: transaction.paymentId,
      description: transaction.description,
      invoiceData,
    });
  } catch (error) {
    console.error('[Admin Invoices] Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// ============================================
// GET INVOICE HTML
// ============================================

/**
 * @openapi
 * /api/v1/admin/invoices/{id}/html:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get invoice HTML for viewing/printing
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, fr]
 *           default: fr
 *     responses:
 *       200:
 *         description: Invoice HTML
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Invoice not found
 */
router.get('/:id/html', async (req, res) => {
  try {
    const { id } = req.params;
    const language = (req.query.language as 'en' | 'fr') || 'fr';

    // First find the transaction to get the userId
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        type: 'PURCHASE',
        paymentStatus: 'COMPLETED',
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const html = await invoiceService.generateInvoiceHtml(id, transaction.userId, language);

    if (!html) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.html"`);
    res.send(html);
  } catch (error) {
    console.error('[Admin Invoices] Error generating invoice HTML:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

export default router;
