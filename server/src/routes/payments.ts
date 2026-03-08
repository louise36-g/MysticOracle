/**
 * Payments Routes
 * Thin controller layer that delegates to use cases
 * Dependencies injected via DI container
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { idempotent } from '../middleware/idempotency.js';
import { CREDIT_PACKAGES } from '../application/use-cases/payments/index.js';

const router = Router();

// Validation schemas
import { z } from 'zod';

const stripeCheckoutSchema = z.object({
  packageId: z
    .string()
    .refine(
      val =>
        ['starter', 'basic', 'popular', 'value', 'premium'].includes(val) ||
        /^quick-[1-5]$/.test(val),
      { message: 'Invalid package ID' }
    ),
  useStripeLink: z.boolean().optional().default(false),
});

const paypalOrderSchema = z.object({
  packageId: z
    .string()
    .refine(
      val =>
        ['starter', 'basic', 'popular', 'value', 'premium'].includes(val) ||
        /^quick-[1-5]$/.test(val),
      { message: 'Invalid package ID' }
    ),
});

const paypalCaptureSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

// Get available credit packages
router.get('/packages', (_req, res) => {
  res.json(CREDIT_PACKAGES);
});

// Create Stripe checkout session
router.post(
  '/stripe/checkout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { packageId, useStripeLink } = stripeCheckoutSchema.parse(req.body);
    const createCheckoutUseCase = req.container.resolve('createCheckoutUseCase');
    const frontendUrl = req.container.resolve('frontendUrl');

    const result = await createCheckoutUseCase.execute({
      userId: req.auth.userId,
      packageId,
      provider: useStripeLink ? 'stripe_link' : 'stripe',
      frontendUrl,
    });

    if (!result.success) {
      const statusCode =
        result.errorCode === 'USER_NOT_FOUND'
          ? 404
          : result.errorCode === 'PROVIDER_NOT_CONFIGURED'
            ? 503
            : result.errorCode === 'INVALID_PACKAGE'
              ? 400
              : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ sessionId: result.sessionId, url: result.url });
  })
);

// Verify Stripe payment AND add credits (backup to webhook)
router.get(
  '/stripe/verify/:sessionId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const verifyUseCase = req.container.resolve('verifyStripePaymentUseCase');

    const result = await verifyUseCase.execute({
      userId: req.auth.userId,
      sessionId: req.params.sessionId,
    });

    res.json(result);
  })
);

// Create PayPal order
router.post(
  '/paypal/order',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { packageId } = paypalOrderSchema.parse(req.body);
    const createCheckoutUseCase = req.container.resolve('createCheckoutUseCase');
    const frontendUrl = req.container.resolve('frontendUrl');

    const result = await createCheckoutUseCase.execute({
      userId: req.auth.userId,
      packageId,
      provider: 'paypal',
      frontendUrl,
    });

    if (!result.success) {
      const statusCode =
        result.errorCode === 'USER_NOT_FOUND'
          ? 404
          : result.errorCode === 'PROVIDER_NOT_CONFIGURED'
            ? 503
            : result.errorCode === 'INVALID_PACKAGE'
              ? 400
              : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ orderId: result.sessionId, approvalUrl: result.url });
  })
);

// Capture PayPal order (after user approves)
// Uses idempotency middleware to prevent double-crediting on retried requests
router.post(
  '/paypal/capture',
  requireAuth,
  idempotent,
  asyncHandler(async (req, res) => {
    const { orderId } = paypalCaptureSchema.parse(req.body);
    const capturePaymentUseCase = req.container.resolve('capturePaymentUseCase');

    const result = await capturePaymentUseCase.execute({
      userId: req.auth.userId,
      orderId,
      provider: 'paypal',
    });

    if (!result.success) {
      const statusCode =
        result.errorCode === 'PROVIDER_NOT_CONFIGURED'
          ? 503
          : result.errorCode === 'CAPTURE_FAILED'
            ? 400
            : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({
      success: true,
      credits: result.credits,
      captureId: result.captureId,
      newBalance: result.newBalance,
    });
  })
);

// Get user's purchase history
router.get(
  '/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const transactionRepository = req.container.resolve('transactionRepository');

    const purchases = await transactionRepository.findByUser(req.auth.userId, {
      type: 'PURCHASE',
    });

    // Filter to only completed purchases
    const completed = purchases.filter(p => p.paymentStatus === 'COMPLETED');
    res.json(completed);
  })
);

// Re-export CREDIT_PACKAGES for backward compatibility
export { CREDIT_PACKAGES };

export default router;
