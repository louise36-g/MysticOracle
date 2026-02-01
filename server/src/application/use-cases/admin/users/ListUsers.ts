/**
 * ListUsers Use Case
 * Lists users with pagination, search, and sorting
 */

import { AccountStatus } from '@prisma/client';
import type {
  IUserRepository,
  UserListOptions,
} from '../../../ports/repositories/IUserRepository.js';

export interface ListUsersInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: AccountStatus;
  sortBy?: 'createdAt' | 'credits' | 'totalReadings' | 'username';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListItem {
  id: string;
  email: string;
  username: string;
  credits: number;
  totalReadings: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  loginStreak: number;
  lastLoginDate: Date | null;
  accountStatus: AccountStatus;
  isAdmin: boolean;
  createdAt: Date;
  _count?: {
    achievements: number;
    readings: number;
  };
}

export interface ListUsersResult {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ListUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: ListUsersInput): Promise<ListUsersResult> {
    const page = input.page ?? 1;
    const limit = Math.min(input.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const options: UserListOptions = {
      limit,
      offset,
      search: input.search,
      status: input.status,
      sortBy: input.sortBy ?? 'createdAt',
      sortOrder: input.sortOrder ?? 'desc',
    };

    const [users, total] = await Promise.all([
      this.userRepository.findMany(options),
      this.userRepository.count({ search: input.search, status: input.status }),
    ]);

    return {
      users: users as UserListItem[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default ListUsersUseCase;
