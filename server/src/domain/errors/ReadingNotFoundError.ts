/**
 * Reading Not Found Error
 * Thrown when a reading cannot be found
 */

import { DomainError } from './DomainError.js';

export class ReadingNotFoundError extends DomainError {
  readonly code = 'READING_NOT_FOUND';
  readonly readingId: string;

  constructor(readingId: string) {
    super(`Reading not found: ${readingId}`);
    this.readingId = readingId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      readingId: this.readingId,
    };
  }
}

export default ReadingNotFoundError;
