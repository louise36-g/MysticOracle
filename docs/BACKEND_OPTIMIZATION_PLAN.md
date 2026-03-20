# CelestiArcana Backend Optimization Plan

**Date:** 2026-03-07
**Scope:** Analysis-only -- no changes made
**Backend:** Node.js/Express on Render (Frankfurt EU), PostgreSQL on Render
**Frontend:** Hetzner VPS (CX23), Caddy web server

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Critical Issues](#3-critical-issues)
4. [Performance Bottlenecks](#4-performance-bottlenecks)
5. [Caching Strategy Assessment](#5-caching-strategy-assessment)
6. [API Versioning Assessment](#6-api-versioning-assessment)
7. [Recommendations](#7-recommendations)
   - 7.1 Response Compression
   - 7.2 Connection Management / Cold Starts
   - 7.3 Application-Level Caching
   - 7.4 Error Handling & Observability
   - 7.5 API Response Optimization
   - 7.6 Resilience Patterns
   - 7.7 Database Optimization
   - 7.8 Startup Performance
8. [Implementation Priority Matrix](#8-implementation-priority-matrix)
9. [Estimated Impact](#9-estimated-impact)

---

## 1. Executive Summary

The CelestiArcana backend is a well-structured Express.js application with clean architecture (DI container, use cases, repositories). However, several performance issues limit production reliability:

- **No response compression middleware** -- the `compression` npm package is not installed or used, despite the profiling noting gzip. Any gzip observed is coming from Caddy/Render's reverse proxy, not the application itself.
- **Render cold starts** cause TTFB spikes from ~200ms to >1,300ms. The health endpoint hits the database on every call (`SELECT 1`), compounding cold-start latency.
- **In-memory-only caching** (node-cache) is lost on every deploy/restart and cannot be shared across instances if the app ever scales horizontally.
- **No Sentry DSN configured** in production -- the code is wired up but `SENTRY_DSN` is listed as "recommended" rather than "required", so error tracking is silently disabled.
- **No circuit breakers** for external services (OpenRouter AI, Stripe, Clerk, Cloudinary).
- **Startup performs synchronous database writes** (sortOrder initialization) that block the listen callback.
- **The `/api/tarot-articles` list endpoint does not use the cache**, while the `/overview` and `/:slug` endpoints do -- this explains the 500 error with 2.4s TTFB observed in profiling.
- **Blog endpoints returning 404** is likely because the frontend is hitting `/api/blog/...` (deprecated path) which passes through the versioned router, but the Caddy reverse proxy may not be forwarding to the backend correctly for blog routes.

---

## 2. Architecture Overview

```
Client (Browser)
    |
    v
Caddy (Hetzner VPS, 46.224.16.4)
    |
    +--> Static assets (SPA, cards, uploads)
    |
    +--> /api/* --> Render Backend (Frankfurt EU)
                        |
                        +--> PostgreSQL (Render)
                        +--> OpenRouter AI API
                        +--> Stripe API
                        +--> Clerk Auth API
                        +--> Cloudinary
                        +--> Brevo (Email)
```

**Key observations from code analysis:**

| Component | Implementation | Notes |
|-----------|---------------|-------|
| Cache | `node-cache` (in-memory singleton) | Lost on restart, no sharing |
| Auth | Clerk JWT verification per request | Calls Clerk API each time |
| DI | Awilix (scoped per request) | Proper but adds overhead per request |
| Rate Limiting | `express-rate-limit` (in-memory) | Lost on restart, no distributed store |
| Error Tracking | Sentry (wired but inactive) | `SENTRY_DSN` not set in production |
| Logging | `console.log/error` | No structured logging, no log levels |
| Compression | None at application level | Relying on reverse proxy only |
| Database | Prisma with `@prisma/adapter-pg` | No connection pooling config |

---

## 3. Critical Issues

### 3.1 Tarot Articles List Endpoint Returns 500

**File:** `/server/src/routes/tarot-articles/public.ts`, lines 187-229

The `GET /api/tarot-articles` (list) endpoint does **not** use the cache, unlike the `/overview` and `/:slug` routes. It runs two Prisma queries (findMany + count) on every request. The Zod schema at line 181 accepts a `status` query parameter but the public endpoint should always enforce `PUBLISHED`. If a client sends `status=DRAFT`, the query will look for draft articles -- which may fail or return unexpected results.

The 500 error with 2.4s TTFB observed in profiling likely stems from:
- Cold database connection on first request after deploy
- No caching on this endpoint
- Potential Prisma query timeout or connection pool exhaustion

### 3.2 Sentry Error Tracking Is Disabled in Production

**File:** `/server/src/config/env.ts`, line 30

`SENTRY_DSN` is listed under `recommendedInProduction` instead of `requiredInProduction`. The Sentry initialization code at `/server/src/config/sentry.ts` line 22 silently returns if DSN is missing. This means the 500 errors are invisible -- no alerts, no stack traces, no error grouping.

### 3.3 Blog Endpoints Return 404

The blog routes are mounted at `/api/v1/blog` (line 252 of index.ts) and also at `/api/blog` via the deprecated router. If Caddy is configured to proxy `/api/` requests to the backend, this should work. The 404 likely indicates one of:
- Caddy is not proxying `/api/blog/` to the backend (misconfigured reverse proxy rules)
- The deprecated `/api/` router is failing silently
- The blog posts table has no published posts with `publishedAt` set (the public endpoint requires both `status: 'PUBLISHED'` AND `publishedAt: { not: null }`)

---

## 4. Performance Bottlenecks

### 4.1 Health Endpoint Hits Database Every Time

**File:** `/server/src/routes/health.ts`, line 57

```typescript
await prisma.$queryRaw`SELECT 1`;
```

Every health check forces a database round-trip. On Render, where the DB is a separate service, this adds 5-50ms in the best case and much more during cold starts. Health checks from uptime monitors, load balancers, or Render's own health checks amplify this.

**Impact:** TTFB varies 197ms to 1,307ms as observed in profiling.

### 4.2 No Response Compression

**File:** `/server/package.json`

The `compression` package is not in dependencies. The Express app does not call `app.use(compression())`. JSON API responses (especially tarot articles with full HTML content, blog posts, and horoscopes) can be 10-50KB uncompressed. While Render's reverse proxy may add some compression, the application has no control over this, and it varies by response size threshold.

### 4.3 Startup Blocks on Database Writes

**File:** `/server/src/index.ts`, lines 322-356

On every server start, the app:
1. Imports Prisma client dynamically
2. Queries all tarot articles across 5 card types
3. Checks if all have `sortOrder === 0`
4. Runs a `$transaction` to update each one if so
5. Invalidates both tarot and blog caches

This runs inside `app.listen()` callback, meaning the server is technically accepting requests while still performing database writes. On Render cold starts, this compounds the initial latency.

### 4.4 Clerk JWT Verification on Every Authenticated Request

**File:** `/server/src/middleware/auth.ts`, line 39

```typescript
const payload = await verifyToken(token, { secretKey: getSecretKey() });
```

Clerk's `verifyToken` may call Clerk's API for JWKS key rotation checks. While most JWT libraries cache the JWKS keys, Clerk's SDK behavior depends on the version. Each auth check adds network latency if JWKS are not cached.

### 4.5 Admin Check Requires Additional DB Query

**File:** `/server/src/middleware/auth.ts`, lines 104-106

```typescript
const user = await prisma.user.findUnique({
  where: { id: req.auth.userId },
  select: { isAdmin: true },
});
```

Every admin request makes an additional database query after JWT verification. This is a simple indexed lookup but adds one more round-trip.

### 4.6 Tarot Overview Makes 5 Parallel Database Queries

**File:** `/server/src/routes/tarot-articles/public.ts`, lines 60-86

The overview endpoint fires 5 parallel `findMany` queries (one per card type). While `Promise.all` helps, this is 5 queries instead of 1 query with `GROUP BY` or a single query filtered by `contentType = 'TAROT_ARTICLE'` and grouped in application code.

### 4.7 Blog Single Post Makes 2 Sequential Queries

**File:** `/server/src/routes/blog/public.ts`, lines 125-175

Fetching a single blog post does:
1. `findFirst` for the main post
2. Fire-and-forget `update` for view count increment
3. `findMany` for related posts (same category)

Steps 1 and 3 are sequential (3 depends on 1). The related posts query does a join through `BlogPostCategory` which is not cached. The view count increment is non-blocking but generates write load on every page view.

### 4.8 OpenRouter AI Calls Have No Timeout Awareness at Route Level

**File:** `/server/src/routes/ai/tarot.ts`

The AI generation routes call `openRouterService.generateTarotReading()` which has a 30-second timeout internally. However, the Express route handlers have no explicit request timeout. If OpenRouter is slow, the client waits up to 30 seconds + retry time (up to 3 retries with exponential backoff = potentially 30 + 30 + 30 seconds = 90 seconds worst case before failing).

### 4.9 Horoscope Pre-Generation Is Sequential

**File:** `/server/src/jobs/preGenerateHoroscopes.ts`, lines 64-155

The pre-generation loop iterates 12 signs x 2 languages = 24 combinations **sequentially**, with a 3-second delay between each. Total time: 24 x (generation_time + 3s) = approximately 2-4 minutes minimum. During this time, if a user requests a horoscope that hasn't been generated yet, they get a live generation (additional latency).

---

## 5. Caching Strategy Assessment

### Current State

| Endpoint | Cached? | TTL | Cache Key Pattern |
|----------|---------|-----|-------------------|
| `GET /tarot-articles/overview` | Yes | 5 min | `tarot:overview` |
| `GET /tarot-articles/:slug` | Yes | 10 min | `tarot:article:{slug}` |
| `GET /tarot-articles` (list) | **No** | -- | -- |
| `GET /blog/posts` | Yes | 5 min | `blog:posts:{params_hash}` |
| `GET /blog/posts/:slug` | **No** | -- | -- |
| `GET /horoscopes/:sign` | Yes | Until midnight | `horoscope:{sign}:{lang}:{date}` |
| `GET /translations/:lang` | **No** (at API level) | -- | -- |
| `GET /payments/packages` | **No** | -- | -- |

### HTTP Cache Headers

**File:** `/server/src/index.ts`, lines 211-224

```typescript
// All GET /api/* (non-admin): Cache-Control: private, max-age=300
// Blog post detail: Cache-Control: no-cache, must-revalidate
// Non-GET or admin: Cache-Control: no-store
```

**Problems:**

1. **`private` prevents CDN caching.** Public content like blog posts, tarot articles, horoscopes, translations, and credit packages are the same for all users. These should use `public` cache-control to allow CDN/Caddy to cache them.

2. **Blog post detail uses `no-cache, must-revalidate`** but the endpoint increments `viewCount` on every request. This means the browser will always re-fetch, which is correct for view counting but prevents any caching benefit. A better approach would be to decouple view counting from content delivery.

3. **No `ETag` or `Last-Modified` headers** on API responses. Without these, conditional requests (`If-None-Match`, `If-Modified-Since`) cannot be used, so browsers always download the full response.

4. **5-minute private cache** is too aggressive for some endpoints (translations change rarely) and not aggressive enough for others (horoscopes are static for 24 hours).

### In-Memory Cache Limitations

The `node-cache` singleton is process-local:
- Lost on every deploy (Render restarts the container)
- Lost on Render auto-restart (memory limits, crashes)
- Cannot be shared if the app scales to multiple instances
- No cache warming on startup (except horoscopes)
- `getStats()` in the cache service serializes every cached value to estimate memory -- this is O(n) and could cause GC pressure with large caches

---

## 6. API Versioning Assessment

**File:** `/server/src/shared/versioning/createVersionedRouter.ts`

**Current approach:**
- `/api/v1/*` -- canonical routes (no deprecation headers)
- `/api/*` -- deprecated routes (same handlers, adds `Deprecation` and `Sunset` headers)

**Issues:**

1. **Rolling deprecation dates.** Lines 273-274 of `index.ts`:
   ```typescript
   deprecationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
   sunsetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
   ```
   These are calculated relative to server start time, meaning every restart pushes the dates forward. The deprecation never actually happens. Clients see different dates depending on when the server last restarted.

2. **No version negotiation.** The `Accept-Version` header is only checked in the error handler (line 21 of `errorHandler.ts`) to decide error format. There is no content negotiation or version routing.

3. **Double middleware execution.** Every request to `/api/*` passes through both the deprecated router middleware (which adds headers) and the v1 router. The same route handlers execute once, but the middleware stack is duplicated.

---

## 7. Recommendations

### 7.1 Response Compression

**Priority: HIGH | Effort: LOW | Impact: 15-40% reduction in response sizes**

Install and configure the `compression` middleware:

```bash
npm install compression
npm install -D @types/compression
```

Add to `index.ts` after Helmet but before routes:

```typescript
import compression from 'compression';

// Compress responses > 1KB
app.use(compression({
  threshold: 1024,
  level: 6,  // Balance between compression ratio and CPU
  filter: (req, res) => {
    // Don't compress SSE or webhook responses
    if (req.path.includes('/webhooks')) return false;
    return compression.filter(req, res);
  },
}));
```

**Why this matters:** Tarot article content (full HTML), blog posts, and horoscope text can be 10-50KB. Gzip compression typically achieves 70-80% reduction for text/JSON. Even if Render's proxy adds some compression, having it at the application level ensures consistent behavior and allows the response to be compressed before being sent over the internal Render network.

### 7.2 Connection Management / Cold Starts

**Priority: CRITICAL | Effort: MEDIUM | Impact: Eliminates 1-2s cold start spikes**

#### 7.2.1 Add a Lightweight Health Check (No DB)

Create a separate `/api/v1/health/ping` endpoint that returns immediately without touching the database. Use this for uptime monitors and Render health checks:

```typescript
// In health.ts -- add before the existing GET /
router.get('/ping', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});
```

Keep the existing `/health` endpoint for deep health checks (admin dashboard).

#### 7.2.2 Keep-Alive Pinging to Prevent Cold Starts

Render spins down free/starter instances after 15 minutes of inactivity. Options:

- **Option A (Recommended):** Use an external cron service (e.g., cron-job.org, UptimeRobot free tier) to ping `/api/v1/health/ping` every 10 minutes.
- **Option B:** If on a paid Render plan, enable "Always On" in the service settings.
- **Option C:** Add a self-ping in the application (not recommended -- fails if the instance is already spun down).

#### 7.2.3 Configure Prisma Connection Pooling

**File:** `/server/src/db/prisma.ts`

The Prisma client uses `@prisma/adapter-pg` with default connection settings. Add explicit pool configuration:

```typescript
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Add connection pool settings
  max: 10,           // Max connections (Render free tier allows 97)
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 5000,  // Fail fast if can't connect in 5s
});
```

#### 7.2.4 Database Connection Warming

Add a lightweight query on startup (before `app.listen`) to ensure the database connection is established before accepting requests:

```typescript
// Warm the database connection before accepting traffic
await prisma.$queryRaw`SELECT 1`;
console.log('Database connection established');

app.listen(PORT, () => { ... });
```

### 7.3 Application-Level Caching

**Priority: HIGH | Effort: MEDIUM-HIGH | Impact: 50-90% reduction in DB queries for hot paths**

#### 7.3.1 Short-term: Fix Missing Caches

Add caching to the endpoints that currently lack it:

**Tarot articles list (`GET /tarot-articles`):**
```typescript
const cacheKey = `tarot:list:${JSON.stringify({ page, limit, cardType, status: 'PUBLISHED' })}`;
const cached = await cacheService.get(cacheKey);
if (cached) return res.json(cached);
// ... existing query ...
await cacheService.set(cacheKey, response, CacheService.TTL.ARTICLES);
```

**Blog post detail (`GET /blog/posts/:slug`):**
Decouple view counting from content delivery. Cache the post content, fire view increment asynchronously:
```typescript
const cacheKey = `blog:post:${slug}`;
const cached = await cacheService.get(cacheKey);
// Always increment view count (non-blocking)
prisma.blogPost.updateMany({
  where: { slug, status: 'PUBLISHED' },
  data: { viewCount: { increment: 1 } },
}).catch(() => {});
if (cached) return res.json(cached);
```

**Translations (`GET /translations/:lang`):**
Already has client-side caching (5min TTL in localStorage). Add server-side caching:
```typescript
// Cache translations for 1 hour (they rarely change)
const cacheKey = `translations:${lang}`;
```

**Credit packages (`GET /payments/packages`):**
These are static data. Cache aggressively:
```typescript
// Cache for 1 hour
const cacheKey = 'packages:all';
```

#### 7.3.2 Medium-term: Migrate to Redis

Replace `node-cache` with Redis for persistent, shared caching:

**Why:**
- Survives deploys and restarts
- Can be shared across multiple instances
- Supports TTL, pub/sub for cache invalidation
- Can serve as rate-limit store (replacing in-memory express-rate-limit)
- Can serve as idempotency store (replacing in-memory node-cache for IdempotencyService)

**Implementation:**
- Use Render's Redis add-on or Upstash Redis (serverless, free tier available)
- Replace `node-cache` with `ioredis` in `services/cache.ts`
- Keep the same `CacheService` interface -- the rest of the codebase does not need to change
- Add Redis health check to the `/health` endpoint

#### 7.3.3 HTTP Cache Header Improvements

Differentiate cache headers by content type:

```typescript
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return next();
  }

  // Admin endpoints -- no caching
  if (req.path.includes('/admin')) {
    res.setHeader('Cache-Control', 'no-store');
    return next();
  }

  // User-specific endpoints -- private cache
  if (req.path.includes('/users/me') || req.path.includes('/readings')) {
    res.setHeader('Cache-Control', 'private, no-cache');
    return next();
  }

  // Horoscopes -- public, cache until midnight
  if (req.path.includes('/horoscopes/')) {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const seconds = Math.floor((midnight.getTime() - now.getTime()) / 1000);
    res.setHeader('Cache-Control', `public, max-age=${seconds}`);
    return next();
  }

  // Translations -- public, long cache with stale-while-revalidate
  if (req.path.includes('/translations')) {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return next();
  }

  // Blog/tarot articles -- public, short cache
  if (req.path.includes('/blog') || req.path.includes('/tarot-articles')) {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return next();
  }

  // Default -- private, 5 minutes
  res.setHeader('Cache-Control', 'private, max-age=300');
  next();
});
```

### 7.4 Error Handling & Observability

**Priority: CRITICAL | Effort: MEDIUM | Impact: Enables detection of all production issues**

#### 7.4.1 Enable Sentry in Production

1. Create a Sentry project for the backend at sentry.io
2. Add `SENTRY_DSN` to Render environment variables
3. Move `SENTRY_DSN` from `recommendedInProduction` to `requiredInProduction` in `config/env.ts`

**File change in `config/env.ts`:**
```typescript
requiredInProduction: [
  // ... existing ...
  'SENTRY_DSN',  // Move from recommendedInProduction
],
```

#### 7.4.2 Add Request ID / Distributed Tracing

Add a request ID middleware early in the stack:

```typescript
import { randomUUID } from 'crypto';

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});
```

This enables:
- Correlating frontend errors with backend logs
- Tracing requests through Caddy -> Express -> Database
- Filtering Sentry events by request

#### 7.4.3 Structured Logging

Replace `console.log/error` with a structured logger (e.g., `pino`):

```bash
npm install pino pino-http
```

Benefits:
- JSON log output for log aggregation (Render logs, Datadog, etc.)
- Automatic request ID, method, path, status, duration in every log line
- Log levels (debug, info, warn, error) with runtime control
- Significantly better performance than `console.log` (async I/O)

Replace the current logger at `/server/src/lib/logger.ts`:

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined,
});
```

#### 7.4.4 Add Performance Monitoring Middleware

Track request duration for all endpoints:

```typescript
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    if (durationMs > 1000) {
      logger.warn({ path: req.path, method: req.method, duration: durationMs, status: res.statusCode },
        'Slow request detected');
    }
  });
  next();
});
```

### 7.5 API Response Optimization

**Priority: MEDIUM | Effort: LOW-MEDIUM | Impact: 20-40% reduction in response sizes**

#### 7.5.1 Reduce Over-fetching in Tarot Overview

The overview endpoint selects individual fields (good), but the 5-query approach can be replaced with a single query:

```typescript
const allArticles = await prisma.blogPost.findMany({
  where: baseWhere,
  select: selectFields,
  orderBy: [{ cardType: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
});

// Group in application code
const grouped = allArticles.reduce((acc, article) => {
  const key = article.cardType || 'unknown';
  (acc[key] = acc[key] || []).push(article);
  return acc;
}, {} as Record<string, typeof allArticles>);
```

This reduces 5 database round-trips to 1.

#### 7.5.2 Add Field Selection / Sparse Fieldsets

For list endpoints, allow clients to request only the fields they need:

```
GET /api/v1/blog/posts?fields=slug,titleEn,coverImage,publishedAt
```

This reduces JSON payload size significantly for list views that only show titles and thumbnails.

#### 7.5.3 Remove Redundant Response Fields

The `transformArticleResponse` function in `shared.ts` includes both legacy fields (`categories: []`, `tags: []`) and new relational fields (`articleCategories`, `tagObjects`, `categoryObjects`). This doubles the taxonomy data in every response. Deprecate the legacy arrays.

#### 7.5.4 Pagination Defaults

The tarot articles list defaults to `limit=20` and blog posts to `limit=12`. These are reasonable. However, the frontend `BlogList.tsx` merges blog + tarot articles for tarot categories (fetching up to 50 + 100 = 150 items). Consider a dedicated endpoint for this merged view to avoid double-fetching.

### 7.6 Resilience Patterns

**Priority: HIGH | Effort: MEDIUM | Impact: Prevents cascading failures**

#### 7.6.1 Circuit Breaker for OpenRouter AI

The OpenRouter service already has retry logic with exponential backoff (3 retries, 1-10s delays). Add a circuit breaker to stop making requests when the service is consistently failing:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,      // Open after 5 failures
    private resetTimeMs: number = 60000  // Try again after 60s
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open -- AI service unavailable');
      }
    }
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'closed';
  }
}
```

Wrap the OpenRouter service:

```typescript
private circuitBreaker = new CircuitBreaker(5, 60000);

private async makeRequest(...) {
  return this.circuitBreaker.execute(() => this.doMakeRequest(...));
}
```

#### 7.6.2 Timeouts on External Service Calls

| Service | Current Timeout | Recommended |
|---------|----------------|-------------|
| OpenRouter AI | 30s (with 3 retries) | 30s per attempt, 2 retries max |
| Stripe | None explicit | 10s |
| Clerk `verifyToken` | None explicit | 5s |
| Cloudinary | None explicit | 15s |
| Brevo (email) | None explicit | 10s |

Add `AbortController` timeouts to all external HTTP calls.

#### 7.6.3 Graceful Degradation for AI Services

When OpenRouter is down:
- Tarot readings: Return a clear error with retry-after header
- Horoscopes: Serve yesterday's horoscope from DB with a "generating today's..." banner
- Summarize question: Disable the feature in the UI rather than showing errors

#### 7.6.4 Request Timeout Middleware

Add a global request timeout to prevent requests from hanging indefinitely:

```typescript
import { setTimeout } from 'timers/promises';

app.use(async (req, res, next) => {
  const timeout = req.path.includes('/ai/') ? 60000 : 30000;
  const timer = setTimeout(timeout).then(() => {
    if (!res.headersSent) {
      res.status(504).json({ error: 'Request timeout' });
    }
  });
  res.on('finish', () => clearTimeout(timer));
  next();
});
```

### 7.7 Database Optimization

**Priority: MEDIUM | Effort: LOW | Impact: 10-30% query speedup**

#### 7.7.1 Missing Composite Indexes

The current schema has good single-column indexes. Add these composite indexes for the most common query patterns:

```prisma
// BlogPost -- the public list query filters by these together
@@index([contentType, status, deletedAt, sortOrder])
@@index([contentType, cardType, status, deletedAt, sortOrder])

// HoroscopeCache -- already has @@unique([sign, language, date]) which serves as an index

// Transaction -- admin queries often filter by type + date range
@@index([userId, type, createdAt])
```

#### 7.7.2 View Count Increment Strategy

The current non-blocking `update` on every page view generates write load:

```typescript
prisma.blogPost.update({
  where: { id: post.id },
  data: { viewCount: { increment: 1 } },
}).catch(() => {});
```

Better approaches:
- **Buffer in memory, flush periodically:** Accumulate view counts in a Map, flush to DB every 60 seconds
- **Use Redis INCR:** Atomic increment in Redis, sync to DB periodically
- **Batch updates:** Collect view events in a queue, batch-update every N minutes

#### 7.7.3 Prisma Query Logging in Development

Add query logging to identify slow queries:

```typescript
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV !== 'production'
    ? [{ emit: 'event', level: 'query' }]
    : [],
});

if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    if (e.duration > 100) {
      console.warn(`Slow query (${e.duration}ms):`, e.query);
    }
  });
}
```

### 7.8 Startup Performance

**Priority: MEDIUM | Effort: LOW | Impact: Faster deploys, cleaner cold starts**

#### 7.8.1 Move SortOrder Initialization to a Migration Script

**File:** `/server/src/index.ts`, lines 322-356

The sortOrder initialization logic should be a one-time migration script, not part of every server start:

```bash
# Create a script: scripts/initSortOrder.ts
# Run once: npx tsx scripts/initSortOrder.ts
# Remove from index.ts
```

#### 7.8.2 Defer Non-Critical Startup Tasks

The horoscope pre-generation starts immediately on boot. Defer it with a short delay to allow the server to become responsive first:

```typescript
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);

  // Defer non-critical tasks
  setTimeout(() => {
    preGenerateHoroscopes().catch(err =>
      console.error('[Horoscope Pre-Gen] Error:', err)
    );
  }, 5000); // 5 second delay
});
```

#### 7.8.3 Parallelize Horoscope Pre-Generation

Instead of sequential generation with 3s delays, generate in controlled parallel batches:

```typescript
// Generate 4 horoscopes in parallel (respects rate limits)
const BATCH_SIZE = 4;
for (let i = 0; i < combos.length; i += BATCH_SIZE) {
  const batch = combos.slice(i, i + BATCH_SIZE);
  await Promise.allSettled(batch.map(({ sign, language }) =>
    generateAndCache(sign, language)
  ));
  await sleep(2000); // Rate limit pause between batches
}
```

This reduces pre-generation time from ~2-4 minutes to ~30-60 seconds.

---

## 8. Implementation Priority Matrix

| # | Recommendation | Priority | Effort | Risk |
|---|---------------|----------|--------|------|
| 1 | Enable Sentry DSN in production | CRITICAL | 15 min | None |
| 2 | Add lightweight `/health/ping` endpoint | CRITICAL | 15 min | None |
| 3 | Set up keep-alive pinging (UptimeRobot) | CRITICAL | 15 min | None |
| 4 | Install + configure `compression` middleware | HIGH | 30 min | Very Low |
| 5 | Add caching to tarot articles list endpoint | HIGH | 30 min | Low |
| 6 | Add caching to blog post detail | HIGH | 30 min | Low |
| 7 | Fix HTTP Cache-Control headers (public vs private) | HIGH | 1 hr | Low |
| 8 | Add request ID middleware | HIGH | 30 min | None |
| 9 | Add circuit breaker for OpenRouter | HIGH | 2 hr | Low |
| 10 | Configure Prisma connection pool settings | HIGH | 30 min | Low |
| 11 | Fix rolling deprecation dates (use fixed dates) | MEDIUM | 15 min | None |
| 12 | Move sortOrder init to migration script | MEDIUM | 1 hr | Low |
| 13 | Replace 5 overview queries with 1 | MEDIUM | 1 hr | Low |
| 14 | Add composite database indexes | MEDIUM | 30 min | Low |
| 15 | Migrate to structured logging (pino) | MEDIUM | 3 hr | Low |
| 16 | Buffer view count increments | MEDIUM | 2 hr | Low |
| 17 | Parallelize horoscope pre-generation | MEDIUM | 2 hr | Low |
| 18 | Add explicit timeouts to all external calls | MEDIUM | 2 hr | Low |
| 19 | Migrate from node-cache to Redis | LOW (long-term) | 4-6 hr | Medium |
| 20 | Add field selection / sparse fieldsets | LOW | 4 hr | Low |

**Recommended implementation order:** 1, 2, 3, 4, 5, 6, 7, 10, 8, 9, 11, 12, 13, 14

---

## 9. Estimated Impact

### Before Optimization (Current State)

| Metric | Value |
|--------|-------|
| Health endpoint TTFB | 197ms - 1,307ms |
| Tarot articles list TTFB | 500+ (intermittent HTTP 500) |
| Blog post detail TTFB | ~300-800ms (uncached, 2 DB queries) |
| Tarot overview TTFB | ~200-500ms (5 parallel queries, cached) |
| AI generation TTFB | 3-30s (model dependent) |
| Cold start total | 3-8s (DB init + sortOrder + horoscope pre-gen) |
| Error visibility | None (Sentry disabled) |

### After Optimization (Projected)

| Metric | Projected Value | Improvement |
|--------|----------------|-------------|
| Health ping TTFB | 10-50ms | 90%+ reduction |
| Tarot articles list TTFB | 50-150ms (cached), 200-400ms (uncached) | No more 500s |
| Blog post detail TTFB | 50-150ms (cached) | 60-80% reduction |
| Tarot overview TTFB | 50-100ms (cached), 150-300ms (1 query) | 40-70% reduction |
| AI generation TTFB | 3-30s (unchanged, but with circuit breaker) | Better failure handling |
| Cold start total | 1-3s (deferred tasks) | 50-60% reduction |
| Error visibility | Full stack traces, alerts, performance traces | From 0 to complete |
| Response sizes | 15-40% smaller (compression) | Bandwidth savings |

### Key Numbers

- Items 1-3 (Sentry + health ping + keep-alive): **30 minutes of work, eliminates cold starts and blind spots**
- Items 4-7 (compression + caching + headers): **2-3 hours of work, 50-80% latency reduction on hot paths**
- Items 8-10 (request ID + circuit breaker + connection pool): **3 hours, production resilience**

The first 10 items can be implemented in a single focused day and will transform the production experience from unreliable to solid.

---

*Analysis performed against codebase at `/Users/louisegriffin/Development/MysticOracle/server/src/`. No files were modified.*
