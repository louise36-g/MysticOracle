# Fix Stripe Payment Credits Not Being Added

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the issue where Stripe payments succeed but credits are not added to user accounts

**Architecture:** Add credit-addition logic to the Stripe verify endpoint as a backup to webhooks, with idempotency checks to prevent double-crediting

**Tech Stack:** Express.js, Prisma, TypeScript, Stripe SDK

---

## Background

Currently:
- Stripe verification endpoint (`/stripe/verify/:sessionId`) ONLY checks payment status
- Credits are ONLY added via webhook (`/webhooks/stripe`)
- If webhook fails or isn't configured, credits are never added
- PayPal works correctly because `/paypal/capture` adds credits immediately

The fix adds credit-addition to the verify endpoint with proper idempotency.

---

## Task 1: Create VerifyAndCompleteStripePayment Use Case

**Files:**
- Create: `server/src/application/use-cases/payments/VerifyStripePayment.ts`
- Modify: `server/src/application/use-cases/payments/index.ts`

**Step 1: Create the use case file**

```typescript
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
          error: `Payment not completed. Status: ${verification.status}`
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
```

**Step 2: Export from index**

Add to `server/src/application/use-cases/payments/index.ts`:
```typescript
export { VerifyStripePaymentUseCase } from './VerifyStripePayment.js';
export type { VerifyStripePaymentInput, VerifyStripePaymentResult } from './VerifyStripePayment.js';
```

---

## Task 2: Register Use Case in DI Container

**Files:**
- Modify: `server/src/shared/di/container.ts`

**Step 1: Import the new use case**

Add import:
```typescript
import { VerifyStripePaymentUseCase } from '../../application/use-cases/payments/VerifyStripePayment.js';
```

**Step 2: Register in container**

Add registration after other payment use cases:
```typescript
container.register('verifyStripePaymentUseCase', () => {
  return new VerifyStripePaymentUseCase(
    container.resolve('stripeGateway'),
    container.resolve('transactionRepository'),
    container.resolve('creditService')
  );
});
```

---

## Task 3: Update Payments Route to Use New Use Case

**Files:**
- Modify: `server/src/routes/payments.ts`

**Step 1: Replace the verify endpoint**

Change the `/stripe/verify/:sessionId` endpoint from:
```typescript
router.get('/stripe/verify/:sessionId', requireAuth, async (req, res) => {
  try {
    console.log('[Stripe Verify] Verifying session:', req.params.sessionId);
    const stripeGateway = req.container.resolve('stripeGateway');

    if (!stripeGateway.isConfigured()) {
      console.log('[Stripe Verify] Gateway not configured');
      return res.status(503).json({ error: 'Stripe payments not configured' });
    }

    const verification = await stripeGateway.verifyPayment(req.params.sessionId);
    console.log('[Stripe Verify] Result:', verification);
    res.json(verification);
  } catch (error) {
    console.error('[Stripe Verify] Error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});
```

To:
```typescript
router.get('/stripe/verify/:sessionId', requireAuth, async (req, res) => {
  try {
    console.log('[Stripe Verify] Verifying session:', req.params.sessionId);
    const verifyUseCase = req.container.resolve('verifyStripePaymentUseCase');

    const result = await verifyUseCase.execute({
      userId: req.auth.userId,
      sessionId: req.params.sessionId,
    });

    console.log('[Stripe Verify] Result:', result);
    res.json(result);
  } catch (error) {
    console.error('[Stripe Verify] Error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});
```

---

## Task 4: Add Idempotency to Webhook Handler

**Files:**
- Modify: `server/src/application/use-cases/payments/ProcessPaymentWebhook.ts`

The webhook handler already has idempotency checks, but let's make sure it handles the case where credits were added by the verify endpoint.

**Step 1: Verify the existing idempotency check covers both cases**

The current code checks for COMPLETED status:
```typescript
const existingTx = await this.transactionRepository.findByPaymentIdAndStatus(
  event.paymentId,
  'COMPLETED'
);

if (existingTx) {
  console.log(`⏭️ Webhook already processed for payment ${event.paymentId}`);
  return;
}
```

This should work correctly - if the verify endpoint already added credits and marked the transaction COMPLETED, the webhook will skip adding credits again.

No changes needed, but verify this works correctly during testing.

---

## Task 5: Add Tests for New Use Case

**Files:**
- Create: `server/src/__tests__/use-cases/payments/VerifyStripePayment.test.ts`

**Step 1: Create comprehensive test file**

```typescript
/**
 * VerifyStripePayment Use Case Tests
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { VerifyStripePaymentUseCase } from '../../../application/use-cases/payments/VerifyStripePayment.js';
import type { IPaymentGateway } from '../../../application/ports/services/IPaymentGateway.js';
import type { ITransactionRepository } from '../../../application/ports/repositories/ITransactionRepository.js';
import type { CreditService } from '../../../services/CreditService.js';

const createMockGateway = (): IPaymentGateway => ({
  provider: 'STRIPE',
  isConfigured: vi.fn().mockReturnValue(true),
  createCheckoutSession: vi.fn(),
  verifyPayment: vi.fn(),
  capturePayment: vi.fn(),
  verifyWebhook: vi.fn(),
});

const createMockTransactionRepo = () => ({
  findByPaymentIdAndStatus: vi.fn(),
  updateStatusByPaymentId: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  findByPaymentId: vi.fn(),
  findByPaymentIdAndType: vi.fn(),
  updateByPaymentId: vi.fn(),
  findByUser: vi.fn(),
  countByUser: vi.fn(),
  update: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  sumCompletedPurchases: vi.fn(),
  sumCompletedPurchasesLast30Days: vi.fn(),
  groupByProvider: vi.fn(),
});

const createMockCreditService = () => ({
  addCredits: vi.fn().mockResolvedValue({ newBalance: 100 }),
  deductCredits: vi.fn(),
  getBalance: vi.fn(),
  processRefund: vi.fn(),
});

describe('VerifyStripePaymentUseCase', () => {
  let useCase: VerifyStripePaymentUseCase;
  let mockGateway: IPaymentGateway;
  let mockTxRepo: ReturnType<typeof createMockTransactionRepo>;
  let mockCreditService: ReturnType<typeof createMockCreditService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGateway = createMockGateway();
    mockTxRepo = createMockTransactionRepo();
    mockCreditService = createMockCreditService();

    useCase = new VerifyStripePaymentUseCase(
      mockGateway,
      mockTxRepo as unknown as ITransactionRepository,
      mockCreditService as unknown as CreditService
    );
  });

  it('should return error if gateway not configured', async () => {
    (mockGateway.isConfigured as Mock).mockReturnValue(false);

    const result = await useCase.execute({
      userId: 'user-123',
      sessionId: 'cs_test_123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Stripe is not configured');
  });

  it('should return error if payment not successful', async () => {
    (mockGateway.verifyPayment as Mock).mockResolvedValue({
      success: false,
      status: 'unpaid',
    });

    const result = await useCase.execute({
      userId: 'user-123',
      sessionId: 'cs_test_123',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('unpaid');
  });

  it('should skip credit addition if already completed', async () => {
    (mockGateway.verifyPayment as Mock).mockResolvedValue({
      success: true,
      credits: 25,
    });
    mockTxRepo.findByPaymentIdAndStatus.mockResolvedValue({
      id: 'tx-123',
      paymentStatus: 'COMPLETED',
    });

    const result = await useCase.execute({
      userId: 'user-123',
      sessionId: 'cs_test_123',
    });

    expect(result.success).toBe(true);
    expect(result.credits).toBe(25);
    expect(mockCreditService.addCredits).not.toHaveBeenCalled();
  });

  it('should add credits for pending transaction', async () => {
    (mockGateway.verifyPayment as Mock).mockResolvedValue({
      success: true,
      credits: 25,
    });
    mockTxRepo.findByPaymentIdAndStatus
      .mockResolvedValueOnce(null) // No COMPLETED
      .mockResolvedValueOnce({     // Found PENDING
        id: 'tx-123',
        userId: 'user-123',
        amount: 25,
        description: 'Purchase: Basic',
        paymentAmount: 10,
        paymentStatus: 'PENDING',
      });

    const result = await useCase.execute({
      userId: 'user-123',
      sessionId: 'cs_test_123',
    });

    expect(result.success).toBe(true);
    expect(result.credits).toBe(25);
    expect(result.newBalance).toBe(100);
    expect(mockCreditService.addCredits).toHaveBeenCalledWith({
      userId: 'user-123',
      amount: 25,
      type: 'PURCHASE',
      description: 'Purchase: Basic',
      metadata: expect.objectContaining({
        paymentProvider: 'STRIPE',
        paymentId: 'cs_test_123',
      }),
    });
    expect(mockTxRepo.updateStatusByPaymentId).toHaveBeenCalledWith(
      'cs_test_123',
      'COMPLETED'
    );
  });
});
```

---

## Task 6: Manual Testing Checklist

After implementing, test the following scenarios:

1. **New Stripe payment (webhook working)**
   - Make a purchase via Stripe
   - Verify credits are added (either by webhook or verify endpoint)
   - Verify no double-crediting

2. **Stripe payment with slow/failed webhook**
   - Temporarily disable webhook or slow it down
   - Make a purchase
   - Verify credits are added by the verify endpoint
   - Re-enable webhook, verify no double-crediting

3. **Existing pending transactions**
   - If any PENDING transactions exist from previous failed payments
   - The verify endpoint should NOT add credits for those (payment_status won't be 'paid')

4. **PayPal still works**
   - Make a PayPal purchase
   - Verify credits are added correctly

---

## Summary

This fix ensures credits are added reliably for Stripe payments by:
1. Adding credit-addition logic to the verify endpoint (backup to webhooks)
2. Using idempotency checks to prevent double-crediting
3. Both webhook and verify endpoint can add credits, but only once

The flow becomes:
- User pays → returns to success page → verify endpoint checks AND adds credits
- Webhook arrives → checks if credits already added → skips if yes, adds if no
