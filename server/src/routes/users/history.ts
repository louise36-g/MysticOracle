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
// UNIFIED READING HISTORY (All Types)
// ============================================
// NOTE: This route MUST come before /me/readings to ensure proper Express matching

/**
 * Reading type discriminator for unified history
 */
type ReadingType = 'tarot' | 'birth_synthesis' | 'personal_year' | 'threshold';

interface UnifiedReading {
  id: string;
  readingType: ReadingType;
  createdAt: Date;
  creditCost: number;
  // Tarot-specific
  spreadType?: string;
  interpretationStyle?: string;
  question?: string;
  cards?: unknown;
  interpretation?: string;
  userReflection?: string;
  followUps?: Array<{
    id: string;
    question: string;
    answer: string;
    creditCost: number;
    createdAt: Date;
  }>;
  // Birth card specific
  personalityCardId?: number;
  soulCardId?: number;
  zodiacSign?: string;
  synthesisEn?: string;
  synthesisFr?: string;
  // Personal year specific
  year?: number;
  personalYearNumber?: number;
  personalYearCardId?: number;
  // Threshold specific
  transitionYear?: number;
  outgoingYearNumber?: number;
  outgoingYearCardId?: number;
  incomingYearNumber?: number;
  incomingYearCardId?: number;
}

/**
 * @openapi
 * /api/v1/users/me/readings/all:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get unified reading history (all types)
 *     description: Retrieve paginated list of all user readings including tarot, birth card synthesis, personal year, and threshold readings
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, tarot, birth_cards]
 *         description: Filter by reading type category
 *     responses:
 *       200:
 *         description: Unified reading history retrieved successfully
 */
router.get(
  '/me/readings/all',
  requireAuth,
  validateQuery(paginationQuerySchema),
  async (req, res) => {
    try {
      const userId = req.auth.userId;
      const typeFilter = req.query.type as string | undefined;
      const language = (req.query.language as string) || 'en';

      debug.log('[User API] Fetching unified readings for userId:', userId, 'type:', typeFilter);

      // Fetch all reading types in parallel
      const [tarotReadings, birthSynthesis, personalYearReadings, thresholdReadings] =
        await Promise.all([
          // Only fetch tarot if not filtering to birth_cards only
          typeFilter !== 'birth_cards'
            ? prisma.reading.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: { followUps: true },
              })
            : Promise.resolve([]),

          // Only fetch birth cards if not filtering to tarot only
          typeFilter !== 'tarot'
            ? prisma.birthCardSynthesis.findUnique({
                where: { userId },
              })
            : Promise.resolve(null),

          typeFilter !== 'tarot'
            ? prisma.personalYearReading.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
              })
            : Promise.resolve([]),

          typeFilter !== 'tarot'
            ? prisma.thresholdReading.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
              })
            : Promise.resolve([]),
        ]);

      // Transform and merge all readings into unified format
      const unifiedReadings: UnifiedReading[] = [];

      // Add tarot readings
      tarotReadings.forEach(reading => {
        unifiedReadings.push({
          id: reading.id,
          readingType: 'tarot',
          createdAt: reading.createdAt,
          creditCost: reading.creditCost,
          spreadType: reading.spreadType,
          interpretationStyle: reading.interpretationStyle,
          question: reading.question || undefined,
          cards: reading.cards,
          interpretation: reading.interpretation,
          userReflection: reading.userReflection || undefined,
          followUps: reading.followUps.map(f => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            creditCost: f.creditCost,
            createdAt: f.createdAt,
          })),
        });
      });

      // Add birth card synthesis (show if ANY language has synthesis)
      if (birthSynthesis && (birthSynthesis.synthesisEn || birthSynthesis.synthesisFr)) {
        unifiedReadings.push({
          id: birthSynthesis.id,
          readingType: 'birth_synthesis',
          createdAt: birthSynthesis.createdAt,
          creditCost: 2, // Birth synthesis costs 2 credits
          personalityCardId: birthSynthesis.personalityCardId,
          soulCardId: birthSynthesis.soulCardId,
          zodiacSign: birthSynthesis.zodiacSign,
          synthesisEn: birthSynthesis.synthesisEn,
          synthesisFr: birthSynthesis.synthesisFr,
        });
      }

      // Add personal year readings (show if ANY language has synthesis)
      personalYearReadings.forEach(reading => {
        if (reading.synthesisEn || reading.synthesisFr) {
          unifiedReadings.push({
            id: reading.id,
            readingType: 'personal_year',
            createdAt: reading.createdAt,
            creditCost: 3, // Year energy costs 3 credits
            year: reading.year,
            personalYearNumber: reading.personalYearNumber,
            personalYearCardId: reading.personalYearCardId,
            personalityCardId: reading.personalityCardId,
            soulCardId: reading.soulCardId,
            zodiacSign: reading.zodiacSign,
            synthesisEn: reading.synthesisEn,
            synthesisFr: reading.synthesisFr,
          });
        }
      });

      // Add threshold readings (show if ANY language has synthesis)
      thresholdReadings.forEach(reading => {
        if (reading.synthesisEn || reading.synthesisFr) {
          unifiedReadings.push({
            id: reading.id,
            readingType: 'threshold',
            createdAt: reading.createdAt,
            creditCost: 3, // Threshold costs 3 credits
            transitionYear: reading.transitionYear,
            outgoingYearNumber: reading.outgoingYearNumber,
            outgoingYearCardId: reading.outgoingYearCardId,
            incomingYearNumber: reading.incomingYearNumber,
            incomingYearCardId: reading.incomingYearCardId,
            personalityCardId: reading.personalityCardId,
            soulCardId: reading.soulCardId,
            synthesisEn: reading.synthesisEn,
            synthesisFr: reading.synthesisFr,
          });
        }
      });

      // Sort all by createdAt descending
      unifiedReadings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply pagination
      const total = unifiedReadings.length;
      const params = parsePaginationParams(req.query, 20, 100);
      const paginatedReadings = unifiedReadings.slice(params.skip, params.skip + params.take);

      debug.log(
        '[User API] Found',
        paginatedReadings.length,
        'unified readings out of',
        total,
        'total'
      );

      res.json(createPaginatedResponse(paginatedReadings, params, total));
    } catch (error) {
      console.error('[User API] Error fetching unified readings:', error);
      res.status(500).json({ error: 'Failed to fetch readings' });
    }
  }
);

// ============================================
// READING HISTORY (Tarot only - legacy endpoint)
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
