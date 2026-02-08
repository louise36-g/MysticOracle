# CelestiArcana Credit System

> Comprehensive documentation for the credit system architecture, costs, bonuses, and best practices.

---

## Overview

Credits are the primary currency in CelestiArcana. Users spend credits to receive tarot readings, and can earn credits through daily bonuses, purchases, or achievements.

**Key Principles:**
1. **Backend Authority**: All credit costs are calculated server-side - never trust frontend values
2. **Atomic Transactions**: All credit operations use database transactions to prevent race conditions
3. **Audit Trail**: Every credit change creates a transaction record for accountability
4. **Consistent Validation**: Frontend validates for UX, backend enforces for security

---

## Credit Costs

### Tarot Readings (Spread Types)

| Spread Type | Cards | Credits | Description |
|-------------|-------|---------|-------------|
| SINGLE | 1 | 1 | Quick single card reading |
| THREE_CARD | 3 | 3 | Past, Present, Future |
| LOVE | 5 | 5 | Relationship focus |
| CAREER | 5 | 5 | Career guidance |
| HORSESHOE | 7 | 7 | Comprehensive 7-card spread |
| CELTIC_CROSS | 10 | 10 | Full Celtic Cross spread |

### Additional Costs

| Feature | Credits | Notes |
|---------|---------|-------|
| Follow-up question | 1 | After a reading |
| Summarize question | 1 | AI-powered question compression |
| Advanced interpretation style | +1 | Per reading (optional) |
| Extended question | +1 | Per reading (optional) |

### Source of Truth

All costs are defined in `server/src/services/CreditService.ts`:

```typescript
export const CREDIT_COSTS = {
  SPREAD: {
    SINGLE: 1,
    THREE_CARD: 3,
    LOVE: 5,
    CAREER: 5,
    HORSESHOE: 7,
    CELTIC_CROSS: 10,
  },
  FOLLOW_UP: 1,
  SUMMARIZE_QUESTION: 1,
  WELCOME_BONUS: 3,
  DAILY_BONUS_BASE: 2,
  WEEKLY_STREAK_BONUS: 5,
} as const;
```

---

## Earning Credits

### 1. Welcome Bonus

New users receive **3 free credits** upon account creation.

- Triggered by: Clerk webhook on user creation
- Transaction type: `WELCOME_BONUS`
- One-time only

### 2. Daily Login Bonus

Users can claim a daily bonus every calendar day.

| Condition | Credits |
|-----------|---------|
| Daily claim | 2 |
| 7-day streak bonus | +5 |

**Streak Logic:**
- Consecutive days are tracked via `loginStreak` field
- If user misses a day, streak resets to 1
- Every 7th consecutive day adds 5 bonus credits (total 7 that day)

**API Endpoint:** `POST /api/v1/users/me/daily-bonus`

**Implementation:** `server/src/routes/users/bonus.ts`

### 3. Purchases

Users can buy credit packages via Stripe or PayPal.

| Package | Credits | Price (EUR) |
|---------|---------|-------------|
| Starter | 10 | 4.99 |
| Popular | 30 | 9.99 |
| Best Value | 100 | 24.99 |

**Payment Flow:**
1. User selects package in CreditShop
2. Frontend creates checkout session via `/api/v1/payments/stripe/checkout`
3. User completes payment on Stripe/PayPal
4. Webhook receives confirmation
5. Backend adds credits atomically
6. User sees updated balance

### 4. Achievements

Users earn credits by unlocking achievements.

| Achievement | Reward | Trigger |
|-------------|--------|---------|
| First Reading | 2 | Complete first tarot reading |
| 7-Day Streak | 5 | Login 7 consecutive days |
| Deep Seeker | 3 | Complete 10 readings |
| Master Reader | 10 | Complete 50 readings |
| ... | ... | See AchievementService |

### 5. Referrals

Future feature - referral credits not yet implemented.

### 6. Admin Adjustments

Admins can manually adjust user credits for:
- Support issues
- Refunds
- Promotions

**API:** `POST /api/v1/admin/users/:id/credits`

---

## Architecture

### CreditService

The `CreditService` class centralizes all credit operations:

```
server/src/services/CreditService.ts
├── getBalance(userId)           # Get current balance
├── checkSufficientCredits()     # Validate before operation
├── calculateReadingCost()       # Server-side cost calculation
├── deductCredits()              # Spend credits
├── addCredits()                 # Earn credits
├── adjustCredits()              # Admin operations
├── processRefund()              # Payment refunds
└── refundCredits()              # Operation failures
```

### Transaction Types

```typescript
enum TransactionType {
  PURCHASE      // Bought credits
  READING       // Spent on reading
  FOLLOW_UP     // Spent on follow-up question
  DAILY_BONUS   // Daily login reward
  WELCOME_BONUS // New user bonus
  REFUND        // Refunded credits
  ADJUSTMENT    // Admin adjustment
}
```

### Database Schema

```prisma
model User {
  id                String   @id
  credits           Int      @default(3)
  totalCreditsEarned Int     @default(0)
  totalCreditsSpent  Int     @default(0)
  loginStreak       Int      @default(0)
  lastLoginDate     DateTime @default(now())
}

model Transaction {
  id              String          @id @default(cuid())
  userId          String
  type            TransactionType
  amount          Int             // Positive=add, Negative=deduct
  description     String
  paymentProvider String?
  paymentId       String?
  paymentAmount   Float?
  paymentStatus   String?
  createdAt       DateTime        @default(now())
}
```

---

## Race Condition Prevention

### Problem
Concurrent requests could allow spending more credits than available:
1. Request A checks balance: 5 credits
2. Request B checks balance: 5 credits
3. Request A deducts 5: success (0 remaining)
4. Request B deducts 5: should fail but might succeed

### Solution: Prisma Transactions

All credit operations use `prisma.$transaction()` for atomicity:

```typescript
const [transaction, updatedUser] = await this.prisma.$transaction([
  this.prisma.transaction.create({ ... }),
  this.prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: amount } },
  }),
]);
```

The `decrement` operation is atomic at the database level, preventing double-spending.

### Additional Safeguards

1. **Balance check before deduction**: Always verify sufficient credits
2. **Idempotency keys**: Payment webhooks use idempotency to prevent duplicate processing
3. **Transaction logging**: Every operation creates an audit trail

---

## Frontend Integration

### Validation (UX Only)

Frontend validates credits for immediate user feedback:

```typescript
const canAfford = user.credits >= readingCost;
if (!canAfford) {
  showCreditShop();
  return;
}
```

**Important:** This is for UX only. Backend always re-validates.

### Credit Display

```typescript
// In Header.tsx
<button onClick={() => setShowCreditShop(true)}>
  <Coins /> {user.credits}
</button>
```

### After Operations

Always refresh user data after credit-consuming operations:

```typescript
const result = await createReading(params);
if (result.success) {
  await refreshUser(); // Updates credit balance
}
```

---

## API Endpoints

### Check Balance
```
GET /api/v1/users/me
Response: { credits: number, ... }
```

### Create Reading (Deducts Credits)
```
POST /api/v1/readings
Body: { spreadType, question, ... }
Response: { success, creditCost, newBalance, ... }
```

### Claim Daily Bonus
```
POST /api/v1/users/me/daily-bonus
Response: { creditsAwarded, newBalance, streak, ... }
```

### Purchase Credits
```
POST /api/v1/payments/stripe/checkout
Body: { packageId }
Response: { sessionUrl }
```

### Admin: Adjust Credits
```
POST /api/v1/admin/users/:id/credits
Body: { amount, reason }
Response: { success, newBalance }
```

---

## Error Handling

### Insufficient Credits

```typescript
// Backend returns
{ error: 'Insufficient credits: have 2, need 5' }

// Frontend shows
'You need 3 more credits for this reading'
```

### Already Claimed (Daily Bonus)

```typescript
// 409 Conflict
{ error: 'Daily bonus already claimed for today' }
```

### Payment Webhook Failures

If a payment succeeds but webhook fails:
1. User doesn't receive credits immediately
2. Stripe retries webhook (up to 3 times)
3. Manual reconciliation possible via admin panel

---

## Testing

### Unit Tests

Located in `server/src/__tests__/services/CreditService.test.ts`:

- `should deduct credits successfully`
- `should reject insufficient credits`
- `should handle concurrent deductions safely`
- `should refund credits on operation failure`

### Concurrent Tests

Located in `server/src/__tests__/services/CreditService.concurrent.test.ts`:

Tests race condition handling with parallel requests.

### Integration Tests

Payment webhook tests in `server/src/__tests__/use-cases/ProcessPaymentWebhook.test.ts`.

---

## Monitoring

### Key Metrics

1. **Credits purchased per day** - Revenue indicator
2. **Credits spent per day** - Engagement indicator
3. **Failed deductions** - Potential UX issues
4. **Refund rate** - Quality indicator

### Logging

All credit operations log to console:

```
[CreditService] Deducted 5 credits from user xyz. New balance: 15. Transaction: abc123
[CreditService] Added 2 credits to user xyz. New balance: 17. Transaction: def456
```

### Alerts

Consider setting up alerts for:
- Unusual refund volume
- Failed webhook processing
- Negative credit balances (should never happen)

---

## Best Practices

### For Developers

1. **Never trust frontend credit values** - Always recalculate server-side
2. **Use CreditService** - Don't manipulate credits directly via Prisma
3. **Handle failures gracefully** - Refund credits if operation fails after deduction
4. **Test concurrent scenarios** - Use the concurrent test suite

### For Operations

1. **Monitor webhook failures** - Set up Stripe webhook event alerts
2. **Regular reconciliation** - Compare Stripe records with transaction table
3. **Admin audit log** - Track all manual adjustments

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01 | Centralized CreditService implemented |
| 2026-01 | Atomic transactions added |
| 2026-01 | Achievement rewards integrated |
| 2026-02 | Documentation created |
