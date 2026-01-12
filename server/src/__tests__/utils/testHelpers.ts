/**
 * Test Helpers
 * Utility functions for creating test data and mocks
 */

import type { Transaction, User, PaymentStatus, TransactionType, PaymentProvider } from '@prisma/client';
import type { WebhookEvent, WebhookEventType } from '../../application/ports/services/IPaymentGateway.js';

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  const timestamp = Date.now();
  return {
    id: `test-user-${timestamp}`,
    email: `test-${timestamp}@example.com`,
    username: `testuser-${timestamp}`,
    credits: 10,
    totalCreditsEarned: 10,
    totalCreditsSpent: 0,
    totalReadings: 0,
    totalQuestions: 0,
    loginStreak: 1,
    lastLoginDate: new Date(),
    welcomeCompleted: false,
    referralCode: `TEST${timestamp}`,
    referredById: null,
    isAdmin: false,
    accountStatus: 'ACTIVE',
    language: 'en',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

/**
 * Create a mock transaction for testing
 */
export function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const timestamp = Date.now();
  return {
    id: `tx-${timestamp}`,
    userId: `test-user-${timestamp}`,
    type: 'PURCHASE' as TransactionType,
    amount: 10,
    description: 'Test transaction',
    paymentProvider: 'STRIPE' as PaymentProvider,
    paymentId: `pay_test_${timestamp}`,
    paymentAmount: 4.99,
    currency: 'EUR',
    paymentStatus: 'PENDING' as PaymentStatus,
    createdAt: new Date(),
    ...overrides,
  } as Transaction;
}

/**
 * Create a mock Stripe webhook event
 */
export function createMockStripeEvent(
  type: WebhookEventType,
  data: Partial<WebhookEvent> = {}
): WebhookEvent {
  const timestamp = Date.now();
  return {
    type,
    paymentId: `cs_test_${timestamp}`,
    userId: `test-user-${timestamp}`,
    credits: 10,
    amount: 4.99,
    currency: 'eur',
    rawEvent: {
      id: `evt_test_${timestamp}`,
      type: type === 'payment.completed' ? 'checkout.session.completed' : type,
      created: Math.floor(timestamp / 1000),
    },
    ...data,
  };
}

/**
 * Create a mock PayPal webhook event
 */
export function createMockPayPalEvent(
  type: WebhookEventType,
  data: Partial<WebhookEvent> = {}
): WebhookEvent {
  const timestamp = Date.now();
  return {
    type,
    paymentId: `PAYPAL_ORDER_${timestamp}`,
    userId: `test-user-${timestamp}`,
    credits: 10,
    amount: 4.99,
    currency: 'eur',
    rawEvent: {
      id: `WH-${timestamp}`,
      event_type: type === 'payment.completed' ? 'CHECKOUT.ORDER.APPROVED' : type,
      create_time: new Date().toISOString(),
    },
    ...data,
  };
}

/**
 * Create a mock payment gateway
 */
export function createMockPaymentGateway(provider: 'STRIPE' | 'STRIPE_LINK' | 'PAYPAL') {
  return {
    provider,
    isConfigured: () => true,
    createCheckoutSession: async () => ({
      sessionId: `session_${Date.now()}`,
      url: 'https://checkout.stripe.com/test',
      provider,
    }),
    verifyPayment: async () => ({
      success: true,
      credits: 10,
    }),
    verifyWebhook: async () => null as WebhookEvent | null,
    capturePayment: async () => ({
      success: true,
      credits: 10,
      captureId: `cap_${Date.now()}`,
    }),
  };
}

/**
 * Create a mock transaction repository
 */
export function createMockTransactionRepository() {
  return {
    findById: async () => null,
    create: async (data: any) => ({ id: `tx_${Date.now()}`, ...data }),
    update: async (_id: string, data: any) => data,
    findByPaymentId: async () => null,
    findByPaymentIdAndStatus: async () => null,
    findByPaymentIdAndType: async () => null,
    updateByPaymentId: async () => 1,
    updateStatusByPaymentId: async () => 1,
    findByUser: async () => [],
    countByUser: async () => 0,
    findMany: async () => [],
    count: async () => 0,
    sumCompletedPurchases: async () => 0,
    sumCompletedPurchasesLast30Days: async () => 0,
    groupByProvider: async () => [],
  };
}

/**
 * Create a mock user repository
 */
export function createMockUserRepository() {
  return {
    findById: async () => null,
    findByEmail: async () => null,
    findByUsername: async () => null,
    findByReferralCode: async () => null,
    create: async (data: any) => ({ id: `user_${Date.now()}`, ...data }),
    update: async (_id: string, data: any) => data,
    updateCredits: async () => ({ credits: 10 }),
    findMany: async () => [],
    count: async () => 0,
  };
}

/**
 * Create a mock credit service
 */
export function createMockCreditService() {
  return {
    getBalance: async () => 10,
    checkSufficientCredits: async () => ({ sufficient: true, balance: 10, required: 1 }),
    addCredits: async () => ({ success: true, newBalance: 20, transactionId: `tx_${Date.now()}` }),
    deductCredits: async () => ({ success: true, newBalance: 5, transactionId: `tx_${Date.now()}` }),
    adjustCredits: async () => ({ success: true, newBalance: 15 }),
    processRefund: async () => ({ success: true, newBalance: 0 }),
    getSpreadCost: () => 1,
  };
}

/**
 * Sleep utility for async tests
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
