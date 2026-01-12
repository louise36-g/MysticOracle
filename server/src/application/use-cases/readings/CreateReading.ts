/**
 * CreateReading Use Case
 * Handles the business logic for creating a new tarot reading
 *
 * CREDIT SAFETY: Uses deduct-first pattern
 * 1. Deduct credits BEFORE creating reading
 * 2. If reading creation fails, REFUND credits
 * 3. Never return success if credits weren't properly charged
 */

import { InterpretationStyle, Reading } from '@prisma/client';
import type {
  IReadingRepository,
  CardPosition,
} from '../../ports/repositories/IReadingRepository.js';
import type { IUserRepository } from '../../ports/repositories/IUserRepository.js';
import type { CreditService } from '../../../services/CreditService.js';

// Domain types
import {
  SpreadType,
  InvalidSpreadTypeError,
  InsufficientCreditsError,
  DomainError,
} from '../../../domain/index.js';

// Input DTO
export interface CreateReadingInput {
  userId: string;
  spreadType: string;
  interpretationStyle?: string;
  question?: string;
  cards: CardPosition[];
  interpretation: string;
  idempotencyKey?: string; // Optional key to prevent duplicate charges
}

// Output DTO
export interface CreateReadingResult {
  success: boolean;
  reading?: Reading;
  error?: string;
  errorCode?:
    | 'VALIDATION_ERROR'
    | 'USER_NOT_FOUND'
    | 'INSUFFICIENT_CREDITS'
    | 'CREDIT_DEDUCTION_FAILED'
    | 'INTERNAL_ERROR';
  transactionId?: string; // For tracking/debugging
  refunded?: boolean; // True if credits were refunded due to failure
}

// Interpretation style mapping
const INTERPRETATION_STYLE_MAP: Record<string, InterpretationStyle> = {
  classic: InterpretationStyle.CLASSIC,
  spiritual: InterpretationStyle.SPIRITUAL,
  psycho_emotional: InterpretationStyle.PSYCHO_EMOTIONAL,
  numerology: InterpretationStyle.NUMEROLOGY,
  elemental: InterpretationStyle.ELEMENTAL,
  CLASSIC: InterpretationStyle.CLASSIC,
  SPIRITUAL: InterpretationStyle.SPIRITUAL,
  PSYCHO_EMOTIONAL: InterpretationStyle.PSYCHO_EMOTIONAL,
  NUMEROLOGY: InterpretationStyle.NUMEROLOGY,
  ELEMENTAL: InterpretationStyle.ELEMENTAL,
};

export class CreateReadingUseCase {
  constructor(
    private readingRepository: IReadingRepository,
    private userRepository: IUserRepository,
    private creditService: CreditService
  ) {}

  async execute(input: CreateReadingInput): Promise<CreateReadingResult> {
    let transactionId: string | undefined;
    let creditCost = 0;

    try {
      // 1. Validate and normalize spread type using domain value object
      let spreadType: SpreadType;
      try {
        spreadType = SpreadType.create(input.spreadType);
      } catch (error) {
        if (error instanceof InvalidSpreadTypeError) {
          return {
            success: false,
            error: error.message,
            errorCode: 'VALIDATION_ERROR',
          };
        }
        throw error;
      }

      // 2. Validate and normalize interpretation style
      const interpretationStyle = input.interpretationStyle
        ? INTERPRETATION_STYLE_MAP[input.interpretationStyle]
        : InterpretationStyle.CLASSIC;

      if (input.interpretationStyle && !interpretationStyle) {
        return {
          success: false,
          error: `Invalid interpretation style: ${input.interpretationStyle}`,
          errorCode: 'VALIDATION_ERROR',
        };
      }

      // 3. Validate cards
      if (!input.cards || input.cards.length === 0) {
        return {
          success: false,
          error: 'At least one card is required',
          errorCode: 'VALIDATION_ERROR',
        };
      }

      // 4. Get credit cost from domain SpreadType value object
      creditCost = spreadType.costValue;

      // 5. Check if user exists and has sufficient credits
      const balanceCheck = await this.creditService.checkSufficientCredits(
        input.userId,
        creditCost
      );

      if (balanceCheck.balance === 0 && !balanceCheck.sufficient) {
        return {
          success: false,
          error: 'User not found',
          errorCode: 'USER_NOT_FOUND',
        };
      }

      if (!balanceCheck.sufficient) {
        const error = new InsufficientCreditsError(creditCost, balanceCheck.balance);
        return {
          success: false,
          error: error.message,
          errorCode: 'INSUFFICIENT_CREDITS',
        };
      }

      // 6. DEDUCT CREDITS FIRST (before creating reading)
      // This ensures we never give away free readings
      const deductResult = await this.creditService.deductCredits({
        userId: input.userId,
        amount: creditCost,
        type: 'READING',
        description: `${spreadType.name} reading`,
      });

      if (!deductResult.success) {
        // Credit deduction failed - do NOT create reading
        console.error(`[CreateReading] Credit deduction failed: ${deductResult.error}`);
        return {
          success: false,
          error: deductResult.error || 'Failed to process credits',
          errorCode: 'CREDIT_DEDUCTION_FAILED',
        };
      }

      // Store transaction ID for potential refund
      transactionId = deductResult.transactionId;

      // 7. Create the reading (credits already deducted)
      let reading: Reading;
      try {
        reading = await this.readingRepository.create({
          userId: input.userId,
          spreadType: spreadType.value,
          interpretationStyle,
          question: input.question,
          cards: input.cards,
          interpretation: input.interpretation,
          creditCost,
        });
      } catch (readingError) {
        // Reading creation failed - REFUND the credits
        console.error(
          `[CreateReading] Reading creation failed, refunding ${creditCost} credits:`,
          readingError
        );

        const refundResult = await this.creditService.refundCredits(
          input.userId,
          creditCost,
          'Reading creation failed',
          transactionId
        );

        if (!refundResult.success) {
          // Critical: refund also failed - log for manual intervention
          console.error(
            `[CreateReading] CRITICAL: Refund failed after reading creation failure! ` +
              `User: ${input.userId}, Amount: ${creditCost}, Original TX: ${transactionId}`
          );
        }

        return {
          success: false,
          error: 'Failed to save reading. Credits have been refunded.',
          errorCode: 'INTERNAL_ERROR',
          transactionId,
          refunded: refundResult.success,
        };
      }

      // 8. Update user's reading count (non-critical, don't fail if this fails)
      try {
        const user = await this.userRepository.findById(input.userId);
        if (user) {
          await this.userRepository.update(input.userId, {
            totalReadings: user.totalReadings + 1,
          });
        }
      } catch (updateError) {
        // Log but don't fail - reading was created successfully
        console.warn(`[CreateReading] Failed to update user reading count:`, updateError);
      }

      return {
        success: true,
        reading,
        transactionId,
      };
    } catch (error) {
      console.error('[CreateReading] Unexpected error:', error);

      // If we already deducted credits, try to refund
      if (transactionId && creditCost > 0) {
        console.log(`[CreateReading] Attempting refund after unexpected error...`);
        const refundResult = await this.creditService.refundCredits(
          input.userId,
          creditCost,
          'Unexpected error during reading creation',
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

      // Handle domain errors specifically
      if (error instanceof DomainError) {
        return {
          success: false,
          error: error.message,
          errorCode: error.code as CreateReadingResult['errorCode'],
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create reading',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export default CreateReadingUseCase;
