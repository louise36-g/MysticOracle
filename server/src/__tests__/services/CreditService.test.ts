/**
 * CreditService Tests
 * Unit tests for the CreditService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreditService, CREDIT_COSTS } from '../../services/CreditService.js';
import { createMockPrismaClient } from '../mocks/prisma.js';

describe('CreditService', () => {
  let creditService: CreditService;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    creditService = new CreditService(mockPrisma as any);
  });

  describe('getBalance', () => {
    it('should return user credits when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        credits: 50,
      } as any);

      const balance = await creditService.getBalance('user-1');

      expect(balance).toBe(50);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { credits: true },
      });
    });

    it('should return null when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const balance = await creditService.getBalance('non-existent');

      expect(balance).toBeNull();
    });
  });

  describe('checkSufficientCredits', () => {
    it('should return sufficient=true when user has enough credits', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        credits: 10,
      } as any);

      const result = await creditService.checkSufficientCredits('user-1', 5);

      expect(result.sufficient).toBe(true);
      expect(result.balance).toBe(10);
      expect(result.required).toBe(5);
    });

    it('should return sufficient=false when user has insufficient credits', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        credits: 3,
      } as any);

      const result = await creditService.checkSufficientCredits('user-1', 5);

      expect(result.sufficient).toBe(false);
      expect(result.balance).toBe(3);
      expect(result.required).toBe(5);
    });

    it('should return sufficient=false when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await creditService.checkSufficientCredits('non-existent', 5);

      expect(result.sufficient).toBe(false);
      expect(result.balance).toBe(0);
    });
  });

  describe('deductCredits', () => {
    it('should deduct credits successfully', async () => {
      // Mock balance check
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        credits: 10,
      } as any);

      // Mock transaction
      mockPrisma.$transaction.mockResolvedValue([
        { id: 'tx-1', amount: -5 },
        { id: 'user-1', credits: 5 },
      ]);

      const result = await creditService.deductCredits({
        userId: 'user-1',
        amount: 5,
        type: 'READING',
        description: 'Test reading',
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(5);
      expect(result.transactionId).toBe('tx-1');
    });

    it('should fail when amount is zero or negative', async () => {
      const result = await creditService.deductCredits({
        userId: 'user-1',
        amount: 0,
        type: 'READING',
        description: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('positive');
    });

    it('should fail when user has insufficient credits', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        credits: 3,
      } as any);

      const result = await creditService.deductCredits({
        userId: 'user-1',
        amount: 5,
        type: 'READING',
        description: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient');
    });
  });

  describe('addCredits', () => {
    it('should add credits successfully', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        { id: 'tx-1', amount: 10 },
        { id: 'user-1', credits: 20 },
      ]);

      const result = await creditService.addCredits({
        userId: 'user-1',
        amount: 10,
        type: 'PURCHASE',
        description: 'Test purchase',
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(20);
      expect(result.transactionId).toBe('tx-1');
    });

    it('should fail when amount is zero or negative', async () => {
      const result = await creditService.addCredits({
        userId: 'user-1',
        amount: -5,
        type: 'PURCHASE',
        description: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('positive');
    });
  });

  describe('getSpreadCost', () => {
    it('should return correct cost for SINGLE spread', () => {
      expect(creditService.getSpreadCost('SINGLE')).toBe(CREDIT_COSTS.SPREAD.SINGLE);
    });

    it('should return correct cost for CELTIC_CROSS spread', () => {
      expect(creditService.getSpreadCost('CELTIC_CROSS')).toBe(CREDIT_COSTS.SPREAD.CELTIC_CROSS);
    });

    it('should return default cost for unknown spread type', () => {
      expect(creditService.getSpreadCost('UNKNOWN')).toBe(1);
    });

    it('should handle lowercase spread types', () => {
      expect(creditService.getSpreadCost('single')).toBe(CREDIT_COSTS.SPREAD.SINGLE);
    });
  });

  describe('adjustCredits', () => {
    it('should add credits when amount is positive', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        { id: 'tx-1', amount: 10 },
        { id: 'user-1', credits: 30 },
      ]);

      const result = await creditService.adjustCredits('user-1', 10, 'Admin bonus');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(30);
    });

    it('should deduct credits when amount is negative', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        credits: 20,
      } as any);

      mockPrisma.$transaction.mockResolvedValue([
        { id: 'tx-1', amount: -5 },
        { id: 'user-1', credits: 15 },
      ]);

      const result = await creditService.adjustCredits('user-1', -5, 'Admin deduction');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(15);
    });

    it('should fail when amount is zero', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        credits: 20,
      } as any);

      const result = await creditService.adjustCredits('user-1', 0, 'Invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('zero');
    });
  });
});
