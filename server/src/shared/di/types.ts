/**
 * Container Types
 * Type definitions for dependency injection container
 */

import type { PrismaClient } from '@prisma/client';

// Repositories
import type { IUserRepository } from '../../application/ports/repositories/IUserRepository.js';
import type { IReadingRepository } from '../../application/ports/repositories/IReadingRepository.js';
import type { ITransactionRepository } from '../../application/ports/repositories/ITransactionRepository.js';
import type { ICreditPackageRepository } from '../../application/ports/repositories/ICreditPackageRepository.js';
import type { IEmailTemplateRepository } from '../../application/ports/repositories/IEmailTemplateRepository.js';
import type { ISystemSettingRepository } from '../../application/ports/repositories/ISystemSettingRepository.js';

// Services
import type { CreditService } from '../../services/CreditService.js';
import type { AdminStatsService } from '../../services/AdminStatsService.js';
import type { AdminAnalyticsService } from '../../services/AdminAnalyticsService.js';
import type { SystemHealthService } from '../../services/SystemHealthService.js';
import type { RevenueExportService } from '../../services/RevenueExportService.js';

// Payment Gateways
import type { IPaymentGateway } from '../../application/ports/services/IPaymentGateway.js';
import type { StripeGateway } from '../../infrastructure/payment/StripeGateway.js';
import type { PayPalGateway } from '../../infrastructure/payment/PayPalGateway.js';

// Use Cases - Readings
import type { CreateReadingUseCase } from '../../application/use-cases/readings/CreateReading.js';
import type { AddFollowUpUseCase } from '../../application/use-cases/readings/AddFollowUp.js';
import type { GetReadingUseCase } from '../../application/use-cases/readings/GetReading.js';
import type { GetReadingHistoryUseCase } from '../../application/use-cases/readings/GetReadingHistory.js';
import type { UpdateReflectionUseCase } from '../../application/use-cases/readings/UpdateReflection.js';

// Use Cases - Payments
import type { CreateCheckoutUseCase } from '../../application/use-cases/payments/CreateCheckout.js';
import type { CapturePaymentUseCase } from '../../application/use-cases/payments/CapturePayment.js';
import type { ProcessPaymentWebhookUseCase } from '../../application/use-cases/payments/ProcessPaymentWebhook.js';

// Use Cases - Admin
import type {
  ListUsersUseCase,
  GetUserUseCase,
  UpdateUserStatusUseCase,
  AdjustUserCreditsUseCase,
  ToggleUserAdminUseCase,
  ListPackagesUseCase,
  CreatePackageUseCase,
  UpdatePackageUseCase,
  DeletePackageUseCase,
  SeedPackagesUseCase,
  ListTemplatesUseCase,
  CreateTemplateUseCase,
  UpdateTemplateUseCase,
  DeleteTemplateUseCase,
  SeedTemplatesUseCase,
  GetSettingsUseCase,
  UpdateSettingUseCase,
} from '../../application/use-cases/admin/index.js';

/**
 * All registered dependencies in the container
 */
export interface ContainerDependencies {
  // Configuration
  frontendUrl: string;
  stripeSecretKey: string | undefined;
  stripeWebhookSecret: string | undefined;
  paypalClientId: string | undefined;
  paypalClientSecret: string | undefined;
  paypalWebhookId: string | undefined;
  paypalIsLive: boolean;

  // Database
  prisma: PrismaClient;

  // Repositories
  userRepository: IUserRepository;
  readingRepository: IReadingRepository;
  transactionRepository: ITransactionRepository;
  creditPackageRepository: ICreditPackageRepository;
  emailTemplateRepository: IEmailTemplateRepository;
  systemSettingRepository: ISystemSettingRepository;

  // Services
  creditService: CreditService;
  adminStatsService: AdminStatsService;
  adminAnalyticsService: AdminAnalyticsService;
  systemHealthService: SystemHealthService;
  revenueExportService: RevenueExportService;

  // Payment Gateways
  stripeGateway: StripeGateway;
  stripeLinkGateway: StripeGateway;
  paypalGateway: PayPalGateway;
  paymentGateways: IPaymentGateway[];

  // Reading Use Cases
  createReadingUseCase: CreateReadingUseCase;
  addFollowUpUseCase: AddFollowUpUseCase;
  getReadingUseCase: GetReadingUseCase;
  getReadingHistoryUseCase: GetReadingHistoryUseCase;
  updateReflectionUseCase: UpdateReflectionUseCase;

  // Payment Use Cases
  createCheckoutUseCase: CreateCheckoutUseCase;
  capturePaymentUseCase: CapturePaymentUseCase;
  processPaymentWebhookUseCase: ProcessPaymentWebhookUseCase;

  // Admin Use Cases - Users
  listUsersUseCase: ListUsersUseCase;
  getUserUseCase: GetUserUseCase;
  updateUserStatusUseCase: UpdateUserStatusUseCase;
  adjustUserCreditsUseCase: AdjustUserCreditsUseCase;
  toggleUserAdminUseCase: ToggleUserAdminUseCase;

  // Admin Use Cases - Packages
  listPackagesUseCase: ListPackagesUseCase;
  createPackageUseCase: CreatePackageUseCase;
  updatePackageUseCase: UpdatePackageUseCase;
  deletePackageUseCase: DeletePackageUseCase;
  seedPackagesUseCase: SeedPackagesUseCase;

  // Admin Use Cases - Templates
  listTemplatesUseCase: ListTemplatesUseCase;
  createTemplateUseCase: CreateTemplateUseCase;
  updateTemplateUseCase: UpdateTemplateUseCase;
  deleteTemplateUseCase: DeleteTemplateUseCase;
  seedTemplatesUseCase: SeedTemplatesUseCase;

  // Admin Use Cases - Settings
  getSettingsUseCase: GetSettingsUseCase;
  updateSettingUseCase: UpdateSettingUseCase;
}

/**
 * Subset of dependencies needed for reading routes
 */
export interface ReadingRouteDependencies {
  createReadingUseCase: CreateReadingUseCase;
  addFollowUpUseCase: AddFollowUpUseCase;
  getReadingUseCase: GetReadingUseCase;
  updateReflectionUseCase: UpdateReflectionUseCase;
}

/**
 * Subset of dependencies needed for payment routes
 */
export interface PaymentRouteDependencies {
  createCheckoutUseCase: CreateCheckoutUseCase;
  capturePaymentUseCase: CapturePaymentUseCase;
  stripeGateway: StripeGateway;
  transactionRepository: ITransactionRepository;
  frontendUrl: string;
}

/**
 * Subset of dependencies needed for webhook routes
 */
export interface WebhookRouteDependencies {
  processPaymentWebhookUseCase: ProcessPaymentWebhookUseCase;
  creditService: CreditService;
}
