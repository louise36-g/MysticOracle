/**
 * CreateCheckout Use Case Tests
 * Tests checkout session creation for Stripe and PayPal payments
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  CreateCheckoutUseCase,
  CREDIT_PACKAGES,
  type CreateCheckoutInput,
} from '../../../application/use-cases/payments/CreateCheckout.js';
import type {
  IPaymentGateway,
  CheckoutSession,
} from '../../../application/ports/services/IPaymentGateway.js';
import type { IUserRepository } from '../../../application/ports/repositories/IUserRepository.js';
import type { ITransactionRepository } from '../../../application/ports/repositories/ITransactionRepository.js';

const createMockUserRepository = (): IUserRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByClerkId: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
});

const createMockTransactionRepository = (): ITransactionRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByPaymentId: vi.fn(),
  findByUser: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
});

const createMockPaymentGateway = (
  provider: string,
  configured: boolean = true
): IPaymentGateway => ({
  provider,
  isConfigured: vi.fn().mockReturnValue(configured),
  createCheckoutSession: vi.fn(),
  capturePayment: vi.fn(),
  verifyWebhook: vi.fn(),
});

describe('CreateCheckoutUseCase', () => {
  let useCase: CreateCheckoutUseCase;
  let mockUserRepo: IUserRepository;
  let mockTransactionRepo: ITransactionRepository;
  let mockStripeGateway: IPaymentGateway;
  let mockPayPalGateway: IPaymentGateway;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    credits: 50,
  };

  const validInput: CreateCheckoutInput = {
    userId: 'user-123',
    packageId: 'basic',
    provider: 'stripe',
    frontendUrl: 'https://example.com',
  };

  const mockCheckoutSession: CheckoutSession = {
    sessionId: 'cs_test_123',
    url: 'https://checkout.stripe.com/test',
    provider: 'STRIPE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRepo = createMockUserRepository();
    mockTransactionRepo = createMockTransactionRepository();
    mockStripeGateway = createMockPaymentGateway('stripe');
    mockPayPalGateway = createMockPaymentGateway('paypal');

    useCase = new CreateCheckoutUseCase(mockUserRepo, mockTransactionRepo, [
      mockStripeGateway,
      mockPayPalGateway,
    ]);
  });

  describe('Provider Selection', () => {
    it('should return error when provider is not configured', async () => {
      const unconfiguredGateway = createMockPaymentGateway('stripe', false);
      useCase = new CreateCheckoutUseCase(mockUserRepo, mockTransactionRepo, [unconfiguredGateway]);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PROVIDER_NOT_CONFIGURED');
      expect(result.error).toBe('stripe payments not configured');
    });

    it('should return error when provider is not found', async () => {
      useCase = new CreateCheckoutUseCase(
        mockUserRepo,
        mockTransactionRepo,
        [] // No gateways
      );

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('PROVIDER_NOT_CONFIGURED');
    });

    it('should select correct gateway for Stripe', async () => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
      (mockStripeGateway.createCheckoutSession as Mock).mockResolvedValue(mockCheckoutSession);
      (mockTransactionRepo.create as Mock).mockResolvedValue({});

      await useCase.execute(validInput);

      expect(mockStripeGateway.createCheckoutSession).toHaveBeenCalled();
      expect(mockPayPalGateway.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('should select correct gateway for PayPal', async () => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
      (mockPayPalGateway.createCheckoutSession as Mock).mockResolvedValue({
        ...mockCheckoutSession,
        provider: 'PAYPAL',
      });
      (mockTransactionRepo.create as Mock).mockResolvedValue({});

      const paypalInput = { ...validInput, provider: 'paypal' as const };
      await useCase.execute(paypalInput);

      expect(mockPayPalGateway.createCheckoutSession).toHaveBeenCalled();
      expect(mockStripeGateway.createCheckoutSession).not.toHaveBeenCalled();
    });
  });

  describe('Package Validation', () => {
    beforeEach(() => {
      (mockStripeGateway.isConfigured as Mock).mockReturnValue(true);
    });

    it('should return error for invalid package ID', async () => {
      const invalidInput = { ...validInput, packageId: 'nonexistent' };

      const result = await useCase.execute(invalidInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_PACKAGE');
      expect(result.error).toBe('Invalid package');
    });

    it('should accept valid package IDs', async () => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
      (mockStripeGateway.createCheckoutSession as Mock).mockResolvedValue(mockCheckoutSession);
      (mockTransactionRepo.create as Mock).mockResolvedValue({});

      for (const pkg of CREDIT_PACKAGES) {
        const input = { ...validInput, packageId: pkg.id };
        const result = await useCase.execute(input);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('User Validation', () => {
    beforeEach(() => {
      (mockStripeGateway.isConfigured as Mock).mockReturnValue(true);
    });

    it('should return error when user is not found', async () => {
      (mockUserRepo.findById as Mock).mockResolvedValue(null);

      const result = await useCase.execute(validInput);

      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-123');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('USER_NOT_FOUND');
    });
  });

  describe('Checkout Session Creation', () => {
    beforeEach(() => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
      (mockStripeGateway.createCheckoutSession as Mock).mockResolvedValue(mockCheckoutSession);
      (mockTransactionRepo.create as Mock).mockResolvedValue({});
    });

    it('should create checkout session with correct parameters', async () => {
      await useCase.execute(validInput);

      const basicPackage = CREDIT_PACKAGES.find(p => p.id === 'basic');
      expect(mockStripeGateway.createCheckoutSession).toHaveBeenCalledWith({
        userId: 'user-123',
        userEmail: 'test@example.com',
        packageId: 'basic',
        creditPackage: basicPackage,
        successUrl:
          'https://example.com/payment/success?session_id={CHECKOUT_SESSION_ID}&provider=stripe',
        cancelUrl: 'https://example.com/payment/cancelled',
      });
    });

    it('should return session ID and URL on success', async () => {
      const result = await useCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('cs_test_123');
      expect(result.url).toBe('https://checkout.stripe.com/test');
    });
  });

  describe('Pending Transaction Creation', () => {
    beforeEach(() => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
      (mockStripeGateway.createCheckoutSession as Mock).mockResolvedValue(mockCheckoutSession);
    });

    it('should create pending transaction with correct data', async () => {
      (mockTransactionRepo.create as Mock).mockResolvedValue({});

      await useCase.execute(validInput);

      const basicPackage = CREDIT_PACKAGES.find(p => p.id === 'basic')!;
      expect(mockTransactionRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        type: 'PURCHASE',
        amount: basicPackage.credits,
        description: `Purchase: ${basicPackage.name}`,
        paymentProvider: 'STRIPE',
        paymentId: 'cs_test_123',
        paymentAmount: basicPackage.priceEur,
        currency: 'EUR',
        paymentStatus: 'PENDING',
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
    });

    it('should handle gateway errors', async () => {
      (mockStripeGateway.createCheckoutSession as Mock).mockRejectedValue(
        new Error('Stripe API error')
      );

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTERNAL_ERROR');
      expect(result.error).toBe('Stripe API error');
    });

    it('should handle transaction creation errors', async () => {
      (mockStripeGateway.createCheckoutSession as Mock).mockResolvedValue(mockCheckoutSession);
      (mockTransactionRepo.create as Mock).mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTERNAL_ERROR');
    });

    it('should handle non-Error exceptions', async () => {
      (mockStripeGateway.createCheckoutSession as Mock).mockRejectedValue('String error');

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create checkout session');
    });
  });

  describe('CREDIT_PACKAGES', () => {
    it('should have 5 packages', () => {
      expect(CREDIT_PACKAGES).toHaveLength(5);
    });

    it('should have required fields for each package', () => {
      for (const pkg of CREDIT_PACKAGES) {
        expect(pkg.id).toBeDefined();
        expect(pkg.credits).toBeGreaterThan(0);
        expect(pkg.priceEur).toBeGreaterThan(0);
        expect(pkg.name).toBeDefined();
        expect(pkg.nameEn).toBeDefined();
        expect(pkg.nameFr).toBeDefined();
      }
    });

    it('should have increasing credits and prices', () => {
      for (let i = 1; i < CREDIT_PACKAGES.length; i++) {
        expect(CREDIT_PACKAGES[i].credits).toBeGreaterThan(CREDIT_PACKAGES[i - 1].credits);
        expect(CREDIT_PACKAGES[i].priceEur).toBeGreaterThan(CREDIT_PACKAGES[i - 1].priceEur);
      }
    });
  });
});
