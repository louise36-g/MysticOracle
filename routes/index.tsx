import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, useRouteError, isRouteErrorResponse, Navigate, useParams } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { ROUTES } from './routes';
import { RootLayout } from '../components/layout/RootLayout';
import { LanguageLayout } from '../components/layout/LanguageLayout';
import { ProtectedRoute } from '../components/routing/ProtectedRoute';
import { AdminRoute } from '../components/routing/AdminRoute';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Lazy-load heavy components to reduce main bundle
const AdminLayout = lazy(() => import('../components/admin/AdminLayout'));
const HomePage = lazy(() => import('../components/HomePage'));
const SignUpPage = lazy(() => import('../components/auth/SignUpPage'));
const SignInPage = lazy(() => import('../components/auth/SignInPage'));

// Minimal loading fallback — pages load fast so this rarely shows
const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
  </div>
);

// Error boundary for route errors
// Outside app context, so use browser language directly
const isFr = () => navigator.language.startsWith('fr');

function RouteErrorBoundary() {
  const error = useRouteError();
  console.error('Route error:', error);
  const fr = isFr();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-8xl font-heading text-purple-500/30 mb-4">{error.status}</div>
          <h1 className="text-3xl font-heading text-white mb-4">{error.statusText}</h1>
          <p className="text-slate-400 mb-6">{error.data || (fr ? 'Une erreur est survenue' : 'Something went wrong')}</p>
          <a
            href={ROUTES.HOME}
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            {fr ? 'Accueil' : 'Go Home'}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-8xl font-heading text-red-500/30 mb-4">{fr ? 'Erreur' : 'Error'}</div>
        <h1 className="text-3xl font-heading text-white mb-4">{fr ? 'Une erreur est survenue' : 'Something went wrong'}</h1>
        <p className="text-slate-400 mb-6">
          {error instanceof Error ? error.message : (fr ? 'Une erreur inattendue est survenue' : 'An unexpected error occurred')}
        </p>
        <a
          href={ROUTES.HOME}
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          {fr ? 'Accueil' : 'Go Home'}
        </a>
      </div>
    </div>
  );
}

// Lazy wrapper with per-route error boundary
const lazyLoad = (importFn: () => Promise<{ default: React.ComponentType }>) => {
  const Component = lazy(importFn);
  return (
    <ErrorBoundary compact>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
};

// Lazy-loaded ActiveReading for Reading Layout
const ActiveReading = lazy(() => import('../components/ActiveReading'));

// 404 Not Found Component
const NotFound = () => {
  // Log for debugging - helps identify when routes aren't matching
  if (import.meta.env.DEV) {
    console.warn('[Router] 404 - No route matched for:', window.location.pathname);
  }

  const fr = isFr();
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-8xl font-heading text-purple-500/30 mb-4">404</div>
        <h1 className="text-3xl font-heading text-white mb-4">{fr ? 'Page introuvable' : 'Page Not Found'}</h1>
        <p className="text-slate-400 mb-6">
          {fr ? 'La page que vous recherchez n\'existe pas ou a été déplacée.' : 'The page you\'re looking for doesn\'t exist or has been moved.'}
        </p>
        <a
          href={ROUTES.HOME}
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          {fr ? 'Accueil' : 'Go Home'}
        </a>
      </div>
    </div>
  );
};

// Reading Layout with error boundary (ReadingProvider is now at app level in index.tsx)
const ReadingLayout = () => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <ActiveReading />
    </Suspense>
  </ErrorBoundary>
);

// Lazy-loaded TarotArticlePage (preserves previewId prop)
const LazyTarotArticlePage = lazy(() => import('../components/TarotArticlePage'));

// Wrapper to pass URL :id param as previewId prop to TarotArticlePage
const TarotArticlePreview = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense fallback={<PageLoader />}>
      <LazyTarotArticlePage previewId={id} />
    </Suspense>
  );
};

// Lazy-loaded BlogPost (preserves previewId prop)
const LazyBlogPost = lazy(() => import('../components/blog/BlogPost'));

// Wrapper to pass URL :id param as previewId prop to BlogPost
const BlogPostPreview = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense fallback={<PageLoader />}>
      <LazyBlogPost previewId={id} />
    </Suspense>
  );
};

// Redirect component for legacy /tarot/articles/:slug URLs to /tarot/:slug
const TarotArticleRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/tarot/${slug}`} replace />;
};

// =====================
// Public route definitions (shared between English and French)
// =====================
function publicRoutes(): RouteObject[] {
  return [
    { path: '/', element: lazyLoad(() => import('../components/HomePage')) },

    // Blog
    { path: '/blog', element: lazyLoad(() => import('../components/blog/BlogList')) },
    { path: '/blog/:slug', element: lazyLoad(() => import('../components/blog/BlogPost')) },

    // Tarot cards
    { path: '/tarot/cards', element: lazyLoad(() => import('../components/tarot/TarotCardsOverview')) },
    { path: '/tarot/cards/all', element: lazyLoad(() => import('../components/tarot/TarotCardsOverview')) },
    { path: '/tarot/cards/:category', element: lazyLoad(() => import('../components/tarot/TarotCardsOverview')) },
    { path: '/tarot/cards/:category/:card', element: lazyLoad(() => import('../components/TarotArticlePage')) },
    { path: '/tarot/:slug', element: lazyLoad(() => import('../components/TarotArticlePage')) },
    { path: '/tarot/articles/:slug', element: <TarotArticleRedirect /> },

    // Daily Tarot, Yes/No & Horoscopes
    { path: '/daily-tarot', element: lazyLoad(() => import('../components/DailyTarotEnergy')) },
    { path: '/yes-no', element: lazyLoad(() => import('../components/YesNoReading')) },
    { path: '/horoscopes', element: lazyLoad(() => import('../components/HoroscopeReading')) },

    // Legal
    { path: '/privacy', element: lazyLoad(() => import('../components/legal/PrivacyPolicy')) },
    { path: '/terms', element: lazyLoad(() => import('../components/legal/TermsOfService')) },
    { path: '/cookies', element: lazyLoad(() => import('../components/legal/CookiePolicy')) },
    { path: '/withdrawal', element: lazyLoad(() => import('../components/legal/WithdrawalForm')) },

    // Info
    { path: '/faq', element: lazyLoad(() => import('../components/FAQ')) },
    { path: '/about', element: lazyLoad(() => import('../components/AboutUs')) },
    { path: '/how-credits-work', element: lazyLoad(() => import('../components/HowCreditsWork')) },
    { path: '/contact', element: lazyLoad(() => import('../components/Contact')) },

    // Payment results
    { path: '/payment/success', element: lazyLoad(() => import('../components/PaymentResult')) },
    { path: '/payment/cancelled', element: lazyLoad(() => import('../components/PaymentResult')) },

    // Reading selector (public)
    { path: '/tarot-card-reading', element: lazyLoad(() => import('../components/CategorySelector')) },
  ];
}

// Protected route children (shared between English and French)
function protectedRouteChildren() {
  return [
    { path: '/profile', element: lazyLoad(() => import('../components/UserProfile')) },
    { path: '/interpret', element: lazyLoad(() => import('../components/interpret/InterpretMyCards')) },
    { path: '/tarot-card-reading/:category/:depth', element: <ReadingLayout /> },
    { path: '/tarot-card-reading/birth-cards/reveal', element: lazyLoad(() => import('../components/reading/BirthCardReveal')) },
    { path: '/tarot-card-reading/birth-cards/:depth', element: lazyLoad(() => import('../components/reading/BirthCardEntry')) },
    { path: '/tarot-card-reading/view/:id', element: lazyLoad(() => import('../components/UserProfile')) },
  ];
}

// Convert absolute paths to relative (for /fr prefix children)
function relativize(routes: RouteObject[]): RouteObject[] {
  return routes.map(r => ({
    ...r,
    path: r.path === '/' ? '' : r.path?.replace(/^\//, ''),
  }));
}

export const router = createBrowserRouter(
  [
    // Auth routes - OUTSIDE RootLayout to avoid re-renders.
    {
      path: '/sign-up',
      element: <Suspense fallback={<PageLoader />}><SignUpPage /></Suspense>,
    },
    {
      path: '/sign-in',
      element: <Suspense fallback={<PageLoader />}><SignInPage /></Suspense>,
    },

    // =====================
    // English routes (no prefix)
    // =====================
    {
      element: <LanguageLayout lang="en" />,
      children: [{
        element: <RootLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          ...publicRoutes(),

          // Protected Routes
          { element: <ProtectedRoute />, children: protectedRouteChildren() },

          // Admin Routes (English only)
          {
            element: <AdminRoute />,
            children: [
              {
                element: <Suspense fallback={<PageLoader />}><AdminLayout /></Suspense>,
                errorElement: <RouteErrorBoundary />,
                children: [
                  { path: ROUTES.ADMIN, element: lazyLoad(() => import('../components/admin/AdminOverview')) },
                  { path: ROUTES.ADMIN_USERS, element: lazyLoad(() => import('../components/admin/AdminUsers')) },
                  { path: ROUTES.ADMIN_TRANSACTIONS, element: lazyLoad(() => import('../components/admin/AdminTransactions')) },
                  { path: ROUTES.ADMIN_ANALYTICS, element: lazyLoad(() => import('../components/admin/AdminAnalytics')) },
                  { path: ROUTES.ADMIN_PACKAGES, element: lazyLoad(() => import('../components/admin/AdminPackages')) },
                  { path: ROUTES.ADMIN_EMAIL_TEMPLATES, element: lazyLoad(() => import('../components/admin/AdminEmailTemplates')) },
                  { path: ROUTES.ADMIN_TRANSLATIONS, element: lazyLoad(() => import('../components/admin/AdminTranslations')) },
                  { path: ROUTES.ADMIN_SETTINGS, element: lazyLoad(() => import('../components/admin/AdminSettings')) },
                  { path: ROUTES.ADMIN_HEALTH, element: lazyLoad(() => import('../components/admin/AdminHealth')) },
                  { path: ROUTES.ADMIN_ACCOUNTING, element: lazyLoad(() => import('../components/admin/AdminAccounting')) },
                  { path: ROUTES.ADMIN_PROMPTS, element: lazyLoad(() => import('../components/admin/AdminPrompts')) },
                  { path: ROUTES.ADMIN_BLOG, element: lazyLoad(() => import('../components/admin/AdminBlog')) },
                  { path: ROUTES.ADMIN_BLOG_NEW, element: lazyLoad(() => import('../components/admin/BlogPostEditor')) },
                  { path: ROUTES.ADMIN_BLOG_EDIT, element: lazyLoad(() => import('../components/admin/BlogPostEditor')) },
                  { path: ROUTES.ADMIN_BLOG_CATEGORIES, element: lazyLoad(() => import('../components/admin/AdminBlog')) },
                  { path: ROUTES.ADMIN_BLOG_TAGS, element: lazyLoad(() => import('../components/admin/AdminBlog')) },
                  { path: ROUTES.ADMIN_BLOG_MEDIA, element: lazyLoad(() => import('../components/admin/AdminBlog')) },
                  { path: ROUTES.ADMIN_BLOG_TRASH, element: lazyLoad(() => import('../components/admin/AdminBlog')) },
                  { path: ROUTES.ADMIN_TAROT, element: <Navigate to={ROUTES.ADMIN_BLOG} replace /> },
                  { path: ROUTES.ADMIN_TAROT_NEW, element: lazyLoad(() => import('../components/admin/TarotArticleEditor')) },
                  { path: ROUTES.ADMIN_TAROT_EDIT, element: lazyLoad(() => import('../components/admin/TarotArticleEditor')) },
                  { path: ROUTES.ADMIN_TAROT_CATEGORIES, element: <Navigate to={ROUTES.ADMIN_BLOG} replace /> },
                  { path: ROUTES.ADMIN_TAROT_TAGS, element: <Navigate to={ROUTES.ADMIN_BLOG} replace /> },
                  { path: ROUTES.ADMIN_TAROT_TRASH, element: <Navigate to={ROUTES.ADMIN_BLOG} replace /> },
                ],
              },
              { path: ROUTES.ADMIN_TAROT_PREVIEW, element: <TarotArticlePreview /> },
              { path: ROUTES.ADMIN_BLOG_PREVIEW, element: <BlogPostPreview /> },
            ],
          },

          { path: '*', element: <NotFound /> },
        ],
      }],
    },

    // =====================
    // French routes (/fr prefix)
    // =====================
    {
      path: '/fr',
      element: <LanguageLayout lang="fr" />,
      children: [{
        element: <RootLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          ...relativize(publicRoutes()),
          { element: <ProtectedRoute />, children: relativize(protectedRouteChildren()) },
          { path: '*', element: <NotFound /> },
        ],
      }],
    },
  ]
);
