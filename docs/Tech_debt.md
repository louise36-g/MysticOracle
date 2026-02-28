# CelestiArcana Technical Debt

> Outstanding issues and improvements still to be addressed.

---

## Last Updated: February 28, 2026

---

## Pending

### 1. Prisma v6 → v7

**Priority:** Medium
**Status:** Blocked

Upgraded to v6.19.2 (from v5.22.0) on Feb 28, 2026. v7 is deferred because it requires:
- `@prisma/adapter-pg` and `pg` driver
- `prisma.config.ts` with database connection
- Generator change: `prisma-client-js` → `prisma-client` + updated imports
- Dockerfile for Coolify deployment (Nixpacks won't work)

**Blocker:** Coolify Docker networking issues caused an outage during a previous v7 attempt. The mapped enum `@map` breaking change was reverted in v7.3, so that is no longer a risk.

**When to do it:** After Coolify Docker networking is resolved or if migrating off Coolify.

---

### 2. Rate Limiting Load Testing

**Priority:** Medium
**Status:** Done

Integration tests added (`rateLimiting.integration.test.ts`) verifying 429 enforcement, header correctness, per-IP isolation, window resets, all 5 limiter tiers, JSON error format, and global+per-route stacking. Load test script added (`scripts/load-test.ts`) using autocannon for manual verification against a running server (`npm run load-test`).

---

### 3. Dual Content Systems (Blog + Tarot Articles)

**Priority:** Medium
**Status:** Not started

Two separate content systems exist with overlapping functionality. Blog has richer features (rich text editor, media management, featured posts, view counts, sitemap). Tarot articles add card-specific fields (cardType, cardNumber, schemaJson). Both have independent sortOrder, caching, and admin interfaces, which led to the category sort order bug (Feb 2026).

**Recommendation:** Consolidate into one system by extending the blog system with optional tarot-specific fields. Migrate existing tarot articles into blog posts.

**When to do it:** Not urgent — both systems work. Best triggered when a pain point surfaces (e.g., wanting view counts on tarot articles, needing the rich text editor for card meanings, or another ordering/caching discrepancy).

---

### 4. Hardcoded Strings

**Priority:** Low
**Status:** Not started

Some UI strings are hardcoded instead of using the translation system. Translation coverage is ~75-80% of user-facing components.

**Fix:** Move remaining user-facing strings to translation files.

---

## Tracking

| Issue | Priority | Status | Notes |
|-------|----------|--------|-------|
| Prisma v6 → v7 | Medium | Blocked | Needs Dockerfile + adapter-pg; Coolify networking issue |
| Rate limiting load test | Medium | Done | Integration tests + autocannon load test script |
| Dual content systems | Medium | Not started | Consolidate blog + tarot articles when pain point arises |
| Hardcoded strings | Low | Not started | ~75-80% translation coverage, remainder to migrate |

---

## Previously Completed

For reference, the following were all resolved prior to or during February 2026:

- Horoscope system overhaul (AI model, post-processing, formatting)
- Card image standardization (10 images resized to 256x384)
- Content system refactoring (9 phases, unified taxonomy)
- API versioning (`/api/v1/` prefix on all routes)
- Stripe v14 → v20 upgrade
- Clerk Backend v1 → v2 upgrade (bumped to v2.32.2)
- React Router v6 → v7 upgrade (v7.13.0)
- Prisma v5 → v6 upgrade (v6.19.2)
- Dead code removal (deductCredits, old taxonomy routes)
- LocalStorage cleanup utility
- Critical `any` types fixed (admin.ts, tarot-articles.ts)
- ESLint 9 + Prettier configured (0 issues remaining)
- 348 tests across 22 test files (blog, email, payments, GDPR, auth, AI, credits)
- All documentation complete (API_ERRORS, CREDIT_SYSTEM, PAYMENT_FLOW, DEPLOYMENT)
- Environment validation at startup
- Sentry error tracking + performance monitoring with custom spans
- Oversized backend files split (translations/, services/api/, blog/)
- Large components refactored (AdminTarotArticles, AdminBlog, ActiveReading, UserProfile)
- Credit deduction patterns unified (backend-only deduction)
- Error boundaries at route, page, and reading flow levels
- Console warnings audited (no issues found)
- AdminTarotArticles modularized (1,045 → 224 lines)
