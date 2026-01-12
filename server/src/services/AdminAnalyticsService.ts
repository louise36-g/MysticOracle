/**
 * AdminAnalyticsService - Analytics and reporting
 * Provides detailed analytics data for admin dashboard
 */

import { PrismaClient, SpreadType as PrismaSpreadType } from '@prisma/client';

export interface DailyReadings {
  date: string;
  count: number;
}

export interface TopUser {
  id?: string;
  username: string;
  count?: number;
  credits?: number;
  streak?: number;
}

export interface ReadingStats {
  bySpread: { spreadType: PrismaSpreadType; count: number }[];
  last7Days: number;
  last30Days: number;
}

export interface AnalyticsData {
  readingsByDay: DailyReadings[];
  topUsers: TopUser[];
  topCreditUsers: TopUser[];
  topStreakUsers: TopUser[];
}

export class AdminAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get comprehensive analytics data
   */
  async getAnalytics(days: number = 7): Promise<AnalyticsData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get readings for the period
    const readings = await this.prisma.reading.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    // Group readings by day
    const readingsByDay: DailyReadings[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = readings.filter(r => {
        const date = new Date(r.createdAt);
        return date >= dayStart && date < dayEnd;
      }).length;

      readingsByDay.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
      });
    }

    // Get top users by various metrics
    const [topUsersByReadings, topUsersByCredits, topUsersByStreak] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { totalReadings: 'desc' },
        take: 5,
        select: { id: true, username: true, totalReadings: true },
      }),
      this.prisma.user.findMany({
        orderBy: { credits: 'desc' },
        take: 5,
        select: { username: true, credits: true },
      }),
      this.prisma.user.findMany({
        orderBy: { loginStreak: 'desc' },
        take: 5,
        select: { username: true, loginStreak: true },
      }),
    ]);

    return {
      readingsByDay,
      topUsers: topUsersByReadings.map(u => ({
        id: u.id,
        username: u.username,
        count: u.totalReadings,
      })),
      topCreditUsers: topUsersByCredits.map(u => ({
        username: u.username,
        credits: u.credits,
      })),
      topStreakUsers: topUsersByStreak.map(u => ({
        username: u.username,
        streak: u.loginStreak,
      })),
    };
  }

  /**
   * Get reading statistics
   */
  async getReadingStats(): Promise<ReadingStats> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [bySpread, last7Days, last30Days] = await Promise.all([
      this.prisma.reading.groupBy({
        by: ['spreadType'],
        _count: true,
      }),
      this.prisma.reading.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.reading.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return {
      bySpread: bySpread.map(r => ({
        spreadType: r.spreadType,
        count: r._count,
      })),
      last7Days,
      last30Days,
    };
  }
}

export default AdminAnalyticsService;
