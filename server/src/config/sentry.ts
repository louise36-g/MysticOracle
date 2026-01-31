/**
 * Sentry Error Tracking Configuration
 * Initializes Sentry for production error monitoring
 */

import * as Sentry from '@sentry/node';

const isProduction = process.env.NODE_ENV === 'production';
const sentryDsn = process.env.SENTRY_DSN;

/**
 * Initialize Sentry error tracking
 * Only initializes in production with a valid DSN
 */
export function initSentry(): void {
  if (!isProduction) {
    console.log('ℹ️  Sentry disabled in development');
    return;
  }

  if (!sentryDsn) {
    console.warn('⚠️  SENTRY_DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',

    // Performance monitoring - sample 10% of transactions in production
    tracesSampleRate: 0.1,

    // Only send errors, not warnings
    beforeSend(event) {
      // Filter out expected errors
      if (event.exception?.values?.[0]?.type === 'NotFoundError') {
        return null; // Don't send 404s
      }
      return event;
    },

    // Integrations
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
  });

  console.log('✅ Sentry initialized for error tracking');
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!isProduction || !sentryDsn) {
    console.error('[Sentry would capture]:', error.message, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (!isProduction || !sentryDsn) {
    console.log(`[Sentry would log ${level}]:`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(userId: string | null, email?: string): void {
  if (!isProduction || !sentryDsn) return;

  if (userId) {
    Sentry.setUser({ id: userId, email });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Express error handler for Sentry
 * Should be added after all routes
 */
import type { RequestHandler, ErrorRequestHandler } from 'express';

export function getSentryErrorHandler(): ErrorRequestHandler {
  return Sentry.expressErrorHandler() as ErrorRequestHandler;
}

export default Sentry;
