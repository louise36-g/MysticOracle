# CelestiArcana Database Performance Analysis & Optimization Plan

**Date:** 2026-03-07
**Scope:** PostgreSQL on Render (mysticoracle-db) + Node.js Express API
**Backend URL:** `https://api.celestiarcana.com`

---

## 1. Executive Summary

The CelestiArcana backend exhibits several performance issues ranging from a confirmed 500 error on a public endpoint to inconsistent response times suggesting cold starts and missing caches. The database schema has good index coverage for its current size (78 tarot articles, 135 blog posts) but will need optimization as data grows. The most impactful improvements are: fixing the broken endpoint, adding application-level caching to the list endpoint, configuring connection pooling, and introducing Redis for shared cache state.

---

## 2. Endpoint Performance Baseline

All measurements taken from macOS client to Render Frankfurt EU.

### 2.1 Measured Response Times

| Endpoint | Status | TTFB (Cold) | TTFB (Warm) | Size | Notes |
|---|---|---|---|---|---|
| `GET /api/health` | 200 | 2,066ms | 205ms | 111B | Database `SELECT 1` check; 10x variance |
| `GET /api/tarot-articles` | 200 | 720ms | 340ms | 19KB | **No application cache** |
| `GET /api/tarot-articles?limit=100` | 200 | 868ms | 764ms | 75KB | **No application cache**, never drops |
| `GET /api/tarot-articles?status=PUBLISHED` | 200 | 1,004ms | -- | 19KB | **No application cache** |
| `GET /api/tarot-articles?status=published` | **500** | 1,073ms | -- | 35B | **BUG: Zod enum case mismatch** |
| `GET /api/tarot-articles?limit=10&status=published` | **500** | 2,400ms | -- | 35B | **Same bug** |
| `GET /api/tarot-articles/overview` | 200 | 1,638ms | **164ms** | 68KB | Cached (5 queries in parallel) |
| `GET /api/tarot-articles/:slug` | 200 | 598ms | 795ms | 48KB | Cache miss on second call (unexpected) |
| `GET /api/blog/posts` | 200 | 260ms | 259ms | 20KB | Cached effectively |
| `GET /api/blog/posts?limit=50` | 200 | 1,877ms | **524ms** | 79KB | Cache kicks in on 2nd call |
| `GET /api/blog/posts?category=tarot-card-meanings` | 200 | 1,271ms | **259ms** | 9KB | Cached effectively |
| `GET /api/blog/categories` | 200 | 273ms | -- | -- | Includes `_count` subquery |
| `GET /api/blog/tags` | 200 | 414ms | -- | -- | Includes `_count` subquery |
| `GET /api/translations/en` | 200 | 230ms | -- | 64KB | Good |
| `GET /api/translations/version` | 200 | 225ms | -- | 15B | Good |

### 2.2 Key Observations

1. **Cold start penalty:** Health check TTFB varies from 205ms to 2,066ms (10x). This is classic Render free/starter tier cold start behavior where the service spins down after inactivity.

2. **The overview endpoint fires 5 parallel database queries** and takes 1.6s uncached, but drops to 164ms when cached. This is the single biggest proof that caching works and should be applied more broadly.

3. **The tarot-articles list endpoint has NO caching at all.** Every request hits the database. This is the most-called public endpoint and should be cached.

4. **Blog posts are cached** but `tarot-articles` list is not -- inconsistent caching strategy.

5. **Large payloads:** `limit=100` returns 75KB, `limit=50` blog returns 79KB. No gzip compression headers observed in curl output, though the server may negotiate it with browsers.

---

## 3. Critical Bugs Found

### 3.1 BUG: `status=published` (lowercase) Returns 500

**File:** `/server/src/routes/tarot-articles/public.ts`, line 181

```typescript
status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
```

The Zod schema expects uppercase enum values (`PUBLISHED`) but the frontend or external consumers may pass lowercase (`published`). When lowercase is passed, Zod throws a validation error, which is caught by the generic catch block and returned as `{"error":"Failed to list articles"}` with a 500 status -- hiding the real cause.

**Impact:** Any API consumer passing `status=published` gets a 500 error with a 1-2.4s delay (the time is spent in error handling, not actual query execution).

**Fix:** Either:
- Transform the input to uppercase before validation: `.transform(v => v?.toUpperCase())`
- Or use `.pipe(z.enum(...))` with a preprocess step
- Or return a proper 400 with the Zod error message instead of a generic 500

### 3.2 Missing Error Details

The catch block at line 225 swallows the actual error:
```typescript
catch (error) {
    console.error('Error listing tarot articles:', error);
    res.status(500).json({ error: 'Failed to list articles' });
}
```

A Zod validation error (bad input) should return 400, not 500. The error type should be checked:
```typescript
if (error instanceof z.ZodError) {
    return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
}
```

---

## 4. Database Query Analysis

### 4.1 Current Schema Index Coverage

The Prisma schema has **good index coverage** for the current data model:

| Table | Indexes | Assessment |
|---|---|---|
| `BlogPost` | `slug`, `status+publishedAt`, `featured`, `deletedAt`, `sortOrder`, `contentType`, `contentType+cardType`, `contentType+status` | Well-indexed |
| `User` | `email`, `referralCode` | Adequate |
| `Reading` | `userId`, `createdAt`, `spreadType` | Good |
| `Transaction` | `userId`, `paymentId`, `createdAt`, `type` | Good |
| `HoroscopeCache` | `sign+language+date` (unique), `sign+date`, `date` | Good |
| `Translation` | `key+languageId` (unique), `languageId` | Good |
| `AuditLog` | `userId`, `adminUserId`, `action`, `createdAt`, `entityType+entityId` | Good |

### 4.2 Missing Indexes

Despite the good coverage, these composite indexes would benefit specific query patterns:

1. **BlogPost composite for public list queries:**
   ```
   @@index([contentType, status, deletedAt, sortOrder])
   ```
   The public tarot-articles list queries `WHERE contentType = 'TAROT_ARTICLE' AND status = 'PUBLISHED' AND deletedAt IS NULL ORDER BY sortOrder ASC, createdAt ASC`. A composite index covering all these columns would allow an index-only scan.

2. **BlogPost for blog public listing with featured sort:**
   ```
   @@index([status, deletedAt, featured, publishedAt])
   ```
   The blog posts public list uses `WHERE status = 'PUBLISHED' AND publishedAt IS NOT NULL AND deletedAt IS NULL ORDER BY featured DESC, publishedAt DESC`.

3. **HoroscopeCache cleanup index:**
   ```
   @@index([date, userId])
   ```
   The cleanup job likely queries old horoscopes by date. Currently indexed but may benefit from covering userId.

4. **ReadingCard for card frequency analysis:**
   ```
   @@index([cardId, isReversed])
   ```
   If you ever want to analyze which cards appear most frequently.

### 4.3 Query Pattern Issues

**4.3.1 Overview endpoint: 5 sequential-parallel queries**

`/api/tarot-articles/overview` fires 5 separate `findMany` calls (one per card type) in `Promise.all`. While parallel execution helps, this could be a single query:

```sql
SELECT * FROM "BlogPost"
WHERE "contentType" = 'TAROT_ARTICLE'
  AND status = 'PUBLISHED'
  AND "deletedAt" IS NULL
ORDER BY "cardType", "sortOrder" ASC, "createdAt" ASC;
```

Then group by `cardType` in application code. This eliminates 4 round-trips to the database.

**4.3.2 Blog categories with _count subquery**

The categories endpoint uses Prisma `_count` which generates a correlated subquery for each category. With 14 categories, this creates 14 subqueries. For small counts this is fine, but a single `GROUP BY` query would be more efficient:

```sql
SELECT c.*, COUNT(bpc."postId") as "postCount"
FROM "BlogCategory" c
LEFT JOIN "BlogPostCategory" bpc ON bpc."categoryId" = c.id
LEFT JOIN "BlogPost" bp ON bp.id = bpc."postId"
  AND bp.status = 'PUBLISHED'
  AND bp."publishedAt" IS NOT NULL
  AND bp."deletedAt" IS NULL
GROUP BY c.id
ORDER BY c."sortOrder" ASC;
```

**4.3.3 Single blog post fetches related posts sequentially**

In `blog/public.ts`, the single post endpoint (`/posts/:slug`) makes two sequential queries:
1. Fetch the post
2. Fetch related posts by shared category

These could be parallelized with `Promise.all`, or the related posts could be cached separately.

**4.3.4 View count increment is a write on every read**

Every blog post view triggers an `UPDATE` (even though it's non-blocking). Under traffic, this creates write contention. Consider batching view count updates (e.g., accumulate in memory and flush every 30 seconds).

---

## 5. Connection Pooling Analysis

### 5.1 Current Configuration

```typescript
// server/src/db/prisma.ts
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
export const prisma = new PrismaClient({ adapter });
```

**Issues identified:**

1. **No explicit connection pool size configured.** The `PrismaPg` adapter uses the `pg` driver defaults, which is a pool of 10 connections. On Render's free/starter PostgreSQL tier, the connection limit is typically 25-50. With a pool of 10, this should be fine for current traffic, but there is no tuning.

2. **No `connection_limit` in the DATABASE_URL.** Prisma supports `?connection_limit=N` in the URL for built-in pooling, but since this uses the `PrismaPg` adapter (driver-level adapter), that parameter is ignored. Pool size must be configured on the `pg.Pool` options.

3. **No PgBouncer.** For Render deployments, using PgBouncer as a connection pooler is recommended to handle connection reuse across cold starts. Render offers this as an option on paid database tiers.

4. **Cold start connection overhead.** The 2s health check TTFB on cold start includes: (a) Render waking the service, (b) Node.js boot + DI container initialization, (c) first database connection establishment (SSL handshake to PostgreSQL). This is structural to Render's free tier.

### 5.2 Recommendations

```typescript
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,                    // Maximum pool size
  min: 2,                     // Keep 2 connections warm
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout new connections after 5s
  allowExitOnIdle: false,     // Keep pool alive
});

const adapter = new PrismaPg({ pool });
```

---

## 6. Caching Strategy Recommendations

### 6.1 Current State

| Component | Cache | TTL | Status |
|---|---|---|---|
| Tarot overview | NodeCache | 5 min | Working well |
| Tarot single article | NodeCache | 10 min | Working (some misses observed) |
| **Tarot article list** | **None** | -- | **Missing -- highest impact fix** |
| Blog post list | NodeCache | 5 min | Working |
| Blog single post | None | -- | Not cached (view count increment prevents it) |
| Blog categories | None | -- | Not cached (but fast enough) |
| Translations | NodeCache | 1 hour | Working |
| HTTP cache | `Cache-Control: private, max-age=300` | 5 min | Browser-only, not CDN-friendly |

### 6.2 Immediate Improvements (No Infrastructure Change)

**6.2.1 Add caching to tarot-articles list endpoint**

In `/server/src/routes/tarot-articles/public.ts`, the `GET /` handler has no caching. Add it:

```typescript
router.get('/', async (req, res) => {
  try {
    const params = listArticlesSchema.parse(req.query);
    const { page, limit, cardType, status } = params;

    // Build deterministic cache key
    const cacheKey = `tarot:list:${JSON.stringify({ p: page, l: limit, ct: cardType || '', s: status || '' })}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    // ... existing query logic ...

    const response = { articles, pagination, total };
    await cacheService.set(cacheKey, response, CacheService.TTL.ARTICLES);
    res.json(response);
  }
});
```

**Expected impact:** Reduce average TTFB from ~800ms to ~165ms for repeat requests.

**6.2.2 Cache blog categories and tags**

These are relatively static data. Add 10-minute caching:

```typescript
const cached = await cacheService.get('blog:categories');
if (cached) return res.json(cached);
// ... query ...
await cacheService.set('blog:categories', response, CacheService.TTL.CATEGORIES);
```

**6.2.3 Change HTTP Cache-Control to public for static content endpoints**

Currently all API responses use `private, max-age=300`. For public endpoints like tarot articles and blog posts, change to:
```
Cache-Control: public, max-age=300, s-maxage=600
```

This allows CDN/reverse proxy caching (if one is ever added in front).

### 6.3 Medium-Term: Redis (Recommended)

**Why:** NodeCache is in-process memory. Every time Render restarts the service (cold start, deploy, crash), the entire cache is lost. With Redis:

1. Cache survives service restarts
2. Cache can be shared across multiple service instances (horizontal scaling)
3. Cache warm-up is not needed after deploys
4. Redis pub/sub can be used for cache invalidation across instances

**Render offers Redis as a managed service** in the same Frankfurt region.

**Implementation:**

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
});

class RedisCacheService {
  async get<T>(key: string): Promise<T | undefined> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : undefined;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(`${pattern}*`);
    if (keys.length) await redis.del(...keys);
  }
}
```

**TTL Recommendations with Redis:**

| Data Type | TTL | Reason |
|---|---|---|
| Tarot article list | 10 min | Rarely changes, admin invalidates on edit |
| Tarot overview | 15 min | Changes only when articles are published |
| Single article | 30 min | Rarely changes after publish |
| Blog post list | 5 min | New posts may be published |
| Blog categories | 30 min | Very stable |
| Translations | 1 hour | Only changes via admin |
| Health check DB status | 30 sec | Should reflect real state |

### 6.4 Long-Term: CDN Layer

Add Cloudflare or similar CDN in front of `api.celestiarcana.com`:
- Static API responses (tarot articles, blog posts) can be edge-cached globally
- Reduces latency for users far from Frankfurt
- `Surrogate-Control` or `CDN-Cache-Control` headers allow fine-grained control
- Estimated TTFB improvement: 200-800ms down to 10-50ms for cached content

---

## 7. Cold Start Mitigation

### 7.1 Problem

Render's free tier spins down services after 15 minutes of inactivity. Cold starts take 2-5 seconds due to:
1. Container wake-up (~1-2s)
2. Node.js boot + module loading + DI container initialization (~0.5-1s)
3. First database connection (SSL handshake to Render PostgreSQL) (~0.5-1s)
4. Startup sort-order initialization queries (~0.3s)

### 7.2 Recommendations

1. **Keep-alive ping (quick win):** Set up an external cron (e.g., UptimeRobot, cron-job.org) to hit `/api/health` every 5 minutes. This prevents the service from spinning down.

2. **Upgrade to Render paid tier:** The "Starter" plan ($7/month) keeps services always-on, eliminating cold starts entirely.

3. **Reduce startup work:** The `index.ts` startup code runs sort-order initialization for 5 card types on every boot. Move this to a migration or admin endpoint instead of a boot-time task.

4. **Lazy-load heavy modules:** The DI container (`createAppContainer()`) is initialized synchronously at import time. Consider deferring non-critical service initialization.

---

## 8. Query Optimization Recommendations

### 8.1 Priority 1: Fix the 500 Error

Add input normalization or proper error handling for the `status` parameter in both the public and admin tarot article list endpoints.

### 8.2 Priority 2: Consolidate Overview Queries

Replace the 5 parallel queries in `/api/tarot-articles/overview` with a single query + application-level grouping. This reduces database round-trips from 5 to 1.

### 8.3 Priority 3: Select Only Needed Fields

The single article endpoint uses `include: articleFullInclude` which pulls full category and tag objects. For the public endpoint, only `nameEn`, `nameFr`, and `slug` are needed from categories and tags. The full `include: { category: true }` pulls all 9+ columns from BlogCategory.

### 8.4 Priority 4: Batch View Count Updates

Replace the per-request `UPDATE` for view counts with an in-memory counter that flushes to the database periodically:

```typescript
const viewBuffer = new Map<string, number>();

function incrementView(postId: string) {
  viewBuffer.set(postId, (viewBuffer.get(postId) || 0) + 1);
}

// Flush every 30 seconds
setInterval(async () => {
  const entries = [...viewBuffer.entries()];
  viewBuffer.clear();
  for (const [id, count] of entries) {
    await prisma.blogPost.update({
      where: { id },
      data: { viewCount: { increment: count } },
    });
  }
}, 30_000);
```

### 8.5 Priority 5: Add Missing Composite Indexes

Add to `schema.prisma`:
```prisma
model BlogPost {
  // ... existing fields ...

  // New composite indexes for common query patterns:
  @@index([contentType, status, deletedAt, sortOrder])    // Tarot article listing
  @@index([status, publishedAt, deletedAt, featured])     // Blog post listing
}
```

These will become important as the dataset grows beyond hundreds of records.

---

## 9. Render-Specific Recommendations

### 9.1 Database Configuration

1. **Enable PgBouncer** if available on your Render plan. This pools connections at the database level and handles connection reuse across service restarts.

2. **Monitor connection count** via Render dashboard. If connections approach the limit (typically 25 for starter tier), reduce the `pg.Pool` max.

3. **Consider Render's internal networking.** If the API service and database are in the same Render region (Frankfurt), ensure you are using the internal database URL (no internet roundtrip) rather than the external one.

### 9.2 Service Configuration

1. **Health check path:** Configure Render's health check to use `/api/health` so it knows when the service is ready.

2. **Start command optimization:** Ensure the start command uses `node` directly (not `ts-node` or `tsx`) in production for faster boot times.

---

## 10. Implementation Priority

| # | Action | Impact | Effort | Risk |
|---|---|---|---|---|
| 1 | Fix `status=published` 500 error | Critical | 15 min | None |
| 2 | Add caching to tarot-articles list endpoint | High | 30 min | None |
| 3 | Set up keep-alive ping for cold start prevention | High | 10 min | None |
| 4 | Cache blog categories and tags endpoints | Medium | 20 min | None |
| 5 | Return 400 (not 500) for Zod validation errors | Medium | 30 min | None |
| 6 | Configure explicit connection pool settings | Medium | 15 min | Low |
| 7 | Consolidate overview endpoint to single query | Medium | 1 hour | Low |
| 8 | Batch view count updates | Medium | 45 min | Low |
| 9 | Add composite database indexes | Medium | 15 min | Low |
| 10 | Change Cache-Control to public for public endpoints | Low | 15 min | None |
| 11 | Migrate from NodeCache to Redis | High | 3-4 hours | Medium |
| 12 | Add CDN layer (Cloudflare) | High | 2-3 hours | Medium |
| 13 | Reduce startup initialization work | Low | 1 hour | Low |

---

## 11. Monitoring Recommendations

To track the impact of these changes, add:

1. **Request duration logging:** Log the time spent in each endpoint handler (middleware-based).
2. **Database query timing:** Enable Prisma query logging in production (with threshold, e.g., only log queries > 100ms).
3. **Cache hit/miss ratio endpoint:** The `CacheService` already tracks hits/misses. Expose this via an admin endpoint.
4. **Connection pool metrics:** Log pool `waitingCount`, `idleCount`, `totalCount` periodically.
5. **Sentry performance tracing:** Already using Sentry -- enable performance monitoring to capture transaction traces.

---

## Appendix A: Test Commands Used

```bash
# Health check with full timing breakdown
curl -s -o /dev/null -w "HTTP: %{http_code} TTFB: %{time_starttransfer}s DNS: %{time_namelookup}s TLS: %{time_appconnect}s\n" "https://api.celestiarcana.com/api/health"

# Tarot articles with params
curl -s -o /dev/null -w "HTTP: %{http_code} TTFB: %{time_starttransfer}s Size: %{size_download}B\n" "https://api.celestiarcana.com/api/tarot-articles?limit=100"

# Blog posts max limit
curl -s -o /dev/null -w "HTTP: %{http_code} TTFB: %{time_starttransfer}s Size: %{size_download}B\n" "https://api.celestiarcana.com/api/blog/posts?limit=50"
```

## Appendix B: Data Volumes (Current)

| Table | Approximate Records |
|---|---|
| BlogPost (tarot articles) | 78 |
| BlogPost (blog posts) | ~57 (135 total - 78 tarot) |
| BlogCategory | 14 |
| HoroscopeCache | Varies (daily generation, 12 signs x 2 languages) |
| User | Unknown (requires auth) |
| Reading | Unknown (requires auth) |
| Translation | ~640+ keys x 2 languages |

At these volumes, database performance is adequate. The main bottlenecks are network latency (client to Render), cold starts, and missing application-level caching on key endpoints.
