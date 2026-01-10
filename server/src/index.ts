import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

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
import userRoutes from './routes/users.js';
import readingRoutes from './routes/readings.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';
import adminRoutes from './routes/admin.js';
import horoscopeRoutes from './routes/horoscopes.js';
import translationRoutes from './routes/translations.js';
import blogRoutes from './routes/blog.js';
import aiRoutes from './routes/ai.js';
import tarotArticleRoutes from './routes/tarot-articles.js';
import ssrRoutes from './routes/ssr.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware - configure helmet to allow cross-origin for uploads
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002',
].filter(Boolean) as string[];

app.use(cors({
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
}));

// Webhook routes need raw body (before express.json())
app.use('/api/webhooks', webhookRoutes);

// Parse JSON bodies
app.use(express.json());

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Static uploads with long cache (files are immutable - include hash/timestamp)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
}, express.static(path.join(process.cwd(), 'public', 'uploads')));

// Add middleware for API cache headers (before routes)
app.use('/api', (req, res, next) => {
  // Only cache GET requests to public endpoints
  if (req.method === 'GET' && !req.path.includes('/admin')) {
    res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

// Routes with specific rate limits
app.use('/api/health', healthRoutes);
app.use('/api/users', authLimiter, userRoutes);
app.use('/api/readings', strictLimiter, readingRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/horoscopes', generalLimiter, horoscopeRoutes);
app.use('/api/translations', generalLimiter, translationRoutes);
app.use('/api/blog', adminLimiter, blogRoutes);
app.use('/api/tarot-articles', generalLimiter, tarotArticleRoutes);
app.use('/api/ai', strictLimiter, aiRoutes);

// Server-Side Rendering routes (for SEO)
// Must come AFTER API routes to avoid conflicts
app.use('/', ssrRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔮 MysticOracle API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
