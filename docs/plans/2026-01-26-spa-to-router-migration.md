# SPA to React Router Migration

> **Status:** Ready for Implementation
> **Created:** 2026-01-26
> **Goal:** Replace custom SPA routing with React Router v6, making all links normal `<a>` tags

## Problem Statement

The current MysticOracle frontend uses a custom SPA routing system with:
- `currentView` state in `App.tsx` determining which component renders
- `SmartLink` component intercepting clicks for client-side navigation
- `handleNavigation()` and `setCurrentView()` calls scattered across 24+ files
- Admin tabs managed by component state, not URLs

**Issues:**
1. Links can't be opened in new tabs (cmd+click/ctrl+click intercepted)
2. Admin pages not bookmarkable (tabs are state, not URLs)
3. Same-URL navigation doesn't reset state (e.g., starting new reading)
4. Back button breaks during reading flow
5. Non-standard pattern, harder for new developers

## Solution Overview

Migrate to React Router v6 with:
- Standard `<Link>` components (real `<a>` tags with proper hrefs)
- URL-based routing for all pages including admin tabs
- Step-based URLs for reading flow with proper back/forward support
- Protected routes for authenticated/admin areas

## Route Structure

### Public Routes
```
/                           → Home (ReadingModeSelector)
/blog                       → BlogList
/blog/:slug                 → BlogPost
/tarot-cards                → TarotCardsOverview
/tarot-cards/:category      → TarotCategorySection
/tarot-cards/:category/:card → TarotCardPreview
/tarot/:slug                → TarotArticlePage
/horoscopes                 → HoroscopeReading
/horoscopes/:sign           → HoroscopeReading (specific sign)
/privacy                    → PrivacyPolicy
/terms                      → TermsOfService
/cookies                    → CookiePolicy
/faq                        → FAQ
/about                      → AboutUs
/how-credits-work           → HowCreditsWork
```

### Authenticated Routes
```
/profile                    → UserProfile (with expandable reading history)
/reading/:id                → View specific reading (bookmarkable)
/payment/success            → PaymentResult (success)
/payment/cancelled          → PaymentResult (cancelled)
```

### Reading Flow Routes
```
/reading                    → Redirect to /reading/select-spread
/reading/select-spread      → SpreadSelector
/reading/question           → QuestionInput
/reading/draw-cards         → Card drawing
/reading/reveal             → RevealingPhase (interpretation loading)
/reading/result             → Reading result (unsaved, in-progress)
```

### Admin Routes
```
/admin                      → AdminOverview (dashboard stats)
/admin/users                → AdminUsers
/admin/transactions         → AdminTransactions
/admin/analytics            → AdminAnalytics
/admin/packages             → AdminPackages
/admin/email-templates      → AdminEmailTemplates
/admin/translations         → AdminTranslations
/admin/settings             → AdminSettings
/admin/health               → AdminHealth

/admin/blog                 → AdminBlog (posts list)
/admin/blog/new             → BlogPostEditor (create)
/admin/blog/:id/edit        → BlogPostEditor (edit)
/admin/blog/categories      → Blog categories
/admin/blog/tags            → Blog tags
/admin/blog/media           → Media library
/admin/blog/trash           → Trash bin

/admin/tarot-articles       → AdminTarotArticles (list)
/admin/tarot-articles/new   → TarotArticleEditor (create)
/admin/tarot-articles/:id/edit → TarotArticleEditor (edit)
/admin/tarot-articles/categories → Categories
/admin/tarot-articles/tags  → Tags
/admin/tarot-articles/trash → Trash bin
```

## Architecture

### Dependencies
```bash
npm install react-router-dom@6
```

### File Structure
```
src/
├── routes/
│   ├── index.tsx           # Main route definitions
│   ├── PublicRoutes.tsx    # Public page routes
│   ├── AuthRoutes.tsx      # Authenticated routes wrapper
│   ├── AdminRoutes.tsx     # Admin nested routes
│   └── ReadingRoutes.tsx   # Reading flow routes
├── context/
│   └── ReadingContext.tsx  # Reading flow state (new)
├── components/
│   ├── routing/
│   │   ├── ProtectedRoute.tsx   # Auth guard
│   │   └── AdminRoute.tsx       # Admin guard
│   └── ... (existing components)
└── App.tsx                 # Simplified, just providers + RouterProvider
```

### Route Configuration (KISS)

Single source of truth for routes:

```typescript
// routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'blog', element: <BlogList /> },
      { path: 'blog/:slug', element: <BlogPost /> },
      // ... public routes

      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile', element: <UserProfile /> },
          { path: 'reading/:id', element: <ReadingView /> },
          { path: 'reading/*', element: <ReadingFlow /> },
        ],
      },

      // Admin routes
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          { index: true, element: <AdminOverview /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'blog', element: <AdminBlog /> },
          { path: 'blog/:id/edit', element: <BlogPostEditor /> },
          // ... admin routes
        ],
      },
    ],
  },
]);
```

### App.tsx (Simplified)

```typescript
// App.tsx - becomes minimal
import { RouterProvider } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { AppProvider } from './context/AppContext';
import { ReadingProvider } from './context/ReadingContext';
import { router } from './routes';

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <AppProvider>
        <ReadingProvider>
          <RouterProvider router={router} />
        </ReadingProvider>
      </AppProvider>
    </ClerkProvider>
  );
}
```

### RootLayout (DRY - shared layout)

```typescript
// components/layout/RootLayout.tsx
import { Outlet } from 'react-router-dom';

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SubNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
      {/* Modals */}
    </div>
  );
}
```

### Protected Route (SOLID - Single Responsibility)

```typescript
// components/routing/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

export function ProtectedRoute() {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) return <LoadingSpinner />;

  if (!isSignedIn) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
```

### Admin Route (SOLID - Single Responsibility)

```typescript
// components/routing/AdminRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function AdminRoute() {
  const { user, isLoading } = useApp();

  if (isLoading) return <LoadingSpinner />;

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      <AdminNav />  {/* Sidebar/tabs as links */}
      <Outlet />
    </div>
  );
}
```

## Reading Flow Implementation

### Reading Context (State Management)

```typescript
// context/ReadingContext.tsx
interface ReadingState {
  spreadType: SpreadType | null;
  interpretationStyle: InterpretationStyle | null;
  question: string;
  cards: CardSelection[] | null;
  interpretation: string | null;
  interpretationStatus: 'idle' | 'loading' | 'complete' | 'error';
  readingId: string | null;
}

interface ReadingContextValue {
  state: ReadingState;
  setSpreadType: (type: SpreadType) => void;
  setQuestion: (question: string) => void;
  setCards: (cards: CardSelection[]) => void;
  setInterpretation: (text: string) => void;
  saveReading: () => Promise<string>;  // Returns reading ID
  clearReading: () => void;
  canProceedTo: (step: ReadingStep) => boolean;
}
```

### Reading Flow Router

```typescript
// routes/ReadingRoutes.tsx
export function ReadingFlow() {
  return (
    <Routes>
      <Route index element={<Navigate to="select-spread" replace />} />
      <Route path="select-spread" element={<SpreadSelector />} />
      <Route path="question" element={<QuestionInput />} />
      <Route path="draw-cards" element={<CardDrawing />} />
      <Route path="reveal" element={<RevealingPhase />} />
      <Route path="result" element={<ReadingResult />} />
    </Routes>
  );
}
```

### Step Navigation Guards

```typescript
// In each reading step component
function CardDrawing() {
  const { state, canProceedTo } = useReading();
  const navigate = useNavigate();

  useEffect(() => {
    if (!canProceedTo('draw-cards')) {
      navigate('/reading/select-spread', { replace: true });
    }
  }, []);

  // ... component logic
}
```

### API Call Protection

```typescript
// components/reading/RevealingPhase.tsx
function RevealingPhase() {
  const { state, setInterpretation } = useReading();
  const navigate = useNavigate();
  const apiCalledRef = useRef(false);

  useEffect(() => {
    // Already have interpretation - don't refetch
    if (state.interpretation) return;

    // Already calling API - don't duplicate
    if (apiCalledRef.current) return;

    // Missing required data - redirect
    if (!state.cards || !state.spreadType) {
      navigate('/reading/select-spread', { replace: true });
      return;
    }

    apiCalledRef.current = true;
    fetchInterpretation(state).then(setInterpretation);
  }, []);

  // ... render logic
}
```

### Same-URL Reset (New Reading)

```typescript
// In Header or nav component
function StartReadingLink() {
  const { state, clearReading } = useReading();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    // If already on a reading page with state, confirm and reset
    if (location.pathname.startsWith('/reading') && state.cards) {
      e.preventDefault();
      if (confirm('Start a new reading? Current progress will be lost.')) {
        clearReading();
        navigate('/reading/select-spread', { replace: true });
      }
    }
    // Otherwise, normal navigation happens via Link
  };

  return (
    <Link to="/reading/select-spread" onClick={handleClick}>
      New Reading
    </Link>
  );
}
```

## Admin Navigation

### AdminNav Component (Replaces Tabs)

```typescript
// components/admin/AdminNav.tsx
import { NavLink } from 'react-router-dom';

const adminLinks = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/transactions', label: 'Transactions' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/blog', label: 'Blog' },
  { to: '/admin/tarot-articles', label: 'Tarot Articles' },
  { to: '/admin/packages', label: 'Packages' },
  { to: '/admin/email-templates', label: 'Email Templates' },
  { to: '/admin/translations', label: 'Translations' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/health', label: 'Health' },
];

export function AdminNav() {
  return (
    <nav className="admin-nav">
      {adminLinks.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            isActive ? 'admin-nav-link active' : 'admin-nav-link'
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
```

### Clickable List Rows

```typescript
// In AdminBlog list
function BlogPostRow({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/admin/blog/${post.id}/edit`}
      className="block hover:bg-gray-50 p-4 border-b"
    >
      <div className="flex justify-between">
        <span>{post.title}</span>
        <span className="text-gray-500">{post.status}</span>
      </div>
    </Link>
  );
}
```

## Migration Strategy

### Phase 1: Setup (Day 1)
1. Install `react-router-dom`
2. Create route configuration file
3. Create `RootLayout`, `ProtectedRoute`, `AdminRoute`
4. Wrap App in `RouterProvider`
5. Keep `currentView` temporarily for fallback

### Phase 2: Public Pages (Day 1-2)
1. Convert Home, Blog, Tarot Cards routes
2. Replace `SmartLink` imports with `Link`
3. Update `Header.tsx`, `SubNav.tsx`, `Footer.tsx`
4. Remove `handleNavigation` calls
5. Test each route manually

### Phase 3: Admin Routes (Day 2-3)
1. Create `AdminRoutes.tsx` with nested routes
2. Convert `AdminDashboard.tsx` tabs to `AdminNav`
3. Add routes for each admin section
4. Make blog/article lists clickable rows
5. Test admin navigation and permissions

### Phase 4: Reading Flow (Day 3-4)
1. Create `ReadingContext.tsx`
2. Create step-based routes
3. Add navigation guards
4. Implement API call protection
5. Test back/forward navigation
6. Test same-URL reset behavior

### Phase 5: Cleanup (Day 4)
1. Delete `SmartLink.tsx`
2. Remove `currentView`, `setCurrentView`, `handleNavigation` from App.tsx
3. Remove unused navigation functions from components
4. Update `ARCHITECTURE.md`
5. Final testing of all routes

## Files to Modify

### Major Changes
- `App.tsx` - Complete restructure
- `components/admin/AdminDashboard.tsx` - Tabs → Routes

### Navigation Components
- `components/Header.tsx`
- `components/SubNav.tsx`
- `components/Footer.tsx`
- `components/Breadcrumb.tsx`

### SmartLink Consumers (24 files)
- `components/blog/BlogPost.tsx`
- `components/blog/BlogList.tsx`
- `components/blog/components/BlogRelated.tsx`
- `components/blog/components/BlogCTA.tsx`
- `components/blog/components/BlogHeader.tsx`
- `components/tarot/TarotCardsOverview.tsx`
- `components/tarot/TarotCardPreview.tsx`
- `components/tarot/TarotCategorySection.tsx`
- `components/tarot-article/TarotArticlePage.tsx`
- `components/tarot-article/RelatedCards.tsx`
- `components/tarot-article/Breadcrumbs.tsx`
- `components/TarotArticlesList.tsx`
- `components/AboutUs.tsx`
- `components/FAQ.tsx`
- `components/HowCreditsWork.tsx`
- `components/PaymentResult.tsx`
- `components/UserProfile.tsx`

### Files to Create
- `routes/index.tsx`
- `routes/ReadingRoutes.tsx`
- `components/routing/ProtectedRoute.tsx`
- `components/routing/AdminRoute.tsx`
- `components/admin/AdminNav.tsx`
- `components/layout/RootLayout.tsx`
- `context/ReadingContext.tsx`

### Files to Delete
- `components/SmartLink.tsx`

## Testing Checklist

### Navigation
- [ ] All nav links work
- [ ] Cmd+click opens new tab
- [ ] Ctrl+click opens new tab
- [ ] Middle-click opens new tab
- [ ] Right-click shows context menu
- [ ] Back button works on all pages
- [ ] Forward button works
- [ ] Direct URL access works for all routes

### Admin
- [ ] Admin routes require authentication
- [ ] Admin routes require admin role
- [ ] All admin tabs are bookmarkable
- [ ] Blog list rows clickable
- [ ] Article list rows clickable
- [ ] Nested routes work (blog/categories, etc.)

### Reading Flow
- [ ] Steps progress correctly
- [ ] Back button moves to previous step
- [ ] Can't skip steps via URL
- [ ] API only called once per reading
- [ ] Refresh preserves state
- [ ] New reading resets state
- [ ] Saved reading accessible via /reading/:id

### Reading History
- [ ] Profile shows reading history
- [ ] Expandable cards still work
- [ ] /reading/:id loads from database
- [ ] Back from /reading/:id works

## Rollback Plan

If issues arise:
1. Git revert the migration commits
2. `SmartLink.tsx` and `currentView` logic preserved in git history
3. No database changes required
4. No API changes required

## Success Criteria

1. All links open in new tabs with cmd/ctrl+click
2. All admin pages bookmarkable
3. Reading flow back/forward works
4. No duplicate API calls
5. Reading history still works
6. Zero console errors
7. All existing functionality preserved
