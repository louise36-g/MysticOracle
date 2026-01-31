/**
 * IUserRepository - User data access interface
 * Abstracts database operations for User entity
 */

import type { User, AccountStatus } from '@prisma/client';

// DTOs for creating/updating users
export interface CreateUserDTO {
  id: string;
  email: string;
  username: string;
  referralCode: string;
  credits?: number;
  isAdmin?: boolean;
  referredById?: string;
}

export interface UpdateUserDTO {
  email?: string;
  username?: string;
  language?: string;
  credits?: number;
  totalCreditsEarned?: number;
  totalCreditsSpent?: number;
  totalReadings?: number;
  totalQuestions?: number;
  loginStreak?: number;
  lastLoginDate?: Date;
  welcomeCompleted?: boolean;
  accountStatus?: AccountStatus;
  isAdmin?: boolean;
}

export interface CreditUpdateDTO {
  creditsDelta: number;
  updateEarned?: boolean; // If true, also update totalCreditsEarned
  updateSpent?: boolean; // If true, also update totalCreditsSpent
}

export interface UserWithCounts extends User {
  _count?: {
    readings?: number;
    referrals?: number;
    achievements?: number;
  };
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface UserListOptions extends PaginationOptions {
  search?: string;
  status?: AccountStatus;
  sortBy?: 'createdAt' | 'credits' | 'totalReadings' | 'username';
  sortOrder?: 'asc' | 'desc';
}

/**
 * User Repository Interface
 * Defines all user-related database operations
 */
export interface IUserRepository {
  // Basic CRUD
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByReferralCode(referralCode: string): Promise<User | null>;

  create(data: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User>;
  delete(id: string): Promise<boolean>;

  // Credit operations
  getCredits(userId: string): Promise<number | null>;
  updateCredits(userId: string, update: CreditUpdateDTO): Promise<User>;

  // Listing
  findMany(options?: UserListOptions): Promise<UserWithCounts[]>;
  count(
    options?: Omit<UserListOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>
  ): Promise<number>;

  // With relations
  findByIdWithAchievements(id: string): Promise<UserWithCounts | null>;
  findByIdWithReadings(
    id: string,
    readingLimit?: number
  ): Promise<(User & { readings: ReadingSummary[] }) | null>;
}

// Summary type for readings list
export interface ReadingSummary {
  id: string;
  spreadType: string;
  createdAt: Date;
  creditCost: number;
}
