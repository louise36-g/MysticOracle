/**
 * CreditService - Centralized credit operations
 * Consolidates all credit additions, deductions, and balance checks
 * with consistent transaction handling and audit logging
 *
 * Uses repository interfaces for data access while maintaining
 * Prisma transactions for atomic operations.
 */

import { PrismaClient, TransactionType } from '@prisma/client';
import * as Sentry from '@sentry/node';
import prismaClient from '../db/prisma.js';
import type { IUserRepository } from '../application/ports/repositories/IUserRepository.js';
import type { ITransactionRepository } from '../application/ports/repositories/ITransactionRepository.js';

// Types for credit operations
export interface CreditOperation {
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  metadata?: {
    paymentProvider?: 'STRIPE' | 'STRIPE_LINK' | 'PAYPAL';
    paymentId?: string;
    paymentAmount?: number;
    currency?: string;
  };
}

export interface CreditResult {
  success: boolean;
  newBalance: number;
  transactionId: string;
  error?: string;
}

export interface BalanceCheck {
  sufficient: boolean;
  balance: number;
  required: number;
}

// Server-side credit costs (never trust client)
export const CREDIT_COSTS = {
  SPREAD: {
    SINGLE: 1,
    TWO_CARD: 2,
    THREE_CARD: 3,
    FIVE_CARD: 5,
    LOVE: 5,
    CAREER: 5,
    HORSESHOE: 7,
    CELTIC_CROSS: 10,
  },
  CLARIFICATION: 1,
  FOLLOW_UP: 1,
  SUMMARIZE_QUESTION: 1,
  WELCOME_BONUS: 3,
  DAILY_BONUS_BASE: 2,
  WEEKLY_STREAK_BONUS: 5,
  REFERRAL_BONUS: 5,
} as const;

class CreditService {
  constructor(
    private prisma: PrismaClient,
    private userRepository?: IUserRepository,
    private transactionRepository?: ITransactionRepository
  ) {}

  /**
   * Get user's current credit balance
   * Uses repository if available, falls back to Prisma
   */
  async getBalance(userId: string): Promise<number | null> {
    if (this.userRepository) {
      return this.userRepository.getCredits(userId);
    }
    // Fallback to direct Prisma (backward compatibility)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    return user?.credits ?? null;
  }

  /**
   * Check if user has sufficient credits for an operation
   */
  async checkSufficientCredits(userId: string, required: number): Promise<BalanceCheck> {
    const balance = await this.getBalance(userId);

    if (balance === null) {
      return { sufficient: false, balance: 0, required };
    }

    return {
      sufficient: balance >= required,
      balance,
      required,
    };
  }

  /**
   * Calculate total cost for a reading - SINGLE SOURCE OF TRUTH
   * Backend always calculates cost, never trust frontend values
   */
  calculateReadingCost(params: {
    spreadType: string;
    hasAdvancedStyle: boolean;
    hasExtendedQuestion: boolean;
  }): { baseCost: number; styleCost: number; extendedCost: number; totalCost: number } {
    // Normalize spread type: 'three-card' -> 'THREE_CARD'
    const spreadKey = params.spreadType
      .toUpperCase()
      .replace('-', '_') as keyof typeof CREDIT_COSTS.SPREAD;
    const baseCost = CREDIT_COSTS.SPREAD[spreadKey] ?? CREDIT_COSTS.SPREAD.SINGLE;

    const styleCost = params.hasAdvancedStyle ? 1 : 0;
    const extendedCost = params.hasExtendedQuestion ? 1 : 0;

    return {
      baseCost,
      styleCost,
      extendedCost,
      totalCost: baseCost + styleCost + extendedCost,
    };
  }

  /**
   * Deduct credits from user account
   * Creates transaction record and updates user stats atomically
   */
  async deductCredits(op: CreditOperation): Promise<CreditResult> {
    try {
      // Validate amount is positive
      if (op.amount <= 0) {
        return {
          success: false,
          newBalance: 0,
          transactionId: '',
          error: 'Amount must be positive',
        };
      }

      // Check balance first
      const check = await this.checkSufficientCredits(op.userId, op.amount);
      if (!check.sufficient) {
        return {
          success: false,
          newBalance: check.balance,
          transactionId: '',
          error: `Insufficient credits: have ${check.balance}, need ${op.amount}`,
        };
      }

      // Atomic transaction: deduct credits + create transaction record
      const [transaction, updatedUser] = await Sentry.startSpan(
        { name: 'credit.deduct', op: 'db.transaction', attributes: { amount: op.amount } },
        () =>
          this.prisma.$transaction([
            this.prisma.transaction.create({
              data: {
                userId: op.userId,
                type: op.type,
                amount: -op.amount, // Negative for deductions
                description: op.description,
                paymentProvider: op.metadata?.paymentProvider,
                paymentId: op.metadata?.paymentId,
                paymentAmount: op.metadata?.paymentAmount,
                currency: op.metadata?.currency,
              },
            }),
            this.prisma.user.update({
              where: { id: op.userId },
              data: {
                credits: { decrement: op.amount },
                totalCreditsSpent: { increment: op.amount },
              },
            }),
          ])
      );

      console.log(
        `[CreditService] Deducted ${op.amount} credits from user ${op.userId}. ` +
          `New balance: ${updatedUser.credits}. Transaction: ${transaction.id}`
      );

      return {
        success: true,
        newBalance: updatedUser.credits,
        transactionId: transaction.id,
      };
    } catch (error) {
      console.error('[CreditService] Error deducting credits:', error);
      return {
        success: false,
        newBalance: 0,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Failed to deduct credits',
      };
    }
  }

  /**
   * Add credits to user account
   * Creates transaction record and updates user stats atomically
   */
  async addCredits(op: CreditOperation): Promise<CreditResult> {
    try {
      // Validate amount is positive
      if (op.amount <= 0) {
        return {
          success: false,
          newBalance: 0,
          transactionId: '',
          error: 'Amount must be positive',
        };
      }

      // Atomic transaction: add credits + create transaction record
      const [transaction, updatedUser] = await Sentry.startSpan(
        { name: 'credit.add', op: 'db.transaction', attributes: { amount: op.amount } },
        () =>
          this.prisma.$transaction([
            this.prisma.transaction.create({
              data: {
                userId: op.userId,
                type: op.type,
                amount: op.amount, // Positive for additions
                description: op.description,
                paymentProvider: op.metadata?.paymentProvider,
                paymentId: op.metadata?.paymentId,
                paymentAmount: op.metadata?.paymentAmount,
                currency: op.metadata?.currency,
                paymentStatus: op.metadata?.paymentId ? 'COMPLETED' : undefined,
              },
            }),
            this.prisma.user.update({
              where: { id: op.userId },
              data: {
                credits: { increment: op.amount },
                totalCreditsEarned: { increment: op.amount },
              },
            }),
          ])
      );

      console.log(
        `[CreditService] Added ${op.amount} credits to user ${op.userId}. ` +
          `New balance: ${updatedUser.credits}. Transaction: ${transaction.id}`
      );

      return {
        success: true,
        newBalance: updatedUser.credits,
        transactionId: transaction.id,
      };
    } catch (error) {
      console.error('[CreditService] Error adding credits:', error);
      return {
        success: false,
        newBalance: 0,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Failed to add credits',
      };
    }
  }

  /**
   * Adjust credits (admin operation) - can add or remove
   * Uses REFUND type for additions, READING type for deductions (matching existing behavior)
   */
  async adjustCredits(userId: string, amount: number, reason: string): Promise<CreditResult> {
    if (amount === 0) {
      const balance = await this.getBalance(userId);
      return {
        success: false,
        newBalance: balance ?? 0,
        transactionId: '',
        error: 'Amount cannot be zero',
      };
    }

    if (amount > 0) {
      return this.addCredits({
        userId,
        amount,
        type: 'REFUND', // Admin additions use REFUND type
        description: `Admin adjustment: ${reason}`,
      });
    } else {
      return this.deductCredits({
        userId,
        amount: Math.abs(amount),
        type: 'READING', // Admin deductions use READING type (matching existing)
        description: `Admin adjustment: ${reason}`,
      });
    }
  }

  /**
   * Process refund - deduct previously added credits
   * Used by payment webhook handlers
   */
  async processRefund(
    userId: string,
    originalAmount: number,
    paymentId: string,
    provider: 'STRIPE' | 'STRIPE_LINK' | 'PAYPAL'
  ): Promise<CreditResult> {
    try {
      // Atomic transaction: deduct credits + create refund record
      const [transaction, updatedUser] = await this.prisma.$transaction([
        this.prisma.transaction.create({
          data: {
            userId,
            type: 'REFUND',
            amount: -originalAmount, // Negative for refund deduction
            description: `Refund processed via ${provider}`,
            paymentProvider: provider,
            paymentId,
            paymentStatus: 'REFUNDED',
          },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: {
            credits: { decrement: originalAmount },
            totalCreditsEarned: { decrement: originalAmount },
          },
        }),
      ]);

      console.log(
        `[CreditService] Processed refund of ${originalAmount} credits for user ${userId}. ` +
          `New balance: ${updatedUser.credits}. Transaction: ${transaction.id}`
      );

      return {
        success: true,
        newBalance: updatedUser.credits,
        transactionId: transaction.id,
      };
    } catch (error) {
      console.error('[CreditService] Error processing refund:', error);
      return {
        success: false,
        newBalance: 0,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Failed to process refund',
      };
    }
  }

  /**
   * Refund credits for a failed operation (reading, follow-up, etc.)
   * Creates a REFUND transaction linked to the original transaction
   */
  async refundCredits(
    userId: string,
    amount: number,
    reason: string,
    originalTransactionId?: string
  ): Promise<CreditResult> {
    try {
      if (amount <= 0) {
        return {
          success: false,
          newBalance: 0,
          transactionId: '',
          error: 'Refund amount must be positive',
        };
      }

      // Atomic transaction: add credits back + create refund record
      const [transaction, updatedUser] = await this.prisma.$transaction([
        this.prisma.transaction.create({
          data: {
            userId,
            type: 'REFUND',
            amount: amount, // Positive for refund (adding credits back)
            description: `Refund: ${reason}`,
            paymentId: originalTransactionId, // Link to original transaction
            paymentStatus: 'COMPLETED',
          },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: {
            credits: { increment: amount },
            totalCreditsSpent: { decrement: amount }, // Reduce spent count
          },
        }),
      ]);

      console.log(
        `[CreditService] Refunded ${amount} credits to user ${userId}. ` +
          `Reason: ${reason}. New balance: ${updatedUser.credits}. Transaction: ${transaction.id}`
      );

      return {
        success: true,
        newBalance: updatedUser.credits,
        transactionId: transaction.id,
      };
    } catch (error) {
      console.error('[CreditService] Error refunding credits:', error);
      return {
        success: false,
        newBalance: 0,
        transactionId: '',
        error: error instanceof Error ? error.message : 'Failed to refund credits',
      };
    }
  }

  /**
   * Add credits to user WITHOUT creating a transaction
   * Use this when updating an existing pending transaction to completed
   * Returns the new balance or null on failure
   */
  async addCreditsToUser(userId: string, amount: number): Promise<number | null> {
    try {
      if (amount <= 0) {
        console.error('[CreditService] addCreditsToUser: amount must be positive');
        return null;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: amount },
          totalCreditsEarned: { increment: amount },
        },
      });

      return updatedUser.credits;
    } catch (error) {
      console.error('[CreditService] Error adding credits to user:', error);
      return null;
    }
  }

  /**
   * Update existing transaction status (for payment completion)
   * Uses repository if available, falls back to Prisma
   */
  async updateTransactionStatus(
    paymentId: string,
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  ): Promise<boolean> {
    try {
      if (this.transactionRepository) {
        await this.transactionRepository.updateStatusByPaymentId(paymentId, status);
        return true;
      }
      // Fallback to direct Prisma
      await this.prisma.transaction.updateMany({
        where: { paymentId },
        data: { paymentStatus: status },
      });
      return true;
    } catch (error) {
      console.error('[CreditService] Error updating transaction status:', error);
      return false;
    }
  }

  /**
   * Get credit cost for a spread type
   */
  getSpreadCost(spreadType: string): number {
    const normalized = spreadType.toUpperCase() as keyof typeof CREDIT_COSTS.SPREAD;
    return CREDIT_COSTS.SPREAD[normalized] ?? 1;
  }
}

// Factory function to create service with dependencies
export function createCreditService(
  prisma: PrismaClient,
  userRepository?: IUserRepository,
  transactionRepository?: ITransactionRepository
): CreditService {
  return new CreditService(prisma, userRepository, transactionRepository);
}

// Singleton instance using the shared prisma client
export const creditService = new CreditService(prismaClient);

export { CreditService };
export default creditService;
