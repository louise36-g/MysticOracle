import { Router, raw } from 'express';
import Stripe from 'stripe';
import { Webhook } from 'svix';
import prisma from '../db/prisma.js';
import { sendWelcomeEmail, sendPurchaseConfirmation } from '../services/email.js';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

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
        const referralCode = generateReferralCode(data.username || data.id);

        await prisma.user.create({
          data: {
            id: data.id,
            email: data.email_addresses[0]?.email_address || '',
            username: data.username || `user_${data.id.slice(-8)}`,
            referralCode,
            credits: 10, // Welcome bonus
            isAdmin: (data.username?.toLowerCase() === 'mooks') // Auto-admin for Mooks
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
        const username = data.username || data.first_name || 'User';
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

// Helper function to generate referral code
function generateReferralCode(username: string): string {
  const base = username.slice(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${random}`;
}

export default router;
