/**
 * CapturePayment Use Case
 * Handles capturing PayPal payments after user approval
 */

import type { IPaymentGateway } from '../../ports/services/IPaymentGateway.js';
import type { ITransactionRepository } from '../../ports/repositories/ITransactionRepository.js';
import type { CreditService } from '../../../services/CreditService.js';

// Input DTO
export interface CapturePaymentInput {
  userId: string;
  orderId: string;
  provider: 'paypal';
}

// Output DTO
export interface CapturePaymentResult {
  success: boolean;
  credits?: number;
  newBalance?: number;
  captureId?: string;
  error?: string;
  errorCode?: 'PROVIDER_NOT_CONFIGURED' | 'CAPTURE_FAILED' | 'INTERNAL_ERROR';
  // Debug info (temporary)
  debug?: {
    orderId?: string;
    requestUserId?: string;
    pendingTxFound?: boolean;
    pendingTxUserId?: string;
    pendingTxAmount?: number;
    completedTxFound?: boolean;
    addCreditsResult?: number | null;
    verifiedBalance?: number | null;
  };
}

export class CapturePaymentUseCase {
  private gateways: Map<string, IPaymentGateway> = new Map();

  constructor(
    private transactionRepository: ITransactionRepository,
    private creditService: CreditService,
    paymentGateways: IPaymentGateway[]
  ) {
    for (const gateway of paymentGateways) {
      this.gateways.set(gateway.provider.toLowerCase(), gateway);
    }
  }

  async execute(input: CapturePaymentInput): Promise<CapturePaymentResult> {
    try {
      // 1. Get the appropriate gateway
      const gateway = this.gateways.get(input.provider);
      if (!gateway || !gateway.isConfigured()) {
        return {
          success: false,
          error: `${input.provider} payments not configured`,
          errorCode: 'PROVIDER_NOT_CONFIGURED',
        };
      }

      // 2. Check if gateway supports capture
      if (!gateway.capturePayment) {
        return {
          success: false,
          error: 'This payment provider does not require capture',
          errorCode: 'CAPTURE_FAILED',
        };
      }

      // 3. Capture the payment
      const captureResult = await gateway.capturePayment({
        orderId: input.orderId,
        userId: input.userId,
      });

      if (!captureResult.success) {
        return {
          success: false,
          error: captureResult.error || 'Payment capture failed',
          errorCode: 'CAPTURE_FAILED',
        };
      }

      // Debug info
      const debug: CapturePaymentResult['debug'] = {
        orderId: input.orderId,
        requestUserId: input.userId, // The user making the request
      };

      // 4. Check if already processed (idempotency) - look for COMPLETED transaction first
      const existingCompleted = await this.transactionRepository.findByPaymentIdAndStatus(
        input.orderId,
        'COMPLETED'
      );

      debug.completedTxFound = !!existingCompleted;

      if (existingCompleted) {
        console.log(`[CapturePayment] Credits already added for order ${input.orderId}`);
        return {
          success: true,
          credits: existingCompleted.amount,
          captureId: captureResult.captureId,
          debug,
        };
      }

      // 5. Look up the pending transaction (created at checkout)
      const pendingTx = await this.transactionRepository.findByPaymentIdAndStatus(
        input.orderId,
        'PENDING'
      );

      debug.pendingTxFound = !!pendingTx;
      debug.pendingTxUserId = pendingTx?.userId;
      debug.pendingTxAmount = pendingTx?.amount;

      if (!pendingTx) {
        console.error(`[CapturePayment] No pending transaction found for order ${input.orderId}`);
        return {
          success: false,
          error: 'No pending transaction found - please contact support',
          errorCode: 'INTERNAL_ERROR',
          debug,
        };
      }

      const credits = pendingTx.amount;
      console.log(
        `[CapturePayment] Found pending transaction with ${credits} credits for user ${pendingTx.userId}`
      );

      // 6. Add credits to user (without creating new transaction - we'll update the existing one)
      const newBalance = await this.creditService.addCreditsToUser(pendingTx.userId, credits);

      debug.addCreditsResult = newBalance;

      if (newBalance === null) {
        console.error(`[CapturePayment] Failed to add credits to user ${pendingTx.userId}`);
        return {
          success: false,
          error: 'Failed to add credits',
          errorCode: 'INTERNAL_ERROR',
          debug,
        };
      }

      // 7. Update pending transaction to COMPLETED
      await this.creditService.updateTransactionStatus(input.orderId, 'COMPLETED');

      // 8. Verify the balance was actually updated (debug)
      const verifiedBalance = await this.creditService.getBalance(pendingTx.userId);
      debug.verifiedBalance = verifiedBalance;

      console.log(
        `[CapturePayment] Successfully added ${credits} credits. New balance: ${newBalance}, Verified: ${verifiedBalance}`
      );

      return {
        success: true,
        credits,
        newBalance,
        captureId: captureResult.captureId,
        debug,
      };
    } catch (error) {
      console.error('[CapturePayment] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to capture payment',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export default CapturePaymentUseCase;
