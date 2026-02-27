# CelestiArcana Technical Debt

> Known issues, inconsistencies, and areas needing improvement.

---

## Last Updated: February 27, 2026

---

## Recently Completed (January 2026)

### ✅ Horoscope System Improvements
Complete overhaul of horoscope generation:
- **AI Model Upgrade:** Switched from free tier to `openai/gpt-4o-mini` for reliable output
- **Post-Processing:** Added `cleanHoroscopeText()` function to remove astrological jargon
- **Formatting:** Added intelligent paragraph breaks after sentence boundaries
- **Planning Detection:** Added patterns to reject AI reasoning output in OpenRouterService
- **Prompt Refinement:** Updated system prompt to request 5 structured paragraphs without planet mentions

### ✅ Card Image Standardization
- Identified and resized 10 card images with non-standard dimensions
- All reading-cards-mini now standardized to 256x384 pixels
- Files fixed: 10-the-wheel-of-fortune-reversed.jpeg, 20-judgement-reversed.jpeg, 18-the-moon-reversed.jpg, 17-the-star-reversed.jpg, 06-the-lovers-reversed.jpeg, 08-strength-cover.jpeg, 18-the-moon-cover.jpeg, 03-of-pentacles-cover.jpg, 03-of-cups-cover.jpeg, 06-the-lovers-cover.jpeg

### ✅ Content System Refactoring (9 Phases)
Complete overhaul of blog and tarot article systems:
- **Phase 1:** Fixed critical bug (missing `});` in tarot-articles.ts)
- **Phase 2:** Extracted shared utilities (sorting, schema, validation)
- **Phase 3:** Database migration - unified taxonomy (categories/tags shared between blog/tarot)
- **Phase 4:** Split backend routes (tarot-articles → modular: public.ts, admin.ts, trash.ts)
- **Phase 5:** Created service layer (ContentService, TarotArticleService, TaxonomyService)
- **Phase 6:** Split frontend components (AdminTarotArticles → ArticlesTab, TrashTab, hooks)
- **Phase 7:** Added client-side form validation with error display
- **Phase 8:** Unified taxonomy API (categories/tags at `/api/v1/taxonomy/*`)
- **Phase 9:** Cleanup and documentation updates

### ✅ API Versioning Added
- All routes now use `/api/v1/` prefix
- Deprecated `/api/*` routes include sunset headers
- New unified taxonomy at `/api/v1/taxonomy/*`

### ✅ Stripe Updated to v20
- Updated from v14.0.0 to v20.3.0
- API version updated to `2026-01-28.clover`
- All 256 tests pass

### ✅ Dead Code Removed
- Removed unused `deductCredits` function from `services/apiService.ts`
- Removed old tarot-specific taxonomy routes and API functions
- Removed `server/src/routes/tarot-articles/taxonomy.ts` (replaced by unified)

### ✅ LocalStorage Cleanup
- Added `cleanupDeprecatedStorage()` utility in `storageService.ts`
- Called on app initialization to remove stale keys
- Deprecated keys: `readingHistory`, `oldUserCredits`, `mystic_reading_history`, `user_session`

### ✅ Critical `any` Types Fixed
- `admin.ts`: Replaced `any` with `Prisma.UserWhereInput` and `Prisma.TransactionWhereInput`
- `tarot-articles.ts`: Replaced `any` with `Prisma.TarotArticleWhereInput` and typed sort function

### ✅ ESLint & Prettier Configured
- ESLint 9 with flat config (`eslint.config.js`)
- Prettier with consistent formatting (`.prettierrc`)
- Scripts: `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`
- 81 lint issues identified (13 errors, 68 warnings) - to be fixed incrementally

### ✅ Test Coverage Expanded
- Added 29 new tests (53 → 82 total)
- `ProcessPaymentWebhook.test.ts` - 14 tests for webhook handling and idempotency
- `IdempotencyService.test.ts` - 15 tests for idempotency key management

### ✅ AdminTarotArticles Modularized
- Slimmed from 1,045 lines to 224 lines
- Extracted ArticlesTab.tsx (375 lines) with drag-drop reorder
- Extracted TrashTab.tsx (200 lines)
- Created hooks: useArticleList, useTrashList, useArticleForm

---

## Pending Upgrades (Phase 4)

### ✅ Clerk Backend v1 → v2
**Status:** Already on v2. Updated to latest v2.32.2 (Feb 2026). All 290 tests pass.

### Prisma v5 → v7
**Estimated Effort:** 6-10 hours

⚠️ **HIGH RISK: Mapped Enums** - The `CardType` enum with `@map` values will change behavior. `CardType.MAJOR_ARCANA` will equal `"Major Arcana"` instead of `"MAJOR_ARCANA"`.

Changes needed:
- Install `@prisma/adapter-pg` and `pg` driver
- Create `prisma.config.ts` with database connection
- Update schema generator: `prisma-client-js` → `prisma-client` + `output` field
- Update all Prisma client imports
- Node.js 20.19.0+ minimum
- Test all enum comparisons after upgrade

### ✅ React Router v6 → v7
**Status:** Upgraded from v6.30.3 to v7.13.0. All existing APIs (createBrowserRouter, useRouteError, useParams, Navigate) are fully compatible — no code changes needed.

---

## High Priority

### 1. Oversized Backend Files

**Files requiring splitting:**

| File | Lines | Recommended Split |
|------|-------|-------------------|
| ~~`server/src/routes/translations.ts`~~ | ~~2,370~~ | ✅ Already split: translations/ directory (admin.ts, public.ts, shared.ts, defaults.ts) |
| ~~`services/apiService.ts`~~ | ~~2,058~~ | ✅ Already split: services/api/ has 12 modular files |
| ~~`server/src/routes/blog.ts`~~ | ~~800~~ | ✅ Already split: blog/ directory (index.ts, public.ts, posts.ts, trash.ts, media.ts, import.ts, sitemap.ts, shared.ts) |

---

### ~~2. Test Coverage Gaps~~

✅ **Resolved.** 348 tests passing across 22 test files.

**Current Coverage:**
- Unit tests: 348 tests passing (22 test files)
- Route tests: Translation routes, auth middleware, AI routes, blog public routes, blog admin posts, blog trash routes
- Service tests: CreditService, IdempotencyService, PlanetaryCalculation, Email service
- Use case tests: CreateReading, AddFollowUp, ProcessPaymentWebhook, payments, admin, users (GDPR)
- Integration tests: Minimal
- E2E tests: None

**Recently Added (Feb 2026):**
- ✅ Blog public routes tests (14 tests: posts list/single/categories/tags, caching, pagination, filters)
- ✅ Blog admin posts routes tests (19 tests: preview, list, get, create, reorder, update)
- ✅ Blog trash routes tests (10 tests: soft delete, restore, permanent delete, empty trash)
- ✅ Email service tests (15 tests: sendEmail, welcome, purchase, referral, contact, upsert, subscribe, unsubscribe)

**Previously Added:**
- ✅ ExportUserData use case tests (GDPR Article 20)
- ✅ DeleteUserAccount use case tests (GDPR Article 17)
- ✅ Translations routes tests (caching, language fetching)
- ✅ Payment webhook tests (idempotency, refunds)
- ✅ Credit deduction concurrent tests

---

### 3. Missing Documentation

**Required Documentation:**
- ~~`docs/API_ERRORS.md`~~ — ✅ Done: Error codes, HTTP status mapping, troubleshooting
- ~~`docs/PAYMENT_FLOW.md`~~ — ✅ Done: Stripe/PayPal flow, webhook handling, idempotency
- ~~`docs/CREDIT_SYSTEM.md`~~ — ✅ Done: Credit deduction rules, bonus logic, race condition prevention
- ~~`docs/DEPLOYMENT.md`~~ — ✅ Done: Render setup, environment variables, rollback procedures

**Status:** ✅ All required documentation complete.

---

### 4. Infrastructure Gaps

**Missing:**
- ~~**Environment Validation:** No startup validation of required env vars~~ ✅ Done: `src/config/env.ts` validates all critical vars at startup, exits on failure
- ~~**Error Tracking:** Sentry SDK installed but not fully wired up for production monitoring~~ ✅ Done: `captureException` wired into error handler middleware, `setUser` wired into auth middleware
- **Performance Monitoring:** No APM tooling
- **Rate Limiting:** Basic rate limiting exists but untested under load

**Fix:** Consider APM tooling when needed.

---

## Medium Priority

### 5. Large Component Files

**Locations:**
- ~~`components/ActiveReading.tsx`~~ (✅ Refactored: ~900 → 642 lines, uses useReadingFlow hook, phases extracted)
- ~~`components/admin/AdminBlog.tsx`~~ (✅ Refactored: ~800 → 232 lines)
- ~~`components/UserProfile.tsx`~~ (✅ Refactored: ~580 → 474 lines, uses useProfileData and useDailyBonus hooks)
- ~~`components/admin/AdminTarotArticles.tsx`~~ (✅ Refactored: 1,045 → 224 lines)

These components handle too many concerns and are difficult to maintain.

**Fix:** Extract sub-components, use custom hooks for logic.

---

### ~~6. Inconsistent Credit Deduction Patterns~~

✅ **Resolved.** Horoscopes are free (no credits). Questions section was removed. All remaining credit flows (tarot readings, follow-ups) use backend-only deduction with frontend validation.

---

### ~~7. ESLint Warnings to Address~~

✅ **Resolved.** Down from 81 issues to 0. Last two fixes: unused `userId` in readings.ts, unused `debug` import in profile.ts.

---

### 8. Dual Content Systems (Blog + Tarot Articles)

**Issue:** Two separate content systems exist side-by-side with overlapping functionality. Blog system has richer features (rich text editor, media management, taxonomy, featured posts, view counts, sitemap). Tarot articles system adds card-specific fields (cardType, cardNumber, schemaJson). Both have independent sortOrder, caching, and admin interfaces, which led to the category sort order bug (Feb 2026).

**Recommendation:** Consolidate into one system by extending the blog system with optional tarot-specific fields. Migrate existing tarot articles into blog posts.

**Estimated Effort:** 4-6 hours

**When to do it:** Not urgent — both systems work. Best triggered when a pain point surfaces (e.g., wanting view counts on tarot articles, needing the rich text editor for card meanings, or another ordering/caching discrepancy).

---

## Low Priority

### ~~9. Missing Error Boundaries (React)~~

✅ **Resolved.** Error boundaries at three levels:
- **Route-level**: `RouteErrorBoundary` on root layout + admin layout (catches navigation errors)
- **Per-route**: Every `lazyLoad()` route wrapped in compact `ErrorBoundary` (isolates page crashes)
- **Reading flow**: Dedicated `ErrorBoundary` around ActiveReading (preserves layout on error)

---

### ~~10. Console Warnings in Development~~

✅ **Resolved.** Audit found no issues: all list renders have proper keys, event listeners cleaned up, no deprecated React patterns, refs used safely, eslint-disable comments justified.

---

### 11. Hardcoded Strings

**Issue:** Some UI strings are hardcoded instead of using translation system.

**Fix:** Move all user-facing strings to translation files.

---

## Tracking

| Issue | Priority | Status | Notes |
|-------|----------|--------|-------|
| Content system refactoring | High | ✅ Done | 9 phases completed |
| API versioning | Medium | ✅ Done | All routes use /api/v1/ |
| Unified taxonomy | High | ✅ Done | Categories/tags shared |
| AdminTarotArticles modular | Medium | ✅ Done | 1,045 → 224 lines |
| Stripe upgrade v14→v20 | Critical | ✅ Done | Upgraded to v20.1.2 |
| Dead code (deductCredits) | High | ✅ Done | Removed from apiService.ts |
| LocalStorage cleanup | Medium | ✅ Done | Added cleanup utility |
| Critical `any` types | High | ✅ Done | Fixed in admin.ts, tarot-articles.ts |
| ESLint/Prettier setup | Medium | ✅ Done | Configured with flat config |
| Payment webhook tests | Critical | ✅ Done | 14 tests added |
| Idempotency tests | High | ✅ Done | 15 tests added |
| Horoscope system | High | ✅ Done | AI model, post-processing, formatting |
| Card image dimensions | Low | ✅ Done | 10 images resized to 256x384 |
| Clerk v1→v2 upgrade | Medium | ✅ Done | Already on v2, bumped to 2.32.2 |
| Prisma v5→v7 upgrade | Medium | Pending | Phase 4 (mapped enum risk) |
| React Router v6→v7 | Medium | ✅ Done | Upgraded to v7.13.0 |
| Oversized backend files | High | ✅ Done | All split: translations/, services/api/, blog/ |
| Test coverage gaps | High | ✅ Done | 348 tests, blog routes, email service, trash, admin posts all covered |
| Missing documentation | Medium | ✅ Done | All documentation complete (API_ERRORS, CREDIT_SYSTEM, PAYMENT_FLOW, DEPLOYMENT) |
| Infrastructure gaps | Medium | Partial | Env validation ✅, Sentry wired ✅, APM still open |
| Large components | Medium | ✅ Done | AdminTarotArticles, AdminBlog, ActiveReading refactored |
| Credit deduction patterns | Medium | ✅ Done | Horoscopes free, all credit flows use backend deduction |
| ESLint warnings | Medium | ✅ Done | 0 issues remaining |
| Error boundaries | Low | ✅ Done | Per-route + reading flow + admin boundaries |
| Console warnings | Low | ✅ Done | Audit found no issues |
| Dual content systems | Medium | Open | Consolidate blog + tarot articles when pain point arises |
| Hardcoded strings | Low | Open | - |
