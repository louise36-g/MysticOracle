/**
 * Idempotency Middleware
 *
 * Applies idempotency protection to POST endpoints to prevent duplicate
 * operations from retried requests.
 *
 * Usage:
 *   router.post('/readings', requireAuth, idempotent, async (req, res) => { ... });
 *
 * Client must send X-Idempotency-Key header with a unique key per operation.
 * If no key is provided, the request proceeds without idempotency protection.
 */

import { Request, Response, NextFunction } from 'express';
import { idempotencyService, IdempotencyRecord } from '../services/IdempotencyService.js';

// Header name for idempotency key
const IDEMPOTENCY_HEADER = 'x-idempotency-key';

// Extend Request type to include idempotency info
declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}

/**
 * Middleware that enforces idempotency for POST requests
 */
export async function idempotent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Only apply to POST/PUT/PATCH requests
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Get idempotency key from header
  const idempotencyKey = req.headers[IDEMPOTENCY_HEADER] as string | undefined;

  // If no key provided, proceed without idempotency protection
  // (backward compatibility - don't break existing clients)
  if (!idempotencyKey) {
    return next();
  }

  // Validate key format (should be non-empty string, max 256 chars)
  if (idempotencyKey.length > 256) {
    res.status(400).json({
      error: 'Idempotency key too long (max 256 characters)',
      code: 'INVALID_IDEMPOTENCY_KEY',
    });
    return;
  }

  // Get user ID (from auth middleware)
  const userId = req.auth?.userId || 'anonymous';
  const endpoint = `${req.method} ${req.baseUrl}${req.path}`;

  // Check if this key was already used
  const markResult = await idempotencyService.markPending(
    idempotencyKey,
    endpoint,
    userId
  );

  if (!markResult.success && markResult.existingRecord) {
    const existing = markResult.existingRecord;

    // If still pending, another request is in progress
    if (existing.state === 'pending') {
      res.status(409).json({
        error: 'A request with this idempotency key is already in progress',
        code: 'DUPLICATE_REQUEST_IN_PROGRESS',
        idempotencyKey,
      });
      return;
    }

    // If completed, return the cached result
    if (existing.state === 'completed') {
      console.log(
        `[Idempotency] Returning cached result for key: ${idempotencyKey}`
      );

      // Set header to indicate this is a cached response
      res.setHeader('X-Idempotency-Replayed', 'true');

      // Return the original status code and result
      res.status(existing.statusCode || 200).json(existing.result);
      return;
    }
  }

  // Store key on request for later use
  req.idempotencyKey = idempotencyKey;

  // Intercept the response to cache the result
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    // Cache the response
    const statusCode = res.statusCode;

    // Only cache successful responses (2xx)
    if (statusCode >= 200 && statusCode < 300) {
      idempotencyService.markCompleted(idempotencyKey, body, statusCode).catch(err => {
        console.error('[Idempotency] Error caching result:', err);
      });
    } else {
      // For failed responses, remove the pending state so client can retry
      idempotencyService.markFailed(idempotencyKey).catch(err => {
        console.error('[Idempotency] Error marking failed:', err);
      });
    }

    return originalJson(body);
  };

  next();
}

/**
 * Middleware that makes idempotency optional but tracks it if provided
 * Use this for endpoints where idempotency is nice-to-have but not critical
 */
export async function optionalIdempotent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Same as idempotent but with less strict validation
  return idempotent(req, res, next);
}

/**
 * Helper to extract idempotency key from request
 */
export function getIdempotencyKey(req: Request): string | undefined {
  return req.idempotencyKey || (req.headers[IDEMPOTENCY_HEADER] as string | undefined);
}

export default idempotent;
