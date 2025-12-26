# MysticOracle - Project Guide

## Overview

MysticOracle is a mystical tarot reading web application with AI-powered interpretations, built with React + Express + Prisma.

## Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Auth**: Clerk (@clerk/clerk-react)
- **State**: React Context API

### Backend
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL on Render
- **ORM**: Prisma
- **Payments**: Stripe + PayPal
- **Email**: Brevo (SendInBlue)
- **Hosting**: Render

## Project Structure

```
MysticOracle/
├── App.tsx                    # Main React application
├── index.tsx                  # React entry point
├── index.html                 # HTML template
├── types.ts                   # TypeScript type definitions
├── constants.ts               # Tarot cards data, spread configs
├── CLAUDE.md                  # This file
│
├── components/
│   ├── Header.tsx             # Navigation with CreditShop trigger
│   ├── Footer.tsx             # Footer with legal links
│   ├── CreditShop.tsx         # Credit purchase modal
│   ├── CookieConsent.tsx      # GDPR cookie banner
│   ├── ActiveReading.tsx      # Tarot reading flow
│   ├── SpreadSelector.tsx     # Spread type selection
│   ├── HoroscopeReading.tsx   # Daily horoscope
│   ├── UserProfile.tsx        # User account page
│   ├── PaymentResult.tsx      # Payment success/cancel pages
│   ├── legal/
│   │   ├── PrivacyPolicy.tsx  # GDPR privacy policy
│   │   ├── TermsOfService.tsx # Terms of service
│   │   └── CookiePolicy.tsx   # Cookie policy
│   └── admin/
│       └── AdminDashboard.tsx # Admin panel
│
├── context/
│   └── AppContext.tsx         # Global state (localStorage-based)
│
├── services/
│   ├── openrouterService.ts   # OpenRouter AI integration
│   ├── paymentService.ts      # Frontend payment helpers
│   └── storageService.ts      # LocalStorage wrapper
│
├── utils/
│   ├── crypto.ts              # Token generation, password hashing
│   ├── shuffle.ts             # Fisher-Yates shuffle
│   └── validation.ts          # Input validation
│
└── server/                    # Express Backend
    ├── prisma/
    │   └── schema.prisma      # Database schema
    ├── src/
    │   ├── index.ts           # Express server entry
    │   ├── db/
    │   │   └── prisma.ts      # Prisma client instance
    │   ├── middleware/
    │   │   └── auth.ts        # Clerk JWT verification
    │   ├── routes/
    │   │   ├── health.ts      # Health check endpoint
    │   │   ├── users.ts       # User profile, credits, history
    │   │   ├── readings.ts    # Tarot reading CRUD
    │   │   ├── payments.ts    # Stripe + PayPal checkout
    │   │   └── webhooks.ts    # Stripe + Clerk webhooks
    │   └── services/
    │       └── email.ts       # Brevo email templates
    └── .env.example           # Environment template
```

## Database Schema (Prisma)

Key models:
- **User**: Synced with Clerk, stores credits, referrals, admin flag
- **Reading**: Tarot readings with cards (JSON), interpretation
- **Transaction**: Credit purchases, spending, bonuses, refunds
- **UserAchievement**: Gamification achievements
- **HoroscopeCache**: Daily horoscope caching
- **EmailSubscription**: Newsletter preferences

## API Endpoints

### Users (`/api/users`)
- `GET /me` - Get current user profile
- `PATCH /me` - Update preferences
- `GET /me/credits` - Get credit balance
- `GET /me/readings` - Reading history
- `GET /me/transactions` - Transaction history
- `POST /me/daily-bonus` - Claim daily login bonus

### Payments (`/api/payments`)
- `GET /packages` - List credit packages
- `POST /stripe/checkout` - Create Stripe session
- `GET /stripe/verify/:sessionId` - Verify payment
- `POST /paypal/order` - Create PayPal order
- `POST /paypal/capture` - Capture PayPal payment
- `GET /history` - Purchase history

### Webhooks (`/api/webhooks`)
- `POST /stripe` - Stripe payment events
- `POST /clerk` - Clerk user events (create/update/delete)

## Environment Variables

### Frontend (.env.local)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_API_URL=http://localhost:3001
VITE_API_KEY=sk-or-xxxxx  # OpenRouter
```

### Backend (server/.env)
```
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://...

# Clerk
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# PayPal
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=sandbox

# Brevo Email
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
npx prisma studio    # Open Prisma Studio
```

## Key Features

### Authentication
- Clerk handles auth (sign in, sign up, SSO)
- Clerk webhooks sync users to our database
- JWT verification on backend routes

### Credits System
- New users get 10 free credits
- Daily login bonus (2 credits, +5 for 7-day streak)
- Purchases via Stripe or PayPal
- Referral bonuses

### Tarot Readings
- Single card, 3-card, Celtic Cross spreads
- AI interpretations via OpenRouter
- Follow-up questions
- Reading history saved

### Legal Compliance
- GDPR-compliant privacy policy
- Cookie consent banner (CNIL compliant)
- Terms of service
- Data stored in EU (Render Frankfurt)

## Development Notes

- Set `VITE_DEV_MODE=true` in `.env.local` to bypass credit checks during development
- Username "Mooks" is auto-admin
- Payment webhooks handle credit fulfillment
- Brevo emails use `{{params.variableName}}` placeholder syntax

## Future Improvements (TODO)

### Admin Dashboard
The admin dashboard exists but is incomplete:
- `components/admin/AdminDashboard.tsx` - Just a stub showing title
- `components/admin/AdminOverview.tsx` - Exists but not wired up
- `components/admin/AdminAnalytics.tsx` - Exists but not wired up
- `components/admin/AdminUsers.tsx` - Exists but not wired up

**TODO:** Connect these components to display real data from the backend.

### Backend Validation (Zod)
API routes don't validate incoming request data. Zod is installed but not used.

**TODO:** Add Zod schemas to validate request bodies in:
- `server/src/routes/payments.ts`
- `server/src/routes/readings.ts`
- `server/src/routes/users.ts`

### Rate Limiting
No rate limiting on API endpoints. Payment and webhook routes are exposed.

**TODO:** Add `express-rate-limit` middleware to protect sensitive endpoints.

### Type Sharing
Types are duplicated between frontend (`types.ts`) and backend (Prisma schema).

**TODO:** Consider using `prisma-zod-generator` or a shared types package to keep them in sync.

### localStorage Usage
Some features still use localStorage instead of backend:
- `CookieConsent` - Cookie preferences
- `HoroscopeReading` - Daily horoscope caching
- `WelcomeModal` - "Welcome seen" flag

**TODO:** Migrate to backend storage for consistency across devices.
