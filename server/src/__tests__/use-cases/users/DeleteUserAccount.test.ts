/**
 * DeleteUserAccount Use Case Tests
 * Tests GDPR Article 17 - Right to erasure ("Right to be forgotten")
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { DeleteUserAccountUseCase } from '../../../application/use-cases/users/DeleteUserAccount.js';
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
  const mockTransaction = vi.fn();
  return {
    $transaction: mockTransaction,
    reading: {
      updateMany: vi.fn(),
    },
    followUpQuestion: {
      updateMany: vi.fn(),
    },
    horoscopeCache: {
      deleteMany: vi.fn(),
    },
    userAchievement: {
      deleteMany: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  } as unknown as PrismaClient & { $transaction: Mock };
};

describe('DeleteUserAccountUseCase', () => {
  let useCase: DeleteUserAccountUseCase;
  let mockUserRepo: IUserRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    credits: 50,
    isAdmin: false,
  };

  const adminUser = {
    ...mockUser,
    id: 'admin-123',
    email: 'admin@example.com',
    isAdmin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRepo = createMockUserRepository();
    mockPrisma = createMockPrismaClient();
    useCase = new DeleteUserAccountUseCase(mockPrisma, mockUserRepo);
  });

  describe('User Verification', () => {
    it('should return USER_NOT_FOUND when user does not exist', async () => {
      (mockUserRepo.findById as Mock).mockResolvedValue(null);

      const result = await useCase.execute({
        userId: 'nonexistent-user',
        confirmEmail: 'test@example.com',
      });

      expect(mockUserRepo.findById).toHaveBeenCalledWith('nonexistent-user');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('USER_NOT_FOUND');
      expect(result.error).toBe('User not found');
    });

    it('should return EMAIL_MISMATCH when confirmation email does not match', async () => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);

      const result = await useCase.execute({
        userId: 'user-123',
        confirmEmail: 'wrong@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('EMAIL_MISMATCH');
      expect(result.error).toBe('Email confirmation does not match your account email');
    });

    it('should match email case-insensitively', async () => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
      (mockPrisma.$transaction as Mock).mockImplementation(
        async (callback: (tx: unknown) => Promise<void>) => {
          await callback({
            reading: { updateMany: vi.fn() },
            followUpQuestion: { updateMany: vi.fn() },
            horoscopeCache: { deleteMany: vi.fn() },
            userAchievement: { deleteMany: vi.fn() },
            user: { update: vi.fn() },
          });
        }
      );

      const result = await useCase.execute({
        userId: 'user-123',
        confirmEmail: 'TEST@EXAMPLE.COM', // Uppercase
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Admin Protection', () => {
    it('should return ADMIN_PROTECTED when trying to delete an admin account', async () => {
      (mockUserRepo.findById as Mock).mockResolvedValue(adminUser);

      const result = await useCase.execute({
        userId: 'admin-123',
        confirmEmail: 'admin@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ADMIN_PROTECTED');
      expect(result.error).toContain('Admin accounts cannot be deleted');
    });
  });

  describe('Successful Deletion (Anonymization)', () => {
    beforeEach(() => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
    });

    it('should anonymize user data successfully', async () => {
      const mockTx = {
        reading: { updateMany: vi.fn() },
        followUpQuestion: { updateMany: vi.fn() },
        horoscopeCache: { deleteMany: vi.fn() },
        userAchievement: { deleteMany: vi.fn() },
        user: { update: vi.fn() },
      };

      (mockPrisma.$transaction as Mock).mockImplementation(
        async (callback: (tx: typeof mockTx) => Promise<void>) => {
          await callback(mockTx);
        }
      );

      const result = await useCase.execute({
        userId: 'user-123',
        confirmEmail: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('anonymized');
    });

    it('should anonymize readings by replacing question and clearing reflection', async () => {
      const mockTx = {
        reading: { updateMany: vi.fn() },
        followUpQuestion: { updateMany: vi.fn() },
        horoscopeCache: { deleteMany: vi.fn() },
        userAchievement: { deleteMany: vi.fn() },
        user: { update: vi.fn() },
      };

      (mockPrisma.$transaction as Mock).mockImplementation(
        async (callback: (tx: typeof mockTx) => Promise<void>) => {
          await callback(mockTx);
        }
      );

      await useCase.execute({
        userId: 'user-123',
        confirmEmail: 'test@example.com',
      });

      expect(mockTx.reading.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          question: '[DELETED]',
          userReflection: null,
        },
      });
    });

    it('should anonymize follow-up questions', async () => {
      const mockTx = {
        reading: { updateMany: vi.fn() },
        followUpQuestion: { updateMany: vi.fn() },
        horoscopeCache: { deleteMany: vi.fn() },
        userAchievement: { deleteMany: vi.fn() },
        user: { update: vi.fn() },
      };

      (mockPrisma.$transaction as Mock).mockImplementation(
        async (callback: (tx: typeof mockTx) => Promise<void>) => {
          await callback(mockTx);
        }
      );

      await useCase.execute({
        userId: 'user-123',
        confirmEmail: 'test@example.com',
      });

      expect(mockTx.followUpQuestion.updateMany).toHaveBeenCalledWith({
        where: { reading: { userId: 'user-123' } },
        data: {
          question: '[DELETED]',
        },
      });
    });

    it('should delete horoscope cache', async () => {
      const mockTx = {
        reading: { updateMany: vi.fn() },
        followUpQuestion: { updateMany: vi.fn() },
        horoscopeCache: { deleteMany: vi.fn() },
        userAchievement: { deleteMany: vi.fn() },
        user: { update: vi.fn() },
      };

      (mockPrisma.$transaction as Mock).mockImplementation(
        async (callback: (tx: typeof mockTx) => Promise<void>) => {
          await callback(mockTx);
        }
      );

      await useCase.execute({
        userId: 'user-123',
        confirmEmail: 'test@example.com',
      });

      expect(mockTx.horoscopeCache.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should delete user achievements', async () => {
      const mockTx = {
        reading: { updateMany: vi.fn() },
        followUpQuestion: { updateMany: vi.fn() },
        horoscopeCache: { deleteMany: vi.fn() },
        userAchievement: { deleteMany: vi.fn() },
        user: { update: vi.fn() },
      };

      (mockPrisma.$transaction as Mock).mockImplementation(
        async (callback: (tx: typeof mockTx) => Promise<void>) => {
          await callback(mockTx);
        }
      );

      await useCase.execute({
        userId: 'user-123',
        confirmEmail: 'test@example.com',
      });

      expect(mockTx.userAchievement.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should anonymize user record with suspended status', async () => {
      const mockTx = {
        reading: { updateMany: vi.fn() },
        followUpQuestion: { updateMany: vi.fn() },
        horoscopeCache: { deleteMany: vi.fn() },
        userAchievement: { deleteMany: vi.fn() },
        user: { update: vi.fn() },
      };

      (mockPrisma.$transaction as Mock).mockImplementation(
        async (callback: (tx: typeof mockTx) => Promise<void>) => {
          await callback(mockTx);
        }
      );

      await useCase.execute({
        userId: 'user-123',
        confirmEmail: 'test@example.com',
      });

      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          accountStatus: 'SUSPENDED',
          credits: 0,
          loginStreak: 0,
          totalCreditsEarned: 0,
          totalCreditsSpent: 0,
          welcomeCompleted: false,
        }),
      });

      // Verify email and username are anonymized
      const updateCall = mockTx.user.update.mock.calls[0][0];
      expect(updateCall.data.email).toMatch(/^deleted_\d+@deleted\.local$/);
      expect(updateCall.data.username).toMatch(/^deleted_\d+$/);
    });
  });

  describe('Transaction Rollback on Failure', () => {
    beforeEach(() => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
    });

    it('should return INTERNAL_ERROR when transaction fails', async () => {
      (mockPrisma.$transaction as Mock).mockRejectedValue(new Error('Database connection lost'));

      const result = await useCase.execute({
        userId: 'user-123',
        confirmEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTERNAL_ERROR');
      expect(result.error).toBe('Database connection lost');
    });

    it('should handle non-Error exceptions', async () => {
      (mockPrisma.$transaction as Mock).mockRejectedValue('String error');

      const result = await useCase.execute({
        userId: 'user-123',
        confirmEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTERNAL_ERROR');
      expect(result.error).toBe('Failed to delete account');
    });

    it('should rollback all changes if any step fails', async () => {
      const mockTx = {
        reading: { updateMany: vi.fn() },
        followUpQuestion: { updateMany: vi.fn().mockRejectedValue(new Error('FK constraint')) },
        horoscopeCache: { deleteMany: vi.fn() },
        userAchievement: { deleteMany: vi.fn() },
        user: { update: vi.fn() },
      };

      (mockPrisma.$transaction as Mock).mockImplementation(
        async (callback: (tx: typeof mockTx) => Promise<void>) => {
          await callback(mockTx);
        }
      );

      const result = await useCase.execute({
        userId: 'user-123',
        confirmEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INTERNAL_ERROR');
    });
  });
});
