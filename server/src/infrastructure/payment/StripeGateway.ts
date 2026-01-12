/**
 * StripeGateway - Stripe implementation of IPaymentGateway
 */

import Stripe from 'stripe';
import type {
  IPaymentGateway,
  CheckoutParams,
  CheckoutSession,
  PaymentVerification,
  WebhookEvent,
  CaptureParams,
  CaptureResult,
} from '../../application/ports/services/IPaymentGateway.js';

export class StripeGateway implements IPaymentGateway {
  readonly provider: 'STRIPE' | 'STRIPE_LINK';
  private stripe: Stripe | null = null;
  private webhookSecret: string | null = null;

  constructor(
    private secretKey: string | undefined,
    webhookSecret: string | undefined,
    private useStripeLink: boolean = false
  ) {
    this.provider = useStripeLink ? 'STRIPE_LINK' : 'STRIPE';
    this.webhookSecret = webhookSecret || null;

    if (secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
    }
  }

  isConfigured(): boolean {
    return this.stripe !== null;
  }

  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: this.useStripeLink ? ['card', 'link'] : ['card'],
      mode: 'payment',
      customer_email: params.userEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: params.creditPackage.name,
              description: `${params.creditPackage.credits} credits for MysticOracle`,
            },
            unit_amount: Math.round(params.creditPackage.priceEur * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: params.userId,
        packageId: params.creditPackage.id,
        credits: params.creditPackage.credits.toString(),
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    return {
      sessionId: session.id,
      url: session.url,
      provider: this.provider,
    };
  }

  async verifyPayment(sessionId: string): Promise<PaymentVerification> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      return {
        success: true,
        credits: parseInt(session.metadata?.credits || '0'),
      };
    }

    return {
      success: false,
      status: session.payment_status,
    };
  }

  async verifyWebhook(
    payload: Buffer | string,
    signature: string
  ): Promise<WebhookEvent | null> {
    if (!this.stripe || !this.webhookSecret) {
      throw new Error('Stripe webhook is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err);
      return null;
    }

    // Map Stripe events to our generic event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status === 'paid') {
          return {
            type: 'payment.completed',
            paymentId: session.id,
            userId: session.metadata?.userId,
            credits: parseInt(session.metadata?.credits || '0'),
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || 'eur',
            rawEvent: event,
          };
        }
        return null;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          type: 'session.expired',
          paymentId: session.id,
          rawEvent: event,
        };
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        return {
          type: 'payment.refunded',
          paymentId: charge.payment_intent as string,
          rawEvent: event,
        };
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
        return null;
    }
  }

  // Stripe doesn't require explicit capture for checkout sessions
  async capturePayment(_params: CaptureParams): Promise<CaptureResult> {
    return {
      success: false,
      error: 'Stripe checkout does not require explicit capture',
    };
  }
}

export default StripeGateway;
