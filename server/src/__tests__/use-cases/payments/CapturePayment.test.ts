/**
 * CapturePayment Use Case Tests
 * Tests PayPal payment capture functionality
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  CapturePaymentUseCase,
  type CapturePaymentInput,
} from '../../../application/use-cases/payments/CapturePayment.js';
import type {
  IPaymentGateway,
  CaptureResult,
} from '../../../application/ports/services/IPaymentGateway.js';
import type { ITransactionRepository } from '../../../application/ports/repositories/ITransactionRepository.js';
import type { CreditService } from '../../../services/CreditService.js';

const createMockTransactionRepository = (): ITransactionRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByPaymentId: vi.fn(),
  findByPaymentIdAndStatus: vi.fn(),
  findByPaymentIdAndType: vi.fn(),
  updateByPaymentId: vi.fn(),
  updateStatusByPaymentId: vi.fn(),
  findByUser: vi.fn(),
  countByUser: vi.fn(),
  update: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  sumCompletedPurchases: vi.fn(),
  sumCompletedPurchasesLast30Days: vi.fn(),
  groupByProvider: vi.fn(),
});

const createMockCreditService = (): CreditService =>
  ({
    checkSufficientCredits: vi.fn(),
    deductCredits: vi.fn(),
    addCredits: vi.fn(),
    refundCredits: vi.fn(),
    getBalance: vi.fn(),
    adjustCredits: vi.fn(),
    updateTransactionStatus: vi.fn(),
  }) as unknown as CreditService;

const createMockPaymentGateway = (
  provider: 'STRIPE' | 'PAYPAL' | 'STRIPE_LINK',
  configured: boolean = true,
  hasCapture: boolean = true
): IPaymentGateway => {
  const gateway: IPaymentGateway = {
    provider,
    isConfigured: vi.fn().mockReturnValue(configured),
    createCheckoutSession: vi.fn(),
    verifyPayment: vi.fn(),
    verifyWebhook: vi.fn(),
  };

  if (hasCapture) {
    gateway.capturePayment = vi.fn();
  }

  return gateway;
};

describe('CapturePaymentUseCase', () => {
  let useCase: CapturePaymentUseCase;
  let mockTransactionRepo: ITransactionRepository;
  let mockCreditService: CreditService;
  let mockPayPalGateway: IPaymentGateway;

  const validInput: CapturePaymentInput = {
    userId: 'user-123',
    orderId: 'ORDER-456',
    provider: 'paypal',
  };

  const mockCaptureResult: CaptureResult = {
    success: true,
    credits: 25,
    captureId: 'CAPTURE-789',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactionRepo = createMockTransactionRepository();
    mockCreditService = createMockCreditService();
    mockPayPalGateway = createMockPaymentGateway('PAYPAL');

    useCase = new CapturePaymentUseCase(mockTransactionRepo, mockCreditService, [
      mockPayPalGateway,
    ]);
  });

  describe('Provider Selection', () => {
    it('should return error when provider is not configured', async () => {
      const unconfiguredGateway = createMockPaymentGateway('PAYPAL', false);
      useCase = new CapturePaymentUseCase(mockTransactionRepo, mockCreditService, [
        unconfiguredGateway,
      ]);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PROVIDER_NOT_CONFIGURED');
      expect(result.error).toBe('paypal payments not configured');
    });

    it('should return error when provider is not found', async () => {
      useCase = new CapturePaymentUseCase(
        mockTransactionRepo,
        mockCreditService,
        [] // No gateways
      );

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PROVIDER_NOT_CONFIGURED');
    });

    it('should return error when gateway does not support capture', async () => {
      const noCaptureGateway = createMockPaymentGateway('PAYPAL', true, false);
      useCase = new CapturePaymentUseCase(mockTransactionRepo, mockCreditService, [
        noCaptureGateway,
      ]);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CAPTURE_FAILED');
      expect(result.error).toBe('This payment provider does not require capture');
    });
  });

  describe('Payment Capture', () => {
    it('should capture payment successfully', async () => {
      (mockPayPalGateway.capturePayment as Mock).mockResolvedValue(mockCaptureResult);
      (mockCreditService.addCredits as Mock).mockResolvedValue({
        success: true,
        newBalance: 75,
        transactionId: 'tx-123',
      });
      (mockCreditService.updateTransactionStatus as Mock).mockResolvedValue({});

      const result = await useCase.execute(validInput);

      expect(mockPayPalGateway.capturePayment).toHaveBeenCalledWith({
        orderId: 'ORDER-456',
        userId: 'user-123',
      });
      expect(result.success).toBe(true);
      expect(result.credits).toBe(25);
      expect(result.captureId).toBe('CAPTURE-789');
    });

    it('should return error when capture fails', async () => {
      (mockPayPalGateway.capturePayment as Mock).mockResolvedValue({
        success: false,
        error: 'Payment already captured',
      });

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CAPTURE_FAILED');
      expect(result.error).toBe('Payment already captured');
    });

    it('should use default error message when capture fails without error', async () => {
      (mockPayPalGateway.capturePayment as Mock).mockResolvedValue({
        success: false,
      });

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment capture failed');
    });
  });

  describe('Credit Addition', () => {
    beforeEach(() => {
      (mockPayPalGateway.capturePayment as Mock).mockResolvedValue(mockCaptureResult);
    });

    it('should add credits via CreditService', async () => {
      (mockCreditService.addCredits as Mock).mockResolvedValue({
        success: true,
        newBalance: 75,
        transactionId: 'tx-123',
      });
      (mockCreditService.updateTransactionStatus as Mock).mockResolvedValue({});

      await useCase.execute(validInput);

      expect(mockCreditService.addCredits).toHaveBeenCalledWith({
        userId: 'user-123',
        amount: 25,
        type: 'PURCHASE',
        description: 'Credit purchase via PayPal',
        metadata: {
          paymentProvider: 'PAYPAL',
          paymentId: 'ORDER-456',
        },
      });
    });

    it('should handle zero credits from capture', async () => {
      (mockPayPalGateway.capturePayment as Mock).mockResolvedValue({
        success: true,
        credits: undefined,
        captureId: 'CAPTURE-789',
      });
      (mockCreditService.addCredits as Mock).mockResolvedValue({
        success: true,
        newBalance: 50,
      });
      (mockCreditService.updateTransactionStatus as Mock).mockResolvedValue({});

      const result = await useCase.execute(validInput);

      expect(mockCreditService.addCredits).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 0 })
      );
      expect(result.credits).toBe(0);
    });

    it('should return new balance from credit service', async () => {
      (mockCreditService.addCredits as Mock).mockResolvedValue({
        success: true,
        newBalance: 100,
      });
      (mockCreditService.updateTransactionStatus as Mock).mockResolvedValue({});

      const result = await useCase.execute(validInput);

      expect(result.newBalance).toBe(100);
    });
  });

  describe('Transaction Status Update', () => {
    beforeEach(() => {
      (mockPayPalGateway.capturePayment as Mock).mockResolvedValue(mockCaptureResult);
      (mockCreditService.addCredits as Mock).mockResolvedValue({
        success: true,
        newBalance: 75,
      });
    });

    it('should update transaction status to COMPLETED', async () => {
      (mockCreditService.updateTransactionStatus as Mock).mockResolvedValue({});

      await useCase.execute(validInput);

      expect(mockCreditService.updateTransactionStatus).toHaveBeenCalledWith(
        'ORDER-456',
        'COMPLETED'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle gateway errors', async () => {
      (mockPayPalGateway.capturePayment as Mock).mockRejectedValue(new Error('PayPal API error'));

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTERNAL_ERROR');
      expect(result.error).toBe('PayPal API error');
    });

    it('should handle credit service errors', async () => {
      (mockPayPalGateway.capturePayment as Mock).mockResolvedValue(mockCaptureResult);
      (mockCreditService.addCredits as Mock).mockRejectedValue(new Error('Credit service error'));

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTERNAL_ERROR');
    });

    it('should handle non-Error exceptions', async () => {
      (mockPayPalGateway.capturePayment as Mock).mockRejectedValue('String error');

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to capture payment');
    });
  });
});
