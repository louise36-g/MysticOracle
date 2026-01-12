/**
 * GetReading Use Case
 * Handles the business logic for retrieving a specific reading
 */

import type {
  IReadingRepository,
  ReadingWithFollowUps,
} from '../../ports/repositories/IReadingRepository.js';

// Input DTO
export interface GetReadingInput {
  userId: string;
  readingId: string;
}

// Output DTO
export interface GetReadingResult {
  success: boolean;
  reading?: ReadingWithFollowUps;
  error?: string;
  errorCode?: 'NOT_FOUND' | 'INTERNAL_ERROR';
}

export class GetReadingUseCase {
  constructor(private readingRepository: IReadingRepository) {}

  async execute(input: GetReadingInput): Promise<GetReadingResult> {
    try {
      // 1. Verify reading exists and belongs to user
      const reading = await this.readingRepository.findByIdAndUser(input.readingId, input.userId);

      if (!reading) {
        return {
          success: false,
          error: 'Reading not found',
          errorCode: 'NOT_FOUND',
        };
      }

      // 2. Get full reading with follow-ups
      const readingWithFollowUps = await this.readingRepository.findByIdWithFollowUps(
        input.readingId
      );

      if (!readingWithFollowUps) {
        return {
          success: false,
          error: 'Reading not found',
          errorCode: 'NOT_FOUND',
        };
      }

      return {
        success: true,
        reading: readingWithFollowUps,
      };
    } catch (error) {
      console.error('[GetReading] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get reading',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export default GetReadingUseCase;
