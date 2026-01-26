# MysticOracle - Architecture Documentation

## System Overview

MysticOracle is a full-stack TypeScript application using a monorepo structure with separate frontend and backend codebases.

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│   React 19 + TypeScript + Vite + Tailwind CSS               │
│   └── Clerk Auth (JWT) + Context API State                  │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS API Calls
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Server                         │
│   └── Routes → Middleware (Auth) → Controllers              │
└─────────────────┬───────────────────────────────────────────┘
                  │ Prisma ORM
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (Render Frankfurt)                   │
│   └── Users, Readings, Transactions, Blog, etc.             │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Routing (React Router v6)
The app uses React Router v6 with `createBrowserRouter` for modern, declarative routing:

**Key Files:**
- `routes/routes.ts` - Route path constants (single source of truth)
- `routes/index.tsx` - Router configuration with `createBrowserRouter`
- `components/layout/RootLayout.tsx` - Shared layout with Header/Footer
- `components/routing/ProtectedRoute.tsx` - Authentication guard
- `components/routing/AdminRoute.tsx` - Admin role guard
- `components/admin/AdminLayout.tsx` - Admin section layout
- `components/admin/AdminNav.tsx` - Admin sidebar navigation
- `context/ReadingContext.tsx` - Reading flow state management

**Route Structure:**
```
RootLayout (Header + Footer + Outlet)
├── Public Routes (accessible to all)
│   ├── / (HomePage)
│   ├── /blog, /blog/:slug
│   ├── /tarot/cards, /tarot/cards/:category, /tarot/:slug
│   ├── /horoscopes, /horoscopes/:sign
│   ├── /privacy, /terms, /cookies, /faq, /about
│   └── /payment/success, /payment/cancelled
│
├── Protected Routes (ProtectedRoute guard)
│   ├── /profile
│   └── /reading/* (wrapped in ReadingProvider)
│
├── Admin Routes (AdminRoute guard → AdminLayout)
│   ├── /admin (overview)
│   ├── /admin/users, /admin/transactions, /admin/analytics
│   ├── /admin/blog/*, /admin/tarot-articles/*
│   └── /admin/settings, /admin/health, etc.
│
└── /* (404 fallback)
```

**Features:**
- Lazy loading with `React.lazy()` for code splitting
- Centralized route constants in `ROUTES` object
- `buildRoute()` helper for dynamic route parameters
- Nested layouts with `<Outlet />` component
- All links are proper `<a>` tags (right-click, new tab support)
- Use `Link` from `react-router-dom` for navigation

### State Management
- **AppContext**: Global state for user, language, credits
- **ReadingContext**: Reading flow state (spread type, cards, question)
- **Component-local state**: UI states, form data
- **LocalStorage**: Cookie consent, temporary caches

### Component Hierarchy
```
RouterProvider (routes/index.tsx)
└── RootLayout
    ├── Header.tsx (nav, credit display, user menu)
    ├── SubNav.tsx (secondary nav with dropdowns)
    ├── <Outlet /> (renders matched route)
    │   ├── HomePage
    │   ├── BlogList / BlogPost
    │   ├── ProtectedRoute → UserProfile / ReadingProvider → ActiveReading
    │   └── AdminRoute → AdminLayout → AdminNav + [Admin Pages]
    ├── Footer.tsx
    └── Modals (CreditShop, WelcomeModal, DailyBonusPopup)
```

### API Service Pattern
All API calls go through `services/apiService.ts`:
- Centralized error handling
- Retry logic for failed requests
- Token injection for authenticated requests
- Type-safe responses

## Backend Architecture

### Route Structure
```
/api
├── /health          # Health check
├── /users           # User management (authenticated)
├── /readings        # Tarot readings
├── /payments        # Stripe/PayPal integration
├── /webhooks        # External service callbacks
├── /admin           # Admin-only endpoints
├── /blog            # Public blog endpoints
│   └── /admin       # Admin blog endpoints (nested)
└── /horoscopes      # Horoscope generation
```

### Middleware Chain
```
Request → CORS → JSON Parser → [Route Handler]
                                    ↓
                              requireAuth (optional)
                                    ↓
                              requireAdmin (optional)
                                    ↓
                              Controller Logic
```

### Authentication Flow
1. Clerk manages user sessions (frontend)
2. Clerk provides JWT tokens via `getToken()`
3. Backend verifies JWT using Clerk SDK
4. User data synced via Clerk webhooks

## Database Schema

### Core Models

**User**
- Primary entity synced from Clerk
- Contains credits, referral codes, admin flag
- Relations: readings, transactions, achievements

**Reading**
- Tarot reading records
- Cards stored as JSON array
- AI interpretation text
- Optional follow-up questions

**Transaction**
- Credit economy tracking
- Purchase, spend, bonus, refund types
- Payment provider integration

### Blog Models

**BlogPost**
- Multi-language content (EN/FR)
- SEO meta fields
- Soft delete (deletedAt + originalSlug)
- Many-to-many with categories/tags

**BlogCategory / BlogTag**
- Taxonomies for posts
- Slug-based URLs
- Display customization (color, icon)

### Enum Types
```prisma
enum AccountStatus { ACTIVE, FLAGGED, SUSPENDED }
enum SpreadType { SINGLE, THREE_CARD, LOVE, CAREER, HORSESHOE, CELTIC_CROSS }
enum InterpretationStyle { CLASSIC, SPIRITUAL, PSYCHO_EMOTIONAL, NUMEROLOGY, ELEMENTAL }
enum TransactionType { PURCHASE, READING, QUESTION, DAILY_BONUS, ACHIEVEMENT, REFERRAL_BONUS, REFUND }
enum BlogPostStatus { DRAFT, PUBLISHED, ARCHIVED }
```

## Blog CMS Architecture

### Content Flow
```
Admin creates post → Draft status → Preview available
       ↓
Admin publishes → status=PUBLISHED, publishedAt set
       ↓
Public can view via /blog/:slug
       ↓
Admin deletes → Soft delete (deletedAt set, slug modified)
       ↓
Admin restores → deletedAt cleared, original slug restored if available
```

### Editor Modes
- **Visual**: RichTextEditor with toolbar (WYSIWYG)
- **Markdown**: MarkdownEditor with live preview
- Default mode: Visual (configurable)

### JSON Import Format
```json
{
  "title": "Article Title",
  "slug": "article-slug",
  "excerpt": "Short description",
  "content": "<p>HTML content...</p>",
  "author": "Author Name",
  "read_time": "5 min",
  "categories": ["Category Name"],
  "tags": ["Tag1", "Tag2"],
  "cover_image": "https://...",
  "seo_meta": {
    "meta_title": "SEO Title",
    "meta_description": "SEO Description"
  }
}
```

## Payment Integration

### Stripe Flow
1. Frontend calls `POST /api/payments/stripe/checkout`
2. Backend creates Stripe Checkout Session
3. User redirected to Stripe
4. Webhook receives `checkout.session.completed`
5. Credits added to user account

### PayPal Flow
1. Frontend creates order via `POST /api/payments/paypal/order`
2. User completes on PayPal
3. Frontend calls `POST /api/payments/paypal/capture`
4. Credits added to user account

## AI Integration

### OpenRouter Service
- Uses OpenRouter API for AI completions
- Supports multiple models (Claude, GPT-4, etc.)
- Structured prompts for tarot interpretations
- Context includes: spread type, cards, question, style

### Prompt Structure
```
System: [Interpreter persona and guidelines]
User: [Spread details, cards drawn, user question]
→ AI generates interpretation
→ Stored in Reading.interpretation
```

## Security Considerations

### Authentication
- Clerk handles all auth (sign up, sign in, SSO)
- JWT verification on every protected route
- Admin routes require `isAdmin: true` flag

### Data Protection
- GDPR-compliant (EU data storage)
- Cookie consent banner
- User data deletion via Clerk webhooks
- Input sanitization (DOMPurify for HTML content)

### API Security
- CORS configured for frontend origin only
- Rate limiting recommended for production
- Webhook signature verification (Stripe, Clerk)

## Deployment

### Production Stack
- **Frontend**: Static hosting (Render/Vercel)
- **Backend**: Node.js on Render
- **Database**: PostgreSQL on Render (Frankfurt)
- **CDN**: Cloudflare (optional)

### Environment Variables
See `CLAUDE.md` for complete list.

## Performance Considerations

### Frontend
- Code splitting via dynamic imports
- Image optimization (lazy loading)
- Tailwind CSS purging in production
- Framer Motion for smooth animations

### Backend
- Prisma connection pooling
- Response caching for blog posts
- Pagination on all list endpoints
- Index fields for frequent queries

## Monitoring

### Health Checks
- `GET /api/health` endpoint
- Admin dashboard health tab
- Service status monitoring

### Logging
- Console logging in development
- Structured logging for production (recommended)
- Error tracking integration (optional)
