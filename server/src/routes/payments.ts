/**
 * Payments Routes
 * Thin controller layer that delegates to use cases
 * Dependencies injected via DI container
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { idempotent } from '../middleware/idempotency.js';
import { CREDIT_PACKAGES } from '../application/use-cases/payments/index.js';

const router = Router();

// Validation schemas
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
router.post('/stripe/checkout', requireAuth, async (req, res) => {
  try {
    const validation = stripeCheckoutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors.map(e => e.message),
      });
    }

    const { packageId, useStripeLink } = validation.data;
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
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Verify Stripe payment
router.get('/stripe/verify/:sessionId', requireAuth, async (req, res) => {
  try {
    const stripeGateway = req.container.resolve('stripeGateway');

    if (!stripeGateway.isConfigured()) {
      return res.status(503).json({ error: 'Stripe payments not configured' });
    }

    const verification = await stripeGateway.verifyPayment(req.params.sessionId);
    res.json(verification);
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Create PayPal order
router.post('/paypal/order', requireAuth, async (req, res) => {
  try {
    const validation = paypalOrderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors.map(e => e.message),
      });
    }

    const createCheckoutUseCase = req.container.resolve('createCheckoutUseCase');
    const frontendUrl = req.container.resolve('frontendUrl');

    const result = await createCheckoutUseCase.execute({
      userId: req.auth.userId,
      packageId: validation.data.packageId,
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
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// Capture PayPal order (after user approves)
// Uses idempotency middleware to prevent double-crediting on retried requests
router.post('/paypal/capture', requireAuth, idempotent, async (req, res) => {
  try {
    const validation = paypalCaptureSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors.map(e => e.message),
      });
    }

    const capturePaymentUseCase = req.container.resolve('capturePaymentUseCase');

    const result = await capturePaymentUseCase.execute({
      userId: req.auth.userId,
      orderId: validation.data.orderId,
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
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({ error: 'Failed to capture PayPal order' });
  }
});

// Get user's purchase history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const transactionRepository = req.container.resolve('transactionRepository');

    const purchases = await transactionRepository.findByUser(req.auth.userId, {
      type: 'PURCHASE',
    });

    // Filter to only completed purchases
    const completed = purchases.filter(p => p.paymentStatus === 'COMPLETED');
    res.json(completed);
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
});

// Re-export CREDIT_PACKAGES for backward compatibility
export { CREDIT_PACKAGES };

export default router;
