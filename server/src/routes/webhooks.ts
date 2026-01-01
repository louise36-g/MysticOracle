import { Router, raw, json } from 'express';
import Stripe from 'stripe';
import { Webhook } from 'svix';
import crypto from 'crypto';
import prisma from '../db/prisma.js';
import { sendWelcomeEmail, sendPurchaseConfirmation } from '../services/email.js';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// PayPal API base URLs
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// ============================================
// STRIPE WEBHOOKS
// ============================================

router.post('/stripe', raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === 'paid') {
        const userId = session.metadata?.userId;
        const credits = parseInt(session.metadata?.credits || '0');

        if (userId && credits > 0) {
          try {
            // IDEMPOTENCY CHECK: Check if already processed
            const existingTx = await prisma.transaction.findFirst({
              where: {
                paymentId: session.id,
                paymentStatus: 'COMPLETED'
              }
            });

            if (existingTx) {
              console.log(`⏭️ Stripe webhook already processed for session ${session.id}`);
              break;
            }

            // Update user credits and transaction
            const [updatedUser] = await prisma.$transaction([
              prisma.user.update({
                where: { id: userId },
                data: {
                  credits: { increment: credits },
                  totalCreditsEarned: { increment: credits }
                }
              }),
              prisma.transaction.updateMany({
                where: { paymentId: session.id },
                data: { paymentStatus: 'COMPLETED' }
              })
            ]);

            console.log(`✅ Credits added: ${credits} for user ${userId}`);

            // Send purchase confirmation email (non-blocking)
            const amount = (session.amount_total || 0) / 100; // Convert from cents
            sendPurchaseConfirmation(
              updatedUser.email,
              updatedUser.username,
              credits,
              amount,
              updatedUser.credits,
              (updatedUser.language as 'en' | 'fr') || 'en'
            ).catch(err => console.error('Failed to send purchase email:', err));
          } catch (error) {
            console.error('Error processing payment:', error);
          }
        }
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;

      // Mark transaction as failed
      await prisma.transaction.updateMany({
        where: { paymentId: session.id },
        data: { paymentStatus: 'FAILED' }
      });
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;

      // IDEMPOTENCY CHECK: Check if refund already processed
      const existingRefund = await prisma.transaction.findFirst({
        where: {
          paymentId: charge.id,
          type: 'REFUND'
        }
      });

      if (existingRefund) {
        console.log(`⏭️ Refund already processed for charge ${charge.id}`);
        break;
      }

      // Find the original transaction and create refund
      const originalTx = await prisma.transaction.findFirst({
        where: {
          paymentId: charge.payment_intent as string,
          paymentStatus: 'COMPLETED'
        }
      });

      if (originalTx) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: originalTx.userId },
            data: {
              credits: { decrement: originalTx.amount },
              totalCreditsEarned: { decrement: originalTx.amount }
            }
          }),
          prisma.transaction.create({
            data: {
              userId: originalTx.userId,
              type: 'REFUND',
              amount: -originalTx.amount,
              description: 'Payment refunded',
              paymentProvider: originalTx.paymentProvider,
              paymentId: charge.id,
              paymentStatus: 'REFUNDED'
            }
          })
        ]);
        console.log(`✅ Refund processed for charge ${charge.id}`);
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  res.json({ received: true });
});

// ============================================
// CLERK WEBHOOKS
// ============================================

router.post('/clerk', raw({ type: 'application/json' }), async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Verify webhook signature
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing svix headers' });
  }

  let payload: any;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    payload = wh.verify(req.body.toString(), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Clerk webhook verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const eventType = payload.type;
  const data = payload.data;

  switch (eventType) {
    case 'user.created': {
      // Create user in our database when they sign up via Clerk
      try {
        // Use username, or first_name, or fallback to user_id
        const username = data.username || data.first_name || `user_${data.id.slice(-8)}`;
        const referralCode = generateReferralCode(username);

        await prisma.user.create({
          data: {
            id: data.id,
            email: data.email_addresses[0]?.email_address || '',
            username,
            referralCode,
            credits: 10, // Welcome bonus
            isAdmin: false // Admin status must be set explicitly via database
          }
        });

        // Create welcome bonus transaction
        await prisma.transaction.create({
          data: {
            userId: data.id,
            type: 'ACHIEVEMENT',
            amount: 10,
            description: 'Welcome bonus'
          }
        });

        console.log(`✅ User created: ${data.id}`);

        // Send welcome email (non-blocking)
        const email = data.email_addresses[0]?.email_address;
        if (email) {
          sendWelcomeEmail(email, username, 'en').catch(err =>
            console.error('Failed to send welcome email:', err)
          );
        }
      } catch (error) {
        console.error('Error creating user:', error);
      }
      break;
    }

    case 'user.updated': {
      // Sync user updates
      try {
        await prisma.user.update({
          where: { id: data.id },
          data: {
            email: data.email_addresses[0]?.email_address,
            username: data.username
          }
        });
      } catch (error) {
        console.error('Error updating user:', error);
      }
      break;
    }

    case 'user.deleted': {
      // Handle user deletion (soft delete or anonymize)
      try {
        await prisma.user.update({
          where: { id: data.id },
          data: {
            accountStatus: 'SUSPENDED',
            email: `deleted_${data.id}@deleted.local`,
            username: `deleted_${data.id}`
          }
        });
      } catch (error) {
        console.error('Error deleting user:', error);
      }
      break;
    }

    default:
      console.log(`Unhandled Clerk event type: ${eventType}`);
  }

  res.json({ received: true });
});

// ============================================
// PAYPAL WEBHOOKS
// ============================================

// Helper to verify PayPal webhook signature
async function verifyPayPalWebhook(
  webhookId: string,
  eventBody: any,
  headers: Record<string, string>
): Promise<boolean> {
  try {
    // Get PayPal access token
    const authString = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      console.error('Failed to get PayPal access token');
      return false;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Verify webhook signature with PayPal
    const verifyRes = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: eventBody,
      }),
    });

    if (!verifyRes.ok) {
      console.error('PayPal webhook verification request failed');
      return false;
    }

    const verifyData = await verifyRes.json();
    return verifyData.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('PayPal webhook verification error:', error);
    return false;
  }
}

router.post('/paypal', json(), async (req, res) => {
  const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

  if (!PAYPAL_WEBHOOK_ID) {
    console.error('Missing PAYPAL_WEBHOOK_ID - PayPal webhooks not configured');
    return res.status(500).json({ error: 'PayPal webhooks not configured' });
  }

  // Extract headers for verification
  const headers: Record<string, string> = {
    'paypal-auth-algo': req.headers['paypal-auth-algo'] as string || '',
    'paypal-cert-url': req.headers['paypal-cert-url'] as string || '',
    'paypal-transmission-id': req.headers['paypal-transmission-id'] as string || '',
    'paypal-transmission-sig': req.headers['paypal-transmission-sig'] as string || '',
    'paypal-transmission-time': req.headers['paypal-transmission-time'] as string || '',
  };

  // Verify webhook signature
  const isValid = await verifyPayPalWebhook(PAYPAL_WEBHOOK_ID, req.body, headers);
  if (!isValid) {
    console.error('PayPal webhook signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  const eventType = event.event_type;

  switch (eventType) {
    case 'CHECKOUT.ORDER.APPROVED':
    case 'PAYMENT.CAPTURE.COMPLETED': {
      const resource = event.resource;
      const orderId = resource.id || resource.supplementary_data?.related_ids?.order_id;

      if (!orderId) {
        console.error('No order ID in PayPal webhook');
        break;
      }

      // IDEMPOTENCY CHECK: Check if already processed
      const existingTx = await prisma.transaction.findFirst({
        where: {
          paymentId: orderId,
          paymentStatus: 'COMPLETED'
        }
      });

      if (existingTx) {
        console.log(`⏭️ PayPal webhook already processed for order ${orderId}`);
        break;
      }

      // Find the pending transaction
      const pendingTx = await prisma.transaction.findFirst({
        where: {
          paymentId: orderId,
          paymentStatus: 'PENDING'
        }
      });

      if (pendingTx) {
        // Get the credit package to verify credits (don't trust client data)
        const creditPackage = await prisma.creditPackage.findFirst({
          where: { id: pendingTx.description?.replace('Credit package: ', '') || '' }
        });

        const credits = creditPackage?.credits || pendingTx.amount;

        // Update user credits and transaction
        const [updatedUser] = await prisma.$transaction([
          prisma.user.update({
            where: { id: pendingTx.userId },
            data: {
              credits: { increment: credits },
              totalCreditsEarned: { increment: credits }
            }
          }),
          prisma.transaction.update({
            where: { id: pendingTx.id },
            data: {
              paymentStatus: 'COMPLETED',
              amount: credits
            }
          })
        ]);

        console.log(`✅ PayPal: Credits added: ${credits} for user ${pendingTx.userId}`);

        // Send purchase confirmation email (non-blocking)
        const amount = Number(pendingTx.paymentAmount) || 0;
        sendPurchaseConfirmation(
          updatedUser.email,
          updatedUser.username,
          credits,
          amount,
          updatedUser.credits,
          (updatedUser.language as 'en' | 'fr') || 'en'
        ).catch(err => console.error('Failed to send purchase email:', err));
      }
      break;
    }

    case 'PAYMENT.CAPTURE.DENIED':
    case 'PAYMENT.CAPTURE.REFUNDED': {
      const resource = event.resource;
      const captureId = resource.id;

      if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
        // IDEMPOTENCY CHECK for refunds
        const existingRefund = await prisma.transaction.findFirst({
          where: {
            paymentId: captureId,
            type: 'REFUND'
          }
        });

        if (existingRefund) {
          console.log(`⏭️ PayPal refund already processed for capture ${captureId}`);
          break;
        }

        // Find original transaction and create refund
        const originalTx = await prisma.transaction.findFirst({
          where: {
            paymentProvider: 'PAYPAL',
            paymentStatus: 'COMPLETED'
          }
        });

        if (originalTx) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: originalTx.userId },
              data: {
                credits: { decrement: originalTx.amount },
                totalCreditsEarned: { decrement: originalTx.amount }
              }
            }),
            prisma.transaction.create({
              data: {
                userId: originalTx.userId,
                type: 'REFUND',
                amount: -originalTx.amount,
                description: 'PayPal payment refunded',
                paymentProvider: 'PAYPAL',
                paymentId: captureId,
                paymentStatus: 'REFUNDED'
              }
            })
          ]);
          console.log(`✅ PayPal refund processed for capture ${captureId}`);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled PayPal event type: ${eventType}`);
  }

  res.json({ received: true });
});

// Helper function to generate referral code
function generateReferralCode(username: string): string {
  const base = username.slice(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${random}`;
}

export default router;
