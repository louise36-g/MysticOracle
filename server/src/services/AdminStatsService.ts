/**
 * AdminStatsService - Dashboard statistics aggregation
 * Provides consolidated dashboard metrics for admin overview
 */

import { PrismaClient } from '@prisma/client';
import type { IUserRepository } from '../application/ports/repositories/IUserRepository.js';
import type { IReadingRepository } from '../application/ports/repositories/IReadingRepository.js';
import type { ITransactionRepository } from '../application/ports/repositories/ITransactionRepository.js';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalReadings: number;
  totalRevenue: number;
  todayReadings: number;
  todaySignups: number;
}

export class AdminStatsService {
  constructor(
    private prisma: PrismaClient,
    private userRepository?: IUserRepository,
    private readingRepository?: IReadingRepository,
    private transactionRepository?: ITransactionRepository
  ) {}

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, totalReadings, totalRevenue, todayReadings, todaySignups] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
        this.prisma.reading.count(),
        this.prisma.transaction.aggregate({
          where: { type: 'PURCHASE', paymentStatus: 'COMPLETED' },
          _sum: { paymentAmount: true },
        }),
        this.prisma.reading.count({
          where: { createdAt: { gte: todayStart } },
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: todayStart } },
        }),
      ]);

    return {
      totalUsers,
      activeUsers,
      totalReadings,
      totalRevenue: Number(totalRevenue._sum.paymentAmount) || 0,
      todayReadings,
      todaySignups,
    };
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(): Promise<{
    totalRevenue: number;
    last30DaysRevenue: number;
    totalTransactions: number;
    recentTransactions: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, last30Days, count, recentCount] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { type: 'PURCHASE', paymentStatus: 'COMPLETED' },
        _sum: { paymentAmount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          type: 'PURCHASE',
          paymentStatus: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { paymentAmount: true },
      }),
      this.prisma.transaction.count({
        where: { type: 'PURCHASE', paymentStatus: 'COMPLETED' },
      }),
      this.prisma.transaction.count({
        where: {
          type: 'PURCHASE',
          paymentStatus: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    return {
      totalRevenue: Number(total._sum.paymentAmount) || 0,
      last30DaysRevenue: Number(last30Days._sum.paymentAmount) || 0,
      totalTransactions: count,
      recentTransactions: recentCount,
    };
  }
}

export default AdminStatsService;
