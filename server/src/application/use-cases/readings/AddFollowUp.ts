/**
 * AddFollowUp Use Case
 * Handles the business logic for adding a follow-up question to a reading
 *
 * CREDIT SAFETY: Uses deduct-first pattern
 * 1. Deduct credits BEFORE creating follow-up
 * 2. If follow-up creation fails, REFUND credits
 * 3. Never return success if credits weren't properly charged
 */

import { FollowUpQuestion } from '@prisma/client';
import type { IReadingRepository } from '../../ports/repositories/IReadingRepository.js';
import type { IUserRepository } from '../../ports/repositories/IUserRepository.js';
import type { CreditService } from '../../../services/CreditService.js';
import { CREDIT_COSTS } from '../../../services/CreditService.js';

// Input DTO
export interface AddFollowUpInput {
  userId: string;
  readingId: string;
  question: string;
  answer: string;
}

// Output DTO
export interface AddFollowUpResult {
  success: boolean;
  followUp?: FollowUpQuestion;
  error?: string;
  errorCode?: 'VALIDATION_ERROR' | 'READING_NOT_FOUND' | 'INSUFFICIENT_CREDITS' | 'CREDIT_DEDUCTION_FAILED' | 'INTERNAL_ERROR';
  transactionId?: string;
  refunded?: boolean;
}

export class AddFollowUpUseCase {
  constructor(
    private readingRepository: IReadingRepository,
    private userRepository: IUserRepository,
    private creditService: CreditService
  ) {}

  async execute(input: AddFollowUpInput): Promise<AddFollowUpResult> {
    let transactionId: string | undefined;
    const creditCost = CREDIT_COSTS.FOLLOW_UP;

    try {
      // 1. Validate input
      if (!input.question || input.question.trim().length === 0) {
        return {
          success: false,
          error: 'Question is required',
          errorCode: 'VALIDATION_ERROR',
        };
      }

      if (input.question.length > 1000) {
        return {
          success: false,
          error: 'Question must be 1000 characters or less',
          errorCode: 'VALIDATION_ERROR',
        };
      }

      // 2. Verify reading exists and belongs to user
      const reading = await this.readingRepository.findByIdAndUser(
        input.readingId,
        input.userId
      );

      if (!reading) {
        return {
          success: false,
          error: 'Reading not found',
          errorCode: 'READING_NOT_FOUND',
        };
      }

      // 3. Check if user has sufficient credits
      const balanceCheck = await this.creditService.checkSufficientCredits(
        input.userId,
        creditCost
      );

      if (!balanceCheck.sufficient) {
        return {
          success: false,
          error: `Insufficient credits: have ${balanceCheck.balance}, need ${creditCost}`,
          errorCode: 'INSUFFICIENT_CREDITS',
        };
      }

      // 4. DEDUCT CREDITS FIRST (before creating follow-up)
      const deductResult = await this.creditService.deductCredits({
        userId: input.userId,
        amount: creditCost,
        type: 'QUESTION',
        description: 'Follow-up question',
      });

      if (!deductResult.success) {
        console.error(
          `[AddFollowUp] Credit deduction failed: ${deductResult.error}`
        );
        return {
          success: false,
          error: deductResult.error || 'Failed to process credits',
          errorCode: 'CREDIT_DEDUCTION_FAILED',
        };
      }

      transactionId = deductResult.transactionId;

      // 5. Create the follow-up question (credits already deducted)
      let followUp: FollowUpQuestion;
      try {
        followUp = await this.readingRepository.addFollowUp({
          readingId: input.readingId,
          question: input.question,
          answer: input.answer,
          creditCost,
        });
      } catch (followUpError) {
        // Follow-up creation failed - REFUND the credits
        console.error(
          `[AddFollowUp] Follow-up creation failed, refunding ${creditCost} credits:`,
          followUpError
        );

        const refundResult = await this.creditService.refundCredits(
          input.userId,
          creditCost,
          'Follow-up creation failed',
          transactionId
        );

        if (!refundResult.success) {
          console.error(
            `[AddFollowUp] CRITICAL: Refund failed! User: ${input.userId}, Amount: ${creditCost}`
          );
        }

        return {
          success: false,
          error: 'Failed to save follow-up. Credits have been refunded.',
          errorCode: 'INTERNAL_ERROR',
          transactionId,
          refunded: refundResult.success,
        };
      }

      // 6. Update user's question count (non-critical)
      try {
        const user = await this.userRepository.findById(input.userId);
        if (user) {
          await this.userRepository.update(input.userId, {
            totalQuestions: (user.totalQuestions ?? 0) + 1,
          });
        }
      } catch (updateError) {
        console.warn('[AddFollowUp] Failed to update question count:', updateError);
      }

      return {
        success: true,
        followUp,
        transactionId,
      };
    } catch (error) {
      console.error('[AddFollowUp] Unexpected error:', error);

      // If we already deducted credits, try to refund
      if (transactionId) {
        const refundResult = await this.creditService.refundCredits(
          input.userId,
          creditCost,
          'Unexpected error during follow-up creation',
          transactionId
        );

        return {
          success: false,
          error: 'An unexpected error occurred. Credits have been refunded.',
          errorCode: 'INTERNAL_ERROR',
          transactionId,
          refunded: refundResult.success,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add follow-up question',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export default AddFollowUpUseCase;
