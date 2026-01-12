/**
 * Domain Layer
 * Export all domain types, entities, value objects, and errors
 */

// Errors
export {
  DomainError,
  InsufficientCreditsError,
  InvalidSpreadTypeError,
  UserNotFoundError,
  ReadingNotFoundError,
  ValidationError,
  type ValidationIssue,
} from './errors/index.js';

// Value Objects
export { CreditAmount, SpreadType } from './value-objects/index.js';

// Entities
export {
  Reading,
  type CardPosition,
  type FollowUpQuestion,
  type ReadingProps,
  type CreateReadingData,
} from './entities/index.js';
