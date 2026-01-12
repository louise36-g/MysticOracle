/**
 * User Not Found Error
 * Thrown when a user cannot be found
 */

import { DomainError } from './DomainError.js';

export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';
  readonly userId: string;

  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.userId = userId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      userId: this.userId,
    };
  }
}

export default UserNotFoundError;
