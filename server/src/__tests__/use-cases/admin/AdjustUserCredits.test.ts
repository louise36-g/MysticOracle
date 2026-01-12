/**
 * AdjustUserCredits Use Case Tests
 * Tests admin credit adjustment functionality with audit trail
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { AdjustUserCreditsUseCase, type AdjustUserCreditsInput } from '../../../application/use-cases/admin/users/AdjustUserCredits.js';
import type { IUserRepository } from '../../../application/ports/repositories/IUserRepository.js';
import type { CreditService } from '../../../services/CreditService.js';

const createMockUserRepository = (): IUserRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByClerkId: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
});

const createMockCreditService = (): CreditService => ({
  checkSufficientCredits: vi.fn(),
  deductCredits: vi.fn(),
  addCredits: vi.fn(),
  refundCredits: vi.fn(),
  getBalance: vi.fn(),
  adjustCredits: vi.fn(),
} as unknown as CreditService);

describe('AdjustUserCreditsUseCase', () => {
  let useCase: AdjustUserCreditsUseCase;
  let mockUserRepo: IUserRepository;
  let mockCreditService: CreditService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    credits: 50,
  };

  const validInput: AdjustUserCreditsInput = {
    userId: 'user-123',
    amount: 25,
    reason: 'Bonus for bug report',
    adminUserId: 'admin-456',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRepo = createMockUserRepository();
    mockCreditService = createMockCreditService();
    useCase = new AdjustUserCreditsUseCase(mockUserRepo, mockCreditService);
  });

  describe('User Verification', () => {
    it('should return error when user is not found', async () => {
      (mockUserRepo.findById as Mock).mockResolvedValue(null);

      const result = await useCase.execute(validInput);

      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('Balance Retrieval', () => {
    beforeEach(() => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
    });

    it('should return error when balance cannot be retrieved', async () => {
      (mockCreditService.getBalance as Mock).mockResolvedValue(null);

      const result = await useCase.execute(validInput);

      expect(mockCreditService.getBalance).toHaveBeenCalledWith('user-123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Could not retrieve user balance');
    });
  });

  describe('Credit Adjustment - Adding Credits', () => {
    beforeEach(() => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
      (mockCreditService.getBalance as Mock).mockResolvedValue(50);
    });

    it('should add credits successfully', async () => {
      (mockCreditService.adjustCredits as Mock).mockResolvedValue({
        success: true,
        newBalance: 75,
        transactionId: 'tx-789',
      });

      const result = await useCase.execute(validInput);

      expect(mockCreditService.adjustCredits).toHaveBeenCalledWith(
        'user-123',
        25,
        'Bonus for bug report'
      );
      expect(result).toEqual({
        success: true,
        previousBalance: 50,
        newBalance: 75,
        transactionId: 'tx-789',
      });
    });

    it('should handle large credit additions', async () => {
      const largeInput = { ...validInput, amount: 10000 };
      (mockCreditService.adjustCredits as Mock).mockResolvedValue({
        success: true,
        newBalance: 10050,
        transactionId: 'tx-large',
      });

      const result = await useCase.execute(largeInput);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(10050);
    });
  });

  describe('Credit Adjustment - Deducting Credits', () => {
    beforeEach(() => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
      (mockCreditService.getBalance as Mock).mockResolvedValue(50);
    });

    it('should deduct credits with negative amount', async () => {
      const deductInput = { ...validInput, amount: -20, reason: 'Fraudulent activity refund' };
      (mockCreditService.adjustCredits as Mock).mockResolvedValue({
        success: true,
        newBalance: 30,
        transactionId: 'tx-deduct',
      });

      const result = await useCase.execute(deductInput);

      expect(mockCreditService.adjustCredits).toHaveBeenCalledWith(
        'user-123',
        -20,
        'Fraudulent activity refund'
      );
      expect(result.previousBalance).toBe(50);
      expect(result.newBalance).toBe(30);
    });

    it('should return error if credit service fails to deduct', async () => {
      const deductInput = { ...validInput, amount: -100 };
      (mockCreditService.adjustCredits as Mock).mockResolvedValue({
        success: false,
        error: 'Insufficient credits to deduct',
      });

      const result = await useCase.execute(deductInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient credits to deduct');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
      (mockCreditService.getBalance as Mock).mockResolvedValue(50);
    });

    it('should handle credit service errors', async () => {
      (mockCreditService.adjustCredits as Mock).mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle adjustCredits returning success:false without error message', async () => {
      (mockCreditService.adjustCredits as Mock).mockResolvedValue({
        success: false,
      });

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to adjust credits');
    });

    it('should handle unexpected exceptions', async () => {
      (mockCreditService.adjustCredits as Mock).mockRejectedValue(
        new Error('Unexpected database error')
      );

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected database error');
    });

    it('should handle non-Error exceptions', async () => {
      (mockCreditService.adjustCredits as Mock).mockRejectedValue('String error');

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to adjust credits');
    });
  });

  describe('Return Values', () => {
    beforeEach(() => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
      (mockCreditService.getBalance as Mock).mockResolvedValue(50);
      (mockCreditService.adjustCredits as Mock).mockResolvedValue({
        success: true,
        newBalance: 75,
        transactionId: 'tx-audit',
      });
    });

    it('should return previous and new balance on success', async () => {
      const result = await useCase.execute(validInput);

      expect(result.previousBalance).toBe(50);
      expect(result.newBalance).toBe(75);
    });

    it('should return transaction ID for audit trail', async () => {
      const result = await useCase.execute(validInput);

      expect(result.transactionId).toBe('tx-audit');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      (mockUserRepo.findById as Mock).mockResolvedValue(mockUser);
    });

    it('should handle zero balance user', async () => {
      (mockCreditService.getBalance as Mock).mockResolvedValue(0);
      (mockCreditService.adjustCredits as Mock).mockResolvedValue({
        success: true,
        newBalance: 25,
        transactionId: 'tx-zero',
      });

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.previousBalance).toBe(0);
      expect(result.newBalance).toBe(25);
    });

    it('should handle zero amount adjustment', async () => {
      (mockCreditService.getBalance as Mock).mockResolvedValue(50);
      const zeroInput = { ...validInput, amount: 0, reason: 'Test adjustment' };
      (mockCreditService.adjustCredits as Mock).mockResolvedValue({
        success: true,
        newBalance: 50,
        transactionId: 'tx-zero-adj',
      });

      const result = await useCase.execute(zeroInput);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(50);
    });
  });
});
