# Technical Debt Audit — CelestiArcana

> Full codebase scan performed March 7, 2026. Cross-referenced against existing `docs/Tech_debt.md`.

---

## Critical Items

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | **No frontend tests** — 158 components, 0 test files | Bugs ship undetected | Large |
| 2 | **E2E coverage at ~10%** — Only homepage, blog, legal tested. No payment, reading, or admin flows | Critical user paths untested | Large |
| 3 | **God components** — BirthCardReveal (1,113 lines, 18+ useState), RichTextEditor (1,007), CreditShop (877) | Hard to modify, easy to break | Medium |
| 4 | **No structured logging** — ~50 raw console.log/error calls in production services/components | Can't trace issues in prod | Small |

## High Priority

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 5 | **Duplicated admin state patterns** — 58 instances of identical loading/error/edit useState across 16+ admin components | Every admin feature copies boilerplate | Small |
| 6 | **114 API wrapper functions** in `services/api/admin.ts` — `createCrudOperations()` factory exists in `apiHelpers.ts` but is never used | Bloated, hard to maintain | Small |
| 7 | **Inconsistent backend error handling** — 60+ catch blocks with different patterns, no centralized error middleware usage across all routes | Inconsistent error responses | Medium |
| 8 | **Missing unhandledRejection handler** in server entry — async errors outside Express middleware crash silently | Silent production crashes | Tiny |
| 9 | **Untested routes** — horoscopes, tarot articles (admin/public/trash), year energy, taxonomy, invoices, admin analytics/settings/packages — ~50% of endpoints | Regressions undetected | Large |

## Medium Priority

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 10 | **Prisma v6 → v7** | Already tracked in Tech_debt.md. Blocked by Coolify Docker networking | Large |
| 11 | **`any` types in production** — ~10 instances in components (WelcomeModal, ImportArticle, DailyBonusPopup, AppContext) | Type safety gaps | Small |
| 12 | **AppContext re-render risk** — context value not memoized, all consumers re-render on any state change | Performance on every state update | Small |
| 13 | **Missing composite DB indexes** — `(status, deletedAt)` on BlogPost, `(userId, createdAt DESC)` on Reading, `(action, createdAt)` on AuditLog | Slower queries at scale | Small |
| 14 | **Hardcoded localhost URLs in CORS** — `server/src/index.ts:167-173` has 7 hardcoded localhost origins | Works but fragile for staging/CI | Tiny |
| 15 | **Promise .then() chains** — 15 instances that should be async/await for consistency | Code style inconsistency | Small |

## Low Priority

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 16 | **No Dependabot/Renovate** — Dependencies drift manually | Already addressed by deps-audit today | Tiny |
| 17 | **useCallback overuse** — 133 instances, many without clear perf benefit (especially BirthCardReveal with 10+ deps) | Slight runtime overhead | Small |
| 18 | **Dead code** — `createCrudOperations()` factory in `apiHelpers.ts` (lines 87-198) completely unused | Confusing for new devs | Tiny |

## Already Resolved (flagged by scan but confirmed done)

- **Error boundaries** — exist at route, page, and reading flow levels (`components/ui/ErrorBoundary.tsx`, `routes/index.tsx`)
- **Dual content systems** — already consolidated (tarot articles use BlogPost table with `contentType: 'TAROT_ARTICLE'`)
- **Hardcoded strings** — 95% migrated to `t()` translation system
- **Large components** — AdminTarotArticles, AdminBlog, ActiveReading, UserProfile already split
- **ESLint/Prettier** — 0 issues
- **Sentry** — properly integrated with custom spans

---

## Detailed Findings

### Code Complexity

**Files over 200 lines:** 68 files

**Top God Components (over 800 lines):**

| File | Lines | Issues |
|------|-------|--------|
| `components/reading/BirthCardReveal.tsx` | 1,113 | 18+ useState, 5+ useEffect, 4+ useCallback with 10+ deps. Mixes birth card calculation, 3-tab UI, API calls, share modal, image modal |
| `components/admin/RichTextEditor.tsx` | 1,007 | Tightly couples TipTap editor with media library UI, upload/delete handlers |
| `server/src/lib/validation.ts` | 995 | Validation schemas — acceptable as data definition |
| `components/CreditShop.tsx` | 877 | 12+ useState, purchase flow + package filtering + multi-tab UI |
| `components/CategorySelector.tsx` | 862 | Complex category selection UI |

**Top Backend Files:**

| File | Lines | Issues |
|------|-------|--------|
| `server/src/routes/admin/invoices.ts` | 737 | Route handler doing business logic (PDF generation, email, transactions) |
| `server/src/services/email.ts` | 713 | 8+ email templates in one file |
| `server/src/routes/tarot-articles/admin.ts` | 695 | CRUD + import + reorder + trash in one file |

### Code Duplication

**1. API Request Wrappers** — `services/api/admin.ts` exports 114 functions, nearly all one-line wrappers around `apiRequest()`. A `createCrudOperations()` factory exists in `apiHelpers.ts` (lines 87-198) but is completely unused.

**2. Admin Component State** — 58 instances of this pattern across 16+ admin components:
```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [editingId, setEditingId] = useState<string | null>(null);
const [showNewForm, setShowNewForm] = useState(false);
```
Should extract to a `useAdminCrud()` custom hook.

**3. Prisma Query Patterns** — 60+ occurrences of `prisma.blogPost.findMany/findFirst` across routes. `server/src/routes/shared/queryUtils.ts` centralizes some helpers but not all routes use them.

### Console Logging (No Structured Logging)

~1,054 total console calls across the codebase. ~50 in production code (services, components, context). Scripts account for the rest (acceptable).

**Highest production usage:**

| File | Count |
|------|-------|
| `server/src/services/openRouterService.ts` | 23 |
| `components/ActiveReading.tsx` | 15 |
| `server/src/infrastructure/payment/PayPalGateway.ts` | 12 |
| `server/src/services/promptService.ts` | 11 |
| `server/src/services/CreditService.ts` | 11 |
| `server/src/infrastructure/payment/StripeGateway.ts` | 11 |
| `context/AppContext.tsx` | 11 |

No log levels, no correlation IDs, no structured format.

### Type Safety

- **`any` usage:** 109 total. 45 in generated Prisma code (acceptable), 24 in test files (acceptable), ~10 in production components
- **Non-null assertions:** 33 `as` type casts. Mostly in loops/find operations
- **TODO comments:** Only 1 actual TODO (`context/AppContext.tsx:22`)

### Testing Coverage

**Backend (good):** 30 test files, 509 tests. ~50% route coverage. Core business logic (payments, credits, readings, auth, GDPR) well tested.

**Frontend (critical gap):** 0 test files across 158 components. No vitest config for frontend.

**E2E (minimal):** 3 Playwright specs covering homepage, blog, legal pages. No coverage for: reading creation, payments, auth, admin panel, horoscopes, language switching.

**Untested backend routes:** horoscopes, tarot articles (admin/public/trash), year energy, taxonomy, invoices, admin analytics/settings/packages/maintenance/debug.

### Database Schema

**Good:** All foreign keys properly cascaded. Indexes exist for most query patterns. Soft delete fields indexed.

**Missing indexes:**
- `BlogPost: @@index([status, deletedAt])` composite
- `Reading: @@index([userId, createdAt(sort: Desc)])` for paginated history
- `AuditLog: @@index([action, createdAt])` for activity queries
- `Transaction: @@index([userId, paymentStatus])` for refund lookups

### CI/CD

**Current checks (good):** TypeScript type check, ESLint, Prettier, backend tests with coverage, npm audit, build verification.

**Missing:** Frontend tests, E2E tests, Lighthouse/bundle size checks, Dependabot/Renovate.

### Architecture Issues

- **Inconsistent error handling:** 3 different patterns across backend routes (simple catch, typed errors, custom error classes)
- **No unhandledRejection handler:** Async errors outside Express middleware can crash silently
- **AppContext not memoized:** All consumers re-render on any state change
- **Reorder logic fragmentation:** `reorderUtils.ts` exists but not consistently used

---

## Quick Wins (High ROI, Low Effort)

1. **Add `process.on('unhandledRejection')` handler** to `server/src/index.ts` — 5 lines, prevents silent crashes
2. **Create `useAdminCrud()` hook** — eliminates 58 instances of duplicated loading/error state
3. **Memoize AppContext value** — wrap in `useMemo` to prevent unnecessary re-renders
4. **Delete or use `createCrudOperations()`** — either remove dead code from `apiHelpers.ts` or refactor `admin.ts` to use it

## Medium-Term Improvements (1-2 weeks)

5. **Split BirthCardReveal.tsx** into PersonalityCardTab, SoulCardTab, YearEnergyTab subcomponents
6. **Add centralized error handling middleware** to consolidate 60+ catch blocks
7. **Add structured logging** (Pino or Winston) to replace raw console calls in backend services
8. **Add frontend test setup** — Vitest + React Testing Library for critical components

## Long-Term Initiatives (1-2 months)

9. **E2E test coverage** for payment, reading, and admin flows
10. **Backend route test coverage** to 80%+ (horoscopes, tarot articles, year energy, taxonomy)
11. **Refactor RichTextEditor** — separate editor core from media manager
12. **Move business logic from routes to services** (invoices.ts, tarot-articles/admin.ts)

---

## Dependency Audit Summary (same session)

**Security fixes applied:**
- Frontend: dompurify XSS, rollup path traversal, markdown-it ReDoS
- Backend: express-rate-limit IPv6 bypass, multer DoS, axios DoS, ajv ReDoS, qs DoS

**Removed unused deps:**
- Frontend: `@stripe/stripe-js`, `@tiptap/extension-image`, `openai`
- Backend: `@sentry/react`, `magicast`

**Added missing deps:**
- Frontend: `@tiptap/core`
- Backend: `@eslint/js@9`, `@types/qs`

**Remaining (not actionable):**
- 4 high via `vite-plugin-pwa` → `serialize-javascript` (breaking downgrade required)
- 9 via `prisma` dev tooling (not in production runtime)

**License compliance:** PASS — all 706 deps use permissive licenses (MIT, ISC, BSD, Apache)
