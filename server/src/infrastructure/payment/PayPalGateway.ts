/**
 * PayPalGateway - PayPal implementation of IPaymentGateway
 */

import {
  Client,
  Environment,
  OrdersController,
  CheckoutPaymentIntent,
  OrderApplicationContextLandingPage,
  OrderApplicationContextUserAction,
  Order,
  ApiError,
} from '@paypal/paypal-server-sdk';
import type {
  IPaymentGateway,
  CheckoutParams,
  CheckoutSession,
  PaymentVerification,
  WebhookEvent,
  CaptureParams,
  CaptureResult,
} from '../../application/ports/services/IPaymentGateway.js';

export class PayPalGateway implements IPaymentGateway {
  readonly provider = 'PAYPAL' as const;
  private client: Client | null = null;
  private ordersController: OrdersController | null = null;
  private webhookId: string | null = null;
  private apiBase: string;

  constructor(
    private clientId: string | undefined,
    private clientSecret: string | undefined,
    webhookId: string | undefined,
    isLive: boolean = false
  ) {
    this.webhookId = webhookId || null;
    this.apiBase = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    if (clientId && clientSecret) {
      this.client = new Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: clientId,
          oAuthClientSecret: clientSecret,
        },
        environment: isLive ? Environment.Production : Environment.Sandbox,
      });
      this.ordersController = new OrdersController(this.client);
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.ordersController !== null;
  }

  async createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession> {
    if (!this.ordersController) {
      throw new Error('PayPal is not configured');
    }

    const { body } = await this.ordersController.createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            amount: {
              currencyCode: 'EUR',
              value: params.creditPackage.priceEur.toFixed(2),
            },
            description: `${params.creditPackage.credits} credits for MysticOracle`,
            customId: JSON.stringify({
              userId: params.userId,
              packageId: params.creditPackage.id,
              credits: params.creditPackage.credits,
            }),
          },
        ],
        applicationContext: {
          brandName: 'MysticOracle',
          landingPage: OrderApplicationContextLandingPage.Login,
          userAction: OrderApplicationContextUserAction.PayNow,
          returnUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
        },
      },
    });

    const order: Order = typeof body === 'string' ? JSON.parse(body) : body;
    const approvalUrl = order.links?.find(link => link.rel === 'approve')?.href;

    if (!approvalUrl) {
      throw new Error('PayPal did not return an approval URL');
    }

    return {
      sessionId: order.id!,
      url: approvalUrl,
      provider: 'PAYPAL',
    };
  }

  async verifyPayment(orderId: string): Promise<PaymentVerification> {
    if (!this.ordersController) {
      throw new Error('PayPal is not configured');
    }

    try {
      const { body } = await this.ordersController.getOrder({ id: orderId });
      const order: Order = typeof body === 'string' ? JSON.parse(body) : body;

      if (order.status === 'COMPLETED' || order.status === 'APPROVED') {
        // Parse custom data for credits
        let credits = 0;
        const customId = order.purchaseUnits?.[0]?.customId;
        if (customId) {
          try {
            const customData = JSON.parse(customId);
            credits = customData.credits || 0;
          } catch {
            // Ignore parse errors
          }
        }

        return {
          success: true,
          credits,
          status: order.status,
        };
      }

      return {
        success: false,
        status: order.status,
      };
    } catch (error) {
      console.error('PayPal verify payment error:', error);
      return {
        success: false,
        status: 'ERROR',
      };
    }
  }

  async capturePayment(params: CaptureParams): Promise<CaptureResult> {
    if (!this.ordersController) {
      throw new Error('PayPal is not configured');
    }

    try {
      const { body } = await this.ordersController.captureOrder({
        id: params.orderId,
      });

      const captureData: Order = typeof body === 'string' ? JSON.parse(body) : body;

      if (captureData.status === 'COMPLETED') {
        // Parse custom data to get credits
        // PayPal SDK types don't include nested payments structure after capture
        const purchaseUnit = captureData.purchaseUnits?.[0] as
          | (Record<string, unknown> & { customId?: string })
          | undefined;
        const payments = purchaseUnit?.payments as
          | { captures?: { customId?: string }[] }
          | undefined;
        const customId = payments?.captures?.[0]?.customId || purchaseUnit?.customId;

        let credits = 0;
        if (customId) {
          try {
            const customData = JSON.parse(customId);
            credits = customData.credits || 0;
          } catch {
            console.error('Failed to parse PayPal customId');
          }
        }

        return {
          success: true,
          credits,
          captureId: captureData.id,
        };
      }

      return {
        success: false,
        error: `Payment status: ${captureData.status}`,
      };
    } catch (error) {
      console.error('PayPal capture error:', error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'Failed to capture PayPal payment',
      };
    }
  }

  async verifyWebhook(
    payload: Buffer | string,
    _signature: string,
    headers?: Record<string, string>
  ): Promise<WebhookEvent | null> {
    if (!this.webhookId || !this.clientId || !this.clientSecret) {
      throw new Error('PayPal webhook is not configured');
    }

    // Verify webhook signature with PayPal
    const isValid = await this.verifyPayPalSignature(
      typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString()),
      headers || {}
    );

    if (!isValid) {
      console.error('PayPal webhook signature verification failed');
      return null;
    }

    const event =
      typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString());
    const eventType = event.event_type;

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const resource = event.resource;
        const orderId = resource.id || resource.supplementary_data?.related_ids?.order_id;

        if (!orderId) {
          return null;
        }

        return {
          type: 'payment.completed',
          paymentId: orderId,
          rawEvent: event,
        };
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        const resource = event.resource;
        return {
          type: 'payment.failed',
          paymentId: resource.id,
          rawEvent: event,
        };
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const resource = event.resource;
        return {
          type: 'payment.refunded',
          paymentId: resource.id,
          rawEvent: event,
        };
      }

      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
        return null;
    }
  }

  private async verifyPayPalSignature(
    eventBody: unknown,
    headers: Record<string, string>
  ): Promise<boolean> {
    try {
      // Get PayPal access token
      const authString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const tokenRes = await fetch(`${this.apiBase}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!tokenRes.ok) {
        console.error('Failed to get PayPal access token');
        return false;
      }

      const tokenData = (await tokenRes.json()) as { access_token: string };
      const accessToken = tokenData.access_token;

      // Verify webhook signature with PayPal
      const verifyRes = await fetch(`${this.apiBase}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: this.webhookId,
          webhook_event: eventBody,
        }),
      });

      if (!verifyRes.ok) {
        console.error('PayPal webhook verification request failed');
        return false;
      }

      const verifyData = (await verifyRes.json()) as { verification_status: string };
      return verifyData.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('PayPal webhook verification error:', error);
      return false;
    }
  }
}

export default PayPalGateway;
