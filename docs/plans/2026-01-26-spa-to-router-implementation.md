# SPA to React Router Migration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Replace custom SPA routing with React Router v6 so all links are real `<a>` tags that can be opened in new tabs.

**Architecture:** Install react-router-dom, create route configuration, convert components incrementally from innermost (no dependencies) to outermost (App.tsx).

**Tech Stack:** React Router v6, TypeScript, React 19

---

## Phase 1: Foundation

### Task 1: Install React Router

**Files:**
- Modify: `package.json`

**Steps:**

1. Install react-router-dom:
```bash
npm install react-router-dom@6
```

2. Verify installation:
```bash
npm ls react-router-dom
```
Expected: `react-router-dom@6.x.x`

3. Commit:
```bash
git add package.json package-lock.json
git commit -m "chore: add react-router-dom v6"
```

---

### Task 2: Create Route Configuration

**Files:**
- Create: `routes/index.tsx`
- Create: `routes/routes.ts`

**Step 1: Create routes constants file**

Create `routes/routes.ts`:
```typescript
// Route path constants - single source of truth
export const ROUTES = {
  HOME: '/',

  // Auth
  PROFILE: '/profile',

  // Reading flow
  READING: '/reading',
  READING_SELECT_SPREAD: '/reading/select-spread',
  READING_QUESTION: '/reading/question',
  READING_DRAW: '/reading/draw-cards',
  READING_REVEAL: '/reading/reveal',
  READING_RESULT: '/reading/result',
  READING_VIEW: '/reading/:id',

  // Horoscopes
  HOROSCOPES: '/horoscopes',
  HOROSCOPE_SIGN: '/horoscopes/:sign',

  // Blog
  BLOG: '/blog',
  BLOG_POST: '/blog/:slug',

  // Tarot
  TAROT_CARDS: '/tarot/cards',
  TAROT_CARDS_ALL: '/tarot/cards/all',
  TAROT_CARDS_CATEGORY: '/tarot/cards/:category',
  TAROT_CARD: '/tarot/cards/:category/:card',
  TAROT_ARTICLE: '/tarot/:slug',

  // Legal
  PRIVACY: '/privacy',
  TERMS: '/terms',
  COOKIES: '/cookies',

  // Info
  FAQ: '/faq',
  ABOUT: '/about',
  HOW_CREDITS_WORK: '/how-credits-work',

  // Payment
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_CANCELLED: '/payment/cancelled',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_TRANSACTIONS: '/admin/transactions',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_PACKAGES: '/admin/packages',
  ADMIN_EMAIL_TEMPLATES: '/admin/email-templates',
  ADMIN_TRANSLATIONS: '/admin/translations',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_HEALTH: '/admin/health',

  // Admin Blog
  ADMIN_BLOG: '/admin/blog',
  ADMIN_BLOG_NEW: '/admin/blog/new',
  ADMIN_BLOG_EDIT: '/admin/blog/:id/edit',
  ADMIN_BLOG_CATEGORIES: '/admin/blog/categories',
  ADMIN_BLOG_TAGS: '/admin/blog/tags',
  ADMIN_BLOG_MEDIA: '/admin/blog/media',
  ADMIN_BLOG_TRASH: '/admin/blog/trash',

  // Admin Tarot Articles
  ADMIN_TAROT: '/admin/tarot-articles',
  ADMIN_TAROT_NEW: '/admin/tarot-articles/new',
  ADMIN_TAROT_EDIT: '/admin/tarot-articles/:id/edit',
  ADMIN_TAROT_CATEGORIES: '/admin/tarot-articles/categories',
  ADMIN_TAROT_TAGS: '/admin/tarot-articles/tags',
  ADMIN_TAROT_TRASH: '/admin/tarot-articles/trash',
} as const;

// Helper to build dynamic routes
export function buildRoute(route: string, params: Record<string, string>): string {
  let result = route;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
}
```

**Step 2: Create router configuration shell**

Create `routes/index.tsx`:
```typescript
import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './routes';

// Placeholder - will be filled in as we migrate components
export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <div>Router setup complete - migration in progress</div>,
  },
]);
```

**Step 3: Commit**
```bash
git add routes/
git commit -m "feat: add route configuration foundation"
```

---

### Task 3: Create Layout Components

**Files:**
- Create: `components/layout/RootLayout.tsx`
- Create: `components/layout/index.ts`

**Step 1: Create RootLayout**

Create `components/layout/RootLayout.tsx`:
```typescript
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import SubNav from '../SubNav';
import Footer from '../Footer';
import CookieConsent from '../CookieConsent';
import { Suspense } from 'react';

// Loading fallback for lazy-loaded routes
function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-purple-300/70 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function RootLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex flex-col">
      <Header />
      <SubNav />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
```

**Step 2: Create barrel export**

Create `components/layout/index.ts`:
```typescript
export { RootLayout } from './RootLayout';
```

**Step 3: Commit**
```bash
git add components/layout/
git commit -m "feat: add RootLayout component for router"
```

---

### Task 4: Create Route Guards

**Files:**
- Create: `components/routing/ProtectedRoute.tsx`
- Create: `components/routing/AdminRoute.tsx`
- Create: `components/routing/index.ts`

**Step 1: Create ProtectedRoute**

Create `components/routing/ProtectedRoute.tsx`:
```typescript
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ROUTES } from '../../routes/routes';

export function ProtectedRoute() {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();

  // Show nothing while Clerk loads
  if (!isLoaded) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to home if not signed in
  if (!isSignedIn) {
    return <Navigate to={ROUTES.HOME} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
```

**Step 2: Create AdminRoute**

Create `components/routing/AdminRoute.tsx`:
```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../routes/routes';
import { Shield } from 'lucide-react';

export function AdminRoute() {
  const { isSignedIn, isLoaded } = useUser();
  const { user, isLoading, t } = useApp();

  // Show nothing while loading
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if not signed in
  if (!isSignedIn) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  // Show 403 if not admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-heading text-white mb-4">
            {t('app.App.access_denied', 'Access Denied')}
          </h1>
          <p className="text-slate-400 mb-6">
            {t('app.App.access_denied_description', 'You do not have permission to access this page.')}
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
```

**Step 3: Create barrel export**

Create `components/routing/index.ts`:
```typescript
export { ProtectedRoute } from './ProtectedRoute';
export { AdminRoute } from './AdminRoute';
```

**Step 4: Commit**
```bash
git add components/routing/
git commit -m "feat: add ProtectedRoute and AdminRoute guards"
```

---

## Phase 2: Reading Context

### Task 5: Create Reading Context

**Files:**
- Create: `context/ReadingContext.tsx`

**Step 1: Create the context**

Create `context/ReadingContext.tsx`:
```typescript
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { SpreadType, InterpretationStyle } from '../types';

interface CardSelection {
  cardId: string;
  position: number;
  isReversed: boolean;
}

interface ReadingState {
  spreadType: SpreadType | null;
  interpretationStyle: InterpretationStyle | null;
  question: string;
  cards: CardSelection[] | null;
  interpretation: string | null;
  interpretationStatus: 'idle' | 'loading' | 'complete' | 'error';
  readingId: string | null;
  error: string | null;
}

interface ReadingContextValue {
  state: ReadingState;
  setSpreadType: (type: SpreadType) => void;
  setInterpretationStyle: (style: InterpretationStyle) => void;
  setQuestion: (question: string) => void;
  setCards: (cards: CardSelection[]) => void;
  setInterpretation: (text: string) => void;
  setInterpretationStatus: (status: ReadingState['interpretationStatus']) => void;
  setReadingId: (id: string) => void;
  setError: (error: string | null) => void;
  clearReading: () => void;
  canProceedTo: (step: ReadingStep) => boolean;
  hasStartedReading: () => boolean;
}

type ReadingStep = 'select-spread' | 'question' | 'draw-cards' | 'reveal' | 'result';

const initialState: ReadingState = {
  spreadType: null,
  interpretationStyle: null,
  question: '',
  cards: null,
  interpretation: null,
  interpretationStatus: 'idle',
  readingId: null,
  error: null,
};

const ReadingContext = createContext<ReadingContextValue | null>(null);

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ReadingState>(initialState);

  const setSpreadType = useCallback((type: SpreadType) => {
    setState(prev => ({ ...prev, spreadType: type }));
  }, []);

  const setInterpretationStyle = useCallback((style: InterpretationStyle) => {
    setState(prev => ({ ...prev, interpretationStyle: style }));
  }, []);

  const setQuestion = useCallback((question: string) => {
    setState(prev => ({ ...prev, question }));
  }, []);

  const setCards = useCallback((cards: CardSelection[]) => {
    setState(prev => ({ ...prev, cards }));
  }, []);

  const setInterpretation = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      interpretation: text,
      interpretationStatus: 'complete'
    }));
  }, []);

  const setInterpretationStatus = useCallback((status: ReadingState['interpretationStatus']) => {
    setState(prev => ({ ...prev, interpretationStatus: status }));
  }, []);

  const setReadingId = useCallback((id: string) => {
    setState(prev => ({ ...prev, readingId: id }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, interpretationStatus: error ? 'error' : prev.interpretationStatus }));
  }, []);

  const clearReading = useCallback(() => {
    setState(initialState);
  }, []);

  const canProceedTo = useCallback((step: ReadingStep): boolean => {
    switch (step) {
      case 'select-spread':
        return true;
      case 'question':
        return state.spreadType !== null;
      case 'draw-cards':
        return state.spreadType !== null;
      case 'reveal':
        return state.spreadType !== null && state.cards !== null && state.cards.length > 0;
      case 'result':
        return state.interpretation !== null || state.readingId !== null;
      default:
        return false;
    }
  }, [state]);

  const hasStartedReading = useCallback((): boolean => {
    return state.spreadType !== null || state.cards !== null || state.interpretation !== null;
  }, [state]);

  const value: ReadingContextValue = {
    state,
    setSpreadType,
    setInterpretationStyle,
    setQuestion,
    setCards,
    setInterpretation,
    setInterpretationStatus,
    setReadingId,
    setError,
    clearReading,
    canProceedTo,
    hasStartedReading,
  };

  return (
    <ReadingContext.Provider value={value}>
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading(): ReadingContextValue {
  const context = useContext(ReadingContext);
  if (!context) {
    throw new Error('useReading must be used within a ReadingProvider');
  }
  return context;
}
```

**Step 2: Commit**
```bash
git add context/ReadingContext.tsx
git commit -m "feat: add ReadingContext for reading flow state"
```

---

## Phase 3: Convert Navigation Components

### Task 6: Update Header with React Router Links

**Files:**
- Modify: `components/Header.tsx`

**Step 1: Replace imports and navigation**

At top of file, add:
```typescript
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../routes/routes';
import { useReading } from '../context/ReadingContext';
```

**Step 2: Replace navigation handlers**

Find all `onClick={() => onNavigate('...')}` patterns and replace with `<Link to={ROUTES.XXX}>`.

For the logo/home link:
```typescript
// Before:
<button onClick={() => onNavigate('home')}>MysticOracle</button>

// After:
<Link to={ROUTES.HOME}>MysticOracle</Link>
```

For profile link:
```typescript
// Before:
<button onClick={() => onNavigate('profile')}>Profile</button>

// After:
<Link to={ROUTES.PROFILE}>Profile</Link>
```

For new reading link (with confirmation):
```typescript
const { hasStartedReading, clearReading } = useReading();
const navigate = useNavigate();
const location = useLocation();

const handleNewReading = (e: React.MouseEvent) => {
  if (location.pathname.startsWith('/reading') && hasStartedReading()) {
    e.preventDefault();
    if (confirm('Start a new reading? Current progress will be lost.')) {
      clearReading();
      navigate(ROUTES.READING_SELECT_SPREAD);
    }
  }
};

// In JSX:
<Link to={ROUTES.READING_SELECT_SPREAD} onClick={handleNewReading}>
  New Reading
</Link>
```

**Step 3: Remove onNavigate prop from Header interface**

The Header component should no longer need navigation props - it gets everything from router hooks.

**Step 4: Commit**
```bash
git add components/Header.tsx
git commit -m "refactor: convert Header to use React Router Links"
```

---

### Task 7: Update SubNav with React Router Links

**Files:**
- Modify: `components/SubNav.tsx`

**Step 1: Replace imports**

```typescript
import { Link, NavLink } from 'react-router-dom';
import { ROUTES } from '../routes/routes';
```

**Step 2: Convert navigation items**

Replace all SmartLink or onClick handlers with Link/NavLink:

```typescript
// Before:
<SmartLink href="/horoscopes" onClick={() => onNavigate('horoscopes')}>
  Horoscopes
</SmartLink>

// After:
<NavLink
  to={ROUTES.HOROSCOPES}
  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
>
  Horoscopes
</NavLink>
```

**Step 3: Remove onNavigate prop**

**Step 4: Commit**
```bash
git add components/SubNav.tsx
git commit -m "refactor: convert SubNav to use React Router Links"
```

---

### Task 8: Update Footer with React Router Links

**Files:**
- Modify: `components/Footer.tsx`

**Step 1: Replace imports**

```typescript
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/routes';
```

**Step 2: Convert links**

```typescript
// Before:
<SmartLink href="/privacy" onClick={() => onNavigate('privacy')}>
  Privacy Policy
</SmartLink>

// After:
<Link to={ROUTES.PRIVACY}>Privacy Policy</Link>
```

**Step 3: Commit**
```bash
git add components/Footer.tsx
git commit -m "refactor: convert Footer to use React Router Links"
```

---

### Task 9: Update Breadcrumb Component

**Files:**
- Modify: `components/Breadcrumb.tsx`

**Step 1: Replace with React Router**

```typescript
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/routes';

interface BreadcrumbItem {
  label: string;
  to?: string;  // Changed from onClick
}

// In JSX:
{item.to ? (
  <Link to={item.to} className="hover:text-purple-300">
    {item.label}
  </Link>
) : (
  <span>{item.label}</span>
)}
```

**Step 2: Commit**
```bash
git add components/Breadcrumb.tsx
git commit -m "refactor: convert Breadcrumb to use React Router Links"
```

---

## Phase 4: Convert Page Components

### Task 10: Convert Blog Components

**Files:**
- Modify: `components/blog/BlogList.tsx`
- Modify: `components/blog/BlogPost.tsx`
- Modify: `components/blog/components/BlogRelated.tsx`
- Modify: `components/blog/components/BlogCTA.tsx`
- Modify: `components/blog/components/BlogHeader.tsx`

**Step 1: BlogList.tsx**

```typescript
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES, buildRoute } from '../../routes/routes';

// Get category/tag from URL params
const [searchParams] = useSearchParams();
const categorySlug = searchParams.get('category');
const tagSlug = searchParams.get('tag');

// Link to post:
<Link to={buildRoute(ROUTES.BLOG_POST, { slug: post.slug })}>
  {post.title}
</Link>

// Link to category:
<Link to={`${ROUTES.BLOG}?category=${category.slug}`}>
  {category.name}
</Link>
```

**Step 2: BlogPost.tsx**

```typescript
import { Link, useParams } from 'react-router-dom';
import { ROUTES } from '../../routes/routes';

// Get slug from URL
const { slug } = useParams<{ slug: string }>();

// Related posts link:
<Link to={buildRoute(ROUTES.BLOG_POST, { slug: relatedPost.slug })}>
  {relatedPost.title}
</Link>
```

**Step 3: Commit**
```bash
git add components/blog/
git commit -m "refactor: convert Blog components to use React Router"
```

---

### Task 11: Convert Tarot Components

**Files:**
- Modify: `components/tarot/TarotCardsOverview.tsx`
- Modify: `components/tarot/TarotCardPreview.tsx`
- Modify: `components/tarot/TarotCategorySection.tsx`
- Modify: `components/TarotArticlesList.tsx`
- Modify: `components/tarot-article/TarotArticlePage.tsx`
- Modify: `components/tarot-article/RelatedCards.tsx`
- Modify: `components/tarot-article/Breadcrumbs.tsx`

**Step 1: TarotCardsOverview.tsx**

```typescript
import { Link } from 'react-router-dom';
import { ROUTES, buildRoute } from '../../routes/routes';

// Link to category:
<Link to={buildRoute(ROUTES.TAROT_CARDS_CATEGORY, { category: category.slug })}>
  {category.name}
</Link>
```

**Step 2: TarotArticlePage.tsx**

```typescript
import { useParams } from 'react-router-dom';

const { slug } = useParams<{ slug: string }>();
```

**Step 3: Commit**
```bash
git add components/tarot/ components/TarotArticlesList.tsx components/tarot-article/
git commit -m "refactor: convert Tarot components to use React Router"
```

---

### Task 12: Convert Horoscope Components

**Files:**
- Modify: `components/HoroscopeReading.tsx`
- Modify: `components/horoscopes/HoroscopesIndex.tsx`
- Modify: `components/horoscopes/HoroscopeSignPage.tsx`

**Step 1: Add router imports and use params**

```typescript
import { Link, useParams } from 'react-router-dom';
import { ROUTES, buildRoute } from '../routes/routes';

// In HoroscopeSignPage:
const { sign } = useParams<{ sign: string }>();
```

**Step 2: Commit**
```bash
git add components/HoroscopeReading.tsx components/horoscopes/
git commit -m "refactor: convert Horoscope components to use React Router"
```

---

### Task 13: Convert Info Page Components

**Files:**
- Modify: `components/AboutUs.tsx`
- Modify: `components/FAQ.tsx`
- Modify: `components/HowCreditsWork.tsx`
- Modify: `components/PaymentResult.tsx`

**Step 1: Replace SmartLink with Link**

For each file:
```typescript
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/routes';

// Replace SmartLink with Link
```

**Step 2: PaymentResult navigation**

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Instead of onNavigate('home'):
navigate(ROUTES.HOME);
```

**Step 3: Commit**
```bash
git add components/AboutUs.tsx components/FAQ.tsx components/HowCreditsWork.tsx components/PaymentResult.tsx
git commit -m "refactor: convert info pages to use React Router"
```

---

## Phase 5: Admin Routes

### Task 14: Create Admin Navigation Component

**Files:**
- Create: `components/admin/AdminNav.tsx`

**Step 1: Create AdminNav**

```typescript
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes/routes';
import {
  LayoutDashboard, Users, Receipt, BarChart3, Package,
  Mail, Languages, Settings, Activity, FileText, BookOpen
} from 'lucide-react';

const adminLinks = [
  { to: ROUTES.ADMIN, label: 'Overview', icon: LayoutDashboard, end: true },
  { to: ROUTES.ADMIN_USERS, label: 'Users', icon: Users },
  { to: ROUTES.ADMIN_TRANSACTIONS, label: 'Transactions', icon: Receipt },
  { to: ROUTES.ADMIN_ANALYTICS, label: 'Analytics', icon: BarChart3 },
  { to: ROUTES.ADMIN_BLOG, label: 'Blog', icon: FileText },
  { to: ROUTES.ADMIN_TAROT, label: 'Tarot Articles', icon: BookOpen },
  { to: ROUTES.ADMIN_PACKAGES, label: 'Packages', icon: Package },
  { to: ROUTES.ADMIN_EMAIL_TEMPLATES, label: 'Email Templates', icon: Mail },
  { to: ROUTES.ADMIN_TRANSLATIONS, label: 'Translations', icon: Languages },
  { to: ROUTES.ADMIN_SETTINGS, label: 'Settings', icon: Settings },
  { to: ROUTES.ADMIN_HEALTH, label: 'Health', icon: Activity },
];

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-800/50 rounded-lg">
      {adminLinks.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-purple-600 text-white'
                : 'text-slate-300 hover:bg-slate-700'
            }`
          }
        >
          <Icon className="w-4 h-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
```

**Step 2: Commit**
```bash
git add components/admin/AdminNav.tsx
git commit -m "feat: add AdminNav component with route links"
```

---

### Task 15: Create Admin Layout

**Files:**
- Create: `components/admin/AdminLayout.tsx`

**Step 1: Create layout wrapper**

```typescript
import { Outlet } from 'react-router-dom';
import { AdminNav } from './AdminNav';

export function AdminLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading text-white mb-6">Admin Dashboard</h1>
      <AdminNav />
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add components/admin/AdminLayout.tsx
git commit -m "feat: add AdminLayout component"
```

---

### Task 16: Refactor AdminDashboard for Routes

**Files:**
- Modify: `components/admin/AdminDashboard.tsx`

**Step 1: Remove tab state management**

The AdminDashboard currently manages tabs via state. We need to:
1. Remove `activeTab` state
2. Remove the tab switching logic
3. Let React Router handle which component renders

**Step 2: Extract AdminOverview**

If AdminDashboard contains overview content, extract it to `AdminOverview.tsx`.

**Step 3: Commit**
```bash
git add components/admin/
git commit -m "refactor: simplify AdminDashboard for route-based navigation"
```

---

### Task 17: Make Admin Lists Clickable

**Files:**
- Modify: `components/admin/AdminBlog.tsx`
- Modify: `components/admin/AdminTarotArticles.tsx`

**Step 1: AdminBlog list rows**

```typescript
import { Link } from 'react-router-dom';
import { ROUTES, buildRoute } from '../../routes/routes';

// In the post list:
<Link
  to={buildRoute(ROUTES.ADMIN_BLOG_EDIT, { id: post.id })}
  className="block hover:bg-slate-700/50 p-4 rounded-lg transition-colors"
>
  <div className="flex justify-between items-center">
    <span className="text-white">{post.title}</span>
    <span className="text-slate-400 text-sm">{post.status}</span>
  </div>
</Link>
```

**Step 2: Commit**
```bash
git add components/admin/AdminBlog.tsx components/admin/AdminTarotArticles.tsx
git commit -m "refactor: make admin list items clickable links"
```

---

## Phase 6: Wire Up Routes

### Task 18: Complete Route Configuration

**Files:**
- Modify: `routes/index.tsx`

**Step 1: Add all routes**

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { ROUTES } from './routes';
import { RootLayout } from '../components/layout';
import { ProtectedRoute, AdminRoute } from '../components/routing';
import { AdminLayout } from '../components/admin/AdminLayout';

// Lazy load all page components
const Home = lazy(() => import('../components/ReadingModeSelector'));
const BlogList = lazy(() => import('../components/blog/BlogList'));
const BlogPost = lazy(() => import('../components/blog/BlogPost'));
// ... all other lazy imports

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public routes
      { index: true, element: <Home /> },
      { path: 'blog', element: <BlogList /> },
      { path: 'blog/:slug', element: <BlogPost /> },
      { path: 'horoscopes', element: <HoroscopesIndex /> },
      { path: 'horoscopes/:sign', element: <HoroscopeSignPage /> },
      { path: 'tarot/cards', element: <TarotCardsOverview /> },
      { path: 'tarot/cards/all', element: <TarotCardsAll /> },
      { path: 'tarot/cards/:category', element: <TarotCategorySection /> },
      { path: 'tarot/:slug', element: <TarotArticlePage /> },
      { path: 'privacy', element: <PrivacyPolicy /> },
      { path: 'terms', element: <TermsOfService /> },
      { path: 'cookies', element: <CookiePolicy /> },
      { path: 'faq', element: <FAQ /> },
      { path: 'about', element: <AboutUs /> },
      { path: 'how-credits-work', element: <HowCreditsWork /> },

      // Payment results (no auth required to view)
      { path: 'payment/success', element: <PaymentResult type="success" /> },
      { path: 'payment/cancelled', element: <PaymentResult type="cancelled" /> },

      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile', element: <UserProfile /> },
          { path: 'reading/:id', element: <ReadingView /> },
          {
            path: 'reading',
            children: [
              { index: true, element: <Navigate to="select-spread" replace /> },
              { path: 'select-spread', element: <SpreadSelector /> },
              { path: 'question', element: <QuestionInput /> },
              { path: 'draw-cards', element: <CardDrawing /> },
              { path: 'reveal', element: <RevealingPhase /> },
              { path: 'result', element: <ReadingResult /> },
            ],
          },
        ],
      },

      // Admin routes
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminOverview /> },
              { path: 'users', element: <AdminUsers /> },
              { path: 'transactions', element: <AdminTransactions /> },
              { path: 'analytics', element: <AdminAnalytics /> },
              { path: 'packages', element: <AdminPackages /> },
              { path: 'email-templates', element: <AdminEmailTemplates /> },
              { path: 'translations', element: <AdminTranslations /> },
              { path: 'settings', element: <AdminSettings /> },
              { path: 'health', element: <AdminHealth /> },
              // Blog CMS
              { path: 'blog', element: <AdminBlog /> },
              { path: 'blog/new', element: <BlogPostEditor /> },
              { path: 'blog/:id/edit', element: <BlogPostEditor /> },
              { path: 'blog/categories', element: <AdminBlogCategories /> },
              { path: 'blog/tags', element: <AdminBlogTags /> },
              { path: 'blog/trash', element: <AdminBlogTrash /> },
              // Tarot CMS
              { path: 'tarot-articles', element: <AdminTarotArticles /> },
              { path: 'tarot-articles/new', element: <TarotArticleEditor /> },
              { path: 'tarot-articles/:id/edit', element: <TarotArticleEditor /> },
              { path: 'tarot-articles/categories', element: <AdminTarotCategories /> },
              { path: 'tarot-articles/tags', element: <AdminTarotTags /> },
              { path: 'tarot-articles/trash', element: <AdminTarotTrash /> },
            ],
          },
        ],
      },

      // 404 fallback
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
```

**Step 2: Commit**
```bash
git add routes/index.tsx
git commit -m "feat: complete route configuration"
```

---

### Task 19: Update App.tsx

**Files:**
- Modify: `App.tsx`

**Step 1: Replace entire App with RouterProvider**

```typescript
import { RouterProvider } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { HelmetProvider } from 'react-helmet-async';
import { AppProvider } from './context/AppContext';
import { ReadingProvider } from './context/ReadingContext';
import { router } from './routes';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <HelmetProvider>
        <AppProvider>
          <ReadingProvider>
            <RouterProvider router={router} />
          </ReadingProvider>
        </AppProvider>
      </HelmetProvider>
    </ClerkProvider>
  );
}
```

**Step 2: Commit**
```bash
git add App.tsx
git commit -m "refactor: replace SPA routing with React Router"
```

---

## Phase 7: Cleanup

### Task 20: Delete SmartLink and Unused Code

**Files:**
- Delete: `components/SmartLink.tsx`
- Modify: Any remaining files with SmartLink imports

**Step 1: Find remaining SmartLink usages**
```bash
grep -r "SmartLink" --include="*.tsx" --include="*.ts" .
```

**Step 2: Remove all usages and delete file**

**Step 3: Commit**
```bash
git rm components/SmartLink.tsx
git add .
git commit -m "chore: remove SmartLink and legacy SPA navigation"
```

---

### Task 21: Update Documentation

**Files:**
- Modify: `ARCHITECTURE.md`
- Modify: `CLAUDE.md`

**Step 1: Update ARCHITECTURE.md routing section**

```markdown
### Routing (React Router v6)
The app uses React Router v6 for navigation:
- Route configuration in `routes/index.tsx`
- Route constants in `routes/routes.ts`
- `<Link>` components for all navigation (real `<a>` tags)
- Protected routes via `ProtectedRoute` and `AdminRoute` guards
- Lazy loading for code splitting
```

**Step 2: Commit**
```bash
git add ARCHITECTURE.md CLAUDE.md
git commit -m "docs: update routing documentation for React Router"
```

---

### Task 22: Final Testing

**Manual Testing Checklist:**

- [ ] All nav links work
- [ ] Cmd+click opens new tab
- [ ] Ctrl+click opens new tab
- [ ] Middle-click opens new tab
- [ ] Back button works everywhere
- [ ] Forward button works
- [ ] Direct URL access works for all routes
- [ ] Admin tabs are bookmarkable
- [ ] Blog/article lists are clickable
- [ ] Reading flow steps work
- [ ] Reading flow back/forward works
- [ ] New reading link resets properly
- [ ] API not called twice on back/forward
- [ ] Reading history still worksomial
- [ ] 404 redirects to home

**Step 1: Run dev server and test**
```bash
npm run dev
```

**Step 2: Final commit**
```bash
git add .
git commit -m "test: verify all routes working correctly"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-4 | Foundation: install router, create configs, layouts, guards |
| 2 | 5 | Reading Context for flow state |
| 3 | 6-9 | Convert navigation components (Header, SubNav, Footer, Breadcrumb) |
| 4 | 10-13 | Convert page components (Blog, Tarot, Horoscopes, Info) |
| 5 | 14-17 | Admin routes with navigation and layouts |
| 6 | 18-19 | Wire up all routes, update App.tsx |
| 7 | 20-22 | Cleanup and documentation |

**Total: 22 tasks**
