/**
 * GetReadingHistory Use Case
 * Handles the business logic for retrieving a user's reading history
 */

import type { IReadingRepository, ReadingWithFollowUps } from '../../ports/repositories/IReadingRepository.js';

// Input DTO
export interface GetReadingHistoryInput {
  userId: string;
  limit?: number;
  offset?: number;
}

// Output DTO
export interface GetReadingHistoryResult {
  success: boolean;
  readings?: ReadingWithFollowUps[];
  total?: number;
  error?: string;
  errorCode?: 'INTERNAL_ERROR';
}

export class GetReadingHistoryUseCase {
  constructor(private readingRepository: IReadingRepository) {}

  async execute(input: GetReadingHistoryInput): Promise<GetReadingHistoryResult> {
    try {
      const { userId, limit = 20, offset = 0 } = input;

      // 1. Get user's readings with follow-ups
      const readings = await this.readingRepository.findByUser(userId, {
        limit,
        offset,
      });

      // 2. Get total count for pagination
      const total = await this.readingRepository.countByUser(userId);

      return {
        success: true,
        readings,
        total,
      };
    } catch (error) {
      console.error('[GetReadingHistory] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get reading history',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export default GetReadingHistoryUseCase;
