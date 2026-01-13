import { ApplicationError } from './ApplicationError.js';
import { ZodError } from 'zod';

export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path?: string;
  };
}

export interface LegacyErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * Format error for API response
 * @param error - The error to format
 * @param useLegacyFormat - If true, returns simple {error: string} for compatibility
 */
export function formatError(
  error: Error | ApplicationError | ZodError,
  path?: string,
  useLegacyFormat = false
): StandardErrorResponse | LegacyErrorResponse {
  // Handle ApplicationError instances
  if (error instanceof ApplicationError) {
    if (useLegacyFormat) {
      return {
        error: error.message,
        ...(error.details && { details: error.details }),
      };
    }

    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp.toISOString(),
        path,
      },
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    if (useLegacyFormat) {
      return {
        error: 'Validation failed',
        details: error.errors,
      };
    }

    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.errors,
        timestamp: new Date().toISOString(),
        path,
      },
    };
  }

  // Handle generic errors
  if (useLegacyFormat) {
    return { error: error.message || 'Internal server error' };
  }

  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      path,
    },
  };
}
