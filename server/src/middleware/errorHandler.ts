import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApplicationError, isOperationalError } from '../shared/errors/ApplicationError.js';
import { formatError } from '../shared/errors/formatters.js';
import { errorTrackingService } from '../services/errorTrackingService.js';
import { captureException } from '../config/sentry.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const requestId = res.locals.requestId as string | undefined;

  // Log all errors with requestId for correlation
  console.error('[ErrorHandler]', {
    requestId,
    path: req.path,
    method: req.method,
    error: err.message,
    code: err instanceof ApplicationError ? err.code : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Determine status code
  const statusCode =
    err instanceof ApplicationError ? err.statusCode : err instanceof ZodError ? 400 : 500;

  // Check if client accepts new format (via Accept-Version header)
  const acceptVersion = req.headers['accept-version'] || req.headers['api-version'];
  const useLegacyFormat = !acceptVersion || acceptVersion === 'v1-legacy';

  // Format and send error (includes requestId for correlation)
  const errorResponse = formatError(err, req.path, useLegacyFormat, requestId);
  res.status(statusCode).json(errorResponse);

  // For non-operational errors, track for monitoring
  if (!isOperationalError(err)) {
    // Send to Sentry (no-op in non-production)
    captureException(err instanceof Error ? err : new Error(String(err)), {
      requestId,
      path: req.path,
      method: req.method,
      userId: req.auth?.userId,
    });

    const context = {
      path: req.path,
      method: req.method,
      userId: req.auth?.userId,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      query: req.query,
    };

    // Track as critical if it's a 500 error
    if (statusCode >= 500) {
      errorTrackingService.trackCriticalError(err, context);
    } else {
      errorTrackingService.trackError(err, context, 'high');
    }
  }
}
