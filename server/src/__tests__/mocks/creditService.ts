/**
 * CreditService Mock
 * Mock implementation of CreditService for testing
 */

import { vi, type MockedObject } from 'vitest';
import type { CreditService, CreditResult, BalanceCheck } from '../../services/CreditService.js';

export function createMockCreditService(): MockedObject<CreditService> {
  return {
    getBalance: vi.fn(),
    checkSufficientCredits: vi.fn(),
    deductCredits: vi.fn(),
    addCredits: vi.fn(),
    adjustCredits: vi.fn(),
    processRefund: vi.fn(),
    updateTransactionStatus: vi.fn(),
    getSpreadCost: vi.fn(),
    calculateReadingCost: vi.fn(),
    refundCredits: vi.fn(),
  } as unknown as MockedObject<CreditService>;
}

// Helper to create a successful credit result
export function createSuccessfulCreditResult(newBalance: number): CreditResult {
  return {
    success: true,
    newBalance,
    transactionId: 'test-transaction-id',
  };
}

// Helper to create a failed credit result
export function createFailedCreditResult(error: string): CreditResult {
  return {
    success: false,
    newBalance: 0,
    transactionId: '',
    error,
  };
}

// Helper to create a balance check result
export function createBalanceCheck(balance: number, required: number): BalanceCheck {
  return {
    sufficient: balance >= required,
    balance,
    required,
  };
}
