# CelestiArcana Payment Flow

> Comprehensive documentation for the payment system including Stripe, PayPal, checkout flows, webhook handling, and credit delivery.

---

## Overview

CelestiArcana uses a credit-based system where users purchase credits to access readings. Payments are processed via **Stripe** (primary) and **PayPal** (alternative).

**Key Principles:**
1. **Backend Authority**: All credit delivery happens server-side via webhooks
2. **Idempotency**: Payment webhooks use idempotency keys to prevent double-crediting
3. **Clean Architecture**: Payment logic follows use-case pattern with dependency injection
4. **Atomic Transactions**: Credit additions use database transactions

---

## Credit Packages

| Package ID | Credits | Price (EUR) | Description |
|------------|---------|-------------|-------------|
| starter | 10 | €4.99 | Try it out |
| basic | 25 | €9.99 | Regular use |
| popular | 50 | €17.99 | Best value |
| value | 100 | €29.99 | Power user |
| premium | 250 | €59.99 | Maximum savings |

**Source of Truth:** `server/src/application/use-cases/payments/index.ts`

---

## Architecture

### Components

```
Frontend                    Backend                         External
─────────────────────────────────────────────────────────────────────
CreditShop.tsx       →   /payments/stripe/checkout    →   Stripe
                     →   /payments/paypal/order       →   PayPal

PaymentResult.tsx    ←   /payments/stripe/verify      ←   (polling)

                         /webhooks/stripe             ←   Stripe Webhook
                         /webhooks/paypal             ←   PayPal Webhook
```

### Use Cases

```
server/src/application/use-cases/payments/
├── CreateCheckoutUseCase.ts    # Create checkout sessions
├── CapturePaymentUseCase.ts    # Capture PayPal payments
├── ProcessPaymentWebhookUseCase.ts  # Handle webhooks
└── index.ts                    # Credit packages, exports
```

### Payment Gateways

```
server/src/infrastructure/payment/
├── StripeGateway.ts            # Stripe SDK wrapper
├── PayPalGateway.ts            # PayPal SDK wrapper
└── interfaces.ts               # Gateway contracts
```

---

## Stripe Payment Flow

### 1. Create Checkout Session

**Frontend:** User selects package in CreditShop

**API:** `POST /api/v1/payments/stripe/checkout`

```typescript
// Request
{
  packageId: 'popular',
  useStripeLink: false  // Optional: use Stripe Link for faster checkout
}

// Response
{
  sessionId: 'cs_test_xxx',
  url: 'https://checkout.stripe.com/...'
}
```

**Backend Flow:**
1. Validate package exists
2. Look up user in database
3. Create Stripe Checkout Session with:
   - Line item (package name, credits, price)
   - Success URL: `/payment/success?session_id={CHECKOUT_SESSION_ID}`
   - Cancel URL: `/payment/cancel`
   - Metadata: `userId`, `packageId`, `credits`
4. Return session URL

### 2. User Completes Payment

User is redirected to Stripe hosted checkout page. After payment:
- **Success:** Redirected to `/payment/success?session_id=xxx`
- **Cancel:** Redirected to `/payment/cancel`

### 3. Webhook Delivery (Credit Addition)

**Endpoint:** `POST /webhooks/stripe`

**Event:** `checkout.session.completed`

```typescript
// Webhook payload (simplified)
{
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_xxx',
      metadata: {
        userId: 'user_xxx',
        packageId: 'popular',
        credits: '50'
      },
      amount_total: 1799,
      payment_status: 'paid'
    }
  }
}
```

**Backend Flow:**
1. Verify Stripe signature
2. Check idempotency (prevent double-processing)
3. Extract metadata (userId, credits)
4. Add credits via CreditService (atomic transaction)
5. Create Transaction record
6. Return `{ received: true }`

### 4. Payment Verification (Frontend Polling)

**API:** `GET /api/v1/payments/stripe/verify/:sessionId`

```typescript
// Response
{
  status: 'complete',       // or 'pending', 'expired'
  paymentStatus: 'paid',
  credits: 50,
  amountTotal: 1799
}
```

Frontend polls this endpoint to show success UI before webhook completes.

---

## PayPal Payment Flow

### 1. Create PayPal Order

**API:** `POST /api/v1/payments/paypal/order`

```typescript
// Request
{ packageId: 'popular' }

// Response
{
  orderId: 'ORDER_xxx',
  approvalUrl: 'https://www.paypal.com/checkoutnow?token=xxx'
}
```

### 2. User Approves Payment

User is redirected to PayPal, logs in, and approves payment.

### 3. Capture Payment

After approval, user returns to frontend. Frontend calls:

**API:** `POST /api/v1/payments/paypal/capture`

```typescript
// Request (with Idempotency-Key header)
{ orderId: 'ORDER_xxx' }

// Response
{
  success: true,
  credits: 50,
  captureId: 'CAPTURE_xxx',
  newBalance: 75
}
```

**Note:** PayPal capture uses idempotency middleware to prevent double-crediting on retried requests.

### 4. PayPal Webhook (Backup)

**Endpoint:** `POST /webhooks/paypal`

**Event:** `PAYMENT.CAPTURE.COMPLETED`

PayPal webhooks provide backup credit delivery if the capture endpoint fails.

---

## Idempotency System

### Purpose

Prevent duplicate credit additions when:
- Webhooks are retried
- Network issues cause request retries
- User clicks "Pay" multiple times

### Implementation

**Middleware:** `server/src/middleware/idempotency.ts`

**Service:** `server/src/services/IdempotencyService.ts`

**Database:**
```prisma
model IdempotencyKey {
  key       String   @id
  userId    String
  result    Json?
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

### How It Works

1. Request includes `Idempotency-Key` header (or is generated)
2. Middleware checks if key exists in database
3. If exists: return cached result (no processing)
4. If not: process request, store result, return response

```typescript
// Example: PayPal capture with idempotency
POST /payments/paypal/capture
Headers: {
  'Idempotency-Key': 'paypal_capture_ORDER_xxx_user_yyy'
}
```

---

## Webhook Security

### Stripe Signature Verification

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### PayPal Signature Verification

PayPal uses certificate-based verification:
```typescript
// Headers required for verification
'paypal-auth-algo'
'paypal-cert-url'
'paypal-transmission-id'
'paypal-transmission-sig'
'paypal-transmission-time'
```

---

## Error Handling

### Insufficient Funds

If Stripe/PayPal payment fails, no webhook is sent. User sees error on checkout page.

### Webhook Failure

If webhook processing fails:
1. Return non-200 status
2. Provider retries webhook (up to 3 times for Stripe)
3. Manual reconciliation via admin panel if needed

### Network Timeout

Frontend shows "Payment processing..." and polls verification endpoint.

### Double-Payment Prevention

Idempotency keys prevent credit duplication even if:
- User refreshes success page
- Webhook is retried
- Capture endpoint called multiple times

---

## Testing

### Test Cards (Stripe)

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0341 | Declined (generic) |

### Test Mode

Set `STRIPE_SECRET_KEY` to test key (starts with `sk_test_`).

### Webhook Testing

Use Stripe CLI for local development:
```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
```

---

## Monitoring

### Key Metrics

1. **Payment Success Rate**: % of checkouts that complete
2. **Webhook Latency**: Time from payment to credit delivery
3. **Idempotency Hits**: Rate of duplicate requests caught
4. **Refund Rate**: % of payments refunded

### Logs

```
[Payments] Created checkout for user_xxx: cs_xxx (50 credits, €17.99)
[Webhook] Stripe checkout.session.completed for user_xxx
[CreditService] Added 50 credits to user_xxx. New balance: 75
```

---

## Refunds

### Process

1. Admin issues refund via Stripe/PayPal dashboard
2. Webhook `charge.refunded` (Stripe) or `PAYMENT.CAPTURE.REFUNDED` (PayPal)
3. Backend deducts credits (if still available)
4. Transaction record created with negative amount

### Partial Refunds

Partial refunds deduct proportional credits:
```
Refund 50% of 50-credit package → Deduct 25 credits
```

---

## Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx       # or sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# PayPal
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_MODE=live                    # or sandbox

# Frontend URL (for redirects)
FRONTEND_URL=https://celestiarcana.com
```

---

## API Reference

### Payments Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /payments/packages | No | List credit packages |
| POST | /payments/stripe/checkout | Yes | Create Stripe session |
| GET | /payments/stripe/verify/:id | Yes | Verify Stripe payment |
| POST | /payments/paypal/order | Yes | Create PayPal order |
| POST | /payments/paypal/capture | Yes | Capture PayPal payment |
| GET | /payments/history | Yes | User's purchase history |

### Webhook Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /webhooks/stripe | Signature | Stripe events |
| POST | /webhooks/paypal | Signature | PayPal events |

---

## Troubleshooting

### Credits Not Delivered

1. Check webhook logs for errors
2. Verify idempotency key wasn't already processed
3. Check Transaction table for existing record
4. Use admin panel to manually adjust credits if needed

### Duplicate Charges

1. Check idempotency key cache
2. Review Transaction table for duplicates
3. Issue refund for duplicate via provider dashboard

### Webhook Signature Failures

1. Verify webhook secret matches provider dashboard
2. Check raw body parsing (must use `raw({ type: 'application/json' })`)
3. Ensure no middleware modifies request body before signature check

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01 | Initial payment system with Stripe |
| 2026-01 | Added PayPal support |
| 2026-01 | Implemented idempotency system |
| 2026-02 | Documentation created |
