# Caching System & Validation Refactor Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add in-memory caching to reduce database load and refactor validation to use warnings for SEO/quality checks.

**Architecture:** Two-tier validation (errors vs warnings) + abstracted cache service (node-cache now, Redis later).

**Tech Stack:** node-cache, Express middleware, Zod validation schemas

---

## Part 1: Validation Refactor

### Current Problem
All validation failures are blocking errors. SEO issues (meta title too long) prevent saving even when content is otherwise valid.

### Solution: Two-Tier Validation

**BLOCKING ERRORS (red) - Must fix to save:**
- JSON parse errors
- title (required, 10-100 chars)
- content (required, min 5000 chars)
- cardType (required, valid enum)
- cardNumber (required)
- element (required, valid enum)
- slug (required, valid format)
- author (required)

**WARNINGS (orange) - Can save anyway:**
- SEO meta title length (> 60 chars)
- SEO meta description length (> 155 chars)
- SEO focus keyword missing/short
- FAQ count (< 5 or > 10)
- FAQ question/answer length
- excerpt length
- featuredImageAlt quality
- tags count
- categories count

### Implementation
- Split `TarotArticleSchema` into `CoreSchema` (errors) + `QualitySchema` (warnings)
- Validate both, return combined result with `errors[]` and `warnings[]`
- Frontend already displays warnings in amber - minimal UI changes needed

---

## Part 2: Caching Architecture

### Current Problem
"Too many requests" errors from database connection pool exhaustion. Media library and other frequently-accessed data hammering the database.

### Solution: In-Memory Cache with Abstraction

```
┌─────────────────────────────────────────────────┐
│                  CacheService                   │
│  (abstraction - swap node-cache → Redis later)  │
├─────────────────────────────────────────────────┤
│  get(key) / set(key, value, ttl) / del(key)    │
│  getStats() / flush() / flushPattern(prefix)   │
└─────────────────────────────────────────────────┘
```

### Cache Categories & TTLs

| Cache Key Pattern | TTL | Purpose |
|-------------------|-----|---------|
| `media:list` | 5 min | Media library queries |
| `media:list:<folder>` | 5 min | Filtered media |
| `articles:list` | 5 min | Article listings |
| `articles:<slug>` | 10 min | Individual articles |
| `horoscope:<sign>:<lang>` | 1 hour | Daily horoscopes |
| `tags:list` | 10 min | Tag listings |
| `categories:list` | 10 min | Category listings |

### Cache Invalidation Strategy
- On media upload/delete → flush `media:*`
- On article save/delete → flush `articles:*`
- Admin "Purge All" → flush everything

### Browser Caching (HTTP Headers)
- Static uploads: `Cache-Control: public, max-age=31536000` (1 year, immutable files)
- API responses: `Cache-Control: private, max-age=300` (5 min)

---

## Part 3: Admin Cache Management Page

### Location
New tab in AdminDashboard → "Cache"

### Features
- View cache stats (item count, hit rate, memory usage)
- Cache breakdown by category (media, articles, horoscope, other)
- "Purge All Cache" button
- Last purged timestamp

### API Endpoints
- `GET /api/admin/cache/stats` - Returns cache statistics
- `POST /api/admin/cache/purge` - Clears all cache

---

## Future: Redis Upgrade Path

When traffic increases or multiple server instances are needed:
1. Install Redis add-on on Render
2. Create `RedisCacheAdapter` implementing same interface
3. Swap adapter in CacheService constructor
4. No other code changes needed

---

## Files to Create/Modify

### New Files
- `server/src/services/cache.ts` - CacheService abstraction
- `components/admin/AdminCache.tsx` - Cache management UI

### Modified Files
- `server/src/lib/validation.ts` - Split into core + quality schemas
- `server/src/routes/blog.ts` - Add caching to media endpoints
- `server/src/routes/tarot-articles.ts` - Add caching, update validation
- `server/src/routes/admin.ts` - Add cache stats/purge endpoints
- `server/src/index.ts` - Add Cache-Control headers middleware
- `components/admin/AdminDashboard.tsx` - Add Cache tab
