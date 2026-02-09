/**
 * Dependency Injection Container
 * Centralizes all dependency creation and wiring
 */

import {
  createContainer,
  asClass,
  asValue,
  asFunction,
  InjectionMode,
  AwilixContainer,
} from 'awilix';

// Database
import prismaClient from '../../db/prisma.js';

// Repositories
import { PrismaUserRepository } from '../../infrastructure/persistence/prisma/PrismaUserRepository.js';
import { PrismaReadingRepository } from '../../infrastructure/persistence/prisma/PrismaReadingRepository.js';
import { PrismaTransactionRepository } from '../../infrastructure/persistence/prisma/PrismaTransactionRepository.js';
import { PrismaCreditPackageRepository } from '../../infrastructure/persistence/prisma/PrismaCreditPackageRepository.js';
import { PrismaEmailTemplateRepository } from '../../infrastructure/persistence/prisma/PrismaEmailTemplateRepository.js';
import { PrismaSystemSettingRepository } from '../../infrastructure/persistence/prisma/PrismaSystemSettingRepository.js';

// Services
import { CreditService } from '../../services/CreditService.js';
import { AdminStatsService } from '../../services/AdminStatsService.js';
import { AdminAnalyticsService } from '../../services/AdminAnalyticsService.js';
import { SystemHealthService } from '../../services/SystemHealthService.js';
import { RevenueExportService } from '../../services/RevenueExportService.js';
import { AuditService } from '../../services/AuditService.js';
import { AchievementService } from '../../services/AchievementService.js';

// Audit Repository
import { PrismaAuditLogRepository } from '../../infrastructure/persistence/prisma/PrismaAuditLogRepository.js';

// Payment Gateways
import { StripeGateway } from '../../infrastructure/payment/StripeGateway.js';
import { PayPalGateway } from '../../infrastructure/payment/PayPalGateway.js';

// Use Cases - Readings
import { CreateReadingUseCase } from '../../application/use-cases/readings/CreateReading.js';
import { AddFollowUpUseCase } from '../../application/use-cases/readings/AddFollowUp.js';
import { GetReadingUseCase } from '../../application/use-cases/readings/GetReading.js';
import { GetReadingHistoryUseCase } from '../../application/use-cases/readings/GetReadingHistory.js';
import { UpdateReflectionUseCase } from '../../application/use-cases/readings/UpdateReflection.js';

// Use Cases - Payments
import { CreateCheckoutUseCase } from '../../application/use-cases/payments/CreateCheckout.js';
import { CapturePaymentUseCase } from '../../application/use-cases/payments/CapturePayment.js';
import { ProcessPaymentWebhookUseCase } from '../../application/use-cases/payments/ProcessPaymentWebhook.js';

// Use Cases - Admin
import {
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

// Use Cases - User GDPR Compliance
import { ExportUserDataUseCase } from '../../application/use-cases/users/ExportUserData.js';
import { DeleteUserAccountUseCase } from '../../application/use-cases/users/DeleteUserAccount.js';

// Container type for type safety
import type { ContainerDependencies } from './types.js';

/**
 * Create and configure the application container
 */
export function createAppContainer(): AwilixContainer<ContainerDependencies> {
  const container = createContainer<ContainerDependencies>({
    injectionMode: InjectionMode.CLASSIC,
  });

  // Debug: Log env vars at container creation time
  console.log('[DI Container] Creating container, checking env vars:');
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET;
  const ppClientId = process.env.PAYPAL_CLIENT_ID;
  const ppClientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const ppWebhookId = process.env.PAYPAL_WEBHOOK_ID;
  const ppIsLive = process.env.PAYPAL_MODE === 'live';
  console.log(
    `[DI Container] STRIPE_SECRET_KEY: ${stripeKey ? 'SET (' + stripeKey.substring(0, 10) + '...)' : 'NOT SET'}`
  );
  console.log(`[DI Container] PAYPAL_CLIENT_ID: ${ppClientId ? 'SET' : 'NOT SET'}`);

  // Register configuration values - capture values in local vars first
  container.register({
    // Environment config
    frontendUrl: asValue(process.env.FRONTEND_URL || 'http://localhost:5173'),
    stripeSecretKey: asValue(stripeKey),
    stripeWebhookSecret: asValue(stripeWebhook),
    paypalClientId: asValue(ppClientId),
    paypalClientSecret: asValue(ppClientSecret),
    paypalWebhookId: asValue(ppWebhookId),
    paypalIsLive: asValue(ppIsLive),
  });

  // Register database client
  container.register({
    prisma: asValue(prismaClient),
  });

  // Register repositories (singletons)
  container.register({
    userRepository: asClass(PrismaUserRepository).singleton(),
    readingRepository: asClass(PrismaReadingRepository).singleton(),
    transactionRepository: asClass(PrismaTransactionRepository).singleton(),
    creditPackageRepository: asClass(PrismaCreditPackageRepository).singleton(),
    emailTemplateRepository: asClass(PrismaEmailTemplateRepository).singleton(),
    systemSettingRepository: asClass(PrismaSystemSettingRepository).singleton(),
    auditLogRepository: asClass(PrismaAuditLogRepository).singleton(),
  });

  // Register services (singletons)
  container.register({
    creditService: asClass(CreditService).singleton(),
    adminStatsService: asClass(AdminStatsService).singleton(),
    adminAnalyticsService: asClass(AdminAnalyticsService).singleton(),
    systemHealthService: asClass(SystemHealthService).singleton(),
    revenueExportService: asClass(RevenueExportService).singleton(),
    auditService: asClass(AuditService).singleton(),
    achievementService: asClass(AchievementService).singleton(),
  });

  // Register payment gateways (singletons)
  // Read env vars directly in factories to avoid DI resolution issues
  container.register({
    stripeGateway: asFunction(() => {
      const key = process.env.STRIPE_SECRET_KEY;
      const webhook = process.env.STRIPE_WEBHOOK_SECRET;
      console.log('[DI] Creating stripeGateway, key from env:', key ? 'SET' : 'NOT SET');
      return new StripeGateway(key, webhook, false);
    }).singleton(),

    stripeLinkGateway: asFunction(() => {
      const key = process.env.STRIPE_SECRET_KEY;
      const webhook = process.env.STRIPE_WEBHOOK_SECRET;
      console.log('[DI] Creating stripeLinkGateway, key from env:', key ? 'SET' : 'NOT SET');
      return new StripeGateway(key, webhook, true);
    }).singleton(),

    paypalGateway: asFunction(() => {
      const clientId = process.env.PAYPAL_CLIENT_ID;
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
      const webhookId = process.env.PAYPAL_WEBHOOK_ID;
      const isLive = process.env.PAYPAL_MODE === 'live';
      console.log('[DI] Creating paypalGateway, clientId from env:', clientId ? 'SET' : 'NOT SET');
      return new PayPalGateway(clientId, clientSecret, webhookId, isLive);
    }).singleton(),

    // Array of all payment gateways for use cases
    // Create gateways directly since we bypassed DI for env vars
    paymentGateways: asFunction(() => {
      const stripeGateway = new StripeGateway(
        process.env.STRIPE_SECRET_KEY,
        process.env.STRIPE_WEBHOOK_SECRET,
        false
      );
      const stripeLinkGateway = new StripeGateway(
        process.env.STRIPE_SECRET_KEY,
        process.env.STRIPE_WEBHOOK_SECRET,
        true
      );
      const paypalGateway = new PayPalGateway(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET,
        process.env.PAYPAL_WEBHOOK_ID,
        process.env.PAYPAL_MODE === 'live'
      );
      console.log('[DI] Creating paymentGateways array:', {
        stripe: stripeGateway.isConfigured(),
        stripeLink: stripeLinkGateway.isConfigured(),
        paypal: paypalGateway.isConfigured(),
      });
      return [stripeGateway, stripeLinkGateway, paypalGateway];
    }).singleton(),
  });

  // Register reading use cases (scoped - new instance per request)
  container.register({
    createReadingUseCase: asClass(CreateReadingUseCase).scoped(),
    addFollowUpUseCase: asClass(AddFollowUpUseCase).scoped(),
    getReadingUseCase: asClass(GetReadingUseCase).scoped(),
    getReadingHistoryUseCase: asClass(GetReadingHistoryUseCase).scoped(),
    updateReflectionUseCase: asClass(UpdateReflectionUseCase).scoped(),
  });

  // Register payment use cases (scoped)
  container.register({
    createCheckoutUseCase: asClass(CreateCheckoutUseCase).scoped(),
    capturePaymentUseCase: asClass(CapturePaymentUseCase).scoped(),
    processPaymentWebhookUseCase: asClass(ProcessPaymentWebhookUseCase).scoped(),
  });

  // Register admin use cases (scoped)
  container.register({
    // User management
    listUsersUseCase: asClass(ListUsersUseCase).scoped(),
    getUserUseCase: asClass(GetUserUseCase).scoped(),
    updateUserStatusUseCase: asClass(UpdateUserStatusUseCase).scoped(),
    adjustUserCreditsUseCase: asClass(AdjustUserCreditsUseCase).scoped(),
    toggleUserAdminUseCase: asClass(ToggleUserAdminUseCase).scoped(),

    // Package management
    listPackagesUseCase: asClass(ListPackagesUseCase).scoped(),
    createPackageUseCase: asClass(CreatePackageUseCase).scoped(),
    updatePackageUseCase: asClass(UpdatePackageUseCase).scoped(),
    deletePackageUseCase: asClass(DeletePackageUseCase).scoped(),
    seedPackagesUseCase: asClass(SeedPackagesUseCase).scoped(),

    // Template management
    listTemplatesUseCase: asClass(ListTemplatesUseCase).scoped(),
    createTemplateUseCase: asClass(CreateTemplateUseCase).scoped(),
    updateTemplateUseCase: asClass(UpdateTemplateUseCase).scoped(),
    deleteTemplateUseCase: asClass(DeleteTemplateUseCase).scoped(),
    seedTemplatesUseCase: asClass(SeedTemplatesUseCase).scoped(),

    // Settings management
    getSettingsUseCase: asClass(GetSettingsUseCase).scoped(),
    updateSettingUseCase: asClass(UpdateSettingUseCase).scoped(),
  });

  // Register user GDPR compliance use cases (scoped)
  container.register({
    exportUserDataUseCase: asClass(ExportUserDataUseCase).scoped(),
    deleteUserAccountUseCase: asClass(DeleteUserAccountUseCase).scoped(),
  });

  return container;
}

// Export singleton container instance
let containerInstance: AwilixContainer<ContainerDependencies> | null = null;

export function getContainer(): AwilixContainer<ContainerDependencies> {
  if (!containerInstance) {
    containerInstance = createAppContainer();
  }
  return containerInstance;
}

// For testing - allows resetting the container
export function resetContainer(): void {
  containerInstance = null;
}

export default getContainer;
