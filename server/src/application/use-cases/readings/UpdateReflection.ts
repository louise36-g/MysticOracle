/**
 * UpdateReflection Use Case
 * Handles the business logic for updating a reading's user reflection
 */

import { Reading } from '@prisma/client';
import type { IReadingRepository } from '../../ports/repositories/IReadingRepository.js';

// Input DTO
export interface UpdateReflectionInput {
  userId: string;
  readingId: string;
  userReflection: string;
}

// Output DTO
export interface UpdateReflectionResult {
  success: boolean;
  reading?: Reading;
  error?: string;
  errorCode?: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR';
}

export class UpdateReflectionUseCase {
  constructor(private readingRepository: IReadingRepository) {}

  async execute(input: UpdateReflectionInput): Promise<UpdateReflectionResult> {
    try {
      // 1. Validate input
      if (input.userReflection && input.userReflection.length > 1000) {
        return {
          success: false,
          error: 'Reflection must be 1000 characters or less',
          errorCode: 'VALIDATION_ERROR',
        };
      }

      // 2. Verify reading exists and belongs to user
      const reading = await this.readingRepository.findByIdAndUser(input.readingId, input.userId);

      if (!reading) {
        return {
          success: false,
          error: 'Reading not found',
          errorCode: 'NOT_FOUND',
        };
      }

      // 3. Update the reading with reflection
      const updatedReading = await this.readingRepository.update(input.readingId, {
        userReflection: input.userReflection,
      });

      return {
        success: true,
        reading: updatedReading,
      };
    } catch (error) {
      console.error('[UpdateReflection] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update reflection',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export default UpdateReflectionUseCase;
