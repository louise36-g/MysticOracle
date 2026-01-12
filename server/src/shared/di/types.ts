/**
 * Container Types
 * Type definitions for dependency injection container
 */

import type { PrismaClient } from '@prisma/client';

// Repositories
import type { IUserRepository } from '../../application/ports/repositories/IUserRepository.js';
import type { IReadingRepository } from '../../application/ports/repositories/IReadingRepository.js';
import type { ITransactionRepository } from '../../application/ports/repositories/ITransactionRepository.js';

// Services
import type { CreditService } from '../../services/CreditService.js';

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

  // Services
  creditService: CreditService;

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
