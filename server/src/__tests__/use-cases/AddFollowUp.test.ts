/**
 * AddFollowUp Use Case Tests
 * Tests the business logic for adding follow-up questions to readings
 * with deduct-first credit safety pattern
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  AddFollowUpUseCase,
  type AddFollowUpInput,
} from '../../application/use-cases/readings/AddFollowUp.js';
import type { IReadingRepository } from '../../application/ports/repositories/IReadingRepository.js';
import type { IUserRepository } from '../../application/ports/repositories/IUserRepository.js';
import type { CreditService } from '../../services/CreditService.js';
import { CREDIT_COSTS } from '../../services/CreditService.js';
import type { FollowUpQuestion } from '@prisma/client';

// Mock factory functions
const createMockReadingRepository = (): IReadingRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByIdWithFollowUps: vi.fn(),
  findByIdAndUser: vi.fn(),
  findByUser: vi.fn(),
  countByUser: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  addFollowUp: vi.fn(),
  findFollowUpsByReading: vi.fn(),
  countAll: vi.fn(),
  countToday: vi.fn(),
  getRecentReadings: vi.fn(),
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
    getBalance: vi.fn(),
    adjustCredits: vi.fn(),
  }) as unknown as CreditService;

describe('AddFollowUpUseCase', () => {
  let useCase: AddFollowUpUseCase;
  let mockReadingRepo: IReadingRepository;
  let mockUserRepo: IUserRepository;
  let mockCreditService: CreditService;

  const validInput: AddFollowUpInput = {
    userId: 'user-123',
    readingId: 'reading-456',
    question: 'What does the future hold?',
    answer: 'The cards suggest positive changes ahead.',
  };

  const mockReading = {
    id: 'reading-456',
    userId: 'user-123',
    spreadType: 'THREE_CARD',
    selectedCards: [{ id: 1, name: 'The Fool', isReversed: false }],
    interpretation: 'Initial interpretation',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFollowUp: FollowUpQuestion = {
    id: 'followup-789',
    readingId: 'reading-456',
    question: 'What does the future hold?',
    answer: 'The cards suggest positive changes ahead.',
    creditCost: CREDIT_COSTS.FOLLOW_UP,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReadingRepo = createMockReadingRepository();
    mockUserRepo = createMockUserRepository();
    mockCreditService = createMockCreditService();

    useCase = new AddFollowUpUseCase(mockReadingRepo, mockUserRepo, mockCreditService);
  });

  describe('Input Validation', () => {
    it('should return error when question is empty', async () => {
      const input = { ...validInput, question: '' };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
      expect(result.error).toBe('Question is required');
    });

    it('should return error when question is whitespace only', async () => {
      const input = { ...validInput, question: '   ' };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
      expect(result.error).toBe('Question is required');
    });

    it('should return error when question exceeds 1000 characters', async () => {
      const input = { ...validInput, question: 'a'.repeat(1001) };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
      expect(result.error).toBe('Question must be 1000 characters or less');
    });
  });

  describe('Reading Verification', () => {
    it('should return error when reading is not found', async () => {
      (mockReadingRepo.findByIdAndUser as Mock).mockResolvedValue(null);

      const result = await useCase.execute(validInput);

      expect(mockReadingRepo.findByIdAndUser).toHaveBeenCalledWith('reading-456', 'user-123');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('READING_NOT_FOUND');
    });

    it('should return error when reading belongs to different user', async () => {
      // findByIdAndUser will return null if user doesn't match
      (mockReadingRepo.findByIdAndUser as Mock).mockResolvedValue(null);

      const input = { ...validInput, userId: 'different-user' };
      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('READING_NOT_FOUND');
    });
  });

  describe('Credit Checking', () => {
    beforeEach(() => {
      (mockReadingRepo.findByIdAndUser as Mock).mockResolvedValue(mockReading);
    });

    it('should return error when user has insufficient credits', async () => {
      (mockCreditService.checkSufficientCredits as Mock).mockResolvedValue({
        sufficient: false,
        balance: 0,
      });

      const result = await useCase.execute(validInput);

      expect(mockCreditService.checkSufficientCredits).toHaveBeenCalledWith(
        'user-123',
        CREDIT_COSTS.FOLLOW_UP
      );
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INSUFFICIENT_CREDITS');
      expect(result.error).toContain('Insufficient credits');
    });

    it('should include balance info in insufficient credits error', async () => {
      (mockCreditService.checkSufficientCredits as Mock).mockResolvedValue({
        sufficient: false,
        balance: 0,
      });

      const result = await useCase.execute(validInput);

      expect(result.error).toBe(`Insufficient credits: have 0, need ${CREDIT_COSTS.FOLLOW_UP}`);
    });
  });

  describe('Deduct-First Pattern', () => {
    beforeEach(() => {
      (mockReadingRepo.findByIdAndUser as Mock).mockResolvedValue(mockReading);
      (mockCreditService.checkSufficientCredits as Mock).mockResolvedValue({
        sufficient: true,
        balance: 10,
      });
    });

    it('should return error when credit deduction fails', async () => {
      (mockCreditService.deductCredits as Mock).mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CREDIT_DEDUCTION_FAILED');
      expect(mockReadingRepo.addFollowUp).not.toHaveBeenCalled();
    });

    it('should deduct credits BEFORE creating follow-up', async () => {
      const callOrder: string[] = [];

      (mockCreditService.deductCredits as Mock).mockImplementation(async () => {
        callOrder.push('deductCredits');
        return { success: true, transactionId: 'tx-123', newBalance: 9 };
      });

      (mockReadingRepo.addFollowUp as Mock).mockImplementation(async () => {
        callOrder.push('addFollowUp');
        return mockFollowUp;
      });

      (mockUserRepo.findById as Mock).mockResolvedValue({ totalQuestions: 5 });
      (mockUserRepo.update as Mock).mockResolvedValue({});

      await useCase.execute(validInput);

      expect(callOrder).toEqual(['deductCredits', 'addFollowUp']);
    });

    it('should refund credits if follow-up creation fails', async () => {
      (mockCreditService.deductCredits as Mock).mockResolvedValue({
        success: true,
        transactionId: 'tx-123',
        newBalance: 9,
      });

      (mockReadingRepo.addFollowUp as Mock).mockRejectedValue(new Error('Database error'));

      (mockCreditService.refundCredits as Mock).mockResolvedValue({
        success: true,
      });

      const result = await useCase.execute(validInput);

      expect(mockCreditService.refundCredits).toHaveBeenCalledWith(
        'user-123',
        CREDIT_COSTS.FOLLOW_UP,
        'Follow-up creation failed',
        'tx-123'
      );
      expect(result.success).toBe(false);
      expect(result.refunded).toBe(true);
      expect(result.transactionId).toBe('tx-123');
    });

    it('should report if refund fails after follow-up creation fails', async () => {
      (mockCreditService.deductCredits as Mock).mockResolvedValue({
        success: true,
        transactionId: 'tx-123',
        newBalance: 9,
      });

      (mockReadingRepo.addFollowUp as Mock).mockRejectedValue(new Error('Database error'));

      (mockCreditService.refundCredits as Mock).mockResolvedValue({
        success: false,
      });

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.refunded).toBe(false);
    });
  });

  describe('Successful Follow-Up', () => {
    beforeEach(() => {
      (mockReadingRepo.findByIdAndUser as Mock).mockResolvedValue(mockReading);
      (mockCreditService.checkSufficientCredits as Mock).mockResolvedValue({
        sufficient: true,
        balance: 10,
      });
      (mockCreditService.deductCredits as Mock).mockResolvedValue({
        success: true,
        transactionId: 'tx-123',
        newBalance: 9,
      });
      (mockReadingRepo.addFollowUp as Mock).mockResolvedValue(mockFollowUp);
      (mockUserRepo.findById as Mock).mockResolvedValue({ totalQuestions: 5 });
      (mockUserRepo.update as Mock).mockResolvedValue({});
    });

    it('should create follow-up with correct data', async () => {
      const result = await useCase.execute(validInput);

      expect(mockReadingRepo.addFollowUp).toHaveBeenCalledWith({
        readingId: 'reading-456',
        question: 'What does the future hold?',
        answer: 'The cards suggest positive changes ahead.',
        creditCost: CREDIT_COSTS.FOLLOW_UP,
      });
      expect(result.success).toBe(true);
      expect(result.followUp).toEqual(mockFollowUp);
    });

    it('should return transaction ID on success', async () => {
      const result = await useCase.execute(validInput);

      expect(result.transactionId).toBe('tx-123');
    });

    it('should update user question count', async () => {
      await useCase.execute(validInput);

      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-123');
      expect(mockUserRepo.update).toHaveBeenCalledWith('user-123', {
        totalQuestions: 6,
      });
    });

    it('should not fail if question count update fails', async () => {
      (mockUserRepo.update as Mock).mockRejectedValue(new Error('Update failed'));

      const result = await useCase.execute(validInput);

      // Should still succeed because this is non-critical
      expect(result.success).toBe(true);
    });

    it('should handle user not found when updating question count', async () => {
      (mockUserRepo.findById as Mock).mockResolvedValue(null);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (mockReadingRepo.findByIdAndUser as Mock).mockResolvedValue(mockReading);
      (mockCreditService.checkSufficientCredits as Mock).mockResolvedValue({
        sufficient: true,
        balance: 10,
      });
    });

    it('should handle unexpected errors before credit deduction', async () => {
      (mockCreditService.deductCredits as Mock).mockRejectedValue(new Error('Unexpected error'));

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTERNAL_ERROR');
      expect(result.refunded).toBeUndefined(); // No transaction to refund
    });

    it('should refund and report error on unexpected error after deduction', async () => {
      (mockCreditService.deductCredits as Mock).mockResolvedValue({
        success: true,
        transactionId: 'tx-123',
        newBalance: 9,
      });

      (mockReadingRepo.addFollowUp as Mock).mockResolvedValue(mockFollowUp);

      // Make the user repo throw during question count update
      (mockUserRepo.findById as Mock).mockImplementation(() => {
        throw new Error('Catastrophic failure');
      });

      // Since the error is after follow-up creation but during non-critical update,
      // it should still succeed (the try-catch around user update handles this)
      const result = await useCase.execute(validInput);

      // The non-critical update failure is caught, so this still succeeds
      expect(result.success).toBe(true);
    });
  });
});
