/**
 * IPaymentGateway - Payment gateway interface
 * Abstracts payment provider operations (Stripe, PayPal, etc.)
 */

// Credit package definition
export interface CreditPackage {
  id: string;
  credits: number;
  bonusCredits?: number; // Free bonus credits (e.g., "10 + 2 FREE")
  priceEur: number;
  name: string;
  nameEn: string;
  nameFr: string;
  labelEn: string;
  labelFr: string;
  discount: number;
  badge: string | null;
}

// Checkout session parameters
export interface CheckoutParams {
  userId: string;
  userEmail: string;
  packageId: string;
  creditPackage: CreditPackage;
  successUrl: string;
  cancelUrl: string;
}

// Checkout session result
export interface CheckoutSession {
  sessionId: string;
  url: string | null;
  provider: 'STRIPE' | 'STRIPE_LINK' | 'PAYPAL';
}

// Payment capture parameters (for PayPal)
export interface CaptureParams {
  orderId: string;
  userId: string;
}

// Payment capture result
export interface CaptureResult {
  success: boolean;
  credits?: number;
  captureId?: string;
  error?: string;
}

// Webhook event types
export type WebhookEventType =
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.refunded'
  | 'session.expired';

// Webhook verification result
export interface WebhookEvent {
  type: WebhookEventType;
  paymentId: string;
  userId?: string;
  credits?: number;
  amount?: number;
  currency?: string;
  rawEvent: unknown;
}

// Payment verification result
export interface PaymentVerification {
  success: boolean;
  credits?: number;
  status?: string;
}

/**
 * Payment Gateway Interface
 * Each payment provider implements this interface
 */
export interface IPaymentGateway {
  /**
   * Unique identifier for this gateway
   */
  readonly provider: 'STRIPE' | 'STRIPE_LINK' | 'PAYPAL';

  /**
   * Check if the gateway is configured and available
   */
  isConfigured(): boolean;

  /**
   * Create a checkout session for payment
   */
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession>;

  /**
   * Verify a payment was successful (for redirect-based flows)
   */
  verifyPayment(sessionId: string): Promise<PaymentVerification>;

  /**
   * Verify webhook signature and parse event
   */
  verifyWebhook(
    payload: Buffer | string,
    signature: string,
    headers?: Record<string, string>
  ): Promise<WebhookEvent | null>;

  /**
   * Capture a payment (for PayPal order flow)
   * Optional - not all gateways require this
   */
  capturePayment?(params: CaptureParams): Promise<CaptureResult>;
}

export default IPaymentGateway;
