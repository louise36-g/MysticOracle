/**
 * AdjustUserCredits Use Case
 * Adjusts a user's credit balance (add or subtract) with audit logging
 */

import type { IUserRepository } from '../../../ports/repositories/IUserRepository.js';
import type { CreditService } from '../../../../services/CreditService.js';

export interface AdjustUserCreditsInput {
  userId: string;
  amount: number;
  reason: string;
  adminUserId: string;
}

export interface AdjustUserCreditsResult {
  success: boolean;
  previousBalance?: number;
  newBalance?: number;
  transactionId?: string;
  error?: string;
}

export class AdjustUserCreditsUseCase {
  constructor(
    private userRepository: IUserRepository,
    private creditService: CreditService
  ) {}

  async execute(input: AdjustUserCreditsInput): Promise<AdjustUserCreditsResult> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Get current balance
      const previousBalance = await this.creditService.getBalance(input.userId);
      if (previousBalance === null) {
        return {
          success: false,
          error: 'Could not retrieve user balance',
        };
      }

      // Perform the adjustment
      const result = await this.creditService.adjustCredits(
        input.userId,
        input.amount,
        input.reason
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to adjust credits',
        };
      }

      return {
        success: true,
        previousBalance,
        newBalance: result.newBalance,
        transactionId: result.transactionId,
      };
    } catch (error) {
      console.error('[AdjustUserCredits] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to adjust credits',
      };
    }
  }
}

export default AdjustUserCreditsUseCase;
