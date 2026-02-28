/**
 * Payments Routes Tests
 * Tests for GET /packages, POST /stripe/checkout, GET /stripe/verify/:sessionId,
 * POST /paypal/order, POST /paypal/capture, GET /history
 */

import { describe, it, expect, vi, type Mock } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock auth middleware
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn((_req: any, _res: any, next: any) => {
    _req.auth = { userId: 'test-user-123', sessionId: 'test-session' };
    next();
  }),
}));

// Mock idempotency middleware (pass-through)
vi.mock('../../middleware/idempotency.js', () => ({
  idempotent: vi.fn((_req: any, _res: any, next: any) => next()),
}));

// Mock CREDIT_PACKAGES
vi.mock('../../application/use-cases/payments/index.js', () => ({
  CREDIT_PACKAGES: [
    { id: 'starter', credits: 10, priceEur: 2.99 },
    { id: 'basic', credits: 25, priceEur: 5.99 },
    { id: 'popular', credits: 60, priceEur: 9.99, bonusCredits: 10 },
    { id: 'value', credits: 150, priceEur: 19.99, bonusCredits: 30 },
    { id: 'premium', credits: 400, priceEur: 39.99, bonusCredits: 100 },
  ],
}));

import paymentsRouter from '../../routes/payments.js';

// DI container mocks
const mockCreateCheckoutUseCase = { execute: vi.fn() };
const mockVerifyStripePaymentUseCase = { execute: vi.fn() };
const mockCapturePaymentUseCase = { execute: vi.fn() };
const mockTransactionRepository = { findByUser: vi.fn() };
const mockFrontendUrl = 'https://celestiarcana.com';

const containerRegistry: Record<string, unknown> = {
  createCheckoutUseCase: mockCreateCheckoutUseCase,
  verifyStripePaymentUseCase: mockVerifyStripePaymentUseCase,
  capturePaymentUseCase: mockCapturePaymentUseCase,
  transactionRepository: mockTransactionRepository,
  frontendUrl: mockFrontendUrl,
};

describe('Payments Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req: any, _res: any, next: any) => {
      req.container = {
        resolve: (name: string) => containerRegistry[name],
      };
      next();
    });
    app.use('/', paymentsRouter);
  });

  // ============================================
  // GET /packages
  // ============================================
  describe('GET /packages', () => {
    it('should return 200 with array of packages', async () => {
      const res = await request(app).get('/packages');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(5);
    });

    it('should not require authentication', async () => {
      // Even without auth header, /packages should work
      const res = await request(app).get('/packages');
      expect(res.status).toBe(200);
    });
  });

  // ============================================
  // POST /stripe/checkout
  // ============================================
  describe('POST /stripe/checkout', () => {
    it('should return 400 for invalid packageId', async () => {
      const res = await request(app).post('/stripe/checkout').send({ packageId: 'nonexistent' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/validation failed/i);
    });

    it('should return 200 with sessionId and url on success', async () => {
      mockCreateCheckoutUseCase.execute.mockResolvedValue({
        success: true,
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/cs_test_123',
      });

      const res = await request(app).post('/stripe/checkout').send({ packageId: 'basic' });

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe('cs_test_123');
      expect(res.body.url).toBe('https://checkout.stripe.com/cs_test_123');
    });

    it('should pass stripe provider when useStripeLink is false', async () => {
      mockCreateCheckoutUseCase.execute.mockResolvedValue({
        success: true,
        sessionId: 's',
        url: 'u',
      });

      await request(app)
        .post('/stripe/checkout')
        .send({ packageId: 'basic', useStripeLink: false });

      expect(mockCreateCheckoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'stripe' })
      );
    });

    it('should pass stripe_link provider when useStripeLink is true', async () => {
      mockCreateCheckoutUseCase.execute.mockResolvedValue({
        success: true,
        sessionId: 's',
        url: 'u',
      });

      await request(app).post('/stripe/checkout').send({ packageId: 'basic', useStripeLink: true });

      expect(mockCreateCheckoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'stripe_link' })
      );
    });

    it('should return 404 when user not found', async () => {
      mockCreateCheckoutUseCase.execute.mockResolvedValue({
        success: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });

      const res = await request(app).post('/stripe/checkout').send({ packageId: 'basic' });

      expect(res.status).toBe(404);
    });

    it('should return 503 when provider not configured', async () => {
      mockCreateCheckoutUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Stripe not configured',
        errorCode: 'PROVIDER_NOT_CONFIGURED',
      });

      const res = await request(app).post('/stripe/checkout').send({ packageId: 'basic' });

      expect(res.status).toBe(503);
    });

    it('should return 400 for invalid package from use case', async () => {
      mockCreateCheckoutUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Invalid package',
        errorCode: 'INVALID_PACKAGE',
      });

      const res = await request(app).post('/stripe/checkout').send({ packageId: 'starter' });

      expect(res.status).toBe(400);
    });

    it('should return 500 on unexpected error', async () => {
      mockCreateCheckoutUseCase.execute.mockRejectedValue(new Error('boom'));

      const res = await request(app).post('/stripe/checkout').send({ packageId: 'basic' });

      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // GET /stripe/verify/:sessionId
  // ============================================
  describe('GET /stripe/verify/:sessionId', () => {
    it('should return 200 with verification result', async () => {
      const result = { status: 'paid', credits: 25 };
      mockVerifyStripePaymentUseCase.execute.mockResolvedValue(result);

      const res = await request(app).get('/stripe/verify/cs_test_123');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(result);
      expect(mockVerifyStripePaymentUseCase.execute).toHaveBeenCalledWith({
        userId: 'test-user-123',
        sessionId: 'cs_test_123',
      });
    });

    it('should return 500 on error', async () => {
      mockVerifyStripePaymentUseCase.execute.mockRejectedValue(new Error('boom'));

      const res = await request(app).get('/stripe/verify/cs_test_123');

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/failed to verify/i);
    });
  });

  // ============================================
  // POST /paypal/order
  // ============================================
  describe('POST /paypal/order', () => {
    it('should return 400 for invalid packageId', async () => {
      const res = await request(app).post('/paypal/order').send({ packageId: 'nonexistent' });

      expect(res.status).toBe(400);
    });

    it('should return 200 with orderId and approvalUrl', async () => {
      mockCreateCheckoutUseCase.execute.mockResolvedValue({
        success: true,
        sessionId: 'paypal-order-123',
        url: 'https://paypal.com/approve/123',
      });

      const res = await request(app).post('/paypal/order').send({ packageId: 'basic' });

      expect(res.status).toBe(200);
      expect(res.body.orderId).toBe('paypal-order-123');
      expect(res.body.approvalUrl).toBe('https://paypal.com/approve/123');
    });

    it('should pass paypal provider to use case', async () => {
      mockCreateCheckoutUseCase.execute.mockResolvedValue({
        success: true,
        sessionId: 'o',
        url: 'u',
      });

      await request(app).post('/paypal/order').send({ packageId: 'basic' });

      expect(mockCreateCheckoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'paypal' })
      );
    });

    it('should return 404 when user not found', async () => {
      mockCreateCheckoutUseCase.execute.mockResolvedValue({
        success: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      });

      const res = await request(app).post('/paypal/order').send({ packageId: 'basic' });

      expect(res.status).toBe(404);
    });

    it('should return 503 when PayPal not configured', async () => {
      mockCreateCheckoutUseCase.execute.mockResolvedValue({
        success: false,
        error: 'PayPal not configured',
        errorCode: 'PROVIDER_NOT_CONFIGURED',
      });

      const res = await request(app).post('/paypal/order').send({ packageId: 'basic' });

      expect(res.status).toBe(503);
    });

    it('should return 500 on unexpected error', async () => {
      mockCreateCheckoutUseCase.execute.mockRejectedValue(new Error('boom'));

      const res = await request(app).post('/paypal/order').send({ packageId: 'basic' });

      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // POST /paypal/capture
  // ============================================
  describe('POST /paypal/capture', () => {
    it('should return 400 when orderId is missing', async () => {
      const res = await request(app).post('/paypal/capture').send({});

      expect(res.status).toBe(400);
    });

    it('should return 200 with credits, captureId, and newBalance', async () => {
      mockCapturePaymentUseCase.execute.mockResolvedValue({
        success: true,
        credits: 25,
        captureId: 'capture-123',
        newBalance: 50,
      });

      const res = await request(app).post('/paypal/capture').send({ orderId: 'paypal-order-123' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        credits: 25,
        captureId: 'capture-123',
        newBalance: 50,
      });
    });

    it('should return 503 when provider not configured', async () => {
      mockCapturePaymentUseCase.execute.mockResolvedValue({
        success: false,
        error: 'PayPal not configured',
        errorCode: 'PROVIDER_NOT_CONFIGURED',
      });

      const res = await request(app).post('/paypal/capture').send({ orderId: 'paypal-order-123' });

      expect(res.status).toBe(503);
    });

    it('should return 400 when capture fails', async () => {
      mockCapturePaymentUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Capture failed',
        errorCode: 'CAPTURE_FAILED',
      });

      const res = await request(app).post('/paypal/capture').send({ orderId: 'paypal-order-123' });

      expect(res.status).toBe(400);
    });

    it('should return 500 on unexpected error', async () => {
      mockCapturePaymentUseCase.execute.mockRejectedValue(new Error('boom'));

      const res = await request(app).post('/paypal/capture').send({ orderId: 'paypal-order-123' });

      expect(res.status).toBe(500);
    });
  });

  // ============================================
  // GET /history
  // ============================================
  describe('GET /history', () => {
    it('should return 200 with completed purchases', async () => {
      const purchases = [
        { id: 't1', paymentStatus: 'COMPLETED', amount: 5.99 },
        { id: 't2', paymentStatus: 'COMPLETED', amount: 9.99 },
        { id: 't3', paymentStatus: 'PENDING', amount: 2.99 },
      ];
      mockTransactionRepository.findByUser.mockResolvedValue(purchases);

      const res = await request(app).get('/history');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every((p: any) => p.paymentStatus === 'COMPLETED')).toBe(true);
    });

    it('should filter out non-completed purchases', async () => {
      const purchases = [
        { id: 't1', paymentStatus: 'PENDING', amount: 5.99 },
        { id: 't2', paymentStatus: 'FAILED', amount: 9.99 },
      ];
      mockTransactionRepository.findByUser.mockResolvedValue(purchases);

      const res = await request(app).get('/history');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it('should call transactionRepository with correct params', async () => {
      mockTransactionRepository.findByUser.mockResolvedValue([]);

      await request(app).get('/history');

      expect(mockTransactionRepository.findByUser).toHaveBeenCalledWith('test-user-123', {
        type: 'PURCHASE',
      });
    });

    it('should return 500 on error', async () => {
      mockTransactionRepository.findByUser.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/history');

      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/failed to fetch/i);
    });
  });
});
