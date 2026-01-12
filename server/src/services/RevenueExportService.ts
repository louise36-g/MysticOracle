/**
 * RevenueExportService - Revenue export and reporting
 * Generates CSV exports and provides month availability
 */

import { PrismaClient } from '@prisma/client';

export interface MonthOption {
  year: number;
  month: number;
  label: string;
}

export interface RevenueExportData {
  csv: string;
  filename: string;
  totals: {
    count: number;
    revenue: number;
    credits: number;
  };
}

export class RevenueExportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Export revenue data to CSV format
   */
  async exportToCSV(year: number, month: number): Promise<RevenueExportData> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        type: 'PURCHASE',
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: { select: { email: true, username: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate totals
    const totals = {
      count: transactions.length,
      revenue: transactions.reduce((sum, t) => sum + (Number(t.paymentAmount) || 0), 0),
      credits: transactions.reduce((sum, t) => sum + t.amount, 0),
    };

    // Generate CSV
    const monthName = new Date(year, month - 1).toLocaleString('en', {
      month: 'long',
      year: 'numeric',
    });
    const csv = [
      `MysticOracle Revenue Report - ${monthName}`,
      '',
      'Date,User,Email,Payment Provider,Amount (EUR),Credits,Transaction ID',
      ...transactions.map((t) =>
        [
          new Date(t.createdAt).toISOString().split('T')[0],
          `"${t.user.username}"`,
          `"${t.user.email}"`,
          t.paymentProvider || 'N/A',
          Number(t.paymentAmount).toFixed(2),
          t.amount,
          t.paymentId || t.id,
        ].join(',')
      ),
      '',
      `Total Transactions,${totals.count}`,
      `Total Revenue (EUR),${totals.revenue.toFixed(2)}`,
      `Total Credits Sold,${totals.credits}`,
    ].join('\n');

    const filename = `mysticoracle-revenue-${year}-${String(month).padStart(2, '0')}.csv`;

    return {
      csv,
      filename,
      totals,
    };
  }

  /**
   * Get available months for export
   */
  async getAvailableMonths(): Promise<MonthOption[]> {
    const firstTransaction = await this.prisma.transaction.findFirst({
      where: { type: 'PURCHASE', paymentStatus: 'COMPLETED' },
      orderBy: { createdAt: 'asc' },
    });

    if (!firstTransaction) {
      return [];
    }

    const months: MonthOption[] = [];
    const start = new Date(firstTransaction.createdAt);
    const now = new Date();

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= now) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        label: current.toLocaleString('en', { month: 'long', year: 'numeric' }),
      });
      current.setMonth(current.getMonth() + 1);
    }

    // Most recent first
    return months.reverse();
  }
}

export default RevenueExportService;
