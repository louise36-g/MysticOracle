/**
 * Webhooks Routes
 * Handles webhooks from Stripe, PayPal, and Clerk
 * Dependencies injected via DI container
 *
 * NOTE: Webhook routes intentionally keep specific try/catch blocks
 * where external services (Stripe, Clerk, PayPal) require particular
 * status codes for their retry logic.
 */

import { Router, raw, json } from 'express';
import { Webhook } from 'svix';
import prisma from '../db/prisma.js';

import { CREDIT_COSTS } from '../services/CreditService.js';
import { debug, logger } from '../lib/logger.js';

// Clerk webhook payload types
interface ClerkWebhookData {
  id: string;
  username?: string;
  first_name?: string;
  email_addresses?: Array<{ email_address: string }>;
  deleted?: boolean;
}

interface ClerkWebhookPayload {
  type: string;
  data: ClerkWebhookData;
}

const router = Router();

// ============================================
// STRIPE WEBHOOKS
// ============================================

router.post('/stripe', raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const processPaymentWebhookUseCase = req.container.resolve('processPaymentWebhookUseCase');

    const result = await processPaymentWebhookUseCase.execute({
      provider: 'stripe',
      payload: req.body,
      signature: sig,
    });

    if (!result.success && !result.processed) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('[Webhook] Stripe processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================
// CLERK WEBHOOKS (User management - not payment related)
// ============================================

router.post('/clerk', raw({ type: 'application/json' }), async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Verify webhook signature
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing svix headers' });
  }

  // Signature verification must use try/catch to return 400 to Clerk
  let payload: ClerkWebhookPayload;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    payload = wh.verify(req.body.toString(), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookPayload;
  } catch (err) {
    logger.error('Clerk webhook verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const eventType = payload.type;
  const data = payload.data;

  switch (eventType) {
    case 'user.created': {
      // Individual event handling uses try/catch to avoid failing the whole webhook
      try {
        const username = data.username || data.first_name || `user_${data.id.slice(-8)}`;
        const referralCode = generateReferralCode(username);

        // Create user first (without credits)
        const email = data.email_addresses?.[0]?.email_address || '';
        await prisma.user.create({
          data: {
            id: data.id,
            email,
            username,
            referralCode,
            credits: 0,
            isAdmin: false,
          },
        });

        // Add welcome bonus using CreditService from DI container
        const creditService = req.container.resolve('creditService');
        await creditService.addCredits({
          userId: data.id,
          amount: CREDIT_COSTS.WELCOME_BONUS,
          type: 'ACHIEVEMENT',
          description: 'Welcome bonus',
        });

        logger.info(`User created: ${data.id}`);
      } catch (error) {
        logger.error('Error creating user:', error);
      }
      break;
    }

    case 'user.updated': {
      try {
        await prisma.user.update({
          where: { id: data.id },
          data: {
            email: data.email_addresses?.[0]?.email_address,
            username: data.username,
          },
        });
      } catch (error) {
        logger.error('Error updating user:', error);
      }
      break;
    }

    case 'user.deleted': {
      try {
        await prisma.user.update({
          where: { id: data.id },
          data: {
            accountStatus: 'SUSPENDED',
            email: `deleted_${data.id}@deleted.local`,
            username: `deleted_${data.id}`,
          },
        });
      } catch (error) {
        logger.error('Error deleting user:', error);
      }
      break;
    }

    default:
      debug.log(`Unhandled Clerk event type: ${eventType}`);
  }

  res.json({ received: true });
});

// ============================================
// PAYPAL WEBHOOKS
// ============================================

router.post('/paypal', json(), async (req, res) => {
  try {
    const headers: Record<string, string> = {
      'paypal-auth-algo': (req.headers['paypal-auth-algo'] as string) || '',
      'paypal-cert-url': (req.headers['paypal-cert-url'] as string) || '',
      'paypal-transmission-id': (req.headers['paypal-transmission-id'] as string) || '',
      'paypal-transmission-sig': (req.headers['paypal-transmission-sig'] as string) || '',
      'paypal-transmission-time': (req.headers['paypal-transmission-time'] as string) || '',
    };

    const processPaymentWebhookUseCase = req.container.resolve('processPaymentWebhookUseCase');

    const result = await processPaymentWebhookUseCase.execute({
      provider: 'paypal',
      payload: JSON.stringify(req.body),
      signature: '', // PayPal uses headers for verification
      headers,
    });

    if (!result.success && !result.processed) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('[Webhook] PayPal processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper function to generate referral code
function generateReferralCode(username: string): string {
  const base = username.slice(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${random}`;
}

export default router;
