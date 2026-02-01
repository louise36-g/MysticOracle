/**
 * Users Routes - Reading & Transaction History
 *
 * Endpoints:
 * - GET /me/readings - Get reading history
 * - GET /me/transactions - Get transaction history
 * - GET /me/transactions/:id/invoice - Get invoice
 */

import {
  Router,
  requireAuth,
  prisma,
  parsePaginationParams,
  createPaginatedResponse,
  validateQuery,
  paginationQuerySchema,
  debug,
} from './shared.js';

const router = Router();

// ============================================
// READING HISTORY
// ============================================

/**
 * @openapi
 * /api/v1/users/me/readings:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user reading history
 *     description: Retrieve paginated list of user's tarot readings
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Reading history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reading'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me/readings', requireAuth, validateQuery(paginationQuerySchema), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const params = parsePaginationParams(req.query, 20, 100);

    debug.log('[User API] Fetching readings for userId:', userId, 'params:', params);

    const [readings, total] = await Promise.all([
      prisma.reading.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: params.take,
        skip: params.skip,
        include: {
          followUps: true,
        },
      }),
      prisma.reading.count({ where: { userId } }),
    ]);

    debug.log(
      '[User API] Found',
      readings.length,
      'readings out of',
      total,
      'total for user:',
      userId
    );

    res.json(createPaginatedResponse(readings, params, total));
  } catch (error) {
    console.error('[User API] Error fetching readings:', error);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

// ============================================
// TRANSACTION HISTORY
// ============================================

/**
 * @openapi
 * /api/v1/users/me/transactions:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user transaction history
 *     description: Retrieve paginated list of user's credit transactions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       amount:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/me/transactions',
  requireAuth,
  validateQuery(paginationQuerySchema),
  async (req, res) => {
    try {
      const userId = req.auth.userId;
      const params = parsePaginationParams(req.query, 50, 100);

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: params.take,
          skip: params.skip,
        }),
        prisma.transaction.count({ where: { userId } }),
      ]);

      res.json(createPaginatedResponse(transactions, params, total));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }
);

// ============================================
// INVOICE
// ============================================

/**
 * @openapi
 * /api/v1/users/me/transactions/{id}/invoice:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get invoice for a transaction
 *     description: Generate and download an invoice for a completed purchase transaction
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, fr]
 *           default: fr
 *         description: Invoice language
 *     responses:
 *       200:
 *         description: Invoice HTML document
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Transaction not found or not a purchase
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me/transactions/:id/invoice', requireAuth, async (req, res) => {
  try {
    const { invoiceService } = await import('../../services/invoiceService.js');
    const userId = req.auth.userId;
    const transactionId = req.params.id;
    const language = (req.query.language as 'en' | 'fr') || 'fr';

    const html = await invoiceService.generateInvoiceHtml(transactionId, userId, language);

    if (!html) {
      return res
        .status(404)
        .json({ error: 'Invoice not found or transaction is not a completed purchase' });
    }

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${transactionId}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

export default router;
