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

// Credit Package Repository
export type {
  ICreditPackageRepository,
  CreatePackageDTO,
  UpdatePackageDTO,
} from './ICreditPackageRepository.js';

// Email Template Repository
export type {
  IEmailTemplateRepository,
  CreateTemplateDTO,
  UpdateTemplateDTO,
} from './IEmailTemplateRepository.js';

// System Setting Repository
export type { ISystemSettingRepository } from './ISystemSettingRepository.js';

// Cache Version Repository
export type { ICacheVersionRepository } from './ICacheVersionRepository.js';

// Horoscope Cache Repository
export type {
  IHoroscopeCacheRepository,
  CreateHoroscopeCacheDTO,
} from './IHoroscopeCacheRepository.js';

// Reading Card Repository
export type {
  IReadingCardRepository,
  CreateReadingCardDTO,
  ReadingCardQueryOptions,
  ReadingCardWithReading,
} from './IReadingCardRepository.js';
