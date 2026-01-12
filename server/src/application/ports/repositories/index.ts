/**
 * Repository Interfaces Index
 * Export all repository interfaces for easy importing
 */

// User Repository
export type {
  IUserRepository,
  CreateUserDTO,
  UpdateUserDTO,
  CreditUpdateDTO,
  UserWithCounts,
  PaginationOptions,
  UserListOptions,
} from './IUserRepository.js';

// Reading Repository
export type {
  IReadingRepository,
  CardPosition,
  CreateReadingDTO,
  UpdateReadingDTO,
  CreateFollowUpDTO,
  ReadingWithFollowUps,
} from './IReadingRepository.js';

// Transaction Repository
export type {
  ITransactionRepository,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionListOptions,
  TransactionWithUser,
} from './ITransactionRepository.js';
