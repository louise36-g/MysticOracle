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

// Services
import { CreditService } from '../../services/CreditService.js';

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

// Container type for type safety
import type { ContainerDependencies } from './types.js';

/**
 * Create and configure the application container
 */
export function createAppContainer(): AwilixContainer<ContainerDependencies> {
  const container = createContainer<ContainerDependencies>({
    injectionMode: InjectionMode.CLASSIC,
  });

  // Register configuration values
  container.register({
    // Environment config
    frontendUrl: asValue(process.env.FRONTEND_URL || 'http://localhost:5173'),
    stripeSecretKey: asValue(process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecret: asValue(process.env.STRIPE_WEBHOOK_SECRET),
    paypalClientId: asValue(process.env.PAYPAL_CLIENT_ID),
    paypalClientSecret: asValue(process.env.PAYPAL_CLIENT_SECRET),
    paypalWebhookId: asValue(process.env.PAYPAL_WEBHOOK_ID),
    paypalIsLive: asValue(process.env.PAYPAL_MODE === 'live'),
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
  });

  // Register services (singletons)
  container.register({
    creditService: asClass(CreditService).singleton(),
  });

  // Register payment gateways (singletons)
  container.register({
    stripeGateway: asFunction(({ stripeSecretKey, stripeWebhookSecret }) => {
      return new StripeGateway(stripeSecretKey, stripeWebhookSecret, false);
    }).singleton(),

    stripeLinkGateway: asFunction(({ stripeSecretKey, stripeWebhookSecret }) => {
      return new StripeGateway(stripeSecretKey, stripeWebhookSecret, true);
    }).singleton(),

    paypalGateway: asFunction(
      ({ paypalClientId, paypalClientSecret, paypalWebhookId, paypalIsLive }) => {
        return new PayPalGateway(
          paypalClientId,
          paypalClientSecret,
          paypalWebhookId,
          paypalIsLive
        );
      }
    ).singleton(),

    // Array of all payment gateways for use cases
    paymentGateways: asFunction(
      ({ stripeGateway, stripeLinkGateway, paypalGateway }) => {
        return [stripeGateway, stripeLinkGateway, paypalGateway];
      }
    ).singleton(),
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
