# CelestiArcana - Project Status

**Last Updated:** March 2026
**Current Phase:** 1 - Stabilization
**Health:** 🟢 Stable and deployed

---

## Phase Progress

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Stabilization | 🔄 Active | 90% |
| Phase 2: Mobile Funnel | ⏳ Pending | 0% |
| Phase 3: Shared Backend | ⏳ Pending | 0% |
| Phase 4: New Features | ⏳ Backlog | 0% |

---

## Phase 1 Breakdown

### Bug Fixes

| Task | Status | Notes |
|------|--------|-------|
| Double credit deduction | ✅ Done | Backend-only deduction now |
| 0-card readings saved | ✅ Done | Validation added |
| Reading history not persisting | ✅ Done | Fetches from backend |
| Follow-up questions not saved | ✅ Done | Saves to backend |
| Browser alerts | ✅ Done | Styled modals |
| Horoscope API errors | ✅ Done | Working in production |
| Removed endpoint calls | ✅ Done | Removed in Feb 2026 refactoring |

### Tech Debt

| Task | Status | Priority |
|------|--------|----------|
| Backend-only credit deduction | ✅ Done | High |
| Dead code removal | ✅ Done | Medium |
| Context memoization | ✅ Done | Medium |
| DB composite indexes | ✅ Done | Medium |
| Unhandled rejection handler | ✅ Done | Medium |
| useAdminCrud shared hook | ✅ Done | Medium |
| Split large components | ✅ Done | Medium |
| Error boundaries | ✅ Done | Low |
| Remove localStorage fallback | ✅ Done | Medium |
| API response standardization | ⏸️ Deferred | Low |

### Testing

| Task | Status |
|------|--------|
| API endpoint tests | ✅ Done (509 tests, 30 files) |
| E2E critical paths | ✅ Done (38 tests, 7 files) |
| Prisma model tests | ⏳ Pending |

### Documentation

| Task | Status |
|------|--------|
| CLAUDE.md | ✅ Done |
| Architecture.md | ✅ Done |
| Spec-Kit structure | ✅ Done |
| Agents and commands | ✅ Done |
| Component docs | ⏳ Pending |

---

## Feature Status

### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication (Clerk) | ✅ Working | Sign in, sign up, SSO |
| Tarot Readings | ✅ Working | 6 spread types |
| Follow-up Questions | ✅ Working | 2 questions per credit |
| User Reflections | ✅ Working | Saved to backend |
| Reading History | ✅ Working | Full history with interpretation |
| Credit System | ✅ Working | Purchase, spend, earn |
| Daily Bonus | ✅ Working | 2 credits daily, streak bonus |
| Stripe Payments | ✅ Working | Checkout sessions |
| PayPal Payments | ✅ Working | Order capture flow |
| Transaction History | ✅ Working | In user profile |

### Secondary Features

| Feature | Status | Notes |
|---------|--------|-------|
| Daily Horoscope | ✅ Working | Pre-generates daily at midnight UTC |
| Blog CMS | ✅ Working | Posts, categories, tags, media |
| Tarot Articles CMS | ✅ Working | Admin management, validation, import |
| Admin Dashboard | ✅ Working | Users, transactions, analytics |
| Multi-language (EN/FR) | ✅ Working | Full translation support |
| Achievements | ✅ Working | Basic achievement system |
| Referral System | ✅ Working | Referral codes, bonuses |

### Planned Features

| Feature | Status | Notes |
|---------|--------|-------|
| Tarot Saga Preview | 🔜 Phase 2 | Mobile funnel teaser |
| Rune Readings | 🔜 Phase 4 | UI placeholder exists |
| Birth Chart | 🔜 Phase 4 | UI placeholder exists |
| I Ching | 🔜 Phase 4 | UI placeholder exists |

---

## Blockers

None currently.

---

## Recent Changes

- 2026-03-08: E2E tests expanded to 38 tests across 7 files (tarot, horoscope, info pages, navigation, 404)
- 2026-03-08: localStorage cleanup: removed ghost keys, audited all usage (all legitimate)
- 2026-03-08: Adopted useAdminCrud hook in 5 more admin components (AdminPackages, AdminPrompts, AdminTranslations, TarotCategoriesManager, TarotTagsManager)
- 2026-03-08: Created useAdminCrud shared hook + proof of concept in AdminEmailTemplates
- 2026-03-08: Quick wins: dead code removal (~300 lines), crash handler, AppContext memoization, 3 DB composite indexes
- 2026-03-07: Fixed Coolify Nixpacks build (CSP headers, Docker memory limits)
- 2026-02-28: Route test coverage expanded to 509 tests across 30 files
- 2026-02-28: Prisma v5 → v6 upgrade, ESLint 9 flat config, Sentry integration
- 2026-01-09: AdminTarotArticles modularized (1,045 → 224 lines)
- 2026-01-08: Fixed double credit deduction, 0-card readings, follow-up pricing

---

## Environment Requirements

```env
# Required for full functionality
OPENROUTER_API_KEY=sk-or-xxxxx    # AI interpretations
CLERK_SECRET_KEY=sk_xxxxx         # Authentication
DATABASE_URL=postgresql://...      # Database
STRIPE_SECRET_KEY=sk_xxxxx        # Payments
```

---

## Metrics (To Be Tracked)

| Metric | Current | Target |
|--------|---------|--------|
| Daily Active Users | - | Baseline |
| Readings/Day | - | Baseline |
| Free → Paid Conversion | - | 5% |
| Credits Purchased/Day | - | Baseline |
| Error Rate | - | <1% |
