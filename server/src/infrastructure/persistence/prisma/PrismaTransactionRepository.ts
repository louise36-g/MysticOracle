/**
 * PrismaTransactionRepository - Prisma implementation of ITransactionRepository
 */

import {
  PrismaClient,
  Transaction,
  TransactionType,
  PaymentProvider,
  PaymentStatus,
} from '@prisma/client';
import type {
  ITransactionRepository,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionListOptions,
  TransactionWithUser,
} from '../../../application/ports/repositories/ITransactionRepository.js';

export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({ where: { id } });
  }

  async create(data: CreateTransactionDTO): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: {
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        paymentProvider: data.paymentProvider,
        paymentId: data.paymentId,
        paymentAmount: data.paymentAmount,
        currency: data.currency,
        paymentStatus: data.paymentStatus,
      },
    });
  }

  async update(id: string, data: UpdateTransactionDTO): Promise<Transaction> {
    return this.prisma.transaction.update({
      where: { id },
      data: {
        paymentStatus: data.paymentStatus,
        amount: data.amount,
      },
    });
  }

  async findByPaymentId(paymentId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({
      where: { paymentId },
    });
  }

  async findByPaymentIdAndStatus(
    paymentId: string,
    status: PaymentStatus
  ): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({
      where: { paymentId, paymentStatus: status },
    });
  }

  async findByPaymentIdAndType(
    paymentId: string,
    type: TransactionType
  ): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({
      where: { paymentId, type },
    });
  }

  async updateByPaymentId(paymentId: string, data: UpdateTransactionDTO): Promise<number> {
    const result = await this.prisma.transaction.updateMany({
      where: { paymentId },
      data: {
        paymentStatus: data.paymentStatus,
        amount: data.amount,
      },
    });
    return result.count;
  }

  async updateStatusByPaymentId(paymentId: string, status: PaymentStatus): Promise<number> {
    const result = await this.prisma.transaction.updateMany({
      where: { paymentId },
      data: { paymentStatus: status },
    });
    return result.count;
  }

  async findByUser(userId: string, options?: TransactionListOptions): Promise<Transaction[]> {
    const { limit = 50, offset = 0, type } = options || {};

    const where: { userId: string; type?: TransactionType } = { userId };
    if (type) {
      where.type = type;
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  async countByUser(
    userId: string,
    options?: Omit<TransactionListOptions, 'limit' | 'offset'>
  ): Promise<number> {
    const where: { userId: string; type?: TransactionType } = { userId };
    if (options?.type) {
      where.type = options.type;
    }

    return this.prisma.transaction.count({ where });
  }

  async findMany(options?: TransactionListOptions): Promise<TransactionWithUser[]> {
    const { limit = 50, offset = 0, type } = options || {};

    const where: { type?: TransactionType } = {};
    if (type) {
      where.type = type;
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        user: {
          select: { username: true, email: true },
        },
      },
    });
  }

  async count(options?: Omit<TransactionListOptions, 'limit' | 'offset'>): Promise<number> {
    const where: { type?: TransactionType } = {};
    if (options?.type) {
      where.type = options.type;
    }

    return this.prisma.transaction.count({ where });
  }

  async sumCompletedPurchases(): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        type: 'PURCHASE',
        paymentStatus: 'COMPLETED',
      },
      _sum: { paymentAmount: true },
    });

    return Number(result._sum.paymentAmount) || 0;
  }

  async sumCompletedPurchasesLast30Days(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.transaction.aggregate({
      where: {
        type: 'PURCHASE',
        paymentStatus: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { paymentAmount: true },
    });

    return Number(result._sum.paymentAmount) || 0;
  }

  async groupByProvider(): Promise<
    { paymentProvider: PaymentProvider | null; total: number; count: number }[]
  > {
    const results = await this.prisma.transaction.groupBy({
      by: ['paymentProvider'],
      where: {
        type: 'PURCHASE',
        paymentStatus: 'COMPLETED',
      },
      _sum: { paymentAmount: true },
      _count: true,
    });

    return results.map(r => ({
      paymentProvider: r.paymentProvider,
      total: Number(r._sum.paymentAmount) || 0,
      count: r._count,
    }));
  }
}

export default PrismaTransactionRepository;
