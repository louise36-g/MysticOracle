/**
 * Insufficient Credits Error
 * Thrown when a user doesn't have enough credits for an operation
 */

import { DomainError } from './DomainError.js';

export class InsufficientCreditsError extends DomainError {
  readonly code = 'INSUFFICIENT_CREDITS';
  readonly required: number;
  readonly available: number;

  constructor(required: number, available: number) {
    super(`Insufficient credits: required ${required}, available ${available}`);
    this.required = required;
    this.available = available;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      required: this.required,
      available: this.available,
    };
  }
}

export default InsufficientCreditsError;
