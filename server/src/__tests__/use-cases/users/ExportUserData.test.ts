/**
 * ExportUserData Use Case Tests
 * Tests GDPR Article 20 - Right to data portability
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ExportUserDataUseCase } from '../../../application/use-cases/users/ExportUserData.js';
import type { IUserRepository } from '../../../application/ports/repositories/IUserRepository.js';
import { PrismaClient } from '@prisma/client';

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

const createMockPrismaClient = () => {
  return {
    user: {
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient & { user: { findUnique: Mock } };
};

describe('ExportUserDataUseCase', () => {
  let useCase: ExportUserDataUseCase;
  let mockUserRepo: IUserRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  const mockDate = new Date('2026-01-15T10:00:00.000Z');
  const mockReadingDate = new Date('2026-01-10T14:30:00.000Z');
  const mockTransactionDate = new Date('2026-01-05T09:00:00.000Z');

  const mockUserWithData = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    language: 'en',
    createdAt: mockDate,
    credits: 50,
    totalReadings: 5,
    totalQuestions: 10,
    loginStreak: 3,
    lastLoginDate: mockDate,
    isAdmin: false,
    accountStatus: 'ACTIVE',
    achievements: [
      { achievementId: 'first_reading', unlockedAt: mockDate },
      { achievementId: 'loyal_user', unlockedAt: mockDate },
    ],
    readings: [
      {
        id: 'reading-1',
        spreadType: 'three_card',
        interpretationStyle: 'classic',
        question: 'Will I find love?',
        interpretation: 'The cards suggest...',
        themes: ['love', 'relationships'],
        userReflection: 'Very insightful',
        creditCost: 2,
        createdAt: mockReadingDate,
        followUps: [
          {
            question: 'When?',
            answer: 'Soon...',
            createdAt: mockReadingDate,
          },
        ],
      },
    ],
    transactions: [
      {
        type: 'PURCHASE',
        amount: 50,
        description: 'Credit purchase',
        createdAt: mockTransactionDate,
      },
      {
        type: 'READING',
        amount: -2,
        description: 'Three card reading',
        createdAt: mockReadingDate,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRepo = createMockUserRepository();
    mockPrisma = createMockPrismaClient();
    useCase = new ExportUserDataUseCase(mockPrisma, mockUserRepo);
  });

  describe('Successful Export', () => {
    it('should export complete user data successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithData);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.profile.email).toBe('test@example.com');
      expect(result.data?.profile.username).toBe('testuser');
    });

    it('should include profile data with correct format', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithData);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.data?.profile).toEqual({
        email: 'test@example.com',
        username: 'testuser',
        language: 'en',
        createdAt: '2026-01-15T10:00:00.000Z',
        credits: 50,
        totalReadings: 5,
        totalQuestions: 10,
        loginStreak: 3,
        lastLoginDate: '2026-01-15T10:00:00.000Z',
      });
    });

    it('should include readings with follow-ups', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithData);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.data?.readings).toHaveLength(1);
      expect(result.data?.readings[0]).toEqual({
        id: 'reading-1',
        spreadType: 'three_card',
        interpretationStyle: 'classic',
        question: 'Will I find love?',
        interpretation: 'The cards suggest...',
        themes: ['love', 'relationships'],
        userReflection: 'Very insightful',
        creditCost: 2,
        createdAt: '2026-01-10T14:30:00.000Z',
        followUps: [
          {
            question: 'When?',
            answer: 'Soon...',
            createdAt: '2026-01-10T14:30:00.000Z',
          },
        ],
      });
    });

    it('should include transactions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithData);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.data?.transactions).toHaveLength(2);
      expect(result.data?.transactions[0]).toEqual({
        type: 'PURCHASE',
        amount: 50,
        description: 'Credit purchase',
        createdAt: '2026-01-05T09:00:00.000Z',
      });
    });

    it('should include achievements', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithData);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.data?.achievements).toHaveLength(2);
      expect(result.data?.achievements[0]).toEqual({
        achievementId: 'first_reading',
        unlockedAt: '2026-01-15T10:00:00.000Z',
      });
    });

    it('should include exportedAt timestamp', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithData);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.data?.exportedAt).toBeDefined();
      expect(new Date(result.data!.exportedAt)).toBeInstanceOf(Date);
    });

    it('should exclude internal fields like isAdmin and accountStatus', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithData);

      const result = await useCase.execute({ userId: 'user-123' });

      // These fields should not be in the exported profile
      expect(result.data?.profile).not.toHaveProperty('isAdmin');
      expect(result.data?.profile).not.toHaveProperty('accountStatus');
    });
  });

  describe('User Not Found', () => {
    it('should return USER_NOT_FOUND when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await useCase.execute({ userId: 'nonexistent-user' });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('USER_NOT_FOUND');
      expect(result.error).toBe('User not found');
      expect(result.data).toBeUndefined();
    });
  });

  describe('Empty Data', () => {
    it('should handle user with no readings', async () => {
      const userWithNoReadings = {
        ...mockUserWithData,
        readings: [],
        totalReadings: 0,
      };
      mockPrisma.user.findUnique.mockResolvedValue(userWithNoReadings);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.success).toBe(true);
      expect(result.data?.readings).toHaveLength(0);
    });

    it('should handle user with no transactions', async () => {
      const userWithNoTransactions = {
        ...mockUserWithData,
        transactions: [],
      };
      mockPrisma.user.findUnique.mockResolvedValue(userWithNoTransactions);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.success).toBe(true);
      expect(result.data?.transactions).toHaveLength(0);
    });

    it('should handle user with no achievements', async () => {
      const userWithNoAchievements = {
        ...mockUserWithData,
        achievements: [],
      };
      mockPrisma.user.findUnique.mockResolvedValue(userWithNoAchievements);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.success).toBe(true);
      expect(result.data?.achievements).toHaveLength(0);
    });

    it('should handle reading with no follow-ups', async () => {
      const userWithReadingNoFollowUps = {
        ...mockUserWithData,
        readings: [
          {
            ...mockUserWithData.readings[0],
            followUps: [],
          },
        ],
      };
      mockPrisma.user.findUnique.mockResolvedValue(userWithReadingNoFollowUps);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.success).toBe(true);
      expect(result.data?.readings[0].followUps).toHaveLength(0);
    });
  });

  describe('Null Values', () => {
    it('should handle null question in reading', async () => {
      const userWithNullQuestion = {
        ...mockUserWithData,
        readings: [
          {
            ...mockUserWithData.readings[0],
            question: null,
          },
        ],
      };
      mockPrisma.user.findUnique.mockResolvedValue(userWithNullQuestion);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.success).toBe(true);
      expect(result.data?.readings[0].question).toBeNull();
    });

    it('should handle null userReflection', async () => {
      const userWithNullReflection = {
        ...mockUserWithData,
        readings: [
          {
            ...mockUserWithData.readings[0],
            userReflection: null,
          },
        ],
      };
      mockPrisma.user.findUnique.mockResolvedValue(userWithNullReflection);

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.success).toBe(true);
      expect(result.data?.readings[0].userReflection).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should return INTERNAL_ERROR when database query fails', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection lost'));

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTERNAL_ERROR');
      expect(result.error).toBe('Database connection lost');
    });

    it('should handle non-Error exceptions', async () => {
      mockPrisma.user.findUnique.mockRejectedValue('String error');

      const result = await useCase.execute({ userId: 'user-123' });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTERNAL_ERROR');
      expect(result.error).toBe('Failed to export data');
    });
  });

  describe('Query Verification', () => {
    it('should query with correct includes', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithData);

      await useCase.execute({ userId: 'user-123' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: {
          achievements: true,
          readings: {
            include: { followUps: true },
            orderBy: { createdAt: 'desc' },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });
  });
});
