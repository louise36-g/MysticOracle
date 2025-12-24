import { Router } from 'express';
import Stripe from 'stripe';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Credit packages
const CREDIT_PACKAGES = [
  { id: 'pack_10', credits: 10, priceEur: 2.99, name: '10 Credits' },
  { id: 'pack_25', credits: 25, priceEur: 5.99, name: '25 Credits' },
  { id: 'pack_50', credits: 50, priceEur: 9.99, name: '50 Credits' },
  { id: 'pack_100', credits: 100, priceEur: 17.99, name: '100 Credits' },
];

// Get available credit packages
router.get('/packages', (req, res) => {
  res.json(CREDIT_PACKAGES);
});

// Create Stripe checkout session
router.post('/stripe/checkout', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { packageId, useStripeLink = false } = req.body;

    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!creditPackage) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    // Get user email for Stripe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: useStripeLink
        ? ['card', 'link']
        : ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: creditPackage.name,
              description: `${creditPackage.credits} credits for MysticOracle`,
            },
            unit_amount: Math.round(creditPackage.priceEur * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        packageId: creditPackage.id,
        credits: creditPackage.credits.toString(),
      },
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled`,
    });

    // Create pending transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'PURCHASE',
        amount: creditPackage.credits,
        description: `Purchase: ${creditPackage.name}`,
        paymentProvider: useStripeLink ? 'STRIPE_LINK' : 'STRIPE',
        paymentId: session.id,
        paymentAmount: creditPackage.priceEur,
        currency: 'EUR',
        paymentStatus: 'PENDING'
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Verify Stripe payment
router.get('/stripe/verify/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      res.json({
        success: true,
        credits: parseInt(session.metadata?.credits || '0')
      });
    } else {
      res.json({
        success: false,
        status: session.payment_status
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Create PayPal order
router.post('/paypal/order', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { packageId } = req.body;

    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!creditPackage) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    // PayPal API call would go here
    // For now, return a placeholder
    // You'll need to integrate the PayPal SDK

    const paypalOrderId = `PP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create pending transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'PURCHASE',
        amount: creditPackage.credits,
        description: `Purchase: ${creditPackage.name}`,
        paymentProvider: 'PAYPAL',
        paymentId: paypalOrderId,
        paymentAmount: creditPackage.priceEur,
        currency: 'EUR',
        paymentStatus: 'PENDING'
      }
    });

    res.json({
      orderId: paypalOrderId,
      // Include PayPal approval URL here
      message: 'PayPal integration requires PayPal SDK setup'
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// Get user's purchase history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    const purchases = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'PURCHASE',
        paymentStatus: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
});

export default router;
