/**
 * ProcessPaymentWebhook Use Case Tests
 * Tests for payment webhook processing with idempotency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessPaymentWebhookUseCase } from '../../application/use-cases/payments/ProcessPaymentWebhook.js';
import {
  createMockStripeEvent,
  createMockPayPalEvent,
  createMockPaymentGateway,
  createMockTransactionRepository,
  createMockUserRepository,
  createMockCreditService,
  createMockTransaction,
} from '../utils/testHelpers.js';
import type { WebhookEvent } from '../../application/ports/services/IPaymentGateway.js';

describe('ProcessPaymentWebhookUseCase', () => {
  let useCase: ProcessPaymentWebhookUseCase;
  let mockStripeGateway: ReturnType<typeof createMockPaymentGateway>;
  let mockPayPalGateway: ReturnType<typeof createMockPaymentGateway>;
  let mockTransactionRepo: ReturnType<typeof createMockTransactionRepository>;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;
  let mockCreditService: ReturnType<typeof createMockCreditService>;

  beforeEach(() => {
    mockStripeGateway = createMockPaymentGateway('STRIPE');
    mockPayPalGateway = createMockPaymentGateway('PAYPAL');
    mockTransactionRepo = createMockTransactionRepository();
    mockUserRepo = createMockUserRepository();
    mockCreditService = createMockCreditService();

    useCase = new ProcessPaymentWebhookUseCase(
      mockTransactionRepo as any,
      mockUserRepo as any,
      mockCreditService as any,
      [mockStripeGateway as any, mockPayPalGateway as any]
    );
  });

  describe('Webhook Verification', () => {
    it('should reject unknown payment provider', async () => {
      const result = await useCase.execute({
        provider: 'unknown' as any,
        payload: Buffer.from('test'),
        signature: 'sig_test',
      });

      expect(result.success).toBe(false);
      expect(result.processed).toBe(false);
      expect(result.error).toContain('Unknown payment provider');
    });

    it('should reject invalid webhook signature', async () => {
      mockStripeGateway.verifyWebhook = vi.fn().mockResolvedValue(null);

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('invalid'),
        signature: 'invalid_sig',
      });

      expect(result.success).toBe(false);
      expect(result.processed).toBe(false);
      expect(result.error).toContain('Invalid webhook signature');
    });

    it('should process valid Stripe webhook', async () => {
      const event = createMockStripeEvent('payment.completed');
      const pendingTx = createMockTransaction({
        paymentId: event.paymentId,
        paymentStatus: 'PENDING',
      });

      mockStripeGateway.verifyWebhook = vi.fn().mockResolvedValue(event);
      mockTransactionRepo.findByPaymentIdAndStatus = vi
        .fn()
        .mockResolvedValueOnce(null) // No completed transaction (idempotency check)
        .mockResolvedValueOnce(pendingTx); // Pending transaction exists

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('valid'),
        signature: 'valid_sig',
      });

      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.eventType).toBe('payment.completed');
    });

    it('should process valid PayPal webhook', async () => {
      const event = createMockPayPalEvent('payment.completed');
      const pendingTx = createMockTransaction({
        paymentId: event.paymentId,
        paymentStatus: 'PENDING',
        paymentProvider: 'PAYPAL',
      });

      mockPayPalGateway.verifyWebhook = vi.fn().mockResolvedValue(event);
      mockTransactionRepo.findByPaymentIdAndStatus = vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(pendingTx);

      const result = await useCase.execute({
        provider: 'paypal',
        payload: JSON.stringify({ event: 'test' }),
        signature: '',
        headers: { 'paypal-transmission-id': 'test' },
      });

      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      expect(result.eventType).toBe('payment.completed');
    });
  });

  describe('checkout.session.completed (Stripe)', () => {
    it('should add credits on successful payment', async () => {
      const event = createMockStripeEvent('payment.completed', {
        credits: 25,
        userId: 'user-123',
      });
      const pendingTx = createMockTransaction({
        paymentId: event.paymentId,
        userId: 'user-123',
        amount: 25,
        paymentStatus: 'PENDING',
      });

      mockStripeGateway.verifyWebhook = vi.fn().mockResolvedValue(event);
      mockTransactionRepo.findByPaymentIdAndStatus = vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(pendingTx);
      mockCreditService.addCredits = vi.fn().mockResolvedValue({
        success: true,
        newBalance: 35,
        transactionId: 'tx-new',
      });
      mockTransactionRepo.updateStatusByPaymentId = vi.fn().mockResolvedValue(1);

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'sig_test',
      });

      expect(result.success).toBe(true);
      expect(mockCreditService.addCredits).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          amount: 25,
          type: 'PURCHASE',
        })
      );
      expect(mockTransactionRepo.updateStatusByPaymentId).toHaveBeenCalledWith(
        event.paymentId,
        'COMPLETED'
      );
    });

    it('should not add credits twice for same session (idempotency)', async () => {
      const event = createMockStripeEvent('payment.completed');
      const completedTx = createMockTransaction({
        paymentId: event.paymentId,
        paymentStatus: 'COMPLETED',
      });

      mockStripeGateway.verifyWebhook = vi.fn().mockResolvedValue(event);
      mockTransactionRepo.findByPaymentIdAndStatus = vi.fn().mockResolvedValueOnce(completedTx); // Already completed

      mockCreditService.addCredits = vi.fn();

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'sig_test',
      });

      expect(result.success).toBe(true);
      expect(result.processed).toBe(true);
      // Should NOT have called addCredits
      expect(mockCreditService.addCredits).not.toHaveBeenCalled();
    });

    it('should handle missing pending transaction gracefully', async () => {
      const event = createMockStripeEvent('payment.completed');

      mockStripeGateway.verifyWebhook = vi.fn().mockResolvedValue(event);
      mockTransactionRepo.findByPaymentIdAndStatus = vi
        .fn()
        .mockResolvedValueOnce(null) // No completed
        .mockResolvedValueOnce(null); // No pending either

      mockCreditService.addCredits = vi.fn();

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'sig_test',
      });

      expect(result.success).toBe(true);
      // Should NOT have called addCredits since there's no pending transaction
      expect(mockCreditService.addCredits).not.toHaveBeenCalled();
    });
  });

  describe('charge.refunded (Stripe)', () => {
    it('should deduct credits on refund', async () => {
      const event = createMockStripeEvent('payment.refunded', {
        paymentId: 'pi_test_123',
      });
      const completedTx = createMockTransaction({
        paymentId: 'pi_test_123',
        userId: 'user-123',
        amount: 25,
        paymentStatus: 'COMPLETED',
      });

      mockStripeGateway.verifyWebhook = vi.fn().mockResolvedValue(event);
      mockTransactionRepo.findByPaymentIdAndType = vi.fn().mockResolvedValue(null); // No existing refund
      mockTransactionRepo.findByPaymentIdAndStatus = vi.fn().mockResolvedValue(completedTx);
      mockCreditService.processRefund = vi.fn().mockResolvedValue({
        success: true,
        newBalance: 10,
      });

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'sig_test',
      });

      expect(result.success).toBe(true);
      expect(mockCreditService.processRefund).toHaveBeenCalledWith(
        'user-123',
        25,
        'pi_test_123',
        'STRIPE'
      );
    });

    it('should not process duplicate refund (idempotency)', async () => {
      const event = createMockStripeEvent('payment.refunded');
      const existingRefund = createMockTransaction({
        paymentId: event.paymentId,
        type: 'REFUND',
      });

      mockStripeGateway.verifyWebhook = vi.fn().mockResolvedValue(event);
      mockTransactionRepo.findByPaymentIdAndType = vi.fn().mockResolvedValue(existingRefund);
      mockCreditService.processRefund = vi.fn();

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'sig_test',
      });

      expect(result.success).toBe(true);
      expect(mockCreditService.processRefund).not.toHaveBeenCalled();
    });

    it('should handle missing original transaction gracefully', async () => {
      const event = createMockStripeEvent('payment.refunded');

      mockStripeGateway.verifyWebhook = vi.fn().mockResolvedValue(event);
      mockTransactionRepo.findByPaymentIdAndType = vi.fn().mockResolvedValue(null);
      mockTransactionRepo.findByPaymentIdAndStatus = vi.fn().mockResolvedValue(null); // No original
      mockCreditService.processRefund = vi.fn();

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'sig_test',
      });

      expect(result.success).toBe(true);
      expect(mockCreditService.processRefund).not.toHaveBeenCalled();
    });
  });

  describe('Payment Failed Events', () => {
    it('should update status to FAILED on payment.failed', async () => {
      const event = createMockStripeEvent('payment.failed');

      mockStripeGateway.verifyWebhook = vi.fn().mockResolvedValue(event);
      mockTransactionRepo.updateStatusByPaymentId = vi.fn().mockResolvedValue(1);

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'sig_test',
      });

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('payment.failed');
      expect(mockTransactionRepo.updateStatusByPaymentId).toHaveBeenCalledWith(
        event.paymentId,
        'FAILED'
      );
    });

    it('should update status to FAILED on session.expired', async () => {
      const event = createMockStripeEvent('session.expired');

      mockStripeGateway.verifyWebhook = vi.fn().mockResolvedValue(event);
      mockTransactionRepo.updateStatusByPaymentId = vi.fn().mockResolvedValue(1);

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'sig_test',
      });

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('session.expired');
      expect(mockTransactionRepo.updateStatusByPaymentId).toHaveBeenCalledWith(
        event.paymentId,
        'FAILED'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle gateway errors gracefully', async () => {
      mockStripeGateway.verifyWebhook = vi.fn().mockRejectedValue(new Error('Gateway error'));

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'sig_test',
      });

      expect(result.success).toBe(false);
      expect(result.processed).toBe(false);
      expect(result.error).toContain('Gateway error');
    });

    it('should handle database errors gracefully', async () => {
      const event = createMockStripeEvent('payment.completed');

      mockStripeGateway.verifyWebhook = vi.fn().mockResolvedValue(event);
      mockTransactionRepo.findByPaymentIdAndStatus = vi
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'sig_test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });
});
