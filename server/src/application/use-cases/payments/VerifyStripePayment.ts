/**
 * VerifyStripePayment Use Case
 * Verifies Stripe payment AND adds credits if payment is complete
 * This provides a backup to webhooks for credit addition
 */

import type { IPaymentGateway } from '../../ports/services/IPaymentGateway.js';
import type { ITransactionRepository } from '../../ports/repositories/ITransactionRepository.js';
import type { CreditService } from '../../../services/CreditService.js';

export interface VerifyStripePaymentInput {
  userId: string;
  sessionId: string;
}

export interface VerifyStripePaymentResult {
  success: boolean;
  credits?: number;
  newBalance?: number;
  error?: string;
  status?: string;
}

export class VerifyStripePaymentUseCase {
  constructor(
    private stripeGateway: IPaymentGateway,
    private transactionRepository: ITransactionRepository,
    private creditService: CreditService
  ) {}

  async execute(input: VerifyStripePaymentInput): Promise<VerifyStripePaymentResult> {
    try {
      // 1. Verify payment with Stripe
      if (!this.stripeGateway.isConfigured()) {
        return { success: false, error: 'Stripe is not configured' };
      }

      const verification = await this.stripeGateway.verifyPayment(input.sessionId);

      if (!verification.success) {
        return {
          success: false,
          status: verification.status,
          error: `Payment not completed. Status: ${verification.status}`,
        };
      }

      // 2. Check if credits already added (idempotency)
      const existingCompleted = await this.transactionRepository.findByPaymentIdAndStatus(
        input.sessionId,
        'COMPLETED'
      );

      if (existingCompleted) {
        // Credits already added (by webhook or previous verify call)
        console.log(`[VerifyStripe] Credits already added for session ${input.sessionId}`);
        return {
          success: true,
          credits: verification.credits,
        };
      }

      // 3. Find pending transaction
      const pendingTx = await this.transactionRepository.findByPaymentIdAndStatus(
        input.sessionId,
        'PENDING'
      );

      if (!pendingTx) {
        console.error(`[VerifyStripe] No pending transaction for session ${input.sessionId}`);
        // Payment succeeded but no transaction - unusual state
        // Return success since payment was made, but log the issue
        return {
          success: true,
          credits: verification.credits,
          error: 'Transaction record not found - please contact support if credits not received',
        };
      }

      // 4. Add credits (this is the backup to webhook)
      const credits = verification.credits || pendingTx.amount;
      console.log(`[VerifyStripe] Adding ${credits} credits for user ${pendingTx.userId}`);

      const result = await this.creditService.addCredits({
        userId: pendingTx.userId,
        amount: credits,
        type: 'PURCHASE',
        description: pendingTx.description || 'Credit purchase via Stripe',
        metadata: {
          paymentProvider: 'STRIPE',
          paymentId: input.sessionId,
          paymentAmount: Number(pendingTx.paymentAmount) || 0,
          currency: 'EUR',
        },
      });

      // 5. Update transaction status
      await this.transactionRepository.updateStatusByPaymentId(input.sessionId, 'COMPLETED');

      console.log(`[VerifyStripe] Credits added: ${credits}, new balance: ${result.newBalance}`);

      return {
        success: true,
        credits,
        newBalance: result.newBalance,
      };
    } catch (error) {
      console.error('[VerifyStripe] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }
}

export default VerifyStripePaymentUseCase;
