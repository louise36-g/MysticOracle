# CelestiArcana API Errors

> Comprehensive documentation for API error codes, handling patterns, and troubleshooting.

---

## Overview

CelestiArcana uses a layered error handling architecture:
1. **Domain Layer**: Business rule violations (`DomainError`)
2. **Application Layer**: HTTP-aware errors (`ApplicationError`)
3. **Route Layer**: Result objects with `success` boolean

All errors are logged with context and critical errors are stored in the database for admin review.

---

## Error Response Formats

### Standard Format (Recommended)

Request with `Accept-Version: v2` or `Api-Version: v2` header:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Insufficient credits: need 2, have 1",
    "details": {
      "required": 2,
      "available": 1
    },
    "timestamp": "2026-02-05T12:00:00.000Z",
    "path": "/api/v1/readings"
  }
}
```

### Legacy Format (Default)

Request without version header or with `Accept-Version: v1-legacy`:

```json
{
  "error": "Insufficient credits: need 2, have 1",
  "details": {
    "required": 2,
    "available": 1
  }
}
```

---

## HTTP Status Codes

| Status | Name | Description |
|--------|------|-------------|
| 200 | OK | Successful GET/PATCH/POST |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication token |
| 402 | Payment Required | Insufficient credits for operation |
| 403 | Forbidden | User authenticated but lacks permission |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate request or state conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | External service failure (Stripe, OpenRouter) |
| 503 | Service Unavailable | Payment provider not configured |

---

## Error Codes Reference

### Authentication Errors (401)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `AUTHENTICATION_REQUIRED` | Missing authorization header | No Bearer token provided | Include `Authorization: Bearer <token>` header |
| `AUTHENTICATION_REQUIRED` | Invalid or expired token | JWT verification failed | Refresh token via Clerk |
| `AUTHENTICATION_REQUIRED` | Authentication failed | General auth error | Re-authenticate user |

**Example Response:**
```json
{
  "error": "Missing authorization header"
}
```

### Authorization Errors (403)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `PERMISSION_DENIED` | User not found | User ID not in database | Sync user via Clerk webhook |
| `PERMISSION_DENIED` | Admin access required | Non-admin accessing admin route | Use admin account |
| `PERMISSION_DENIED` | Admin verification failed | Database error during admin check | Check database connection |

**Example Response:**
```json
{
  "error": "Admin access required"
}
```

### Validation Errors (400)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `VALIDATION_ERROR` | Invalid request data | Zod schema validation failed | Check request body against schema |
| `VALIDATION_ERROR` | Validation failed | Missing or invalid fields | Provide all required fields |
| `INVALID_SPREAD_TYPE` | Invalid spread type | Unknown spread type provided | Use valid spread type |

**Example Response (Zod validation):**
```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "array",
      "path": ["cards"],
      "message": "At least one card is required"
    },
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["question"],
      "message": "Required"
    }
  ]
}
```

### Credit Errors (402)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `INSUFFICIENT_CREDITS` | Insufficient credits: need X, have Y | User lacks credits | Purchase more credits |
| `CREDIT_OPERATION_FAILED` | Credit deduction failed | Database transaction error | Retry request |

**Example Response:**
```json
{
  "error": "Insufficient credits: need 2, have 1"
}
```

### Resource Errors (404)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `USER_NOT_FOUND` | User not found: {userId} | User ID not in database | Ensure user is synced |
| `READING_NOT_FOUND` | Reading not found | Reading ID invalid | Check reading ID |
| `NOT_FOUND` | Resource not found | Generic 404 | Verify resource exists |

**Example Response:**
```json
{
  "error": "Reading not found"
}
```

### Conflict Errors (409)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `DUPLICATE_REQUEST` | Duplicate request detected | Idempotency key already processed | Safe to ignore - original result cached |
| `CONFLICT` | Resource state conflict | Invalid state transition | Refresh resource state |

**Example Response:**
```json
{
  "error": "Duplicate request detected"
}
```

### Rate Limit Errors (429)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `RATE_LIMIT_EXCEEDED` | Too many requests | Request limit exceeded | Wait and retry with backoff |

### External Service Errors (502)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `EXTERNAL_SERVICE_ERROR` | External service error | Third-party API failure | Retry after delay |
| `AI_GENERATION_FAILED` | AI generation failed | OpenRouter API error | Check AI service status |

**Example Response:**
```json
{
  "error": "AI generation failed",
  "details": {
    "service": "openrouter",
    "originalError": "Rate limit exceeded"
  }
}
```

### Server Errors (500)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `INTERNAL_ERROR` | Unexpected error | Unhandled exception | Check server logs |
| `INTERNAL_ERROR` | Failed to create reading | Database error during creation | Retry request |

---

## Domain Errors

Domain errors represent business rule violations. They are defined in `server/src/domain/errors/`.

### InsufficientCreditsError

```typescript
class InsufficientCreditsError extends DomainError {
  code = 'INSUFFICIENT_CREDITS';
  required: number;
  available: number;
}
```

**Triggered when:**
- Creating a reading without enough credits
- Asking a follow-up question without credits
- Any credit-consuming operation

### InvalidSpreadTypeError

```typescript
class InvalidSpreadTypeError extends DomainError {
  code = 'INVALID_SPREAD_TYPE';
  providedType: string;
  validTypes: string[];
}
```

**Valid spread types:**
- `single`
- `three_card`
- `five_card`
- `horseshoe`
- `celtic_cross`

### UserNotFoundError

```typescript
class UserNotFoundError extends DomainError {
  code = 'USER_NOT_FOUND';
  userId: string;
}
```

### ReadingNotFoundError

```typescript
class ReadingNotFoundError extends DomainError {
  code = 'READING_NOT_FOUND';
  readingId: string;
}
```

### ValidationError

```typescript
class ValidationError extends DomainError {
  code = 'VALIDATION_ERROR';
  issues: ValidationIssue[];
}

interface ValidationIssue {
  field: string;
  message: string;
}
```

---

## Application Errors

Application errors are HTTP-aware and include status codes. Defined in `server/src/shared/errors/ApplicationError.ts`.

| Error Class | Code | Status | Description |
|-------------|------|--------|-------------|
| `ValidationError` | `VALIDATION_ERROR` | 400 | Invalid input |
| `NotFoundError` | `NOT_FOUND` | 404 | Resource missing |
| `AuthenticationError` | `AUTHENTICATION_REQUIRED` | 401 | Auth required |
| `AuthorizationError` | `PERMISSION_DENIED` | 403 | Access denied |
| `InsufficientCreditsError` | `INSUFFICIENT_CREDITS` | 402 | Need more credits |
| `CreditOperationError` | `CREDIT_OPERATION_FAILED` | 500 | Credit system failure |
| `ExternalServiceError` | `EXTERNAL_SERVICE_ERROR` | 502 | Third-party failure |
| `AIGenerationError` | `AI_GENERATION_FAILED` | 502 | AI service failure |
| `RateLimitError` | `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `ConflictError` | `CONFLICT` | 409 | State conflict |
| `IdempotencyError` | `DUPLICATE_REQUEST` | 409 | Duplicate request |

---

## Error Handling Patterns

### Pattern 1: Zod Validation

Routes validate input using Zod schemas:

```typescript
const validation = createReadingSchema.safeParse(req.body);
if (!validation.success) {
  return res.status(400).json({
    error: 'Invalid request data',
    details: validation.error.errors,
  });
}
```

### Pattern 2: Use Case Results

Use cases return result objects instead of throwing:

```typescript
interface CreateReadingResult {
  success: boolean;
  reading?: Reading;
  error?: string;
  errorCode?: 'VALIDATION_ERROR' | 'USER_NOT_FOUND' | 'INSUFFICIENT_CREDITS' | 'INTERNAL_ERROR';
  transactionId?: string;
  refunded?: boolean;
}

// Route handling
const result = await createReadingUseCase.execute({...});
if (!result.success) {
  const statusCode =
    result.errorCode === 'USER_NOT_FOUND' ? 404 :
    result.errorCode === 'INSUFFICIENT_CREDITS' ? 402 :
    result.errorCode === 'VALIDATION_ERROR' ? 400 : 500;
  return res.status(statusCode).json({ error: result.error });
}
```

### Pattern 3: Credit Safety

Credits are deducted BEFORE expensive operations to prevent double-charging:

```typescript
// 1. Deduct credits first
const creditResult = await creditService.deduct(userId, cost, 'READING');
const transactionId = creditResult.transactionId;

try {
  // 2. Perform operation
  const reading = await readingRepository.create({...});
  return { success: true, reading };
} catch (error) {
  // 3. Refund on failure
  await creditService.refund(userId, cost, transactionId);
  return { success: false, error: 'Operation failed', refunded: true };
}
```

### Pattern 4: Idempotency

Critical operations use idempotency middleware to prevent duplicates:

```typescript
// Middleware checks Idempotency-Key header
router.post('/readings', requireAuth, idempotent, async (req, res) => {
  // If key exists in cache, returns cached response
  // Otherwise processes request and caches result
});
```

---

## Error Middleware

All unhandled errors pass through the global error handler:

**File:** `server/src/middleware/errorHandler.ts`

```typescript
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // 1. Log error with context
  console.error('[ErrorHandler]', {
    path: req.path,
    method: req.method,
    error: err.message,
    code: err instanceof ApplicationError ? err.code : undefined,
  });

  // 2. Determine status code
  const statusCode = err instanceof ApplicationError ? err.statusCode : 500;

  // 3. Format response based on version header
  const useLegacyFormat = !req.headers['accept-version'];
  const errorResponse = formatError(err, req.path, useLegacyFormat);

  // 4. Send response
  res.status(statusCode).json(errorResponse);

  // 5. Track critical errors
  if (!isOperationalError(err) && statusCode >= 500) {
    errorTrackingService.trackCriticalError(err, {
      path: req.path,
      userId: req.auth?.userId,
    });
  }
}
```

---

## Error Tracking

Critical errors are tracked for monitoring:

**File:** `server/src/services/errorTrackingService.ts`

**Tracked Context:**
- Request path and method
- User ID (if authenticated)
- Client IP and user agent
- Request body (sanitized)
- Query parameters

**Sensitive Data Sanitization:**
- Passwords, tokens, API keys, credit card numbers are removed
- Context is safe for logging and database storage

**Critical Error Storage:**
- Stored in `AuditLog` table for admin review
- Action type: `SYSTEM_ERROR`
- Includes: message, severity, context, timestamp

---

## Frontend Error Handling

### API Service Pattern

```typescript
// services/api/base.ts
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.error, error.details);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Network error');
  }
}
```

### Component Error Handling

```typescript
try {
  const result = await createReading(readingData);
  // Handle success
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 402:
        // Show credit purchase modal
        break;
      case 401:
        // Redirect to sign in
        break;
      default:
        // Show generic error message
    }
  }
}
```

---

## Troubleshooting

### Common Issues

**401: Missing authorization header**
- Ensure `Authorization: Bearer <token>` header is included
- Check that token is not expired
- Verify Clerk is properly initialized

**402: Insufficient credits**
- User needs to purchase more credits
- Check `credits` field in user profile
- Daily bonus may be available

**403: Admin access required**
- Only users with `isAdmin: true` can access admin routes
- Check user's admin status in database

**500: Internal server error**
- Check server logs for stack trace
- Verify database connection is healthy
- Check external service status (Stripe, OpenRouter)

**502: AI generation failed**
- OpenRouter API may be rate limited
- Check `OPENROUTER_API_KEY` is valid
- Verify AI model is available

### Debug Mode

Enable detailed error logging:

```bash
NODE_ENV=development npm run dev
```

Development mode includes:
- Full stack traces in error responses
- Detailed console logging
- Request/response logging

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02 | Initial documentation created |
