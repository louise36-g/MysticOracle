# MysticOracle Technical Debt

> Known issues, inconsistencies, and areas needing improvement.

---

## Last Updated: January 31, 2026

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

### Clerk Backend v1 → v2
**Estimated Effort:** 1-2 hours

Changes needed:
- Import `verifyToken` from `@clerk/backend/jwt` (new path in Core 2)
- Test webhook signature verification
- Minimum Node.js 18.17.0+ (likely already met)

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

### React Router v6 → v7
**Estimated Effort:** 2-4 hours

Changes needed:
- Review breaking changes in v7
- Update route definitions
- Test all navigation flows

---

## High Priority

### 1. Oversized Backend Files

**Files requiring splitting:**

| File | Lines | Recommended Split |
|------|-------|-------------------|
| ~~`server/src/routes/translations.ts`~~ | ~~2,370~~ | ✅ Already split: translations/ directory (admin.ts, public.ts, shared.ts, defaults.ts) |
| ~~`services/apiService.ts`~~ | ~~2,058~~ | ✅ Already split: services/api/ has 12 modular files |
| `server/src/routes/blog.ts` | ~800 | Split into admin.ts, public.ts |

**Fix:** Apply same modular pattern used for tarot-articles (public.ts, admin.ts, shared.ts).

---

### 2. Test Coverage Gaps

**Current Coverage:**
- Unit tests: ~21% of use-cases
- Route tests: ~6% of routes covered
- Integration tests: Minimal
- E2E tests: None

**Critical Untested Areas:**
- GDPR compliance (cookie consent, data deletion)
- Payment webhook edge cases
- Credit deduction race conditions
- Email template rendering
- Translation fallback chains

**Fix:** Prioritize tests for payment and credit flows first.

---

### 3. Missing Documentation

**Required Documentation:**
- `docs/API_ERRORS.md` — Comprehensive error codes and handling
- ~~`docs/PAYMENT_FLOW.md`~~ — ✅ Done: Stripe/PayPal flow, webhook handling, idempotency
- ~~`docs/CREDIT_SYSTEM.md`~~ — ✅ Done: Credit deduction rules, bonus logic, race condition prevention
- `docs/DEPLOYMENT.md` — Render setup, environment variables, rollback procedures

**Fix:** Create documentation as features are touched.

---

### 4. Infrastructure Gaps

**Missing:**
- **Environment Validation:** No startup validation of required env vars
- **Error Tracking:** No Sentry or similar for production error monitoring
- **Performance Monitoring:** No APM tooling
- **Rate Limiting:** Basic rate limiting exists but untested under load

**Fix:** Add env validation first (quick win), then error tracking.

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

### 6. Inconsistent Credit Deduction Patterns

**Issue:** Some features deduct credits on frontend (validation only), others rely entirely on backend.

**Current State:**
- Tarot readings: Frontend validates → Backend deducts ✅
- Follow-up questions: Frontend validates → Backend deducts ✅
- Horoscope questions: Frontend deducts locally (needs review)

**Fix:** Standardize all credit operations to backend-only with frontend validation.

---

### 7. ESLint Warnings to Address

**Current Count:** 81 issues (13 errors, 68 warnings)

Main categories:
- `@typescript-eslint/no-explicit-any`: ~50 warnings (mostly in tarot-articles.ts, validation files)
- `@typescript-eslint/no-unused-vars`: ~15 warnings
- `prefer-const`: ~5 warnings

**Fix:** Run `npm run lint:fix` for auto-fixable issues, then address remaining manually.

---

## Low Priority

### 8. Missing Error Boundaries

**Issue:** React components don't have error boundaries. Uncaught errors crash entire app.

**Fix:** Add error boundaries at route level and around critical components.

---

### 9. Console Warnings in Development

**Issue:** Various React warnings about keys, dependencies, etc.

**Fix:** Audit and fix warnings one by one.

---

### 10. Hardcoded Strings

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
| Clerk v1→v2 upgrade | Medium | Pending | Phase 4 |
| Prisma v5→v7 upgrade | Medium | Pending | Phase 4 (mapped enum risk) |
| React Router v6→v7 | Medium | Pending | Phase 4 |
| Oversized backend files | High | ✅ Done | translations/ and services/api/ already modular (only blog.ts ~800 lines remains) |
| Test coverage gaps | High | Open | ~21% coverage, critical flows untested |
| Missing documentation | Medium | Partial | API_ERRORS still needed (CREDIT_SYSTEM, PAYMENT_FLOW done) |
| Infrastructure gaps | Medium | Open | No env validation, no error tracking |
| Large components | Medium | ✅ Done | AdminTarotArticles, AdminBlog, ActiveReading refactored |
| Credit deduction patterns | Medium | Partial | - |
| ESLint warnings | Medium | Open | 81 issues to fix |
| Error boundaries | Low | Open | - |
| Console warnings | Low | Open | - |
| Hardcoded strings | Low | Open | - |
