import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { creditService, CREDIT_COSTS } from '../services/CreditService.js';
import { AchievementService } from '../services/AchievementService.js';
import { NotFoundError, ConflictError } from '../shared/errors/ApplicationError.js';
import { parsePaginationParams, createPaginatedResponse } from '../shared/pagination/pagination.js';
import { validateQuery, paginationQuerySchema } from '../middleware/validateQuery.js';
import { debug, logger } from '../lib/logger.js';
import { sendEmail } from '../services/email.js';

// Create achievement service instance
const achievementService = new AchievementService(prisma);

const router = Router();

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile including credits, achievements, and reading count
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    debug.log('[Users /me] Fetching user with ID:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      debug.log('[Users /me] User not found for ID:', userId);
      throw new NotFoundError('User', userId);
    }

    debug.log('[Users /me] Found user, credits:', user.credits);
    res.json(user);
  } catch (error) {
    console.error('[Users /me] Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user preferences
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { language, welcomeCompleted } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        language: language || undefined,
        welcomeCompleted: typeof welcomeCompleted === 'boolean' ? welcomeCompleted : undefined,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get user credits
router.get('/me/credits', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        totalCreditsEarned: true,
        totalCreditsSpent: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

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
    const { invoiceService } = await import('../services/invoiceService.js');
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

/**
 * @openapi
 * /api/v1/users/me/daily-bonus:
 *   post:
 *     tags:
 *       - Users
 *     summary: Claim daily login bonus
 *     description: Claim the daily login bonus. Awards 2 credits daily, with an additional 5 credit bonus every 7 days (7-day streak)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Daily bonus claimed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 creditsAwarded:
 *                   type: integer
 *                   example: 7
 *                 newBalance:
 *                   type: integer
 *                   example: 50
 *                 streak:
 *                   type: integer
 *                   example: 7
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Daily bonus already claimed today
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/me/daily-bonus', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = new Date(user.lastLoginDate);
    lastLogin.setHours(0, 0, 0, 0);

    if (today.getTime() === lastLogin.getTime()) {
      throw new ConflictError('Daily bonus already claimed for today');
    }

    // Calculate streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isConsecutive = lastLogin.getTime() === yesterday.getTime();
    const newStreak = isConsecutive ? user.loginStreak + 1 : 1;

    // Calculate bonus using CreditService constants
    let bonusCredits = CREDIT_COSTS.DAILY_BONUS_BASE;
    if (newStreak % 7 === 0) bonusCredits += CREDIT_COSTS.WEEKLY_STREAK_BONUS;

    // Add credits using CreditService (handles transaction + audit)
    const result = await creditService.addCredits({
      userId,
      amount: bonusCredits,
      type: 'DAILY_BONUS',
      description: `Daily login bonus (${newStreak} day streak)`,
    });

    // Update streak and last login date
    await prisma.user.update({
      where: { id: userId },
      data: {
        loginStreak: newStreak,
        lastLoginDate: new Date(),
      },
    });

    // Check for streak-based achievements (non-critical)
    let unlockedAchievements: { achievementId: string; reward: number }[] = [];
    try {
      unlockedAchievements = await achievementService.checkAndUnlockAchievements(userId, {
        loginStreak: newStreak,
      });
    } catch (achievementError) {
      console.warn('[Daily Bonus] Failed to check achievements:', achievementError);
    }

    res.json({
      success: true,
      creditsAwarded: bonusCredits,
      newBalance: result.newBalance + unlockedAchievements.reduce((sum, a) => sum + a.reward, 0),
      streak: newStreak,
      unlockedAchievements,
    });
  } catch (error) {
    console.error('Error claiming daily bonus:', error);
    next(error); // Pass to error handler middleware
  }
});

// ============================================
// GDPR COMPLIANCE ENDPOINTS
// ============================================

/**
 * GET /api/users/me/export
 * GDPR Article 20 - Right to data portability
 * Returns all user data in a portable JSON format
 */
router.get('/me/export', requireAuth, async (req, res) => {
  try {
    const exportUserDataUseCase = req.container.resolve('exportUserDataUseCase');
    const auditService = req.container.resolve('auditService');

    const result = await exportUserDataUseCase.execute({
      userId: req.auth.userId,
    });

    if (!result.success) {
      const statusCode = result.errorCode === 'USER_NOT_FOUND' ? 404 : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    // Log the export for audit trail
    await auditService.log('USER_DATA_EXPORT', 'User', req.auth.userId, {
      userId: req.auth.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Set headers for file download
    const filename = `mysticoracle-data-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.json(result.data);
  } catch (error) {
    console.error('[Users /me/export] Error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

/**
 * DELETE /api/users/me
 * GDPR Article 17 - Right to erasure ("Right to be forgotten")
 * Anonymizes user data and deactivates account
 *
 * Required body: { confirmEmail: string }
 */
router.delete('/me', requireAuth, async (req, res) => {
  try {
    const { confirmEmail } = req.body;

    if (!confirmEmail || typeof confirmEmail !== 'string') {
      return res.status(400).json({
        error:
          'Email confirmation required. Please provide your account email to confirm deletion.',
      });
    }

    const deleteUserAccountUseCase = req.container.resolve('deleteUserAccountUseCase');
    const auditService = req.container.resolve('auditService');

    // Log deletion request first (in case something fails)
    await auditService.log('ACCOUNT_DELETION_REQUESTED', 'User', req.auth.userId, {
      userId: req.auth.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const result = await deleteUserAccountUseCase.execute({
      userId: req.auth.userId,
      confirmEmail,
    });

    if (!result.success) {
      const statusCodes: Record<string, number> = {
        USER_NOT_FOUND: 404,
        EMAIL_MISMATCH: 400,
        ADMIN_PROTECTED: 403,
        INTERNAL_ERROR: 500,
      };
      const statusCode = statusCodes[result.errorCode || 'INTERNAL_ERROR'] || 500;
      return res.status(statusCode).json({ error: result.error });
    }

    // Log successful deletion
    await auditService.log('ACCOUNT_DELETED', 'User', req.auth.userId, {
      userId: req.auth.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('[Users DELETE /me] Error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Withdrawal request validation schema
const withdrawalRequestSchema = z.object({
  email: z.string().email(),
  orderReference: z.string().min(1, 'Order reference is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  reason: z.string().optional(),
});

/**
 * @openapi
 * /api/v1/users/withdrawal-request:
 *   post:
 *     tags:
 *       - Users
 *     summary: Submit a withdrawal/refund request
 *     description: |
 *       Submit a request to exercise the 14-day withdrawal right under EU consumer law.
 *       The request will be processed within 14 days.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - orderReference
 *               - purchaseDate
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               orderReference:
 *                 type: string
 *                 description: Transaction or order ID
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *                 description: Optional reason for withdrawal
 *     responses:
 *       200:
 *         description: Withdrawal request submitted successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 */
router.post('/withdrawal-request', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Validate request body
    const validation = withdrawalRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const { email, orderReference, purchaseDate, reason } = validation.data;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the withdrawal request
    logger.info(
      `[Withdrawal Request] User: ${userId}, Order: ${orderReference}, Date: ${purchaseDate}`
    );

    // Send notification email to refunds inbox
    try {
      await sendEmail({
        to: 'refunds@mysticoracle.com',
        subject: `Withdrawal Request - ${orderReference}`,
        htmlContent: `
          <h2>New Withdrawal Request</h2>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>User Email:</strong> ${user.email || email}</p>
          <p><strong>Username:</strong> ${user.username || 'N/A'}</p>
          <p><strong>Contact Email:</strong> ${email}</p>
          <p><strong>Order Reference:</strong> ${orderReference}</p>
          <p><strong>Purchase Date:</strong> ${purchaseDate}</p>
          <p><strong>Reason:</strong> ${reason || 'Not provided'}</p>
          <p><strong>Request Date:</strong> ${new Date().toISOString()}</p>
          <hr>
          <p>This request must be processed within 14 days per EU Directive 2011/83/EU.</p>
        `,
      });
    } catch (emailError) {
      // Log but don't fail - the request is still valid
      console.error('[Withdrawal Request] Failed to send notification email:', emailError);
    }

    // Send confirmation email to user
    try {
      await sendEmail({
        to: email,
        subject: 'Withdrawal Request Received - MysticOracle',
        htmlContent: `
          <h2>Withdrawal Request Confirmation</h2>
          <p>We have received your withdrawal request for order <strong>${orderReference}</strong>.</p>
          <p><strong>Purchase Date:</strong> ${purchaseDate}</p>
          <p><strong>Request Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p>Your request will be processed within 14 days as required by EU consumer protection law.</p>
          <p>If you have any questions, please contact us at refunds@mysticoracle.com</p>
          <hr>
          <p style="color: #666; font-size: 12px;">MysticOracle - 7 rue Beauregard, 77171 Chalautre la Grande, France</p>
        `,
      });
    } catch (emailError) {
      // Log but don't fail
      console.error('[Withdrawal Request] Failed to send confirmation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      requestId: `WR-${Date.now()}`,
    });
  } catch (error) {
    console.error('[Users POST /withdrawal-request] Error:', error);
    res.status(500).json({ error: 'Failed to submit withdrawal request' });
  }
});

export default router;
