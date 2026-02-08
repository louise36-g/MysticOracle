# CelestiArcana API Design Audit Report

**Date:** January 13, 2026
**Auditor:** Claude Code
**Framework:** REST API Design Principles
**Scope:** All backend API endpoints

---

## Executive Summary

The CelestiArcana API demonstrates **solid fundamentals** with good use of HTTP semantics, rate limiting, and security middleware. However, it lacks **API versioning**, has **inconsistent pagination patterns**, and would benefit from **standardized response formats** and **comprehensive documentation**.

**Overall Grade:** B+ (Good, but room for improvement)

---

## 1. REST Fundamentals ✅ PASS

### HTTP Methods
✅ **Correct usage of HTTP verbs:**
- `GET` for retrieval (users, readings, transactions)
- `POST` for creation (readings, payments, follow-ups)
- `PATCH` for partial updates (user preferences, reflections)
- `DELETE` for deletion (account deletion)

✅ **Idempotency respected:**
- Payment endpoints use idempotency middleware
- GET requests are safe and cacheable
- DELETE is idempotent by nature

### Statelessness
✅ Authentication via Bearer tokens (Clerk JWT)
✅ No server-side session storage
✅ Each request contains full auth context

---

## 2. Resource Design 🟡 NEEDS IMPROVEMENT

### Collection Naming
✅ **Good:** Plural nouns used correctly
- `/api/users/me`
- `/api/readings`
- `/api/payments`
- `/api/horoscopes`

### Resource Hierarchy
✅ **Good nesting:**
- `/api/readings/:id/follow-up` (follow-up belongs to reading)
- `/api/users/me/transactions` (transactions belong to user)
- `/api/users/me/readings` (readings belong to user)

⚠️ **Inconsistency:**
```
/api/readings/horoscope/:sign  ❌ Should be /api/horoscopes/:sign
/api/readings/:id/follow-up    ✅ Correct nesting
```

**Recommendation:** Move horoscope endpoints from `readings.ts` to `horoscopes.ts` (already exists!)

---

## 3. API Versioning ❌ CRITICAL ISSUE

### Current State
❌ **No versioning strategy in place**
- All endpoints are at `/api/*` with no version prefix
- Breaking changes would impact all clients immediately
- No migration path for mobile app

### Risk Assessment
🔴 **HIGH RISK:** You plan to share this backend with a mobile app (AI Tarot Saga). Without versioning:
- Can't evolve web and mobile APIs independently
- Breaking changes require coordinated releases
- No safe deprecation path

### Recommended Fix
```typescript
// Option 1: URL versioning (Recommended)
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/readings', readingRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Option 2: Header-based versioning
app.use((req, res, next) => {
  const version = req.headers['api-version'] || 'v1';
  req.apiVersion = version;
  next();
});
```

**Action Required:** Add versioning BEFORE mobile app launch.

---

## 4. Status Codes ✅ MOSTLY CORRECT

### Good Usage
✅ `200 OK` - Successful GET requests
✅ `201 Created` - Successful POST (readings, follow-ups)
✅ `400 Bad Request` - Validation errors
✅ `401 Unauthorized` - Missing/invalid auth
✅ `403 Forbidden` - Admin access required
✅ `404 Not Found` - Resource doesn't exist
✅ `500 Internal Server Error` - Unexpected errors
✅ `503 Service Unavailable` - Payment provider not configured

⚠️ **Minor Issues:**
```typescript
// users.ts:152 - Should be 409 Conflict, not 400
if (today.getTime() === lastLogin.getTime()) {
  return res.status(400).json({ error: 'Already claimed today' }); // ❌
  // Should be: res.status(409).json({ error: 'Daily bonus already claimed' });
}
```

---

## 5. Error Handling 🟡 INCONSISTENT

### Current Formats
```typescript
// Format 1: Simple error string
{ error: "User not found" }

// Format 2: Error with details array
{ error: "Invalid request data", details: [...] }

// Format 3: Success flag with message
{ success: false, error: "...", errorCode: "..." }
```

⚠️ **Problem:** Clients can't rely on consistent error structure.

### Recommended Standard
```typescript
// ALL errors should use this format
interface ApiError {
  error: {
    code: string;           // Machine-readable (e.g., "USER_NOT_FOUND")
    message: string;        // Human-readable
    details?: Array<{       // Optional field-level errors
      field: string;
      message: string;
    }>;
    timestamp: string;      // ISO 8601
    path: string;          // Request path
  }
}

// Example response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ],
    "timestamp": "2026-01-13T10:30:00Z",
    "path": "/api/users/me"
  }
}
```

**Action Required:** Create centralized error handler middleware.

---

## 6. Pagination 🟡 PARTIALLY IMPLEMENTED

### Current Implementation
✅ **Offset-based pagination exists:**
```typescript
// users.ts:90-96
GET /api/users/me/readings?limit=20&offset=0
GET /api/users/me/transactions?limit=50&offset=0
```

❌ **Missing:**
1. No pagination on other list endpoints
2. No total count in response consistently
3. No cursor-based pagination for large datasets
4. No HATEOAS links for next/prev pages

### Response Format Issues
```typescript
// Current (inconsistent)
{ readings: [...], total: 100 }          // users.ts:104
{ transactions: [...], total: 50 }       // users.ts:126
{ users: [...], pagination: {...} }      // admin.ts (different format!)
```

### Recommended Standard
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    links?: {
      first: string;
      prev: string | null;
      next: string | null;
      last: string;
    };
  }
}

// Usage
GET /api/v1/users/me/readings?limit=20&offset=0

{
  "data": [...],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0,
    "hasMore": true,
    "links": {
      "first": "/api/v1/users/me/readings?limit=20&offset=0",
      "next": "/api/v1/users/me/readings?limit=20&offset=20",
      "last": "/api/v1/users/me/readings?limit=20&offset=140"
    }
  }
}
```

---

## 7. HATEOAS ❌ NOT IMPLEMENTED

### What's Missing
No hypermedia links to guide clients through API workflows.

### Example Enhancement
```typescript
// Current response
GET /api/readings/123
{
  "id": "123",
  "spreadType": "celtic_cross",
  "status": "completed"
}

// With HATEOAS
{
  "id": "123",
  "spreadType": "celtic_cross",
  "status": "completed",
  "_links": {
    "self": "/api/readings/123",
    "follow-up": {
      "href": "/api/readings/123/follow-up",
      "method": "POST",
      "cost": 1
    },
    "reflection": {
      "href": "/api/readings/123",
      "method": "PATCH"
    },
    "export": "/api/users/me/export"
  }
}
```

**Priority:** Low (nice-to-have, not critical)

---

## 8. Security & Rate Limiting ✅ EXCELLENT

### Security Headers
✅ Helmet with CSP and HSTS configured
✅ HTTPS enforcement in production
✅ CORS properly configured
✅ No sensitive data in URLs (uses request body)

### Rate Limiting
✅ **Tiered rate limits:**
```typescript
General:  500 req/15min
Auth:     20 req/15min
Payment:  30 req/hour
Strict:   10 req/minute
Admin:    200 req/minute
```

✅ **Idempotency protection:**
- Payment capture endpoints
- Reading creation
- Follow-up questions

### Auth Patterns
✅ JWT verification middleware (Clerk)
✅ Admin role checking
✅ Optional auth for public endpoints

---

## 9. Validation 🟡 MOSTLY GOOD

### Strengths
✅ Zod schemas for request validation
✅ Type-safe validation with error details
✅ Proper schema composition

### Gaps
⚠️ **Inconsistent query param validation:**
```typescript
// Some routes parse manually
const { limit = 20, offset = 0 } = req.query; // ❌ No validation

// Should use Zod schema
const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});
```

---

## 10. Documentation ❌ CRITICAL GAP

### Current State
❌ No OpenAPI/Swagger documentation
❌ No auto-generated API reference
❌ Only inline code comments

### Impact
- Frontend devs rely on reading route files
- Mobile team will struggle with integration
- No contract testing possible
- API changes are undocumented

### Recommended Solution
```bash
npm install swagger-jsdoc swagger-ui-express
```

```typescript
/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/me', requireAuth, async (req, res) => { ... });
```

**Priority:** HIGH - Do this before mobile app development starts.

---

## 11. Response Format Consistency 🟡 NEEDS WORK

### Current Variations
```typescript
// Pattern 1: Direct object
GET /api/users/me → { id, email, credits, ... }

// Pattern 2: Data wrapper
GET /api/users/me/readings → { readings: [...], total: 100 }

// Pattern 3: Success wrapper
POST /api/readings → { success: true, reading: {...} }

// Pattern 4: No wrapper
GET /api/payments/packages → [{ id, price, ... }]
```

### Recommendation: Pick ONE standard
```typescript
// Option A: JSend Standard (Recommended)
{
  "status": "success",
  "data": { ... }
}

// Option B: Envelope pattern
{
  "data": { ... },
  "meta": { timestamp, requestId }
}

// Option C: Direct responses (current, acceptable)
// Keep as-is, just be consistent
```

---

## 12. Code Quality ✅ GOOD

### Strengths
✅ Clean Architecture (use cases, repositories)
✅ Dependency Injection (Awilix container)
✅ Separation of concerns (thin controllers)
✅ Type safety (TypeScript + Zod)
✅ Middleware composition

### Minor Issues
```typescript
// readings.ts:179-246 - Horoscope endpoints still here
// Should be moved to horoscopes.ts ✅ (route file already exists)

// users.ts:196-216 - Dev endpoint in production code
router.post('/me/reset-daily-bonus', requireAuth, async (req, res) => {
  if (process.env.NODE_ENV === 'production') { // ❌ Shouldn't exist in prod
    return res.status(403).json({ error: 'Not allowed in production' });
  }
  // ...
});
// Recommendation: Extract to separate dev-only router
```

---

## Priority Action Items

### 🔴 CRITICAL (Before Mobile Launch)
1. **Add API Versioning** → `/api/v1/*`
2. **Create OpenAPI/Swagger Docs** → Auto-generated reference
3. **Standardize Error Format** → Consistent error responses
4. **Remove Dev Endpoints** → Separate dev-only routes

### 🟡 HIGH (Next Sprint)
5. **Standardize Pagination** → Consistent response format
6. **Move Horoscope Endpoints** → Out of readings.ts
7. **Add Query Param Validation** → Zod schemas for all query params
8. **Fix Status Code Edge Cases** → 409 for conflicts

### 🟢 MEDIUM (Phase 2)
9. **Add HATEOAS Links** → Improve discoverability
10. **Cursor-based Pagination** → For large datasets
11. **Response Format Standard** → Pick and enforce one pattern
12. **Rate Limit Headers** → Include X-RateLimit-* headers

---

## Comparison with Industry Standards

| Feature | CelestiArcana | Industry Best Practice | Gap |
|---------|--------------|------------------------|-----|
| HTTP Semantics | ✅ Correct | ✅ Required | None |
| Status Codes | 🟡 Mostly | ✅ Required | Minor issues |
| Versioning | ❌ None | ✅ Required | **Critical** |
| Rate Limiting | ✅ Excellent | ✅ Required | None |
| Authentication | ✅ Good | ✅ Required | None |
| Error Format | 🟡 Inconsistent | ✅ Standardized | Medium |
| Pagination | 🟡 Partial | ✅ Consistent | Medium |
| HATEOAS | ❌ None | 🟡 Optional | Low priority |
| Documentation | ❌ None | ✅ Required | **Critical** |
| Validation | ✅ Good | ✅ Required | Minor gaps |

---

## Risk Assessment for Mobile Integration

### 🔴 HIGH RISK
- **No API versioning** → Can't evolve APIs independently
- **No OpenAPI docs** → Mobile team will struggle

### 🟡 MEDIUM RISK
- **Inconsistent pagination** → Extra client-side handling
- **Inconsistent errors** → Complex error parsing

### 🟢 LOW RISK
- Security is solid ✅
- Rate limiting is good ✅
- Auth patterns work well ✅

---

## Recommendations by Phase

### Phase 0: Pre-Mobile Launch (2-3 days)
```bash
1. Add /api/v1 prefix to all routes
2. Generate OpenAPI documentation
3. Standardize error response format
4. Create API versioning strategy doc
```

### Phase 1: Consistency Fixes (1 week)
```bash
5. Standardize pagination across all endpoints
6. Add Zod validation to query parameters
7. Move horoscope endpoints out of readings.ts
8. Fix status code edge cases (409, etc.)
```

### Phase 2: Enhancement (2 weeks)
```bash
9. Add HATEOAS links to key resources
10. Implement cursor-based pagination
11. Add response format standard
12. Add rate limit headers
```

---

## Conclusion

The CelestiArcana API is **well-architected** with solid security, authentication, and rate limiting. However, **critical gaps in versioning and documentation** pose risks for the upcoming mobile integration.

**Recommended Action:** Address the 4 critical items (versioning, docs, error format, dev endpoints) in a focused 2-3 day sprint before starting mobile app development.

**Grade Breakdown:**
- REST Fundamentals: A
- Security: A+
- Code Quality: A
- Consistency: C+
- Documentation: D
- Versioning: F

**Overall: B+** (Would be A with versioning and docs)

---

**Next Steps:**
1. Review this audit with team
2. Prioritize action items
3. Create tickets for Phase 0 work
4. Schedule API versioning implementation
5. Set up Swagger documentation

---

*Audit completed using the Backend Development API Design Principles skill from the Claude Agents repository.*
