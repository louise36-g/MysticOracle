/**
 * UpdateUserStatus Use Case
 * Updates a user's account status (ACTIVE, FLAGGED, SUSPENDED)
 */

import { AccountStatus, User } from '@prisma/client';
import type { IUserRepository } from '../../../ports/repositories/IUserRepository.js';

export interface UpdateUserStatusInput {
  userId: string;
  status: AccountStatus;
}

export interface UpdateUserStatusResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class UpdateUserStatusUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: UpdateUserStatusInput): Promise<UpdateUserStatusResult> {
    try {
      // Verify user exists
      const existingUser = await this.userRepository.findById(input.userId);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Update status
      const user = await this.userRepository.update(input.userId, {
        accountStatus: input.status,
      });

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('[UpdateUserStatus] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user status',
      };
    }
  }
}

export default UpdateUserStatusUseCase;
