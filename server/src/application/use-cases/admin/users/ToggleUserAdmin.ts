/**
 * ToggleUserAdmin Use Case
 * Toggles a user's admin status
 */

import { User } from '@prisma/client';
import type { IUserRepository } from '../../../ports/repositories/IUserRepository.js';

export interface ToggleUserAdminInput {
  userId: string;
  isAdmin: boolean;
}

export interface ToggleUserAdminResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class ToggleUserAdminUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: ToggleUserAdminInput): Promise<ToggleUserAdminResult> {
    try {
      // Verify user exists
      const existingUser = await this.userRepository.findById(input.userId);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Update admin status
      const user = await this.userRepository.update(input.userId, {
        isAdmin: input.isAdmin,
      });

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('[ToggleUserAdmin] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update admin status',
      };
    }
  }
}

export default ToggleUserAdminUseCase;
