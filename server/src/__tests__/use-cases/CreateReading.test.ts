/**
 * CreateReading Use Case Tests
 * Unit tests for the CreateReading use case
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateReadingUseCase } from '../../application/use-cases/readings/CreateReading.js';
import { createMockReadingRepository, createMockUserRepository } from '../mocks/repositories.js';
import {
  createMockCreditService,
  createBalanceCheck,
  createSuccessfulCreditResult,
} from '../mocks/creditService.js';
import type { SpreadType, InterpretationStyle } from '@prisma/client';

// Mock achievement service
const createMockAchievementService = () => ({
  checkAndUnlockAchievements: vi.fn().mockResolvedValue([]),
  unlockAchievement: vi.fn().mockResolvedValue(null),
  getUserAchievements: vi.fn().mockResolvedValue([]),
});

describe('CreateReadingUseCase', () => {
  let useCase: CreateReadingUseCase;
  let mockReadingRepo: ReturnType<typeof createMockReadingRepository>;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;
  let mockCreditService: ReturnType<typeof createMockCreditService>;
  let mockAchievementService: ReturnType<typeof createMockAchievementService>;

  const validInput = {
    userId: 'user-1',
    spreadType: 'SINGLE',
    interpretationStyle: 'CLASSIC',
    question: 'What does my future hold?',
    cards: [{ cardId: 'the-fool', position: 0, isReversed: false }],
    interpretation: 'The Fool represents new beginnings...',
  };

  const mockReading = {
    id: 'reading-1',
    userId: 'user-1',
    spreadType: 'SINGLE' as SpreadType,
    interpretationStyle: 'CLASSIC' as InterpretationStyle,
    question: 'What does my future hold?',
    cards: [{ cardId: 'the-fool', position: 0, isReversed: false }],
    interpretation: 'The Fool represents new beginnings...',
    creditCost: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    summary: null,
    userReflection: null,
    themes: [],
  };

  beforeEach(() => {
    mockReadingRepo = createMockReadingRepository();
    mockUserRepo = createMockUserRepository();
    mockCreditService = createMockCreditService();
    mockAchievementService = createMockAchievementService();

    useCase = new CreateReadingUseCase(
      mockReadingRepo,
      mockUserRepo,
      mockCreditService as any,
      mockAchievementService as any
    );

    // Default successful mocks
    mockCreditService.calculateReadingCost.mockReturnValue({
      baseCost: 1,
      styleCost: 0,
      extendedCost: 0,
      totalCost: 1,
    });
    mockCreditService.checkSufficientCredits.mockResolvedValue(createBalanceCheck(10, 1));
    mockCreditService.deductCredits.mockResolvedValue(createSuccessfulCreditResult(9));
    mockCreditService.refundCredits.mockResolvedValue({
      success: true,
      newBalance: 10,
      transactionId: 'refund-id',
    });
    mockReadingRepo.create.mockResolvedValue(mockReading);
    mockUserRepo.findById.mockResolvedValue({
      id: 'user-1',
      totalReadings: 5,
    } as any);
    mockUserRepo.update.mockResolvedValue({} as any);
  });

  describe('successful creation', () => {
    it('should create a reading with valid input', async () => {
      const result = await useCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.reading).toEqual(mockReading);
      expect(result.error).toBeUndefined();
    });

    it('should calculate credit cost from SpreadType domain object', async () => {
      await useCase.execute(validInput);

      // Credit cost is now determined by the SpreadType value object
      // The checkSufficientCredits should be called with the correct cost (1 for SINGLE)
      expect(mockCreditService.checkSufficientCredits).toHaveBeenCalledWith('user-1', 1);
    });

    it('should check sufficient credits before creating', async () => {
      await useCase.execute(validInput);

      expect(mockCreditService.checkSufficientCredits).toHaveBeenCalledWith('user-1', 1);
    });

    it('should deduct credits after creating reading', async () => {
      await useCase.execute(validInput);

      expect(mockCreditService.deductCredits).toHaveBeenCalledWith({
        userId: 'user-1',
        amount: 1,
        type: 'READING',
        description: 'Single Card', // Uses SpreadType.name from domain object
      });
    });

    it('should accept lowercase spread types', async () => {
      const input = { ...validInput, spreadType: 'single' };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
    });

    it('should use CLASSIC interpretation style when not specified', async () => {
      const input = { ...validInput, interpretationStyle: undefined };

      await useCase.execute(input);

      expect(mockReadingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          interpretationStyle: 'CLASSIC',
        })
      );
    });
  });

  describe('validation errors', () => {
    it('should reject invalid spread type', async () => {
      const input = { ...validInput, spreadType: 'INVALID_SPREAD' };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
      expect(result.error).toContain('Invalid spread type');
    });

    it('should reject invalid interpretation style', async () => {
      const input = { ...validInput, interpretationStyle: 'INVALID_STYLE' };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
      expect(result.error).toContain('Invalid interpretation style');
    });

    it('should reject empty cards array', async () => {
      const input = { ...validInput, cards: [] };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
      expect(result.error).toContain('card');
    });
  });

  describe('credit errors', () => {
    it('should return USER_NOT_FOUND when user has no credits', async () => {
      mockCreditService.checkSufficientCredits.mockResolvedValue({
        sufficient: false,
        balance: 0,
        required: 1,
      });

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('USER_NOT_FOUND');
    });

    it('should return INSUFFICIENT_CREDITS when user lacks credits', async () => {
      // Use a more expensive spread
      mockCreditService.calculateReadingCost.mockReturnValue({
        baseCost: 10,
        styleCost: 0,
        extendedCost: 0,
        totalCost: 10,
      });
      mockCreditService.checkSufficientCredits.mockResolvedValue({
        sufficient: false,
        balance: 5,
        required: 10,
      });

      const result = await useCase.execute({
        ...validInput,
        spreadType: 'CELTIC_CROSS',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INSUFFICIENT_CREDITS');
      expect(result.error).toContain('Insufficient');
    });
  });

  describe('different spread types', () => {
    // Each spread type has its cost defined in the SpreadType domain object
    const spreadTypes = [
      { type: 'SINGLE', cost: 1, name: 'Single Card' },
      { type: 'THREE_CARD', cost: 3, name: 'Three Card' },
      { type: 'LOVE', cost: 5, name: 'Love Spread' },
      { type: 'CAREER', cost: 5, name: 'Career Spread' },
      { type: 'HORSESHOE', cost: 7, name: 'Horseshoe Spread' },
      { type: 'CELTIC_CROSS', cost: 10, name: 'Celtic Cross' },
    ];

    spreadTypes.forEach(({ type, cost, name }) => {
      it(`should handle ${type} spread correctly`, async () => {
        // Mock calculateReadingCost to return the correct cost for this spread type
        mockCreditService.calculateReadingCost.mockReturnValue({
          baseCost: cost,
          styleCost: 0,
          extendedCost: 0,
          totalCost: cost,
        });
        // Mock sufficient credits for the specific cost
        mockCreditService.checkSufficientCredits.mockResolvedValue(createBalanceCheck(100, cost));

        const input = { ...validInput, spreadType: type };
        const result = await useCase.execute(input);

        expect(result.success).toBe(true);
        // Verify the correct cost is used (from calculateReadingCost)
        expect(mockCreditService.checkSufficientCredits).toHaveBeenCalledWith('user-1', cost);
        expect(mockCreditService.deductCredits).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: cost,
            description: name, // Just the spread name for classic style
          })
        );
      });
    });
  });
});
