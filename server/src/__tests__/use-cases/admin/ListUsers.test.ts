/**
 * ListUsers Use Case Tests
 * Tests the admin user listing functionality with pagination, search, and sorting
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ListUsersUseCase, type ListUsersInput } from '../../../application/use-cases/admin/users/ListUsers.js';
import type { IUserRepository } from '../../../application/ports/repositories/IUserRepository.js';
import { AccountStatus } from '@prisma/client';

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

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;
  let mockUserRepo: IUserRepository;

  const mockUsers = [
    {
      id: 'user-1',
      email: 'alice@example.com',
      username: 'alice',
      credits: 100,
      totalReadings: 10,
      totalCreditsEarned: 200,
      totalCreditsSpent: 100,
      loginStreak: 5,
      lastLoginDate: new Date('2026-01-10'),
      accountStatus: AccountStatus.ACTIVE,
      isAdmin: false,
      createdAt: new Date('2025-12-01'),
    },
    {
      id: 'user-2',
      email: 'bob@example.com',
      username: 'bob',
      credits: 50,
      totalReadings: 5,
      totalCreditsEarned: 100,
      totalCreditsSpent: 50,
      loginStreak: 2,
      lastLoginDate: new Date('2026-01-12'),
      accountStatus: AccountStatus.ACTIVE,
      isAdmin: true,
      createdAt: new Date('2026-01-01'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRepo = createMockUserRepository();
    useCase = new ListUsersUseCase(mockUserRepo);
  });

  describe('Default Pagination', () => {
    it('should use default page 1 and limit 20 when not specified', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue(mockUsers);
      (mockUserRepo.count as Mock).mockResolvedValue(2);

      await useCase.execute({});

      expect(mockUserRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 0,
        })
      );
    });

    it('should calculate correct offset for page 2', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue([]);
      (mockUserRepo.count as Mock).mockResolvedValue(50);

      await useCase.execute({ page: 2, limit: 10 });

      expect(mockUserRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10,
        })
      );
    });

    it('should cap limit at 100 maximum', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue([]);
      (mockUserRepo.count as Mock).mockResolvedValue(0);

      await useCase.execute({ limit: 200 });

      expect(mockUserRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        })
      );
    });
  });

  describe('Search Filtering', () => {
    it('should pass search term to repository', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue([mockUsers[0]]);
      (mockUserRepo.count as Mock).mockResolvedValue(1);

      await useCase.execute({ search: 'alice' });

      expect(mockUserRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'alice',
        })
      );
      expect(mockUserRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'alice',
        })
      );
    });
  });

  describe('Status Filtering', () => {
    it('should pass status filter to repository', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue([]);
      (mockUserRepo.count as Mock).mockResolvedValue(0);

      await useCase.execute({ status: AccountStatus.SUSPENDED });

      expect(mockUserRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AccountStatus.SUSPENDED,
        })
      );
    });

    it('should filter by ACTIVE status', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue(mockUsers);
      (mockUserRepo.count as Mock).mockResolvedValue(2);

      await useCase.execute({ status: AccountStatus.ACTIVE });

      expect(mockUserRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AccountStatus.ACTIVE,
        })
      );
    });
  });

  describe('Sorting', () => {
    it('should use default sort by createdAt desc', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue(mockUsers);
      (mockUserRepo.count as Mock).mockResolvedValue(2);

      await useCase.execute({});

      expect(mockUserRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
      );
    });

    it('should allow sorting by credits ascending', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue(mockUsers);
      (mockUserRepo.count as Mock).mockResolvedValue(2);

      await useCase.execute({ sortBy: 'credits', sortOrder: 'asc' });

      expect(mockUserRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'credits',
          sortOrder: 'asc',
        })
      );
    });

    it('should allow sorting by totalReadings', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue([]);
      (mockUserRepo.count as Mock).mockResolvedValue(0);

      await useCase.execute({ sortBy: 'totalReadings' });

      expect(mockUserRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'totalReadings',
        })
      );
    });

    it('should allow sorting by username', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue([]);
      (mockUserRepo.count as Mock).mockResolvedValue(0);

      await useCase.execute({ sortBy: 'username' });

      expect(mockUserRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'username',
        })
      );
    });
  });

  describe('Response Format', () => {
    it('should return users with pagination info', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue(mockUsers);
      (mockUserRepo.count as Mock).mockResolvedValue(50);

      const result = await useCase.execute({ page: 1, limit: 20 });

      expect(result).toEqual({
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          totalPages: 3,
        },
      });
    });

    it('should calculate correct totalPages', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue([]);
      (mockUserRepo.count as Mock).mockResolvedValue(25);

      const result = await useCase.execute({ page: 1, limit: 10 });

      expect(result.pagination.totalPages).toBe(3);
    });

    it('should handle empty results', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue([]);
      (mockUserRepo.count as Mock).mockResolvedValue(0);

      const result = await useCase.execute({});

      expect(result).toEqual({
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });
    });
  });

  describe('Combined Filters', () => {
    it('should handle all filters together', async () => {
      (mockUserRepo.findMany as Mock).mockResolvedValue([mockUsers[1]]);
      (mockUserRepo.count as Mock).mockResolvedValue(1);

      const input: ListUsersInput = {
        page: 2,
        limit: 10,
        search: 'bob',
        status: AccountStatus.ACTIVE,
        sortBy: 'credits',
        sortOrder: 'desc',
      };

      const result = await useCase.execute(input);

      expect(mockUserRepo.findMany).toHaveBeenCalledWith({
        limit: 10,
        offset: 10,
        search: 'bob',
        status: AccountStatus.ACTIVE,
        sortBy: 'credits',
        sortOrder: 'desc',
      });

      expect(mockUserRepo.count).toHaveBeenCalledWith({
        search: 'bob',
        status: AccountStatus.ACTIVE,
      });

      expect(result.users).toHaveLength(1);
    });
  });
});
