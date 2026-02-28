/**
 * Sentry Error Tracking Configuration (Frontend)
 * Initializes Sentry for production error monitoring
 */

import * as Sentry from '@sentry/react';

const isProduction = import.meta.env.PROD;
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

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
    console.warn('⚠️  VITE_SENTRY_DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: isProduction ? 'production' : 'development',

    // Performance monitoring - sample 10% of transactions
    tracesSampleRate: 0.1,

    // Session replay for debugging (sample 1%)
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 0.1,

    // Filter out common noise
    beforeSend(event) {
      // Filter out network errors that are expected
      if (event.exception?.values?.[0]?.value?.includes('Failed to fetch')) {
        return null;
      }
      // Filter out ResizeObserver errors (browser quirk)
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
        return null;
      }
      return event;
    },

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });

  console.log('✅ Sentry initialized for error tracking');
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!isProduction || !sentryDsn) {
    console.warn('[Sentry would capture]:', error.message, context);
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
 * Error boundary component for React
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

export default Sentry;
