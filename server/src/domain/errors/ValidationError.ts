/**
 * Validation Error
 * Thrown when input validation fails
 */

import { DomainError } from './DomainError.js';

export interface ValidationIssue {
  field: string;
  message: string;
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    const message = issues.map(i => `${i.field}: ${i.message}`).join('; ');
    super(`Validation failed: ${message}`);
    this.issues = issues;
  }

  static fromField(field: string, message: string): ValidationError {
    return new ValidationError([{ field, message }]);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      issues: this.issues,
    };
  }
}

export default ValidationError;
