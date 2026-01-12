/**
 * Repository Mocks
 * Mock implementations of repository interfaces for testing
 */

import { vi, type MockedObject } from 'vitest';
import type { IUserRepository } from '../../application/ports/repositories/IUserRepository.js';
import type { IReadingRepository } from '../../application/ports/repositories/IReadingRepository.js';
import type { ITransactionRepository } from '../../application/ports/repositories/ITransactionRepository.js';

export function createMockUserRepository(): MockedObject<IUserRepository> {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    findByReferralCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getCredits: vi.fn(),
    updateCredits: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findByIdWithAchievements: vi.fn(),
    findByIdWithReadings: vi.fn(),
  };
}

export function createMockReadingRepository(): MockedObject<IReadingRepository> {
  return {
    findById: vi.fn(),
    findByIdWithFollowUps: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByUser: vi.fn(),
    countByUser: vi.fn(),
    findByIdAndUser: vi.fn(),
    addFollowUp: vi.fn(),
    findFollowUpsByReading: vi.fn(),
    countAll: vi.fn(),
    countToday: vi.fn(),
    getRecentReadings: vi.fn(),
  };
}

export function createMockTransactionRepository(): MockedObject<ITransactionRepository> {
  return {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findByPaymentId: vi.fn(),
    findByPaymentIdAndStatus: vi.fn(),
    findByPaymentIdAndType: vi.fn(),
    updateByPaymentId: vi.fn(),
    updateStatusByPaymentId: vi.fn(),
    findByUser: vi.fn(),
    countByUser: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    sumCompletedPurchases: vi.fn(),
    sumCompletedPurchasesLast30Days: vi.fn(),
    groupByProvider: vi.fn(),
  };
}
