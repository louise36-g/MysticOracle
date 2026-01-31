import { Request, Response, NextFunction } from 'express';
import { ApplicationError, isOperationalError } from '../shared/errors/ApplicationError.js';
import { formatError } from '../shared/errors/formatters.js';
import { errorTrackingService } from '../services/errorTrackingService.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Log all errors
  console.error('[ErrorHandler]', {
    path: req.path,
    method: req.method,
    error: err.message,
    code: err instanceof ApplicationError ? err.code : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Determine status code
  const statusCode = err instanceof ApplicationError ? err.statusCode : 500;

  // Check if client accepts new format (via Accept-Version header)
  const acceptVersion = req.headers['accept-version'] || req.headers['api-version'];
  const useLegacyFormat = !acceptVersion || acceptVersion === 'v1-legacy';

  // Format and send error
  const errorResponse = formatError(err, req.path, useLegacyFormat);
  res.status(statusCode).json(errorResponse);

  // For non-operational errors, track for monitoring
  if (!isOperationalError(err)) {
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
