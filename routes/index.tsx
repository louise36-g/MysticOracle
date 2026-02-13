import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, useRouteError, isRouteErrorResponse, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { ROUTES } from './routes';
import { RootLayout } from '../components/layout/RootLayout';
import { ProtectedRoute } from '../components/routing/ProtectedRoute';
import { AdminRoute } from '../components/routing/AdminRoute';
import AdminLayout from '../components/admin/AdminLayout';
import { SignUpPage, SignInPage } from '../components/auth';

// Card back component matching the shuffle phase design
const LoaderCardBack = ({ delay }: { delay: number }) => (
  <motion.div
    className="w-14 h-20 md:w-16 md:h-24 rounded-lg bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 shadow-xl border-2 border-amber-500/50"
    initial={{ y: 0, rotateY: 0 }}
    animate={{
      y: [0, -8, 0],
      rotateY: [0, 10, 0, -10, 0],
    }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <div className="w-full h-full flex items-center justify-center relative rounded-md overflow-hidden">
      {/* Inner border */}
      <div className="absolute inset-1 border border-amber-500/30 rounded-sm" />
      {/* Decorative pattern */}
      <div className="absolute inset-2">
        <div className="w-full h-full border border-purple-400/40 rounded-sm" />
        <div className="absolute inset-1 border border-purple-400/25 rounded-sm" />
      </div>
      {/* Center symbol */}
      <Moon className="w-5 h-5 md:w-6 md:h-6 text-amber-400/80" />
    </div>
  </motion.div>
);

// Loading fallback for lazy components - three animated cards
const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center">
      <div className="flex gap-2 md:gap-3 justify-center mb-4">
        <LoaderCardBack delay={0} />
        <LoaderCardBack delay={0.2} />
        <LoaderCardBack delay={0.4} />
      </div>
      <motion.p
        className="text-purple-300/70 text-sm"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Loading...
      </motion.p>
    </div>
  </div>
);

// Error boundary for route errors
function RouteErrorBoundary() {
  const error = useRouteError();
  console.error('Route error:', error);

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-8xl font-heading text-purple-500/30 mb-4">{error.status}</div>
          <h1 className="text-3xl font-heading text-white mb-4">{error.statusText}</h1>
          <p className="text-slate-400 mb-6">{error.data || 'Something went wrong'}</p>
          <a
            href={ROUTES.HOME}
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-8xl font-heading text-red-500/30 mb-4">Error</div>
        <h1 className="text-3xl font-heading text-white mb-4">Something went wrong</h1>
        <p className="text-slate-400 mb-6">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <a
          href={ROUTES.HOME}
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

// Lazy wrapper for cleaner code
const lazyLoad = (importFn: () => Promise<{ default: React.ComponentType }>) => {
  const Component = lazy(importFn);
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
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

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-8xl font-heading text-purple-500/30 mb-4">404</div>
        <h1 className="text-3xl font-heading text-white mb-4">Page Not Found</h1>
        <p className="text-slate-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href={ROUTES.HOME}
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
};

// Reading Layout (ReadingProvider is now at app level in index.tsx)
const ReadingLayout = () => (
  <Suspense fallback={<PageLoader />}>
    <ActiveReading />
  </Suspense>
);

// Redirect component for legacy /tarot/articles/:slug URLs to /tarot/:slug
const TarotArticleRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/tarot/${slug}`} replace />;
};

export const router = createBrowserRouter(
  [
    {
    // Root layout wraps all public routes
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // =====================
      // Public Routes
      // =====================
      {
        path: ROUTES.HOME,
        element: lazyLoad(() => import('../components/HomePage')),
      },

      // Auth routes (with wildcards for Clerk's multi-step flows)
      {
        path: '/sign-up/*',
        element: <SignUpPage />,
      },
      {
        path: '/sign-in/*',
        element: <SignInPage />,
      },

      // Blog routes
      {
        path: ROUTES.BLOG,
        element: lazyLoad(() => import('../components/blog/BlogList')),
      },
      {
        path: ROUTES.BLOG_POST,
        element: lazyLoad(() => import('../components/blog/BlogPost')),
      },

      // Tarot cards routes
      {
        path: ROUTES.TAROT_CARDS,
        element: lazyLoad(() => import('../components/tarot/TarotCardsOverview')),
      },
      {
        path: ROUTES.TAROT_CARDS_ALL,
        element: lazyLoad(() => import('../components/tarot/TarotCardsOverview')),
      },
      {
        path: ROUTES.TAROT_CARDS_CATEGORY,
        element: lazyLoad(() => import('../components/tarot/TarotCardsOverview')),
      },
      {
        path: ROUTES.TAROT_CARD,
        element: lazyLoad(() => import('../components/TarotArticlePage')),
      },
      {
        path: ROUTES.TAROT_ARTICLE,
        element: lazyLoad(() => import('../components/TarotArticlePage')),
      },
      // Legacy URL redirect: /tarot/articles/:slug -> /tarot/:slug
      {
        path: ROUTES.TAROT_ARTICLE_LEGACY,
        element: <TarotArticleRedirect />,
      },

      // Horoscope route - unified experience
      {
        path: ROUTES.HOROSCOPES,
        element: lazyLoad(() => import('../components/HoroscopeReading')),
      },

      // Legal routes
      {
        path: ROUTES.PRIVACY,
        element: lazyLoad(() => import('../components/legal/PrivacyPolicy')),
      },
      {
        path: ROUTES.TERMS,
        element: lazyLoad(() => import('../components/legal/TermsOfService')),
      },
      {
        path: ROUTES.COOKIES,
        element: lazyLoad(() => import('../components/legal/CookiePolicy')),
      },
      {
        path: ROUTES.WITHDRAWAL,
        element: lazyLoad(() => import('../components/legal/WithdrawalForm')),
      },

      // Info routes
      {
        path: ROUTES.FAQ,
        element: lazyLoad(() => import('../components/FAQ')),
      },
      {
        path: ROUTES.ABOUT,
        element: lazyLoad(() => import('../components/AboutUs')),
      },
      {
        path: ROUTES.HOW_CREDITS_WORK,
        element: lazyLoad(() => import('../components/HowCreditsWork')),
      },

      // Payment result routes
      {
        path: ROUTES.PAYMENT_SUCCESS,
        element: lazyLoad(() => import('../components/PaymentResult')),
      },
      {
        path: ROUTES.PAYMENT_CANCELLED,
        element: lazyLoad(() => import('../components/PaymentResult')),
      },

      // Reading - category selector (public, like horoscopes)
      {
        path: ROUTES.READING,
        element: lazyLoad(() => import('../components/CategorySelector')),
      },

      // =====================
      // Protected Routes (require authentication)
      // =====================
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: ROUTES.PROFILE,
            element: lazyLoad(() => import('../components/UserProfile')),
          },
          // Reading with category and depth
          {
            path: ROUTES.READING_CATEGORY_DEPTH,
            element: <ReadingLayout />,
          },
          // Birth card reveal/result (must be before :depth to ensure matching)
          {
            path: ROUTES.READING_BIRTH_CARDS_REVEAL,
            element: lazyLoad(() => import('../components/reading/BirthCardReveal')),
          },
          // Birth cards entry with depth parameter
          {
            path: ROUTES.READING_BIRTH_CARDS,
            element: lazyLoad(() => import('../components/reading/BirthCardEntry')),
          },
          // View saved reading
          {
            path: ROUTES.READING_VIEW,
            element: lazyLoad(() => import('../components/UserProfile')),
          },
        ],
      },

      // =====================
      // Admin Routes (require authentication + admin role)
      // =====================
      {
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              // Admin overview (index route)
              {
                path: ROUTES.ADMIN,
                element: lazyLoad(() => import('../components/admin/AdminOverview')),
              },
              {
                path: ROUTES.ADMIN_USERS,
                element: lazyLoad(() => import('../components/admin/AdminUsers')),
              },
              {
                path: ROUTES.ADMIN_TRANSACTIONS,
                element: lazyLoad(() => import('../components/admin/AdminTransactions')),
              },
              {
                path: ROUTES.ADMIN_ANALYTICS,
                element: lazyLoad(() => import('../components/admin/AdminAnalytics')),
              },
              {
                path: ROUTES.ADMIN_PACKAGES,
                element: lazyLoad(() => import('../components/admin/AdminPackages')),
              },
              {
                path: ROUTES.ADMIN_EMAIL_TEMPLATES,
                element: lazyLoad(() => import('../components/admin/AdminEmailTemplates')),
              },
              {
                path: ROUTES.ADMIN_TRANSLATIONS,
                element: lazyLoad(() => import('../components/admin/AdminTranslations')),
              },
              {
                path: ROUTES.ADMIN_SETTINGS,
                element: lazyLoad(() => import('../components/admin/AdminSettings')),
              },
              {
                path: ROUTES.ADMIN_HEALTH,
                element: lazyLoad(() => import('../components/admin/AdminHealth')),
              },
              {
                path: ROUTES.ADMIN_ACCOUNTING,
                element: lazyLoad(() => import('../components/admin/AdminAccounting')),
              },
              {
                path: ROUTES.ADMIN_PROMPTS,
                element: lazyLoad(() => import('../components/admin/AdminPrompts')),
              },

              // Admin Blog routes
              {
                path: ROUTES.ADMIN_BLOG,
                element: lazyLoad(() => import('../components/admin/AdminBlog')),
              },
              {
                path: ROUTES.ADMIN_BLOG_NEW,
                element: lazyLoad(() => import('../components/admin/BlogPostEditor')),
              },
              {
                path: ROUTES.ADMIN_BLOG_EDIT,
                element: lazyLoad(() => import('../components/admin/BlogPostEditor')),
              },
              {
                path: ROUTES.ADMIN_BLOG_CATEGORIES,
                element: lazyLoad(() => import('../components/admin/AdminBlog')),
              },
              {
                path: ROUTES.ADMIN_BLOG_TAGS,
                element: lazyLoad(() => import('../components/admin/AdminBlog')),
              },
              {
                path: ROUTES.ADMIN_BLOG_MEDIA,
                element: lazyLoad(() => import('../components/admin/AdminBlog')),
              },
              {
                path: ROUTES.ADMIN_BLOG_TRASH,
                element: lazyLoad(() => import('../components/admin/AdminBlog')),
              },

              // Admin Tarot Articles routes
              {
                path: ROUTES.ADMIN_TAROT,
                element: lazyLoad(() => import('../components/admin/AdminTarotArticles')),
              },
              {
                path: ROUTES.ADMIN_TAROT_NEW,
                element: lazyLoad(() => import('../components/admin/TarotArticleEditor')),
              },
              {
                path: ROUTES.ADMIN_TAROT_EDIT,
                element: lazyLoad(() => import('../components/admin/TarotArticleEditor')),
              },
              {
                path: ROUTES.ADMIN_TAROT_CATEGORIES,
                element: lazyLoad(() => import('../components/admin/AdminTarotArticles')),
              },
              {
                path: ROUTES.ADMIN_TAROT_TAGS,
                element: lazyLoad(() => import('../components/admin/AdminTarotArticles')),
              },
              {
                path: ROUTES.ADMIN_TAROT_TRASH,
                element: lazyLoad(() => import('../components/admin/AdminTarotArticles')),
              },
            ],
          },
        ],
      },

      // =====================
      // 404 Fallback
      // =====================
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]
);
