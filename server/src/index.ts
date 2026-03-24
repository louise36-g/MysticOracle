import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
// Load environment variables FIRST (must be before any other imports that read process.env)
import 'dotenv/config';

import path from 'path';
import { fileURLToPath } from 'url';
import { scopePerRequest } from 'awilix-express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

logger.info('✅ Environment validated, DI container initialized');

// Shared rate limiter options for Render reverse proxy
const proxyValidation = { validate: { xForwardedForHeader: false } };

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip for admin routes — they have their own adminLimiter
  skip: req => req.path.includes('/admin'),
  ...proxyValidation,
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit payment requests
  message: { error: 'Too many payment requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  ...proxyValidation,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Very strict for sensitive operations
  message: { error: 'Rate limit exceeded, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  ...proxyValidation,
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Higher limit for admin operations
  message: { error: 'Admin rate limit exceeded, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  ...proxyValidation,
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
import { preGenerateHoroscopes } from './jobs/preGenerateHoroscopes.js';
import { createVersionedRouter } from './shared/versioning/createVersionedRouter.js';
import { Router } from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { logger } from './lib/logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust first proxy (Render reverse proxy) — required for express-rate-limit
// to correctly read client IP from X-Forwarded-For header
app.set('trust proxy', 1);

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
        reportUri: ['/api/v1/health/csp-report'],
      },
    },
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Compression middleware (after Helmet, before routes)
app.use(
  compression({
    threshold: 1024,
    level: 6,
    filter: (req, res) => {
      if (req.path.includes('/webhooks')) return false;
      return compression.filter(req, res);
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
        logger.warn(`CORS blocked request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Request ID middleware (before routes, after CORS/helmet/compression)
app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// Request timeout middleware (prevents hanging requests)
app.use((req, res, next) => {
  const timeout = req.path.includes('/ai') || req.path.includes('/readings') ? 60000 : 30000;
  req.setTimeout(timeout);
  res.setTimeout(timeout);
  next();
});

// Slow request logging (warn on >2s responses)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 2000) {
      logger.warn(
        `[Slow Request] ${req.method} ${req.path} took ${duration}ms (status: ${res.statusCode})`
      );
    }
  });
  next();
});

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
  if (req.method !== 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return next();
  }

  // Admin endpoints: no-store
  if (req.path.includes('/admin')) {
    res.setHeader('Cache-Control', 'no-store');
    return next();
  }

  // Credit packages: static data, cache aggressively
  if (req.path.includes('/payments/packages')) {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return next();
  }

  // User-specific endpoints: private, no-cache
  if (
    req.path.includes('/users/me') ||
    req.path.includes('/readings') ||
    req.path.includes('/payments')
  ) {
    res.setHeader('Cache-Control', 'private, no-cache');
    return next();
  }

  // Translations: long public cache
  if (req.path.includes('/translations')) {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return next();
  }

  // Horoscopes: public but shorter (changes daily, same for all users)
  if (req.path.includes('/horoscopes')) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return next();
  }

  // Public content endpoints: blog, tarot-articles, health
  if (
    req.path.includes('/blog') ||
    req.path.includes('/tarot-articles') ||
    req.path.includes('/health')
  ) {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return next();
  }

  // Default for other GET requests
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
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
v1Router.use('/users', generalLimiter, userRoutes);
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
  logger.info('🔧 Dev endpoints enabled at /api/v1/dev');
}

// DEPRECATED: Mount same routes at /api/* for backward compatibility
const deprecatedRouter = createVersionedRouter(v1Router, {
  version: 'v1',
  deprecationDate: '2026-06-01T00:00:00.000Z',
  sunsetDate: '2026-09-01T00:00:00.000Z',
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
    cleanupOldHoroscopes()
      .then(() => preGenerateHoroscopes())
      .catch(err => logger.error('[Horoscope] Cleanup/pre-gen error:', err));
    // Then run every 24 hours at midnight
    setInterval(() => {
      cleanupOldHoroscopes()
        .then(() => preGenerateHoroscopes())
        .catch(err => logger.error('[Horoscope] Cleanup/pre-gen error:', err));
    }, CLEANUP_INTERVAL);
  }, msUntilMidnight);

  logger.info(
    `[Horoscope Cleanup] Daily cleanup scheduled for midnight UTC (next run: ${nextMidnight.toISOString()})`
  );
}

// Catch unhandled promise rejections (prevents silent crashes)
process.on('unhandledRejection', (reason, _promise) => {
  logger.error('[FATAL] Unhandled Promise Rejection:', reason);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🔮 CelestiArcana API running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Schedule background jobs
  scheduleHoroscopeCleanup();

  // Pre-generate today's horoscopes (deferred to not block startup)
  setTimeout(() => {
    preGenerateHoroscopes().catch(err => logger.error('[Horoscope Pre-Gen] Startup error:', err));
  }, 5000);
});

export default app;
