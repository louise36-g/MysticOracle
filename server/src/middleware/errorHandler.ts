import { Request, Response, NextFunction } from 'express';
import { ApplicationError, isOperationalError } from '../shared/errors/ApplicationError.js';
import { formatError } from '../shared/errors/formatters.js';

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

  // For non-operational errors, notify monitoring service
  if (!isOperationalError(err)) {
    // TODO: Send to error tracking service (Sentry, etc.)
  }
}
