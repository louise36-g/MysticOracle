# MysticOracle - Project Guide

## Overview

MysticOracle is a mystical tarot reading web application with AI-powered interpretations, built with React + Express + Prisma. Features include tarot readings, daily horoscopes, a blog CMS, user credits system, and full admin dashboard.

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

MysticOracle serves as:
1. **Standalone Product**: Monetized tarot readings and horoscopes
2. **Mobile Funnel**: Gateway to AI Tarot Saga mobile game

The backend will be shared between web and mobile, with same Clerk authentication and credit system.

## Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Auth**: Clerk (@clerk/clerk-react)
- **State**: React Context API
- **Rich Text**: Custom editors (RichTextEditor, MarkdownEditor)

### Backend
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL on Render
- **ORM**: Prisma
- **Validation**: Zod
- **Payments**: Stripe + PayPal
- **Email**: Brevo (SendInBlue)
- **Hosting**: Render (Frankfurt EU)

## Project Structure

```
MysticOracle/
├── App.tsx                    # Main React application (SPA routing)
├── index.tsx                  # React entry point
├── index.html                 # HTML template + blog typography CSS
├── types.ts                   # TypeScript type definitions
├── constants.ts               # Tarot cards data, spread configs
├── CLAUDE.md                  # This file
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
│       ├── AdminDashboard.tsx # Main admin container with tabs
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
│   └── AppContext.tsx         # Global state (user, language, credits)
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
```

**Note**: API keys are no longer configured in the frontend. All AI generation happens on the backend for improved security.

### Backend (server/.env)
```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
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
npm run dev          # Start dev server (port 5173)
npm run build        # Production build
npx tsc --noEmit     # Type check
```

### Backend
```bash
cd server
npm install          # Install dependencies
npm run dev          # Start dev server (port 3001)
npm run build        # Compile TypeScript
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
