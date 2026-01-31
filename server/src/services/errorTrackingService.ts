/**
 * Error Tracking Service
 * Logs critical errors for monitoring and alerting
 * Can be extended to integrate with Sentry, LogRocket, etc.
 */

import prisma from '../db/prisma.js';

interface ErrorContext {
  path?: string;
  method?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  body?: unknown;
  query?: unknown;
}

interface TrackedError {
  message: string;
  stack?: string;
  code?: string;
  context: ErrorContext;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorTrackingService {
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Track an error for monitoring
   */
  async trackError(
    error: Error,
    context: ErrorContext = {},
    severity: TrackedError['severity'] = 'high'
  ): Promise<void> {
    const trackedError: TrackedError = {
      message: error.message,
      stack: this.isProduction ? undefined : error.stack,
      code: (error as { code?: string }).code,
      context: this.sanitizeContext(context),
      timestamp: new Date(),
      severity,
    };

    // Always log to console (structured for log aggregation)
    console.error(
      '[ERROR_TRACKING]',
      JSON.stringify({
        ...trackedError,
        environment: process.env.NODE_ENV,
      })
    );

    // In production, store critical errors in database for admin review
    if (this.isProduction && (severity === 'critical' || severity === 'high')) {
      await this.storeErrorInDatabase(trackedError);
    }
  }

  /**
   * Remove sensitive data from context
   */
  private sanitizeContext(context: ErrorContext): ErrorContext {
    const sanitized = { ...context };

    // Remove potentially sensitive body fields
    if (sanitized.body && typeof sanitized.body === 'object') {
      const body = { ...(sanitized.body as Record<string, unknown>) };
      delete body.password;
      delete body.token;
      delete body.apiKey;
      delete body.creditCard;
      sanitized.body = body;
    }

    return sanitized;
  }

  /**
   * Store error in database for admin dashboard
   */
  private async storeErrorInDatabase(error: TrackedError): Promise<void> {
    try {
      // Use the AuditLog model which should exist for GDPR compliance
      await prisma.auditLog.create({
        data: {
          action: 'SYSTEM_ERROR',
          entityType: 'System',
          entityId: error.code || 'unknown',
          details: JSON.parse(
            JSON.stringify({
              message: error.message,
              severity: error.severity,
              context: error.context,
            })
          ),
          ipAddress: error.context.ip || null,
          userAgent: error.context.userAgent || null,
        },
      });
    } catch (dbError) {
      // Don't let database errors cause cascading failures
      console.error('[ERROR_TRACKING] Failed to store error in database:', dbError);
    }
  }

  /**
   * Track a critical system error (e.g., database down, external service failure)
   */
  async trackCriticalError(error: Error, context: ErrorContext = {}): Promise<void> {
    await this.trackError(error, context, 'critical');

    // In production, could trigger immediate alerts here
    // e.g., send email, Slack notification, PagerDuty, etc.
    if (this.isProduction) {
      console.error('[CRITICAL_ALERT] System error requires immediate attention:', error.message);
    }
  }
}

export const errorTrackingService = new ErrorTrackingService();
