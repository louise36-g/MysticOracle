/**
 * Refund Failure Tests
 * Tests for refund edge cases, gateway timeouts, partial refunds, and credit restoration
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ProcessPaymentWebhookUseCase } from '../../../application/use-cases/payments/ProcessPaymentWebhook.js';
import type { ITransactionRepository } from '../../../application/ports/repositories/ITransactionRepository.js';
import type { IUserRepository } from '../../../application/ports/repositories/IUserRepository.js';
import type {
  IPaymentGateway,
  WebhookEvent,
} from '../../../application/ports/services/IPaymentGateway.js';
import type { CreditService } from '../../../services/CreditService.js';

const createMockTransactionRepository = (): ITransactionRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByPaymentId: vi.fn(),
  findByPaymentIdAndStatus: vi.fn(),
  findByPaymentIdAndType: vi.fn(),
  findByUser: vi.fn(),
  updateStatusByPaymentId: vi.fn(),
  update: vi.fn(),
  updateByPaymentId: vi.fn(),
  countByUser: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  sumCompletedPurchases: vi.fn(),
  sumCompletedPurchasesLast30Days: vi.fn(),
  groupByProvider: vi.fn(),
});

const createMockUserRepository = (): IUserRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByUsername: vi.fn(),
  findByReferralCode: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getCredits: vi.fn(),
  updateCredits: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  findByIdWithAchievements: vi.fn(),
  findByIdWithReadings: vi.fn(),
});

const createMockCreditService = (): CreditService =>
  ({
    checkSufficientCredits: vi.fn(),
    deductCredits: vi.fn(),
    addCredits: vi.fn(),
    refundCredits: vi.fn(),
    processRefund: vi.fn(),
    getBalance: vi.fn(),
    adjustCredits: vi.fn(),
    calculateReadingCost: vi.fn(),
    getSpreadCost: vi.fn(),
    updateTransactionStatus: vi.fn(),
  }) as unknown as CreditService;

const createMockPaymentGateway = (provider: 'STRIPE' | 'PAYPAL'): IPaymentGateway =>
  ({
    provider,
    createCheckoutSession: vi.fn(),
    capturePayment: vi.fn(),
    verifyWebhook: vi.fn(),
    refundPayment: vi.fn(),
  }) as unknown as IPaymentGateway;

describe('RefundFailures', () => {
  let useCase: ProcessPaymentWebhookUseCase;
  let mockTransactionRepo: ITransactionRepository;
  let mockUserRepo: IUserRepository;
  let mockCreditService: CreditService;
  let mockStripeGateway: IPaymentGateway;

  const originalTransaction = {
    id: 'tx-original-123',
    userId: 'user-refund-test',
    type: 'PURCHASE',
    amount: 50,
    paymentId: 'pi_stripe_123',
    paymentStatus: 'COMPLETED',
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactionRepo = createMockTransactionRepository();
    mockUserRepo = createMockUserRepository();
    mockCreditService = createMockCreditService();
    mockStripeGateway = createMockPaymentGateway('STRIPE');

    useCase = new ProcessPaymentWebhookUseCase(
      mockTransactionRepo,
      mockUserRepo,
      mockCreditService,
      [mockStripeGateway]
    );
  });

  describe('Gateway Timeout During Refund', () => {
    it('should handle gateway timeout gracefully', async () => {
      const refundEvent: WebhookEvent = {
        type: 'payment.refunded',
        paymentId: 'pi_timeout_123',
        userId: 'user-123',
        amount: 50,
        credits: 50,
        currency: 'eur',
        rawEvent: {},
      };

      (mockStripeGateway.verifyWebhook as Mock).mockResolvedValue(refundEvent);
      (mockTransactionRepo.findByPaymentIdAndType as Mock).mockResolvedValue(null); // No existing refund
      (mockTransactionRepo.findByPaymentIdAndStatus as Mock).mockResolvedValue(originalTransaction);
      (mockCreditService.processRefund as Mock).mockRejectedValue(
        new Error('Gateway timeout: Connection refused')
      );

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'valid_sig',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Gateway timeout');
    });

    it('should return appropriate error for network failures', async () => {
      const refundEvent: WebhookEvent = {
        type: 'payment.refunded',
        paymentId: 'pi_network_fail',
        userId: 'user-123',
        amount: 25,
        credits: 25,
        currency: 'eur',
        rawEvent: {},
      };

      (mockStripeGateway.verifyWebhook as Mock).mockResolvedValue(refundEvent);
      (mockTransactionRepo.findByPaymentIdAndType as Mock).mockResolvedValue(null);
      (mockTransactionRepo.findByPaymentIdAndStatus as Mock).mockResolvedValue(originalTransaction);
      (mockCreditService.processRefund as Mock).mockRejectedValue(
        new Error('ECONNRESET: Network connection reset')
      );

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'valid_sig',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('ECONNRESET');
    });
  });

  describe('Partial Refund Handling', () => {
    it('should handle partial refund amounts correctly', async () => {
      const partialRefundEvent: WebhookEvent = {
        type: 'payment.refunded',
        paymentId: 'pi_partial_123',
        userId: 'user-partial',
        amount: 25, // Original was 50, refunding 25
        credits: 25,
        currency: 'eur',
        rawEvent: {},
      };

      (mockStripeGateway.verifyWebhook as Mock).mockResolvedValue(partialRefundEvent);
      (mockTransactionRepo.findByPaymentIdAndType as Mock).mockResolvedValue(null);
      (mockTransactionRepo.findByPaymentIdAndStatus as Mock).mockResolvedValue({
        ...originalTransaction,
        amount: 50, // Original amount
      });
      (mockCreditService.processRefund as Mock).mockResolvedValue({
        success: true,
        newBalance: 25,
        transactionId: 'tx-refund-partial',
      });

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'valid_sig',
      });

      expect(result.success).toBe(true);
      // Should process refund with original transaction amount
      expect(mockCreditService.processRefund).toHaveBeenCalledWith(
        'user-refund-test',
        50, // Uses original amount from transaction
        'pi_partial_123',
        'STRIPE'
      );
    });
  });

  describe('Credit Restoration', () => {
    it('should restore credits when refund is processed', async () => {
      const refundEvent: WebhookEvent = {
        type: 'payment.refunded',
        paymentId: 'pi_restore_123',
        userId: 'user-restore',
        amount: 100,
        credits: 100,
        currency: 'eur',
        rawEvent: {},
      };

      (mockStripeGateway.verifyWebhook as Mock).mockResolvedValue(refundEvent);
      (mockTransactionRepo.findByPaymentIdAndType as Mock).mockResolvedValue(null);
      (mockTransactionRepo.findByPaymentIdAndStatus as Mock).mockResolvedValue({
        ...originalTransaction,
        amount: 100,
        userId: 'user-restore',
      });
      (mockCreditService.processRefund as Mock).mockResolvedValue({
        success: true,
        newBalance: 0, // Credits were deducted
        transactionId: 'tx-refund-restore',
      });

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'valid_sig',
      });

      expect(result.success).toBe(true);
      expect(mockCreditService.processRefund).toHaveBeenCalledWith(
        'user-restore',
        100,
        'pi_restore_123',
        'STRIPE'
      );
    });

    it('should handle refund for user with zero credits', async () => {
      const refundEvent: WebhookEvent = {
        type: 'payment.refunded',
        paymentId: 'pi_zero_credits',
        userId: 'user-zero',
        amount: 50,
        credits: 50,
        currency: 'eur',
        rawEvent: {},
      };

      (mockStripeGateway.verifyWebhook as Mock).mockResolvedValue(refundEvent);
      (mockTransactionRepo.findByPaymentIdAndType as Mock).mockResolvedValue(null);
      (mockTransactionRepo.findByPaymentIdAndStatus as Mock).mockResolvedValue({
        ...originalTransaction,
        userId: 'user-zero',
      });
      // User spent all credits, refund results in negative balance
      (mockCreditService.processRefund as Mock).mockResolvedValue({
        success: true,
        newBalance: -50, // Allow negative (business decision)
        transactionId: 'tx-refund-zero',
      });

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'valid_sig',
      });

      expect(result.success).toBe(true);
      expect(mockCreditService.processRefund).toHaveBeenCalled();
    });
  });

  describe('Idempotency for Refunds', () => {
    it('should skip already processed refunds', async () => {
      const refundEvent: WebhookEvent = {
        type: 'payment.refunded',
        paymentId: 'pi_already_refunded',
        userId: 'user-123',
        amount: 50,
        credits: 50,
        currency: 'eur',
        rawEvent: {},
      };

      (mockStripeGateway.verifyWebhook as Mock).mockResolvedValue(refundEvent);
      // Refund already exists
      (mockTransactionRepo.findByPaymentIdAndType as Mock).mockResolvedValue({
        id: 'tx-existing-refund',
        type: 'REFUND',
        paymentId: 'pi_already_refunded',
      });

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'valid_sig',
      });

      expect(result.success).toBe(true);
      // Should not process refund again
      expect(mockCreditService.processRefund).not.toHaveBeenCalled();
    });

    it('should handle duplicate refund webhooks', async () => {
      const refundEvent: WebhookEvent = {
        type: 'payment.refunded',
        paymentId: 'pi_duplicate',
        userId: 'user-123',
        amount: 50,
        credits: 50,
        currency: 'eur',
        rawEvent: {},
      };

      (mockStripeGateway.verifyWebhook as Mock).mockResolvedValue(refundEvent);
      (mockTransactionRepo.findByPaymentIdAndType as Mock)
        .mockResolvedValueOnce(null) // First call: no existing refund
        .mockResolvedValueOnce({ id: 'tx-refund', type: 'REFUND' }); // Second call: refund exists

      (mockTransactionRepo.findByPaymentIdAndStatus as Mock).mockResolvedValue(originalTransaction);
      (mockCreditService.processRefund as Mock).mockResolvedValue({
        success: true,
        newBalance: 0,
        transactionId: 'tx-refund',
      });

      // First webhook
      const result1 = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'valid_sig',
      });

      // Second webhook (duplicate)
      const result2 = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'valid_sig',
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // processRefund should only be called once
      expect(mockCreditService.processRefund).toHaveBeenCalledTimes(1);
    });
  });

  describe('Missing Original Transaction', () => {
    it('should handle refund when original transaction not found', async () => {
      const refundEvent: WebhookEvent = {
        type: 'payment.refunded',
        paymentId: 'pi_no_original',
        userId: 'user-123',
        amount: 50,
        credits: 50,
        currency: 'eur',
        rawEvent: {},
      };

      (mockStripeGateway.verifyWebhook as Mock).mockResolvedValue(refundEvent);
      (mockTransactionRepo.findByPaymentIdAndType as Mock).mockResolvedValue(null);
      (mockTransactionRepo.findByPaymentIdAndStatus as Mock).mockResolvedValue(null); // No original

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'valid_sig',
      });

      // Should still succeed (webhook processed), but no refund action
      expect(result.success).toBe(true);
      expect(mockCreditService.processRefund).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Webhook Signature', () => {
    it('should reject refund with invalid signature', async () => {
      (mockStripeGateway.verifyWebhook as Mock).mockResolvedValue(null); // Invalid signature

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'invalid_sig',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid webhook signature');
      expect(mockCreditService.processRefund).not.toHaveBeenCalled();
    });
  });

  describe('Database Errors During Refund', () => {
    it('should handle database errors gracefully', async () => {
      const refundEvent: WebhookEvent = {
        type: 'payment.refunded',
        paymentId: 'pi_db_error',
        userId: 'user-123',
        amount: 50,
        credits: 50,
        currency: 'eur',
        rawEvent: {},
      };

      (mockStripeGateway.verifyWebhook as Mock).mockResolvedValue(refundEvent);
      (mockTransactionRepo.findByPaymentIdAndType as Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await useCase.execute({
        provider: 'stripe',
        payload: Buffer.from('test'),
        signature: 'valid_sig',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });
});
