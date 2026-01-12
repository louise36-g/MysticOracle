/**
 * ApplicationError - Base error class for all application errors
 * Provides consistent error structure with codes, HTTP status, and details
 */

export interface ErrorDetails {
  [key: string]: unknown;
}

/**
 * Base application error with structured information
 */
export class ApplicationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: ErrorDetails;
  public readonly timestamp: Date;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details: ErrorDetails = {},
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.isOperational = isOperational; // Operational errors are expected (vs programming bugs)

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Validation errors - invalid input from user
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Not found errors - resource doesn't exist
 */
export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, { resource, ...(id && { id }) });
  }
}

/**
 * Authentication errors - user not authenticated
 */
export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_REQUIRED', 401);
  }
}

/**
 * Authorization errors - user not permitted
 */
export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Permission denied') {
    super(message, 'PERMISSION_DENIED', 403);
  }
}

/**
 * Insufficient credits error - user doesn't have enough credits
 */
export class InsufficientCreditsError extends ApplicationError {
  constructor(required: number, available: number) {
    super(
      `Insufficient credits: need ${required}, have ${available}`,
      'INSUFFICIENT_CREDITS',
      402, // Payment Required
      { required, available }
    );
  }
}

/**
 * Credit operation failed - deduction or refund failed
 */
export class CreditOperationError extends ApplicationError {
  constructor(operation: 'deduct' | 'refund' | 'add', reason: string, details: ErrorDetails = {}) {
    super(`Credit ${operation} failed: ${reason}`, 'CREDIT_OPERATION_FAILED', 500, {
      operation,
      ...details,
    });
  }
}

/**
 * External service errors - third-party API failures
 */
export class ExternalServiceError extends ApplicationError {
  public readonly service: string;
  public readonly originalError?: Error;

  constructor(service: string, message: string, originalError?: Error, details: ErrorDetails = {}) {
    super(
      `${service} error: ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      502, // Bad Gateway
      { service, ...details }
    );
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * AI generation errors - OpenRouter/AI failures
 */
export class AIGenerationError extends ApplicationError {
  public readonly service: string = 'AI';
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error, details: ErrorDetails = {}) {
    super(
      `AI error: ${message}`,
      'AI_GENERATION_FAILED',
      502, // Bad Gateway
      { service: 'AI', ...details }
    );
    this.originalError = originalError;
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends ApplicationError {
  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429, retryAfter ? { retryAfter } : {});
  }
}

/**
 * Conflict errors - resource state conflict
 */
export class ConflictError extends ApplicationError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * Idempotency errors - duplicate request detected
 */
export class IdempotencyError extends ApplicationError {
  constructor(idempotencyKey: string, existingResourceId?: string) {
    super('Duplicate request detected', 'DUPLICATE_REQUEST', 409, {
      idempotencyKey,
      ...(existingResourceId && { existingResourceId }),
    });
  }
}

/**
 * Check if an error is an operational ApplicationError
 */
export function isOperationalError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError && error.isOperational;
}

/**
 * Wrap unknown errors in ApplicationError
 */
export function wrapError(error: unknown, context?: string): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  return new ApplicationError(
    context ? `${context}: ${message}` : message,
    'INTERNAL_ERROR',
    500,
    { originalError: error instanceof Error ? error.name : typeof error },
    false // Not operational - this is unexpected
  );
}
