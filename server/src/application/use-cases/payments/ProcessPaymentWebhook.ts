/**
 * ProcessPaymentWebhook Use Case
 * Handles payment webhook events from Stripe and PayPal
 */

import type { IPaymentGateway, WebhookEvent } from '../../ports/services/IPaymentGateway.js';
import type { ITransactionRepository } from '../../ports/repositories/ITransactionRepository.js';
import type { IUserRepository } from '../../ports/repositories/IUserRepository.js';
import type { CreditService } from '../../../services/CreditService.js';

// Input DTO
export interface ProcessWebhookInput {
  provider: 'stripe' | 'paypal';
  payload: Buffer | string;
  signature: string;
  headers?: Record<string, string>;
}

// Output DTO
export interface ProcessWebhookResult {
  success: boolean;
  processed: boolean;
  eventType?: string;
  error?: string;
}

export class ProcessPaymentWebhookUseCase {
  private gateways: Map<string, IPaymentGateway> = new Map();

  constructor(
    private transactionRepository: ITransactionRepository,
    private userRepository: IUserRepository,
    private creditService: CreditService,
    paymentGateways: IPaymentGateway[]
  ) {
    for (const gateway of paymentGateways) {
      this.gateways.set(gateway.provider.toLowerCase(), gateway);
    }
  }

  async execute(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
    try {
      // 1. Get the appropriate gateway
      const gateway = this.gateways.get(input.provider);
      if (!gateway) {
        return {
          success: false,
          processed: false,
          error: `Unknown payment provider: ${input.provider}`,
        };
      }

      // 2. Verify and parse webhook
      const event = await gateway.verifyWebhook(
        input.payload,
        input.signature,
        input.headers
      );

      if (!event) {
        return {
          success: false,
          processed: false,
          error: 'Invalid webhook signature or unhandled event',
        };
      }

      // 3. Process event based on type
      switch (event.type) {
        case 'payment.completed':
          await this.handlePaymentCompleted(event, gateway.provider);
          break;

        case 'payment.failed':
        case 'session.expired':
          await this.handlePaymentFailed(event);
          break;

        case 'payment.refunded':
          await this.handlePaymentRefunded(event, gateway.provider);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      return {
        success: true,
        processed: true,
        eventType: event.type,
      };
    } catch (error) {
      console.error('[ProcessWebhook] Error:', error);
      return {
        success: false,
        processed: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook',
      };
    }
  }

  private async handlePaymentCompleted(
    event: WebhookEvent,
    provider: 'STRIPE' | 'STRIPE_LINK' | 'PAYPAL'
  ): Promise<void> {
    // Idempotency check
    const existingTx = await this.transactionRepository.findByPaymentIdAndStatus(
      event.paymentId,
      'COMPLETED'
    );

    if (existingTx) {
      console.log(`⏭️ Webhook already processed for payment ${event.paymentId}`);
      return;
    }

    // Find pending transaction
    const pendingTx = await this.transactionRepository.findByPaymentIdAndStatus(
      event.paymentId,
      'PENDING'
    );

    if (!pendingTx) {
      console.error(`No pending transaction found for payment ${event.paymentId}`);
      return;
    }

    // Use credits from event if available, otherwise from pending transaction
    const credits = event.credits || pendingTx.amount;
    const userId = event.userId || pendingTx.userId;

    // Add credits via CreditService
    const result = await this.creditService.addCredits({
      userId,
      amount: credits,
      type: 'PURCHASE',
      description: `Credit purchase via ${provider}`,
      metadata: {
        paymentProvider: provider,
        paymentId: event.paymentId,
        paymentAmount: event.amount || Number(pendingTx.paymentAmount) || 0,
        currency: (event.currency || 'eur') as 'EUR',
      },
    });

    // Update pending transaction to COMPLETED
    await this.transactionRepository.updateStatusByPaymentId(event.paymentId, 'COMPLETED');

    console.log(
      `✅ Credits added: ${credits} for user ${userId}, new balance: ${result.newBalance}`
    );
  }

  private async handlePaymentFailed(event: WebhookEvent): Promise<void> {
    await this.transactionRepository.updateStatusByPaymentId(event.paymentId, 'FAILED');
    console.log(`❌ Payment failed/expired for ${event.paymentId}`);
  }

  private async handlePaymentRefunded(
    event: WebhookEvent,
    provider: 'STRIPE' | 'STRIPE_LINK' | 'PAYPAL'
  ): Promise<void> {
    // Idempotency check for refunds
    const existingRefund = await this.transactionRepository.findByPaymentIdAndType(
      event.paymentId,
      'REFUND'
    );

    if (existingRefund) {
      console.log(`⏭️ Refund already processed for ${event.paymentId}`);
      return;
    }

    // Find original completed transaction
    const originalTx = await this.transactionRepository.findByPaymentIdAndStatus(
      event.paymentId,
      'COMPLETED'
    );

    if (!originalTx) {
      console.error(`No completed transaction found for refund ${event.paymentId}`);
      return;
    }

    // Process refund via CreditService
    await this.creditService.processRefund(
      originalTx.userId,
      originalTx.amount,
      event.paymentId,
      provider
    );

    console.log(`✅ Refund processed for ${event.paymentId}`);
  }
}

export default ProcessPaymentWebhookUseCase;
