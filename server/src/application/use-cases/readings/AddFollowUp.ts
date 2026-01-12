/**
 * AddFollowUp Use Case
 * Handles the business logic for adding a follow-up question to a reading
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
  errorCode?: 'VALIDATION_ERROR' | 'READING_NOT_FOUND' | 'INSUFFICIENT_CREDITS' | 'INTERNAL_ERROR';
}

export class AddFollowUpUseCase {
  constructor(
    private readingRepository: IReadingRepository,
    private userRepository: IUserRepository,
    private creditService: CreditService
  ) {}

  async execute(input: AddFollowUpInput): Promise<AddFollowUpResult> {
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

      // 2. Get credit cost (server-side constant)
      const creditCost = CREDIT_COSTS.FOLLOW_UP;

      // 3. Verify reading exists and belongs to user
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

      // 4. Check if user has sufficient credits
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

      // 5. Create the follow-up question
      const followUp = await this.readingRepository.addFollowUp({
        readingId: input.readingId,
        question: input.question,
        answer: input.answer,
        creditCost,
      });

      // 6. Deduct credits
      const deductResult = await this.creditService.deductCredits({
        userId: input.userId,
        amount: creditCost,
        type: 'QUESTION',
        description: 'Follow-up question',
      });

      if (!deductResult.success) {
        console.error(
          `[AddFollowUp] Credit deduction failed after follow-up creation: ${deductResult.error}`
        );
      }

      // 7. Update user's question count
      const user = await this.userRepository.findById(input.userId);
      if (user) {
        await this.userRepository.update(input.userId, {
          totalQuestions: (user.totalQuestions ?? 0) + 1,
        });
      }

      return {
        success: true,
        followUp,
      };
    } catch (error) {
      console.error('[AddFollowUp] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add follow-up question',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export default AddFollowUpUseCase;
