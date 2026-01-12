/**
 * PrismaUserRepository Tests
 * Unit tests for the PrismaUserRepository implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaUserRepository } from '../../infrastructure/persistence/prisma/PrismaUserRepository.js';
import { createMockPrismaClient } from '../mocks/prisma.js';
import type { User, AccountStatus } from '@prisma/client';

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    language: 'en',
    credits: 10,
    totalCreditsEarned: 100,
    totalCreditsSpent: 90,
    totalReadings: 15,
    totalQuestions: 5,
    loginStreak: 3,
    lastLoginDate: new Date(),
    welcomeCompleted: true,
    referralCode: 'TEST1234',
    referredById: null,
    accountStatus: 'ACTIVE' as AccountStatus,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repository = new PrismaUserRepository(mockPrisma as any);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById('user-1');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('findByUsername', () => {
    it('should return user when found by username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const createData = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST1234',
        credits: 3,
      };

      const result = await repository.create(createData);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
          referralCode: 'TEST1234',
          credits: 3,
        }),
      });
    });

    it('should use default values when not provided', async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const createData = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        referralCode: 'TEST1234',
      };

      await repository.create(createData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          credits: 0,
          isAdmin: false,
        }),
      });
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const updatedUser = { ...mockUser, credits: 20 };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update('user-1', { credits: 20 });

      expect(result.credits).toBe(20);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ credits: 20 }),
      });
    });

    it('should only update provided fields', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await repository.update('user-1', { username: 'newname' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          email: undefined,
          username: 'newname',
          language: undefined,
          credits: undefined,
          totalCreditsEarned: undefined,
          totalCreditsSpent: undefined,
          totalReadings: undefined,
          totalQuestions: undefined,
          loginStreak: undefined,
          lastLoginDate: undefined,
          welcomeCompleted: undefined,
          accountStatus: undefined,
          isAdmin: undefined,
        },
      });
    });
  });

  describe('delete', () => {
    it('should return true on successful deletion', async () => {
      mockPrisma.user.delete.mockResolvedValue(mockUser);

      const result = await repository.delete('user-1');

      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockPrisma.user.delete.mockRejectedValue(new Error('Not found'));

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getCredits', () => {
    it('should return user credits', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ credits: 50 } as any);

      const result = await repository.getCredits('user-1');

      expect(result).toBe(50);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { credits: true },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.getCredits('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateCredits', () => {
    it('should increment credits with positive delta', async () => {
      const updatedUser = { ...mockUser, credits: 15 };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.updateCredits('user-1', {
        creditsDelta: 5,
        updateEarned: true,
      });

      expect(result.credits).toBe(15);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          credits: { increment: 5 },
          totalCreditsEarned: { increment: 5 },
        },
      });
    });

    it('should decrement credits with negative delta', async () => {
      const updatedUser = { ...mockUser, credits: 5 };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.updateCredits('user-1', {
        creditsDelta: -5,
        updateSpent: true,
      });

      expect(result.credits).toBe(5);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          credits: { increment: -5 },
          totalCreditsSpent: { increment: 5 },
        },
      });
    });
  });

  describe('findMany', () => {
    it('should return users with default pagination', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await repository.findMany();

      expect(result).toHaveLength(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should apply search filter', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      await repository.findMany({ search: 'test' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { username: { contains: 'test', mode: 'insensitive' } },
              { email: { contains: 'test', mode: 'insensitive' } },
              { id: { contains: 'test', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should apply status filter', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await repository.findMany({ status: 'SUSPENDED' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountStatus: 'SUSPENDED' },
        })
      );
    });
  });

  describe('count', () => {
    it('should return total user count', async () => {
      mockPrisma.user.count.mockResolvedValue(42);

      const result = await repository.count();

      expect(result).toBe(42);
    });

    it('should apply filters to count', async () => {
      mockPrisma.user.count.mockResolvedValue(5);

      await repository.count({ search: 'admin' });

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: { contains: 'admin', mode: 'insensitive' } },
            { email: { contains: 'admin', mode: 'insensitive' } },
            { id: { contains: 'admin', mode: 'insensitive' } },
          ],
        },
      });
    });
  });
});
