import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from './routes';
import { RootLayout } from '../components/layout/RootLayout';
import { ProtectedRoute } from '../components/routing/ProtectedRoute';
import { AdminRoute } from '../components/routing/AdminRoute';
import AdminLayout from '../components/admin/AdminLayout';
// Loading fallback for lazy components
const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-purple-300/70 text-sm">Loading...</p>
    </div>
  </div>
);

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
const NotFound = () => (
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

// Reading Layout (ReadingProvider is now at app level in index.tsx)
const ReadingLayout = () => (
  <Suspense fallback={<PageLoader />}>
    <ActiveReading />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    // Root layout wraps all public routes
    element: <RootLayout />,
    children: [
      // =====================
      // Public Routes
      // =====================
      {
        path: ROUTES.HOME,
        element: lazyLoad(() => import('../components/HomePage')),
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

      // Horoscope routes
      {
        path: ROUTES.HOROSCOPES,
        element: lazyLoad(() => import('../components/horoscopes/HoroscopesIndex')),
      },
      {
        path: ROUTES.HOROSCOPE_SIGN,
        element: lazyLoad(() => import('../components/horoscopes/HoroscopeSignPage')),
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

          // Reading - spread selector
          {
            path: ROUTES.READING,
            element: lazyLoad(() => import('../components/SpreadSelector')),
          },
          // Reading with specific spread type (e.g., /reading/single, /reading/three-card)
          {
            path: ROUTES.READING_SPREAD,
            element: <ReadingLayout />,
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
]);
