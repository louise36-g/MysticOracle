/**
 * DeleteUserAccount Use Case
 * GDPR Article 17 - Right to erasure ("Right to be forgotten")
 * Anonymizes user data while preserving aggregated analytics
 */

import { PrismaClient } from '@prisma/client';
import type { IUserRepository } from '../../ports/repositories/IUserRepository.js';

export interface DeleteUserAccountInput {
  userId: string;
  confirmEmail: string; // User must confirm their email for safety
}

export interface DeleteUserAccountResult {
  success: boolean;
  message?: string;
  error?: string;
  errorCode?: 'USER_NOT_FOUND' | 'EMAIL_MISMATCH' | 'ADMIN_PROTECTED' | 'INTERNAL_ERROR';
}

export class DeleteUserAccountUseCase {
  constructor(
    private prisma: PrismaClient,
    private userRepository: IUserRepository
  ) {}

  async execute(input: DeleteUserAccountInput): Promise<DeleteUserAccountResult> {
    try {
      // 1. Verify user exists
      const user = await this.userRepository.findById(input.userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          errorCode: 'USER_NOT_FOUND',
        };
      }

      // 2. Verify email confirmation matches
      if (user.email.toLowerCase() !== input.confirmEmail.toLowerCase()) {
        return {
          success: false,
          error: 'Email confirmation does not match your account email',
          errorCode: 'EMAIL_MISMATCH',
        };
      }

      // 3. Prevent admin self-deletion (admins must be demoted first)
      if (user.isAdmin) {
        return {
          success: false,
          error: 'Admin accounts cannot be deleted. Please contact support or remove admin status first.',
          errorCode: 'ADMIN_PROTECTED',
        };
      }

      // 4. Perform deletion in a transaction (atomicity)
      const timestamp = Date.now();
      const anonymizedEmail = `deleted_${timestamp}@deleted.local`;
      const anonymizedUsername = `deleted_${timestamp}`;

      await this.prisma.$transaction(async (tx) => {
        // 4a. Anonymize readings - preserve for analytics, remove PII
        await tx.reading.updateMany({
          where: { userId: input.userId },
          data: {
            question: '[DELETED]',
            userReflection: null,
          },
        });

        // 4b. Anonymize follow-up questions
        await tx.followUpQuestion.updateMany({
          where: { reading: { userId: input.userId } },
          data: {
            question: '[DELETED]',
          },
        });

        // 4c. Delete horoscope cache (not needed after deletion)
        await tx.horoscopeCache.deleteMany({
          where: { userId: input.userId },
        });

        // 4d. Delete horoscope Q&A associated with user's horoscopes
        // (cascade handles this via HoroscopeCache deletion)

        // 4e. Delete achievements (no analytical value)
        await tx.userAchievement.deleteMany({
          where: { userId: input.userId },
        });

        // 4f. Anonymize user record
        // Keep the record for referral integrity and transaction history
        await tx.user.update({
          where: { id: input.userId },
          data: {
            email: anonymizedEmail,
            username: anonymizedUsername,
            accountStatus: 'SUSPENDED',
            credits: 0,
            loginStreak: 0,
            totalCreditsEarned: 0,
            totalCreditsSpent: 0,
            welcomeCompleted: false,
          },
        });
      });

      console.log(`[DeleteUserAccount] User ${input.userId} data anonymized successfully`);

      return {
        success: true,
        message: 'Your account data has been anonymized and your account has been deactivated. This action cannot be undone.',
      };
    } catch (error) {
      console.error('[DeleteUserAccount] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete account',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export default DeleteUserAccountUseCase;
