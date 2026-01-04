# MysticOracle - Project Guide

## Overview

MysticOracle is a mystical tarot reading web application with AI-powered interpretations, built with React + Express + Prisma. Features include tarot readings, daily horoscopes, a blog CMS, user credits system, and full admin dashboard.

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
│       └── AdminSettings.tsx  # System settings
│
├── context/
│   └── AppContext.tsx         # Global state (user, language, credits)
│
├── services/
│   ├── apiService.ts          # All API calls with retry logic
│   ├── openrouterService.ts   # OpenRouter AI integration
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
    │   │   └── horoscopes.ts  # Horoscope generation
    │   └── services/
    │       └── email.ts       # Brevo email templates
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
- `GET /api/blog/admin/posts` - List all posts (inc. drafts)
- `GET /api/blog/admin/preview/:id` - Preview any post
- `POST /api/blog/admin/import` - Import JSON articles

## Environment Variables

### Frontend (.env.local)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_API_URL=http://localhost:3001
VITE_API_KEY=sk-or-xxxxx  # OpenRouter
```

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
