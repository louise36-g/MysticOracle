# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CelestiArcana is a mystical tarot reading web application with AI-powered interpretations, built with React + Express + Prisma. Features include tarot readings, daily horoscopes, a blog CMS, user credits system, and full admin dashboard.

---

## SEO Spec — CelestiArcana Standing Rules

Paste at the start of any CC session involving page structure, meta tags, URL changes, new page types, or sitemap updates. Every critical rule must be met before deployment.

### URL Format [CRITICAL]
- All URLs use a single consistent format: no trailing slash (e.g. `/tarot/queen-of-cups` not `/tarot/queen-of-cups/`)
- This format must be identical across sitemap, canonical tags, hreflang tags, and all internal links
- 301 redirects must enforce this — any URL accessible in two formats is a duplicate content risk
- No URL should be reachable without redirect in more than one format
- The `/fr` prefix (not `/fr`) is the standard for all French pages
- `/fr/` must 301 redirect to `/fr` with no exceptions
- No alternate language root URLs should exist (`/en`, `/en/`, etc.) — these must redirect to `/`
- All redirects must be single-step 301 (no chains, no 302 unless explicitly temporary)
- The final destination of any redirect must return 200, not another redirect
- Verify all redirects with `curl -I` before deployment

### Hreflang [CRITICAL]
- Every EN page includes three hreflang tags: self-referencing `hreflang="en"`, alternate `hreflang="fr"` pointing to the `/fr` equivalent, and `hreflang="x-default"` pointing to the EN URL
- Every FR page includes three hreflang tags: self-referencing `hreflang="fr"`, alternate `hreflang="en"` pointing to the EN equivalent, and `hreflang="x-default"` pointing to the EN URL
- x-default currently points to the EN equivalent. If site structure evolves to include additional languages or a language-agnostic landing page, revisit this
- Only add alternate hreflang if the equivalent page actually exists in the other language. No links to non-existent URLs
- Every relationship must be reciprocal. If EN references FR, FR must reference EN with identical URLs
- Hreflang URLs must match canonical URLs exactly — same protocol, path, and trailing slash treatment
- Tags must be present in SSR HTML output, not JS-injected by React after hydration. Verify with `curl` on raw HTML
- No duplicate or conflicting hreflang tags on any page. Confirm the SSR layer and React are not both rendering these

### Canonical Tags [CRITICAL]
- Every page self-canonicalises: EN pages canonicalise to their own EN URL, FR pages to their own FR URL. No cross-language canonicals
- Canonical URLs are consistent in format with hreflang URLs and sitemap URLs — identical protocol, path, and trailing slash treatment

### Rendering [CRITICAL]
- All critical SEO tags (title, description, canonical, hreflang, og:*) must be present in the initial HTML response from the server
- No critical SEO tag may depend on client-side React rendering or hydration to appear
- Pages must not rely on client-side rendering for indexability
- Verify with `curl` on raw HTML before deployment — if a tag is missing from the curl output it will not be seen by Googlebot

### Indexability [CRITICAL]
- Every public page must return a 200 status. No redirect chains, no soft 404s
- `meta name="robots"` must be `index, follow` on all public SEO pages
- No unintended noindex directives in HTTP headers or meta tags — check explicitly as staging configs sometimes leak to production
- No public SEO page must be blocked by robots.txt

### Index Scope [CRITICAL]
- Only tarot articles, blog posts, hub pages, and core site pages are indexable
- The following must never be indexed and must carry `noindex, nofollow` or be blocked via robots.txt:
  - All Clerk and authentication routes (sign-in, sign-up, dashboard, user profile)
  - All admin routes (`/admin/*`)
  - All payment and checkout flows
  - All API endpoints (`/api/*`)
- Verify that none of these appear in GSC as indexed or discovered pages

### Homepage [CRITICAL]
- `/` canonical = `/` and is indexable (200)
- `/fr` canonical = `/fr` and is indexable (200)
- Both homepages include reciprocal hreflang tags following the same rules as all other pages
- Both homepages are present in the sitemap
- `/` links clearly to `/fr` via the language switcher
- `/fr` links clearly back to `/` via the language switcher

### Sitemap [CRITICAL]
- Only canonical URLs are included in the sitemap — no redirected URLs, no URL variants
- All sitemap URLs match canonical and hreflang URLs exactly in format
- Both EN and FR versions of a page must appear in the sitemap when both exist
- Sitemap must update automatically when a new page is created or a URL changes
- No orphan URLs — every page intended for indexing must appear in the sitemap

### Internal Linking
- Every FR page must be reachable from at least one other FR page (not just from the EN version)
- Every indexable page must be reachable via normal navigation from the homepage (EN pages from `/`, FR pages from `/fr`)
- The language switcher must link directly to the equivalent page in the other language, not to the homepage
- No internal links should point to redirected URLs — all internal links must use the canonical URL format
- Homepage must link clearly to `/fr` and vice versa

### Title & Description
- Every page has a unique title tag. No generic site-wide fallback titles
- `meta name="description"` is unique and page-specific on every page. No boilerplate
- FR pages have French titles and descriptions. EN content must not appear on FR pages

### Open Graph
- FR pages: `og:locale = fr_FR`. EN pages: `og:locale = en_US`. No cross-language values
- `og:url` matches the canonical URL exactly on every page
- `og:title` and `og:description` are page-specific and in the correct language for the page

### Verification Before Deployment
- `curl` one EN and one FR page pair and confirm all critical SEO tags appear in raw HTML before any JS executes
- Confirm both pages return 200 and that meta robots is `index, follow`
- Verify all redirects are single-step 301 using `curl -I`
- Spot-check 3–4 other EN/FR page pairs to confirm consistency across the site, not just the test page
- Confirm no page outputs duplicate meta tags of any kind — title, description, canonical, hreflang, og:*
- Check that all internal links on the tested pages use canonical URL format with no redirects
- Verify sitemap includes both the EN and FR versions of the tested pages with correct URL format
- Confirm no auth, admin, payment, or API routes are appearing as indexable

### Post-Deployment GSC Check
- Inspect at least one EN and one FR URL using GSC URL Inspection
- Confirm indexed status, correct canonical selected by Google, and no "Duplicate without user-selected canonical" errors
- Check that submitted sitemap URL count matches expected page count
- Monitor that indexed page count is growing over time and not shrinking
- If any auth, admin, or payment routes appear in GSC coverage report, treat as critical and fix immediately

---

## Spec-Kit Reference

This project uses Spec-Kit for documentation-driven development.

### Core Documents
- `.specify/memory/constitution.md` — Non-negotiable principles
- `.specify/specs/001-mystic-oracle/spec.md` — Feature specification
- `.specify/specs/001-mystic-oracle/plan.md` — Implementation phases
- `.specify/specs/001-mystic-oracle/data-model.md` — Database schema
- `.specify/specs/001-mystic-oracle/api-spec.md` — API endpoints

### Project Status
- `docs/Project_status.md` — Current progress
- `docs/Tech_debt.md` — Known issues to fix
- `docs/Roadmap.md` — High-level roadmap

## Current Priority

**Phase 1: Stabilization**

Focus on:
1. Fix remaining bugs (horoscope API, dead endpoints)
2. Clear tech debt (credit deduction, component splitting)
3. Add basic tests
4. Prepare for mobile integration

## Cross-Platform Vision

CelestiArcana serves as:
1. **Standalone Product**: Monetized tarot readings and horoscopes
2. **Mobile Funnel**: Gateway to AI Tarot Saga mobile game

The backend will be shared between web and mobile, with same Clerk authentication and credit system.

## Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6 (createBrowserRouter)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Auth**: Clerk (@clerk/clerk-react)
- **State**: React Context API
- **Rich Text**: Custom editors (RichTextEditor, MarkdownEditor)

### Backend
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL on Render (Frankfurt EU)
- **ORM**: Prisma
- **Validation**: Zod
- **Payments**: Stripe + PayPal
- **Email**: Brevo (SendInBlue)
- **Hosting**: Hetzner VPS (CX23) via Coolify — dashboard at `46.224.16.4:8000`

## Project Structure

```
CelestiArcana/
├── App.tsx                    # Main React application (mounts RouterProvider)
├── index.tsx                  # React entry point
├── index.html                 # HTML template + blog typography CSS
├── types.ts                   # TypeScript type definitions
├── constants.ts               # Tarot cards data, spread configs
├── CLAUDE.md                  # This file
│
├── routes/
│   ├── routes.ts              # Route path constants (ROUTES object)
│   └── index.tsx              # Router configuration (createBrowserRouter)
│
├── components/
│   ├── Header.tsx             # Navigation with CreditShop trigger
│   ├── SubNav.tsx             # Secondary navigation with hover dropdowns
│   ├── Footer.tsx             # Footer with legal links
│   ├── CreditShop.tsx         # Credit purchase modal
│   ├── CookieConsent.tsx      # GDPR cookie banner
│   ├── ActiveReading.tsx      # Tarot reading flow
│   ├── SpreadSelector.tsx     # Spread type selection
│   ├── HoroscopeReading.tsx   # Daily horoscope
│   ├── UserProfile.tsx        # User account page
│   ├── PaymentResult.tsx      # Payment success/cancel pages
│   ├── WelcomeModal.tsx       # First-time user welcome
│   ├── Breadcrumb.tsx         # Navigation breadcrumbs
│   │
│   ├── layout/
│   │   ├── RootLayout.tsx     # Shared layout (Header + Outlet + Footer)
│   │   └── index.ts           # Re-exports
│   │
│   ├── routing/
│   │   ├── ProtectedRoute.tsx # Auth guard (redirects to sign-in)
│   │   ├── AdminRoute.tsx     # Admin guard (requires isAdmin flag)
│   │   └── index.ts           # Re-exports
│   │
│   ├── blog/
│   │   ├── BlogList.tsx       # Blog listing page with filters
│   │   └── BlogPost.tsx       # Single blog post view + preview mode
│   │
│   ├── rewards/
│   │   └── DailyBonusPopup.tsx # Daily login bonus UI
│   │
│   ├── legal/
│   │   ├── PrivacyPolicy.tsx  # GDPR privacy policy
│   │   ├── TermsOfService.tsx # Terms of service
│   │   └── CookiePolicy.tsx   # Cookie policy
│   │
│   └── admin/
│       ├── AdminLayout.tsx    # Admin section layout (sidebar + content)
│       ├── AdminNav.tsx       # Admin sidebar navigation
│       ├── AdminOverview.tsx  # Dashboard stats overview
│       ├── AdminUsers.tsx     # User management
│       ├── AdminTransactions.tsx # Transaction history
│       ├── AdminAnalytics.tsx # Analytics charts
│       ├── AdminPackages.tsx  # Credit package management
│       ├── AdminEmailTemplates.tsx # Email template editor
│       ├── AdminBlog.tsx      # Blog CMS (posts, categories, tags, media, trash)
│       ├── BlogPostEditor.tsx # Visual/Markdown blog editor
│       ├── RichTextEditor.tsx # WYSIWYG editor component
│       ├── MarkdownEditor.tsx # Markdown editor with preview
│       ├── AdminHealth.tsx    # Service health checks
│       ├── AdminTranslations.tsx # Translation string management
│       ├── AdminSettings.tsx  # System settings
│       ├── AdminTarotArticles.tsx # Tarot articles CMS (container with tabs)
│       ├── TarotArticleEditor.tsx # Article editing with validation
│       ├── TarotCategoriesManager.tsx # Unified category management
│       ├── TarotTagsManager.tsx # Unified tag management
│       │
│       ├── tarot-articles/    # Modular tarot admin components
│       │   ├── ArticlesTab.tsx # Article list with drag-drop reorder
│       │   ├── TrashTab.tsx   # Deleted articles management
│       │   ├── types.ts       # Shared types and constants
│       │   └── hooks/
│       │       ├── useArticleList.ts # Article list state + pagination
│       │       ├── useArticleForm.ts # Form validation + state
│       │       └── useTrashList.ts   # Trash management state
│       │
│       └── editor/            # Shared editor components
│           ├── EditorField.tsx # Form field wrappers
│           ├── EditorTopBar.tsx # Save/cancel toolbar
│           ├── EditorLayout.tsx # Two-column layout
│           └── index.ts       # Re-exports
│
├── context/
│   ├── AppContext.tsx         # Global state (user, language, credits)
│   └── ReadingContext.tsx     # Reading flow state (spread, cards, question)
│
├── services/
│   ├── apiService.ts          # All API calls with retry logic
│   ├── paymentService.ts      # Frontend payment helpers
│   └── storageService.ts      # LocalStorage wrapper
│
├── utils/
│   ├── crypto.ts              # Token generation
│   ├── shuffle.ts             # Fisher-Yates shuffle
│   └── validation.ts          # Input validation
│
└── server/                    # Express Backend
    ├── prisma/
    │   └── schema.prisma      # Database schema (see ARCHITECTURE.md)
    ├── src/
    │   ├── index.ts           # Express server entry
    │   ├── db/
    │   │   └── prisma.ts      # Prisma client instance
    │   ├── middleware/
    │   │   └── auth.ts        # Clerk JWT verification (requireAuth, requireAdmin)
    │   ├── routes/
    │   │   ├── health.ts      # Health check endpoint
    │   │   ├── users.ts       # User profile, credits, history
    │   │   ├── readings.ts    # Tarot reading CRUD
    │   │   ├── payments.ts    # Stripe + PayPal checkout
    │   │   ├── webhooks.ts    # Stripe + Clerk webhooks
    │   │   ├── admin.ts       # Admin endpoints
    │   │   ├── blog.ts        # Blog CMS endpoints
    │   │   ├── horoscopes.ts  # Horoscope generation
    │   │   ├── translations.ts # Translation API & admin endpoints
    │   │   ├── taxonomy.ts    # Unified category/tag endpoints
    │   │   │
    │   │   └── tarot-articles/ # Modular tarot article routes
    │   │       ├── index.ts   # Route combiner
    │   │       ├── public.ts  # Public endpoints (list, single)
    │   │       ├── admin.ts   # CRUD, import, reorder
    │   │       ├── trash.ts   # Soft delete, restore, empty
    │   │       └── shared.ts  # Common imports/utilities
    │   │
    │   ├── services/
    │   │   ├── email.ts       # Brevo email templates
    │   │   ├── cache.ts       # NodeCache wrapper
    │   │   ├── TaxonomyService.ts # Unified category/tag service
    │   │   │
    │   │   └── content/       # Content service layer
    │   │       ├── ContentService.ts # Abstract base class
    │   │       └── TarotArticleService.ts # Tarot-specific service
    │   │
    │   └── lib/
    │       ├── validation/
    │       │   └── tarot.ts   # Tarot article validation schemas
    │       └── tarot/
    │           ├── sorting.ts # Card number parsing/sorting
    │           └── schema.ts  # JSON-LD schema generation
    │
    └── .env.example           # Environment template
```

## Key Features

### Authentication
- Clerk handles auth (sign in, sign up, SSO)
- Clerk webhooks sync users to our database
- JWT verification on backend routes
- Admin flag on User model for access control

### Credits System
- New users get 3 free credits
- Daily login bonus (2 credits, +5 for 7-day streak)
- Purchases via Stripe or PayPal
- Referral bonuses

### Tarot Readings
- Multiple spread types: Single, 3-Card, Love, Career, Horseshoe, Celtic Cross
- Interpretation styles: Classic, Spiritual, Psycho-Emotional, Numerology, Elemental
- AI interpretations via OpenRouter
- Follow-up questions
- Reading history saved with themes extraction

### Blog CMS
- Full admin interface for posts, categories, tags, media
- Visual (WYSIWYG) and Markdown editor modes
- JSON import for bulk article creation
- Soft delete with trash bin
- Preview mode for unpublished posts
- SEO meta fields and Open Graph support
- Multi-language support (EN/FR)

### Translation System
- **Dynamic translations** - All UI text editable from Admin panel
- **Database-backed** - Translations stored in PostgreSQL with version tracking
- **Client-side caching** - localStorage cache (5min TTL) for fast loads
- **English default** - All text defaults to English, French when explicitly selected
- **Admin editable** - Manage translations via Admin → Translations (no code changes needed)
- **Version tracking** - Automatic cache invalidation when translations update
- **Development warnings** - Console alerts for missing translation keys (DEV mode only)
- **Fallback system** - Never shows blank text (key → fallback → English)
- **Type safe** - Full TypeScript support with `t(key, fallback)` function
- **Coverage** - 43% of codebase refactored (~75-80% of user-facing components)

**Quick Reference:**
- Usage in components: `const { t } = useApp(); t('nav.home', 'Home')`
- Key naming: `category.Component.semantic_key` (e.g., `profile.achievements.unlocked`)
- Documentation: See `docs/TRANSLATIONS.md` for full guide
- Testing: See `docs/TRANSLATION_TESTING_CHECKLIST.md`

### Admin Dashboard
- User management with status controls
- Transaction history
- Analytics and charts
- Credit package management
- Email template editor
- System health monitoring
- Translation string management
- System settings

## Critical Development Patterns

### Pre-rendering (SSR-lite)
`npm run build` runs `scripts/build-with-prerender.sh` — Vite build followed by static HTML generation for 100+ pages. **Build fails if fewer than 100 pages are generated.** Each page gets embedded JSON data + static HTML; JS is deferred until user interaction via `/public/deferred-loader.js`.

- `deferred-loader.js` **must** be in the Caddyfile `@notStaticFile` exclusion list (MIME type fix)
- Modulepreload hints **must** be stripped from pre-rendered HTML (kept hints kill Lighthouse scores)
- Achieves 98–100 mobile Lighthouse scores on all content pages

### Multilingual /fr/ Routing
Language is determined **by URL path** (`/fr` prefix), never by localStorage. `LocalizedLink` component auto-prefixes `/fr/` — use it for all public-facing links. Admin routes stay English-only (use regular `Link`). Article internal links are auto-rewritten to `/fr/` by content processors. Clerk uses `frFR` locale on `/fr/` paths.

### Blog & Tarot Reorder
Backend reorder endpoints must apply **all the same filters** (category, status) as the admin list endpoint — otherwise position indices mismatch and items bounce back. Both use deterministic ordering: `sortOrder ASC, createdAt ASC`. Disable drag handles when search is active. Public blog endpoint limit: max 50; tarot articles: max 100 — don't exceed from frontend.

### CI / Lint Requirements
GitHub Actions runs on every push: type-check, lint (frontend + backend), backend tests, full production build. **Both lint runs must pass with 0 errors and 0 warnings.** Backend uses ESLint 9 flat config at `server/eslint.config.js` (`.eslintignore` is not supported). Unused vars must be prefixed `_`. Avoid `!` non-null assertions — use a guarded `const` instead. Always run `npm run lint` in `server/` before committing backend changes.

### Deploy Safety
Caddyfile **must** have dedicated `handle /assets/*` and `handle /fonts/*` blocks **before** the SPA fallback. Without these, Cloudflare caches HTML responses as JS/CSS during deploys. Always test locally, bundle into one commit, push once — no rapid-fire deployments. Pushes to `main` trigger Coolify webhook deployments (check deployments tab if stuck).

### Yes/No Blog Article
**Do not edit the Yes/No blog article via the admin CMS editor** — it strips custom HTML. Use database scripts only.

## API Endpoints

### Public
- `GET /api/health` - Health check
- `GET /api/translations/:lang` - Get all translations for a language
- `GET /api/translations/version` - Get cache version
- `GET /api/translations/languages` - Get list of active languages
- `GET /api/blog/posts` - List published posts
- `GET /api/blog/posts/:slug` - Get single post
- `GET /api/blog/categories` - List categories
- `GET /api/blog/tags` - List tags

### Authenticated
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update preferences
- `POST /api/users/me/daily-bonus` - Claim daily bonus
- `POST /api/readings` - Create reading
- `POST /api/payments/stripe/checkout` - Create Stripe session

### Admin Only
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/:id/status` - Update user status
- `GET /api/translations/admin/languages` - Get all languages with translation counts
- `GET /api/translations/admin/:lang` - Get translations for editing
- `POST /api/translations/admin/translations` - Create/update translation
- `DELETE /api/translations/admin/translations/:id` - Delete translation
- `POST /api/translations/admin/seed` - Seed/update all translations from defaults
- `GET /api/blog/admin/posts` - List all posts (inc. drafts)
- `GET /api/blog/admin/preview/:id` - Preview any post
- `POST /api/blog/admin/import` - Import JSON articles

### Unified Taxonomy (Admin)
- `GET /api/v1/taxonomy/categories` - List all categories with usage counts
- `POST /api/v1/taxonomy/categories` - Create category
- `PATCH /api/v1/taxonomy/categories/:id` - Update category
- `DELETE /api/v1/taxonomy/categories/:id` - Delete category (blocked if in use)
- `GET /api/v1/taxonomy/tags` - List all tags with usage counts
- `POST /api/v1/taxonomy/tags` - Create tag
- `PATCH /api/v1/taxonomy/tags/:id` - Update tag
- `DELETE /api/v1/taxonomy/tags/:id` - Delete tag (blocked if in use)

### Tarot Articles (Admin)
- `GET /api/v1/tarot-articles/admin/list` - List articles with filters
- `GET /api/v1/tarot-articles/admin/:id` - Get article for editing
- `PATCH /api/v1/tarot-articles/admin/:id` - Update article
- `PATCH /api/v1/tarot-articles/admin/reorder` - Reorder articles
- `POST /api/v1/tarot-articles/admin/import` - Import article JSON
- `DELETE /api/v1/tarot-articles/admin/:id` - Soft delete
- `POST /api/v1/tarot-articles/admin/:id/restore` - Restore from trash
- `DELETE /api/v1/tarot-articles/admin/:id/permanent` - Permanent delete

## Environment Variables

### Frontend (.env.local)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_API_URL=http://localhost:3001
VITE_DEV_MODE=true   # Bypasses credit checks in development
```

**Note**: API keys are no longer configured in the frontend. All AI generation happens on the backend for improved security.

### Backend (server/.env)
```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=sandbox
BREVO_API_KEY=xkeysib-xxxxx
OPENROUTER_API_KEY=sk-or-xxxxx
AI_MODEL=openai/gpt-oss-120b:free  # Optional, defaults to free tier
```

## Commands

### Frontend
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000)
npm run build        # Production build with pre-rendering (required for deploy)
npm run build:spa-only # Build without pre-rendering
npx tsc --noEmit     # Type check
npm run lint         # ESLint
npm run test         # Unit tests (Vitest)
npm run test:coverage # Tests with coverage
npm run test:e2e     # Playwright E2E tests
```

### Backend
```bash
cd server
npm install          # Install dependencies
npm run dev          # Start dev server (port 3001)
npm run build        # Compile TypeScript
npm run lint         # ESLint — must pass 0 errors/0 warnings before committing
npm run lint:fix     # ESLint with auto-fix
npm run test         # Unit tests (Vitest)
npm run test:watch   # Watch mode
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma migrate dev # Run migrations
npx prisma studio    # Open Prisma Studio
```

## Development Notes

- Set `VITE_DEV_MODE=true` in `.env.local` to bypass credit checks
- Username "Mooks" is auto-admin
- Blog typography styles are in `index.html` (`.prose` class)
- Visual editor is default for new blog posts
- Confirmation modals replace browser alerts
- Soft delete for blog posts (trash bin feature)

## Legal Compliance
- GDPR-compliant privacy policy
- Cookie consent banner (CNIL compliant)
- Terms of service
- Data stored in EU (Render Frankfurt)
