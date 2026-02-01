/**
 * Users Routes - GDPR Compliance
 *
 * Endpoints:
 * - GET /me/export - Export user data (Article 20)
 * - DELETE /me - Delete account (Article 17)
 * - POST /withdrawal-request - EU withdrawal request
 */

import {
  Router,
  requireAuth,
  prisma,
  logger,
  sendEmail,
  withdrawalRequestSchema,
} from './shared.js';

const router = Router();

// ============================================
// DATA EXPORT (GDPR Article 20)
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

// ============================================
// ACCOUNT DELETION (GDPR Article 17)
// ============================================

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

// ============================================
// WITHDRAWAL REQUEST (EU Consumer Rights)
// ============================================

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
