/**
 * PrismaUserRepository - Prisma implementation of IUserRepository
 */

import { PrismaClient, User, AccountStatus } from '@prisma/client';
import type {
  IUserRepository,
  CreateUserDTO,
  UpdateUserDTO,
  CreditUpdateDTO,
  UserWithCounts,
  UserListOptions,
} from '../../../application/ports/repositories/IUserRepository.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { referralCode } });
  }

  async create(data: CreateUserDTO): Promise<User> {
    return this.prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        username: data.username,
        referralCode: data.referralCode,
        credits: data.credits ?? 0,
        isAdmin: data.isAdmin ?? false,
        referredById: data.referredById,
      },
    });
  }

  async update(id: string, data: UpdateUserDTO): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        username: data.username,
        language: data.language,
        credits: data.credits,
        totalCreditsEarned: data.totalCreditsEarned,
        totalCreditsSpent: data.totalCreditsSpent,
        totalReadings: data.totalReadings,
        totalQuestions: data.totalQuestions,
        loginStreak: data.loginStreak,
        lastLoginDate: data.lastLoginDate,
        welcomeCompleted: data.welcomeCompleted,
        accountStatus: data.accountStatus,
        isAdmin: data.isAdmin,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getCredits(userId: string): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    return user?.credits ?? null;
  }

  async updateCredits(userId: string, update: CreditUpdateDTO): Promise<User> {
    const data: any = {
      credits: { increment: update.creditsDelta },
    };

    if (update.updateEarned && update.creditsDelta > 0) {
      data.totalCreditsEarned = { increment: update.creditsDelta };
    }

    if (update.updateSpent && update.creditsDelta < 0) {
      data.totalCreditsSpent = { increment: Math.abs(update.creditsDelta) };
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async findMany(options?: UserListOptions): Promise<UserWithCounts[]> {
    const {
      limit = 20,
      offset = 0,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.accountStatus = status;
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
      include: {
        _count: {
          select: { readings: true, referrals: true, achievements: true },
        },
      },
    });
  }

  async count(options?: Omit<UserListOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>): Promise<number> {
    const where: any = {};

    if (options?.search) {
      where.OR = [
        { username: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
        { id: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.status) {
      where.accountStatus = options.status;
    }

    return this.prisma.user.count({ where });
  }

  async findByIdWithAchievements(id: string): Promise<UserWithCounts | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        achievements: true,
        _count: {
          select: { readings: true, referrals: true },
        },
      },
    });
  }

  async findByIdWithReadings(id: string, readingLimit = 50): Promise<(User & { readings: any[] }) | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        readings: {
          select: {
            id: true,
            spreadType: true,
            createdAt: true,
            creditCost: true,
          },
          orderBy: { createdAt: 'desc' },
          take: readingLimit,
        },
      },
    });
  }
}

export default PrismaUserRepository;
