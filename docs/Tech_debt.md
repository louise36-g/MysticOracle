# CelestiArcana Technical Debt

> Outstanding issues and improvements still to be addressed.

---

## Last Updated: March 8, 2026

---

## Pending

---

### 2. Rate Limiting Load Testing

**Priority:** Medium
**Status:** Done

Integration tests added (`rateLimiting.integration.test.ts`) verifying 429 enforcement, header correctness, per-IP isolation, window resets, all 5 limiter tiers, JSON error format, and global+per-route stacking. Load test script added (`scripts/load-test.ts`) using autocannon for manual verification against a running server (`npm run load-test`).

---

---

### 4. Hardcoded Strings

**Priority:** Low
**Status:** Done (user-facing)

All user-facing components now use the `t()` translation system (~95% coverage). Remaining hardcoded ternaries are in admin-only components (~326 strings across 43 files) and legal documents (which use a `content[language]` pattern by design).

**Completed:** Feb 28, 2026 — Migrated 8 components (~48 new translation keys): Header, HoroscopeReading, TarotArticlePage, TarotArticlesList, ReadingModeSelector, SpreadIntroSelector, QuestionLengthModal, SpendingLimitsSettings.

---

## Tracking

| Issue | Priority | Status | Notes |
|-------|----------|--------|-------|
| Prisma v5 → v7 | Medium | Done | v7.4.2 with adapter-pg, prisma-client generator |
| Rate limiting load test | Medium | Done | Integration tests + autocannon load test script |
| Dual content systems | Medium | Done | Consolidated — tarot articles use BlogPost table with contentType='TAROT_ARTICLE' |
| Hardcoded strings | Low | Done (user-facing) | ~95% user-facing coverage; admin strings remain |
| localStorage fallback removal | Medium | Done | Ghost keys removed; all remaining usage legitimate |

---

## Previously Completed

For reference, the following were all resolved prior to or during March 2026:

- Horoscope system overhaul (AI model, post-processing, formatting)
- Card image standardization (10 images resized to 256x384)
- Content system consolidation (tarot articles merged into BlogPost table, 9-phase taxonomy unification)
- API versioning (`/api/v1/` prefix on all routes)
- Stripe v14 → v20 upgrade
- Clerk Backend v1 → v2 upgrade (bumped to v2.32.2)
- React Router v6 → v7 upgrade (v7.13.0)
- Prisma v5 → v7 upgrade (v7.4.2 with adapter-pg, prisma-client generator)
- Dead code removal (deductCredits, old taxonomy routes)
- LocalStorage cleanup utility
- Critical `any` types fixed (admin.ts, tarot-articles.ts)
- ESLint 9 + Prettier configured (0 issues remaining)
- 509 tests across 30 test files (blog, email, payments, GDPR, auth, AI, credits, routes)
- All documentation complete (API_ERRORS, CREDIT_SYSTEM, PAYMENT_FLOW, DEPLOYMENT)
- Environment validation at startup
- Sentry error tracking + performance monitoring with custom spans
- Oversized backend files split (translations/, services/api/, blog/)
- Large components refactored (AdminTarotArticles, AdminBlog, ActiveReading, UserProfile)
- Credit deduction patterns unified (backend-only deduction)
- Error boundaries at route, page, and reading flow levels
- Console warnings audited (no issues found)
- AdminTarotArticles modularized (1,045 → 224 lines)
- Dead code removal: unused CRUD factory (~120 lines), unused cleanHoroscopeText (~185 lines), backup file (1,062 lines)
- AppContext provider value memoized with useMemo (prevents unnecessary re-renders)
- Unhandled promise rejection handler added (prevents silent crashes)
- DB composite indexes added (Reading[userId,createdAt], Transaction[userId,paymentStatus], AuditLog[action,createdAt])
- useAdminCrud shared hook created and adopted in 6 admin components (centralizes CRUD state management)
- Coolify Nixpacks build fixed (CSP headers extracted to Caddyfile.template, Docker memory limits configured)
