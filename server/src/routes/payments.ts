import { Router } from 'express';
import Stripe from 'stripe';
import {
  Client,
  Environment,
  OrdersController,
  LogLevel,
  ApiError,
  CheckoutPaymentIntent,
  OrderApplicationContextLandingPage,
  OrderApplicationContextUserAction,
  Order,
} from '@paypal/paypal-server-sdk';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Check for required environment variables
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const PAYPAL_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!STRIPE_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY not configured - Stripe payments will fail');
}
if (!PAYPAL_ID || !PAYPAL_SECRET) {
  console.warn('⚠️ PayPal credentials not configured - PayPal payments will fail');
}

// Initialize Stripe (only if key exists)
const stripe = STRIPE_KEY
  ? new Stripe(STRIPE_KEY, { apiVersion: '2023-10-16' })
  : null;

// Initialize PayPal (only if credentials exist)
const paypalClient = (PAYPAL_ID && PAYPAL_SECRET)
  ? new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_ID,
        oAuthClientSecret: PAYPAL_SECRET,
      },
      environment: process.env.PAYPAL_MODE === 'live'
        ? Environment.Production
        : Environment.Sandbox,
      logging: {
        logLevel: LogLevel.Info,
        logRequest: { logBody: true },
        logResponse: { logBody: true },
      },
    })
  : null;

const ordersController = paypalClient ? new OrdersController(paypalClient) : null;

// Credit packages
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    credits: 10,
    priceEur: 5.00,
    name: 'Starter',
    nameEn: 'Starter',
    nameFr: 'Démarrage',
    labelEn: 'Try It Out',
    labelFr: 'Essayez',
    discount: 0,
    badge: null,
  },
  {
    id: 'basic',
    credits: 25,
    priceEur: 10.00,
    name: 'Basic',
    nameEn: 'Basic',
    nameFr: 'Basique',
    labelEn: 'Popular',
    labelFr: 'Populaire',
    discount: 20,
    badge: null,
  },
  {
    id: 'popular',
    credits: 60,
    priceEur: 20.00,
    name: 'Popular',
    nameEn: 'Popular',
    nameFr: 'Populaire',
    labelEn: '⭐ MOST POPULAR',
    labelFr: '⭐ LE PLUS POPULAIRE',
    discount: 34,
    badge: 'popular',
  },
  {
    id: 'value',
    credits: 100,
    priceEur: 30.00,
    name: 'Value',
    nameEn: 'Value',
    nameFr: 'Avantage',
    labelEn: '💰 BEST VALUE',
    labelFr: '💰 MEILLEUR PRIX',
    discount: 40,
    badge: 'value',
  },
  {
    id: 'premium',
    credits: 200,
    priceEur: 50.00,
    name: 'Premium',
    nameEn: 'Premium',
    nameFr: 'Premium',
    labelEn: '👑 POWER USER',
    labelFr: '👑 UTILISATEUR PRO',
    discount: 50,
    badge: 'premium',
  },
];

// Get available credit packages
router.get('/packages', (req, res) => {
  res.json(CREDIT_PACKAGES);
});

// Create Stripe checkout session
router.post('/stripe/checkout', requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe payments not configured' });
    }

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
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe payments not configured' });
    }

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
    if (!ordersController) {
      return res.status(503).json({ error: 'PayPal payments not configured' });
    }

    const userId = req.auth.userId;
    const { packageId } = req.body;

    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!creditPackage) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    // Create PayPal order
    const { body } = await ordersController.createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            amount: {
              currencyCode: 'EUR',
              value: creditPackage.priceEur.toFixed(2),
            },
            description: `${creditPackage.credits} credits for MysticOracle`,
            customId: JSON.stringify({ userId, packageId: creditPackage.id, credits: creditPackage.credits }),
          },
        ],
        applicationContext: {
          brandName: 'MysticOracle',
          landingPage: OrderApplicationContextLandingPage.Login,
          userAction: OrderApplicationContextUserAction.PayNow,
          returnUrl: `${process.env.FRONTEND_URL}/payment/success?provider=paypal`,
          cancelUrl: `${process.env.FRONTEND_URL}/payment/cancelled`,
        },
      },
    });

    const order = body as Order;

    // Create pending transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'PURCHASE',
        amount: creditPackage.credits,
        description: `Purchase: ${creditPackage.name}`,
        paymentProvider: 'PAYPAL',
        paymentId: order.id!,
        paymentAmount: creditPackage.priceEur,
        currency: 'EUR',
        paymentStatus: 'PENDING'
      }
    });

    // Find approval URL
    const approvalUrl = order.links?.find(link => link.rel === 'approve')?.href;

    res.json({
      orderId: order.id,
      approvalUrl,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode || 500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create PayPal order' });
    }
  }
});

// Capture PayPal order (after user approves)
router.post('/paypal/capture', requireAuth, async (req, res) => {
  try {
    if (!ordersController) {
      return res.status(503).json({ error: 'PayPal payments not configured' });
    }

    const userId = req.auth.userId;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    // Capture the order
    const { body } = await ordersController.captureOrder({
      id: orderId,
    });

    const captureData = body as Order;

    if (captureData.status === 'COMPLETED') {
      // Parse custom data to get credits
      const customId = (captureData.purchaseUnits?.[0] as any)?.payments?.captures?.[0]?.customId
        || captureData.purchaseUnits?.[0]?.customId;

      let credits = 0;
      if (customId) {
        try {
          const customData = JSON.parse(customId);
          credits = customData.credits || 0;
        } catch {
          console.error('Failed to parse customId');
        }
      }

      // Update user credits and transaction
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            credits: { increment: credits },
            totalCreditsEarned: { increment: credits }
          }
        }),
        prisma.transaction.updateMany({
          where: { paymentId: orderId },
          data: { paymentStatus: 'COMPLETED' }
        })
      ]);

      res.json({
        success: true,
        credits,
        captureId: captureData.id,
      });
    } else {
      res.json({
        success: false,
        status: captureData.status,
      });
    }
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode || 500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to capture PayPal order' });
    }
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
