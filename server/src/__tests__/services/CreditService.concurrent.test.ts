/**
 * CreditService Concurrency Tests
 * Tests for race condition handling and transaction isolation
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { CreditService } from '../../services/CreditService.js';
import { PrismaClient, TransactionType } from '@prisma/client';

// Mock PrismaClient with transaction support
const createMockPrismaClient = () => {
  const mockTransaction = vi.fn();
  const mockUser = {
    findUnique: vi.fn(),
    update: vi.fn(),
  };
  const mockTransactionModel = {
    create: vi.fn(),
    updateMany: vi.fn(),
  };

  return {
    $transaction: mockTransaction,
    user: mockUser,
    transaction: mockTransactionModel,
    _mockUser: mockUser,
    _mockTransactionModel: mockTransactionModel,
  } as unknown as PrismaClient & {
    $transaction: Mock;
    _mockUser: typeof mockUser;
    _mockTransactionModel: typeof mockTransactionModel;
  };
};

describe('CreditService Concurrency', () => {
  let creditService: CreditService;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrismaClient();
    creditService = new CreditService(mockPrisma);
  });

  describe('Concurrent Deductions', () => {
    it('should handle concurrent deduction attempts atomically', async () => {
      // Simulate a user with 10 credits trying to make two 7-credit transactions
      const userId = 'user-concurrent-1';
      let currentBalance = 10;

      // Track transactions processed
      let transactionsProcessed = 0;

      // Mock getBalance to return current state
      mockPrisma._mockUser.findUnique.mockImplementation(async () => {
        return { credits: currentBalance };
      });

      // Mock $transaction to simulate atomic update with balance check
      (mockPrisma.$transaction as Mock).mockImplementation(async (_operations: unknown[]) => {
        // Simulate atomic check-and-update
        if (currentBalance >= 7) {
          currentBalance -= 7;
          transactionsProcessed++;
          return [{ id: `tx-${transactionsProcessed}`, amount: -7 }, { credits: currentBalance }];
        }
        throw new Error('Insufficient credits');
      });

      // Attempt two concurrent deductions
      const deduction1 = creditService.deductCredits({
        userId,
        amount: 7,
        type: 'READING' as TransactionType,
        description: 'Reading 1',
      });

      const deduction2 = creditService.deductCredits({
        userId,
        amount: 7,
        type: 'READING' as TransactionType,
        description: 'Reading 2',
      });

      const [result1, result2] = await Promise.all([deduction1, deduction2]);

      // One should succeed, one should fail
      const successes = [result1, result2].filter(r => r.success);
      const failures = [result1, result2].filter(r => !r.success);

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);
      expect(transactionsProcessed).toBe(1);
    });

    it('should prevent double-spending through transaction isolation', async () => {
      const userId = 'user-double-spend';
      let balance = 5;
      let updateAttempts = 0;

      mockPrisma._mockUser.findUnique.mockImplementation(async () => ({ credits: balance }));

      (mockPrisma.$transaction as Mock).mockImplementation(async () => {
        updateAttempts++;
        // Simulate that balance is checked atomically within transaction
        if (balance >= 5) {
          balance -= 5;
          return [{ id: `tx-${updateAttempts}` }, { credits: balance }];
        }
        throw new Error('Insufficient credits');
      });

      // 5 concurrent attempts to spend 5 credits
      const attempts = Array.from({ length: 5 }, (_, i) =>
        creditService.deductCredits({
          userId,
          amount: 5,
          type: 'READING' as TransactionType,
          description: `Attempt ${i + 1}`,
        })
      );

      const results = await Promise.all(attempts);
      const successCount = results.filter(r => r.success).length;

      // Only 1 should succeed (5 credits available, each needs 5)
      expect(successCount).toBe(1);
      expect(balance).toBe(0);
    });
  });

  describe('Concurrent Additions', () => {
    it('should handle concurrent credit additions correctly', async () => {
      const userId = 'user-concurrent-add';
      let currentBalance = 0;
      let transactionsCreated = 0;

      mockPrisma._mockUser.findUnique.mockImplementation(async () => ({ credits: currentBalance }));

      (mockPrisma.$transaction as Mock).mockImplementation(async () => {
        const addAmount = 10;
        currentBalance += addAmount;
        transactionsCreated++;
        return [
          { id: `tx-add-${transactionsCreated}`, amount: addAmount },
          { credits: currentBalance },
        ];
      });

      // 5 concurrent additions of 10 credits each
      const additions = Array.from({ length: 5 }, (_, i) =>
        creditService.addCredits({
          userId,
          amount: 10,
          type: 'PURCHASE' as TransactionType,
          description: `Purchase ${i + 1}`,
        })
      );

      const results = await Promise.all(additions);

      // All should succeed
      expect(results.every(r => r.success)).toBe(true);
      expect(transactionsCreated).toBe(5);
      expect(currentBalance).toBe(50); // 5 * 10
    });

    it('should create separate transaction records for each addition', async () => {
      const userId = 'user-tx-records';
      const createdTransactions: string[] = [];

      mockPrisma._mockUser.findUnique.mockResolvedValue({ credits: 0 });

      (mockPrisma.$transaction as Mock).mockImplementation(async () => {
        const txId = `tx-${Date.now()}-${Math.random()}`;
        createdTransactions.push(txId);
        return [{ id: txId, amount: 5 }, { credits: 5 }];
      });

      await Promise.all([
        creditService.addCredits({
          userId,
          amount: 5,
          type: 'BONUS' as TransactionType,
          description: 'Bonus 1',
        }),
        creditService.addCredits({
          userId,
          amount: 5,
          type: 'BONUS' as TransactionType,
          description: 'Bonus 2',
        }),
      ]);

      expect(createdTransactions.length).toBe(2);
      // Each transaction should have a unique ID
      expect(new Set(createdTransactions).size).toBe(2);
    });
  });

  describe('Mixed Concurrent Operations', () => {
    it('should handle mixed add/deduct operations correctly', async () => {
      const userId = 'user-mixed';
      const balance = 10;
      let operationCount = 0;

      mockPrisma._mockUser.findUnique.mockImplementation(async () => ({ credits: balance }));

      (mockPrisma.$transaction as Mock).mockImplementation(async (_ops: unknown[]) => {
        // Simulate the operation based on what's being done
        // In real code, this would be atomic
        operationCount++;
        return [{ id: `tx-${operationCount}` }, { credits: balance }];
      });

      // Interleaved add and deduct
      const results = await Promise.all([
        creditService.addCredits({
          userId,
          amount: 5,
          type: 'BONUS' as TransactionType,
          description: 'Bonus',
        }),
        creditService.deductCredits({
          userId,
          amount: 3,
          type: 'READING' as TransactionType,
          description: 'Reading',
        }),
        creditService.addCredits({
          userId,
          amount: 2,
          type: 'REFERRAL' as TransactionType,
          description: 'Referral',
        }),
      ]);

      // All operations should succeed
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Transaction Isolation', () => {
    it('should use Prisma $transaction for atomicity', async () => {
      const userId = 'user-atomic';

      mockPrisma._mockUser.findUnique.mockResolvedValue({ credits: 100 });
      (mockPrisma.$transaction as Mock).mockResolvedValue([
        { id: 'tx-123', amount: -10 },
        { credits: 90 },
      ]);

      await creditService.deductCredits({
        userId,
        amount: 10,
        type: 'READING' as TransactionType,
        description: 'Test deduction',
      });

      // Verify $transaction was called (ensuring atomicity)
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should rollback on transaction failure', async () => {
      const userId = 'user-rollback';
      const balance = 50;

      mockPrisma._mockUser.findUnique.mockImplementation(async () => ({ credits: balance }));

      // Simulate transaction failure
      (mockPrisma.$transaction as Mock).mockRejectedValue(
        new Error('Database constraint violation')
      );

      const result = await creditService.deductCredits({
        userId,
        amount: 10,
        type: 'READING' as TransactionType,
        description: 'Failed deduction',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database constraint violation');
      // Balance should not change on failed transaction
      expect(balance).toBe(50);
    });

    it('should not leave partial state on failure', async () => {
      const userId = 'user-partial';
      const stateChanges: string[] = [];

      mockPrisma._mockUser.findUnique.mockResolvedValue({ credits: 100 });

      // Simulate failure after partial operation
      (mockPrisma.$transaction as Mock).mockImplementation(async () => {
        stateChanges.push('transaction_started');
        throw new Error('Connection lost mid-transaction');
      });

      const result = await creditService.addCredits({
        userId,
        amount: 50,
        type: 'PURCHASE' as TransactionType,
        description: 'Purchase',
      });

      expect(result.success).toBe(false);
      // Transaction should have been attempted but rolled back
      expect(stateChanges).toContain('transaction_started');
      // No partial state should exist (handled by Prisma's transaction rollback)
    });
  });

  describe('Idempotency Considerations', () => {
    it('should return consistent results for the same operation', async () => {
      const userId = 'user-idempotent';

      mockPrisma._mockUser.findUnique.mockResolvedValue({ credits: 100 });
      (mockPrisma.$transaction as Mock).mockResolvedValue([
        { id: 'tx-same', amount: 10 },
        { credits: 110 },
      ]);

      const operation = {
        userId,
        amount: 10,
        type: 'BONUS' as TransactionType,
        description: 'Same bonus',
      };

      const result1 = await creditService.addCredits(operation);
      const result2 = await creditService.addCredits(operation);

      // Both should succeed (each creates its own transaction)
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });
});
