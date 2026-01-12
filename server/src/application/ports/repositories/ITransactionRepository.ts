/**
 * ITransactionRepository - Transaction data access interface
 * Abstracts database operations for Transaction entity
 */

import type { Transaction, TransactionType, PaymentProvider, PaymentStatus } from '@prisma/client';

// DTOs for creating transactions
export interface CreateTransactionDTO {
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  paymentProvider?: PaymentProvider;
  paymentId?: string;
  paymentAmount?: number;
  currency?: string;
  paymentStatus?: PaymentStatus;
}

export interface UpdateTransactionDTO {
  paymentStatus?: PaymentStatus;
  amount?: number;
}

// Re-use PaginationOptions from IUserRepository
import type { PaginationOptions } from './IUserRepository.js';

export interface TransactionListOptions extends PaginationOptions {
  type?: TransactionType;
}

// Transaction with user info for admin views
export interface TransactionWithUser extends Transaction {
  user: {
    username: string;
    email: string;
  };
}

/**
 * Transaction Repository Interface
 * Defines all transaction-related database operations
 */
export interface ITransactionRepository {
  // Basic CRUD
  findById(id: string): Promise<Transaction | null>;
  create(data: CreateTransactionDTO): Promise<Transaction>;
  update(id: string, data: UpdateTransactionDTO): Promise<Transaction>;

  // Find by payment ID (for webhook idempotency)
  findByPaymentId(paymentId: string): Promise<Transaction | null>;
  findByPaymentIdAndStatus(paymentId: string, status: PaymentStatus): Promise<Transaction | null>;
  findByPaymentIdAndType(paymentId: string, type: TransactionType): Promise<Transaction | null>;

  // Update by payment ID
  updateByPaymentId(paymentId: string, data: UpdateTransactionDTO): Promise<number>;
  updateStatusByPaymentId(paymentId: string, status: PaymentStatus): Promise<number>;

  // User's transactions
  findByUser(userId: string, options?: TransactionListOptions): Promise<Transaction[]>;
  countByUser(userId: string, options?: Omit<TransactionListOptions, 'limit' | 'offset'>): Promise<number>;

  // Admin listing
  findMany(options?: TransactionListOptions): Promise<TransactionWithUser[]>;
  count(options?: Omit<TransactionListOptions, 'limit' | 'offset'>): Promise<number>;

  // Aggregations
  sumCompletedPurchases(): Promise<number>;
  sumCompletedPurchasesLast30Days(): Promise<number>;
  groupByProvider(): Promise<{ paymentProvider: PaymentProvider | null; total: number; count: number }[]>;
}

export default ITransactionRepository;
