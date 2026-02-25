import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { scopePerRequest } from 'awilix-express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Sentry early (before other imports that might throw)
import { initSentry, getSentryErrorHandler } from './config/sentry.js';
initSentry();

// Validate environment variables (fail fast if misconfigured)
import { validateEnvOrExit } from './config/env.js';
validateEnvOrExit();

// Import DI container
import { createAppContainer } from './shared/di/container.js';

// Initialize DI container
const container = createAppContainer();

// Log container initialization
console.log('🔧 DI Container initialized');

// Debug: Check environment variables and payment gateway status
console.log('🔍 Environment variables check:');
console.log(
  `   - STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? 'SET (' + process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...)' : 'NOT SET'}`
);
console.log(`   - STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`   - PAYPAL_CLIENT_ID: ${process.env.PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`   - PAYPAL_CLIENT_SECRET: ${process.env.PAYPAL_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);

try {
  const stripeGateway = container.resolve('stripeGateway');
  const stripeLinkGateway = container.resolve('stripeLinkGateway');
  const paypalGateway = container.resolve('paypalGateway');
  console.log('💳 Payment gateways status:');
  console.log(
    `   - Stripe: ${stripeGateway ? (stripeGateway.isConfigured() ? 'configured' : 'not configured') : 'UNDEFINED'}`
  );
  console.log(
    `   - Stripe Link: ${stripeLinkGateway ? (stripeLinkGateway.isConfigured() ? 'configured' : 'not configured') : 'UNDEFINED'}`
  );
  console.log(
    `   - PayPal: ${paypalGateway ? (paypalGateway.isConfigured() ? 'configured' : 'not configured') : 'UNDEFINED'}`
  );
} catch (err) {
  console.error('❌ Error resolving payment gateways:', err);
}

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit auth-related requests
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit payment requests
  message: { error: 'Too many payment requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Very strict for sensitive operations
  message: { error: 'Rate limit exceeded, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Higher limit for admin operations
  message: { error: 'Admin rate limit exceeded, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Import routes
import healthRoutes from './routes/health.js';
import userRoutes from './routes/users/index.js';
import readingRoutes from './routes/readings.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';
import adminRoutes from './routes/admin/index.js';
import horoscopeRoutes from './routes/horoscopes/index.js';
import translationRoutes from './routes/translations/index.js';
import blogRoutes from './routes/blog/index.js';
import aiRoutes from './routes/ai/index.js';
import tarotArticleRoutes from './routes/tarot-articles/index.js';
import taxonomyRoutes from './routes/taxonomy.js';
import ssrRoutes from './routes/ssr.js';
import devRoutes from './routes/dev.js';
import promptRoutes from './routes/prompts.js';
import internalLinksRoutes from './routes/internal-links.js';
import yearEnergyRoutes from './routes/yearEnergy/index.js';
import contactRoutes from './routes/contact.js';
import { cleanupOldHoroscopes } from './jobs/cleanupHoroscopeCache.js';
import { createVersionedRouter } from './shared/versioning/createVersionedRouter.js';
import { Router } from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Parse FRONTEND_URL (supports comma-separated values for multiple origins)
const frontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : [];

// Security middleware - configure helmet with CSP and HSTS for compliance
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://js.stripe.com',
          'https://checkout.stripe.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://api.stripe.com', 'https://openrouter.ai', ...frontendUrls],
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://checkout.stripe.com'],
        objectSrc: ["'none'"],
      },
    },
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// HTTPS enforcement in production (Render sets x-forwarded-proto)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// CORS configuration
const allowedOrigins = [
  ...frontendUrls,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Attach scoped DI container to each request (before routes)
app.use(scopePerRequest(container));

// Webhook routes need raw body (before express.json())
app.use('/api/webhooks', webhookRoutes);

// Parse JSON bodies
app.use(express.json());

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Static uploads with long cache (files are immutable - include hash/timestamp)
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    next();
  },
  express.static(path.join(process.cwd(), 'public', 'uploads'))
);

// Static card images with long cache (optimized WebP images)
app.use(
  '/cards',
  (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    next();
  },
  express.static(path.join(process.cwd(), 'public', 'cards'))
);

// Add middleware for API cache headers (before routes)
app.use('/api', (req, res, next) => {
  // Only cache GET requests to public endpoints
  if (req.method === 'GET' && !req.path.includes('/admin')) {
    // Blog posts should not be cached to ensure content updates are visible immediately
    if (req.path.includes('/blog/posts/')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes
    }
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

// Swagger API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CelestiArcana API Docs',
  })
);

// OpenAPI JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Register v1 routes (current API as v1)
const v1Router = Router();
v1Router.use('/health', healthRoutes);
v1Router.use('/users', authLimiter, userRoutes);
v1Router.use('/readings', strictLimiter, readingRoutes);
v1Router.use('/payments', paymentLimiter, paymentRoutes);
v1Router.use('/admin', adminLimiter, adminRoutes);
v1Router.use('/admin/prompts', adminLimiter, promptRoutes);
v1Router.use('/horoscopes', generalLimiter, horoscopeRoutes);
v1Router.use('/translations', generalLimiter, translationRoutes);
v1Router.use('/blog', generalLimiter, blogRoutes);
v1Router.use('/tarot-articles', generalLimiter, tarotArticleRoutes);
v1Router.use('/taxonomy', adminLimiter, taxonomyRoutes);
v1Router.use('/ai', strictLimiter, aiRoutes);
v1Router.use('/year-energy', generalLimiter, yearEnergyRoutes);
v1Router.use('/internal-links', generalLimiter, internalLinksRoutes);
v1Router.use('/contact', strictLimiter, contactRoutes);

// Mount v1 at /api/v1
app.use('/api/v1', v1Router);

// DEV ONLY: Mount development routes (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/v1/dev', generalLimiter, devRoutes);
  console.log('🔧 Dev endpoints enabled at /api/v1/dev');
}

// DEPRECATED: Mount same routes at /api/* for backward compatibility
// Deprecation date: 2 weeks from now, Sunset: 2 months from now
const deprecatedRouter = createVersionedRouter(v1Router, {
  version: 'v1',
  deprecationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  sunsetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
});
app.use('/api', deprecatedRouter);

// Server-Side Rendering routes (for SEO)
// Must come AFTER API routes to avoid conflicts
app.use('/', ssrRoutes);

// Sentry error handler (must be before other error handlers)
app.use(getSentryErrorHandler());

// Error handling middleware
app.use(errorHandler);

// Schedule horoscope cache cleanup (runs daily at midnight UTC)
function scheduleHoroscopeCleanup(): void {
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  // Calculate time until next midnight UTC
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setUTCHours(24, 0, 0, 0); // Set to next midnight (00:00:00)

  const msUntilMidnight = nextMidnight.getTime() - now.getTime();

  setTimeout(() => {
    cleanupOldHoroscopes().catch(err => console.error('[Horoscope Cleanup] Error:', err));
    // Then run every 24 hours at midnight
    setInterval(() => {
      cleanupOldHoroscopes().catch(err => console.error('[Horoscope Cleanup] Error:', err));
    }, CLEANUP_INTERVAL);
  }, msUntilMidnight);

  console.log(
    `[Horoscope Cleanup] Daily cleanup scheduled for midnight UTC (next run: ${nextMidnight.toISOString()})`
  );
}

// Start server
app.listen(PORT, async () => {
  console.log(`🔮 CelestiArcana API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // One-time fix: assign sequential sortOrder to articles that all have sortOrder=0
  try {
    const { prisma: prismaClient } = await import('./db/prisma.js');
    const { cacheService } = await import('./services/cache.js');
    const cardTypes = [
      'MAJOR_ARCANA',
      'SUIT_OF_WANDS',
      'SUIT_OF_CUPS',
      'SUIT_OF_SWORDS',
      'SUIT_OF_PENTACLES',
    ] as const;
    for (const cardType of cardTypes) {
      const articles = await prismaClient.tarotArticle.findMany({
        where: { cardType, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true, sortOrder: true },
      });
      const allZero = articles.every(a => a.sortOrder === 0);
      if (allZero && articles.length > 1) {
        await prismaClient.$transaction(
          articles.map((article, index) =>
            prismaClient.tarotArticle.update({
              where: { id: article.id },
              data: { sortOrder: index },
            })
          )
        );
        console.log(`[SortOrder] Initialized ${articles.length} ${cardType} articles`);
      }
    }
    await cacheService.invalidateTarot();
    await cacheService.invalidateBlog();
    console.log('[Cache] Tarot + blog cache cleared on startup');
  } catch (err) {
    console.error('[SortOrder] Failed to initialize sort order:', err);
  }

  // Schedule background jobs
  scheduleHoroscopeCleanup();
});

export default app;
