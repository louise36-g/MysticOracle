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

      // 4. Add credits via CreditService
      const credits = captureResult.credits || 0;
      const creditResult = await this.creditService.addCredits({
        userId: input.userId,
        amount: credits,
        type: 'PURCHASE',
        description: 'Credit purchase via PayPal',
        metadata: {
          paymentProvider: 'PAYPAL',
          paymentId: input.orderId,
        },
      });

      // 5. Update pending transaction to COMPLETED
      await this.creditService.updateTransactionStatus(input.orderId, 'COMPLETED');

      return {
        success: true,
        credits,
        newBalance: creditResult.newBalance,
        captureId: captureResult.captureId,
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
