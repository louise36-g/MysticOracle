/**
 * CreateReading Use Case
 * Handles the business logic for creating a new tarot reading
 */

import { InterpretationStyle, Reading } from '@prisma/client';
import type { IReadingRepository, CardPosition } from '../../ports/repositories/IReadingRepository.js';
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
}

// Output DTO
export interface CreateReadingResult {
  success: boolean;
  reading?: Reading;
  error?: string;
  errorCode?: 'VALIDATION_ERROR' | 'USER_NOT_FOUND' | 'INSUFFICIENT_CREDITS' | 'INTERNAL_ERROR';
}

// Interpretation style mapping
const INTERPRETATION_STYLE_MAP: Record<string, InterpretationStyle> = {
  'classic': InterpretationStyle.CLASSIC,
  'spiritual': InterpretationStyle.SPIRITUAL,
  'psycho_emotional': InterpretationStyle.PSYCHO_EMOTIONAL,
  'numerology': InterpretationStyle.NUMEROLOGY,
  'elemental': InterpretationStyle.ELEMENTAL,
  'CLASSIC': InterpretationStyle.CLASSIC,
  'SPIRITUAL': InterpretationStyle.SPIRITUAL,
  'PSYCHO_EMOTIONAL': InterpretationStyle.PSYCHO_EMOTIONAL,
  'NUMEROLOGY': InterpretationStyle.NUMEROLOGY,
  'ELEMENTAL': InterpretationStyle.ELEMENTAL,
};

export class CreateReadingUseCase {
  constructor(
    private readingRepository: IReadingRepository,
    private userRepository: IUserRepository,
    private creditService: CreditService
  ) {}

  async execute(input: CreateReadingInput): Promise<CreateReadingResult> {
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
      const creditCost = spreadType.costValue;

      // 5. Check if user has sufficient credits
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
        // Use domain error for better error information
        const error = new InsufficientCreditsError(creditCost, balanceCheck.balance);
        return {
          success: false,
          error: error.message,
          errorCode: 'INSUFFICIENT_CREDITS',
        };
      }

      // 6. Create the reading
      const reading = await this.readingRepository.create({
        userId: input.userId,
        spreadType: spreadType.value, // Use Prisma enum value
        interpretationStyle,
        question: input.question,
        cards: input.cards,
        interpretation: input.interpretation,
        creditCost,
      });

      // 7. Deduct credits (handles transaction + audit logging)
      const deductResult = await this.creditService.deductCredits({
        userId: input.userId,
        amount: creditCost,
        type: 'READING',
        description: `${spreadType.name} reading`,
      });

      if (!deductResult.success) {
        // Reading was created but credit deduction failed
        // Log this for investigation but don't fail the request
        console.error(
          `[CreateReading] Credit deduction failed after reading creation: ${deductResult.error}`
        );
      }

      // 8. Update user's reading count
      await this.userRepository.update(input.userId, {
        totalReadings: (await this.userRepository.findById(input.userId))?.totalReadings ?? 0 + 1,
      });

      return {
        success: true,
        reading,
      };
    } catch (error) {
      console.error('[CreateReading] Error:', error);

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
