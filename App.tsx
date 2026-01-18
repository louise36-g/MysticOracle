import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useUser, SignInButton } from '@clerk/clerk-react';
import Header from './components/Header';
import ReadingModeSelector from './components/ReadingModeSelector';
import SpreadSelector from './components/SpreadSelector';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import ErrorBoundary from './components/ui/ErrorBoundary';
import WelcomeModal from './components/WelcomeModal';
import CreditShop from './components/CreditShop';
import Breadcrumb from './components/Breadcrumb';
import SubNav from './components/SubNav';
import { DailyBonusPopup } from './components/rewards';
import { useApp } from './context/AppContext';
import { SpreadConfig, InterpretationStyle, SpreadType } from './types';
import { CategoryType, CATEGORY_CONFIG } from './components/tarot';
import { SPREADS } from './constants';
import Button from './components/Button';
import { Star, Shield, Zap, Coins, X, AlertTriangle } from 'lucide-react';

// Lazy-loaded components for code splitting
// Core reading components (loaded when user starts a reading)
const ActiveReading = lazy(() => import('./components/ActiveReading'));
const HoroscopeReading = lazy(() => import('./components/HoroscopeReading'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const PaymentResult = lazy(() => import('./components/PaymentResult'));

// Admin components
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

// Legal pages
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/legal/TermsOfService'));
const CookiePolicy = lazy(() => import('./components/legal/CookiePolicy'));

// Content pages
const BlogList = lazy(() => import('./components/blog/BlogList'));
const BlogPostView = lazy(() => import('./components/blog/BlogPost'));
const TarotArticlesList = lazy(() => import('./components/TarotArticlesList'));
const TarotArticlePage = lazy(() => import('./components/TarotArticlePage'));
const TarotCardsOverview = lazy(() => import('./components/tarot/TarotCardsOverview'));
const HowCreditsWork = lazy(() => import('./components/HowCreditsWork'));
const FAQ = lazy(() => import('./components/FAQ'));
const AboutUs = lazy(() => import('./components/AboutUs'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-purple-300/70 text-sm">Loading...</p>
    </div>
  </div>
);
import { motion, AnimatePresence } from 'framer-motion';

// Low credits threshold
const LOW_CREDITS_WARNING_THRESHOLD = 5;

const App: React.FC = () => {
  const { user, isLoading, language, refreshUser, t } = useApp();
  const { isSignedIn, isLoaded: clerkLoaded } = useUser();
  const [currentView, setCurrentView] = useState('home');
  const [selectedSpread, setSelectedSpread] = useState<SpreadConfig | null>(null);
  const [readingMode, setReadingMode] = useState<string | null>(null);
  const [blogSlug, setBlogSlug] = useState<string | null>(null);
  const [blogPreviewId, setBlogPreviewId] = useState<string | null>(null);
  const [blogCategory, setBlogCategory] = useState<string | null>(null);
  const [blogTag, setBlogTag] = useState<string | null>(null);
  const [tarotArticleSlug, setTarotArticleSlug] = useState<string | null>(null);
  const [tarotPreviewId, setTarotPreviewId] = useState<string | null>(null);
  const [tarotCardsCategory, setTarotCardsCategory] = useState<string | null>(null);

  // Modal states
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [showLowCreditsModal, setShowLowCreditsModal] = useState(false);
  const [showCreditShop, setShowCreditShop] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showDailyBonusPopup, setShowDailyBonusPopup] = useState(false);
  const [pendingSpread, setPendingSpread] = useState<SpreadConfig | null>(null);
  const [hasShownLowCreditsWarning, setHasShownLowCreditsWarning] = useState(false);
  const [hasCheckedDailyBonus, setHasCheckedDailyBonus] = useState(false);

  // Check if user is admin (from AppContext or default false)
  const isAdmin = user?.isAdmin || false;

  // Handle initial URL path routing
  useEffect(() => {
    // Normalize path by removing trailing slash (except for root)
    const rawPath = window.location.pathname;
    const path = rawPath === '/' ? '/' : rawPath.replace(/\/$/, '');

    // Payment callbacks
    if (path === '/payment/success') {
      setCurrentView('payment-success');
      window.history.replaceState({ view: 'payment-success' }, '', '/payment/success');
    } else if (path === '/payment/cancelled') {
      setCurrentView('payment-cancelled');
      window.history.replaceState({ view: 'payment-cancelled' }, '', '/payment/cancelled');
    }
    // Admin
    else if (path === '/admin') {
      setCurrentView('admin');
      window.history.replaceState({ view: 'admin' }, '', '/admin');
    }
    // Profile
    else if (path === '/profile') {
      setCurrentView('profile');
      window.history.replaceState({ view: 'profile' }, '', '/profile');
    }
    // Legal pages
    else if (path === '/privacy') {
      setCurrentView('privacy');
      window.history.replaceState({ view: 'privacy' }, '', '/privacy');
    } else if (path === '/terms') {
      setCurrentView('terms');
      window.history.replaceState({ view: 'terms' }, '', '/terms');
    } else if (path === '/cookies') {
      setCurrentView('cookies');
      window.history.replaceState({ view: 'cookies' }, '', '/cookies');
    }
    // How Credits Work
    else if (path === '/how-credits-work') {
      setCurrentView('how-credits-work');
      window.history.replaceState({ view: 'how-credits-work' }, '', '/how-credits-work');
    }
    // FAQ
    else if (path === '/faq') {
      setCurrentView('faq');
      window.history.replaceState({ view: 'faq' }, '', '/faq');
    }
    // About Us
    else if (path === '/about') {
      setCurrentView('about');
      window.history.replaceState({ view: 'about' }, '', '/about');
    }
    // Tarot articles list - redirect to /tarot/cards/all
    else if (path === '/tarot-articles') {
      setCurrentView('tarot-cards-all');
      window.history.replaceState({ view: 'tarot-cards-all' }, '', '/tarot/cards/all');
    }
    // Admin tarot article preview
    else if (path.startsWith('/admin/tarot/preview/')) {
      const id = path.replace('/admin/tarot/preview/', '');
      setCurrentView('tarot-preview');
      setTarotPreviewId(id);
      window.history.replaceState({ view: 'tarot-preview', tarotPreviewId: id }, '', path);
    }
    // Tarot article pages
    else if (path.startsWith('/tarot/articles/')) {
      const slug = path.replace('/tarot/articles/', '');
      setCurrentView('tarot-article');
      setTarotArticleSlug(slug);
      window.history.replaceState({ view: 'tarot-article', tarotArticleSlug: slug }, '', path);
    }
    // Tarot Cards pages
    else if (path === '/tarot/cards') {
      setCurrentView('tarot-cards');
      window.history.replaceState({ view: 'tarot-cards' }, '', '/tarot/cards');
    }
    else if (path === '/tarot/cards/all') {
      setCurrentView('tarot-cards-all');
      window.history.replaceState({ view: 'tarot-cards-all' }, '', '/tarot/cards/all');
    }
    else if (path.startsWith('/tarot/cards/')) {
      const category = path.replace('/tarot/cards/', '');
      setCurrentView('tarot-cards-category');
      setTarotCardsCategory(category);
      window.history.replaceState({ view: 'tarot-cards-category', tarotCardsCategory: category }, '', path);
    }
    // Reading modes
    else if (path === '/tarot' || path.startsWith('/tarot/')) {
      setReadingMode('tarot');
      // Check if path contains a spread slug (e.g., /tarot/single-card)
      const spreadSlug = path.replace('/tarot/', '').replace('/tarot', '');
      if (spreadSlug && spreadSlug !== '' && spreadSlug !== '/') {
        // Find spread by matching the slug with nameEn
        const spread = Object.values(SPREADS).find(s =>
          s.nameEn.toLowerCase().replace(/\s+/g, '-') === spreadSlug
        );
        if (spread) {
          setSelectedSpread(spread);
          setCurrentView('reading');
          window.history.replaceState({ view: 'reading', readingMode: 'tarot', selectedSpread: spread }, '', path);
        } else {
          window.history.replaceState({ view: 'home', readingMode: 'tarot' }, '', path);
        }
      } else {
        window.history.replaceState({ view: 'home', readingMode: 'tarot' }, '', path);
      }
    } else if (path === '/horoscope') {
      setReadingMode('horoscope');
      window.history.replaceState({ view: 'home', readingMode: 'horoscope' }, '', '/horoscope');
    } else if (path === '/oracle') {
      setReadingMode('oracle');
      window.history.replaceState({ view: 'home', readingMode: 'oracle' }, '', '/oracle');
    }
    // Blog pages
    else if (path === '/blog') {
      setCurrentView('blog');
      window.history.replaceState({ view: 'blog' }, '', '/blog');
    } else if (path.startsWith('/blog/preview/')) {
      const id = path.replace('/blog/preview/', '');
      setCurrentView('blog-preview');
      setBlogPreviewId(id);
      window.history.replaceState({ view: 'blog-preview', blogPreviewId: id }, '', path);
    } else if (path.startsWith('/blog/')) {
      const slug = path.replace('/blog/', '');
      setCurrentView('blog-post');
      setBlogSlug(slug);
      window.history.replaceState({ view: 'blog-post', blogSlug: slug }, '', path);
    }
  }, []);

  // Browser history management - handle back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state) {
        setCurrentView(state.view || 'home');
        setReadingMode(state.readingMode || null);
        setSelectedSpread(state.selectedSpread || null);
        setBlogSlug(state.blogSlug || null);
        setBlogPreviewId(state.blogPreviewId || null);
        setBlogCategory(state.blogCategory || null);
        setBlogTag(state.blogTag || null);
        setTarotArticleSlug(state.tarotArticleSlug || null);
        setTarotCardsCategory(state.tarotCardsCategory || null);
      } else {
        // No state means we're at the initial page
        setCurrentView('home');
        setReadingMode(null);
        setSelectedSpread(null);
        setBlogSlug(null);
        setBlogPreviewId(null);
        setBlogCategory(null);
        setBlogTag(null);
        setTarotArticleSlug(null);
        setTarotCardsCategory(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Set initial state
    if (!window.history.state) {
      window.history.replaceState({ view: 'home', readingMode: null }, '', window.location.pathname);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Scroll to top whenever the view or reading mode changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, readingMode]);

  // Check for low credits and show warning (once per session)
  useEffect(() => {
    const hasShownLowCreditsThisSession = sessionStorage.getItem('low_credits_warning_shown');
    if (user && user.credits <= LOW_CREDITS_WARNING_THRESHOLD && user.credits > 0 && !hasShownLowCreditsWarning && !hasShownLowCreditsThisSession) {
      setShowLowCreditsModal(true);
      setHasShownLowCreditsWarning(true);
      sessionStorage.setItem('low_credits_warning_shown', 'true');
    }
  }, [user?.credits, hasShownLowCreditsWarning]);

  // Show welcome modal for new users (once per session)
  useEffect(() => {
    const hasShownWelcomeThisSession = sessionStorage.getItem('welcome_modal_shown');
    if (user && !user.welcomeCompleted && user.totalReadings === 0 && !hasShownWelcomeThisSession) {
      setShowWelcomeModal(true);
      sessionStorage.setItem('welcome_modal_shown', 'true');
    }
  }, [user]);

  // Check for daily bonus eligibility
  useEffect(() => {
    if (!user || hasCheckedDailyBonus || showWelcomeModal) return;

    // Check sessionStorage to prevent showing multiple times in the same session
    const sessionClaimCheck = sessionStorage.getItem('daily_bonus_checked_today');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    if (sessionClaimCheck === today) {
      setHasCheckedDailyBonus(true);
      return;
    }

    // Check if user can claim daily bonus (different calendar day, matching backend logic)
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    const now = new Date();

    if (!lastLogin) {
      // Never claimed before
      setShowDailyBonusPopup(true);
      setHasCheckedDailyBonus(true);
      sessionStorage.setItem('daily_bonus_checked_today', today);
    } else {
      // Check if it's a different calendar day (matching backend logic)
      const todayDate = new Date(now);
      todayDate.setHours(0, 0, 0, 0);
      const lastLoginDay = new Date(lastLogin);
      lastLoginDay.setHours(0, 0, 0, 0);

      if (todayDate.getTime() !== lastLoginDay.getTime()) {
        setShowDailyBonusPopup(true);
        sessionStorage.setItem('daily_bonus_checked_today', today);
      }
      setHasCheckedDailyBonus(true);
    }
  }, [user, hasCheckedDailyBonus, showWelcomeModal]);

  const handleReadingFinish = useCallback(() => {
    setSelectedSpread(null);
    setCurrentView('home');
    setReadingMode('tarot');
    window.history.pushState({ view: 'home', readingMode: 'tarot' }, '', '/tarot');
  }, []);

  const handleReadingModeSelect = (mode: string) => {
    setCurrentView('home');
    setReadingMode(mode);
    setSelectedSpread(null);
    const url = mode === 'tarot' ? '/tarot' : mode === 'horoscope' ? '/horoscope' : `/${mode}`;
    window.history.pushState({ view: 'home', readingMode: mode }, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearReadingMode = () => {
    setSelectedSpread(null);
    // Stay in tarot mode, just go back to spread selector
    setReadingMode('tarot');
    setCurrentView('home');
    window.history.pushState({ view: 'home', readingMode: 'tarot' }, '', '/tarot');
  };

  const handleNavigate = (view: string) => {
    window.scrollTo(0, 0);

    // Handle special navigation cases
    if (view === 'tarot') {
      // Navigate to tarot spread selector
      setCurrentView('home');
      setReadingMode('tarot');
      setSelectedSpread(null);
      window.history.pushState({ view: 'home', readingMode: 'tarot' }, '', '/tarot');
      return;
    }

    setCurrentView(view);

    // Push state to history for back button support
    // Handle special URL patterns that don't match simple /${view}
    let url: string;
    if (view === 'home') {
      url = '/';
    } else if (view === 'tarot-cards') {
      url = '/tarot/cards';
    } else if (view === 'tarot-cards-all') {
      url = '/tarot/cards/all';
    } else {
      url = `/${view}`;
    }
    window.history.pushState({ view, readingMode: view === 'home' ? null : readingMode }, '', url);

    if (view === 'home') {
      setReadingMode(null);
      setSelectedSpread(null);
    }

    // Reset blog state when navigating away from blog
    if (view === 'blog') {
      setBlogSlug(null);
      setBlogCategory(null);
      setBlogTag(null);
    }
  }

  const handleSpreadSelect = useCallback((spread: SpreadConfig) => {
    if (!user) return;

    if (user.credits >= spread.cost) {
      setSelectedSpread(spread);
      setCurrentView('reading');
      // Create URL-friendly spread name
      const spreadSlug = spread.nameEn.toLowerCase().replace(/\s+/g, '-');
      window.history.pushState({ view: 'reading', readingMode: 'tarot', selectedSpread: spread }, '', `/tarot/${spreadSlug}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Show no credits modal instead of alert
      setPendingSpread(spread);
      setShowNoCreditsModal(true);
    }
  }, [user]);

  // Navigate and clear URL path - MUST be before early return to follow Rules of Hooks
  const handlePaymentNavigate = useCallback((view: string) => {
    window.history.pushState({ view }, '', '/');
    setCurrentView(view);
  }, []);

  const handleBuyCredits = useCallback(() => {
    setShowNoCreditsModal(false);
    setShowLowCreditsModal(false);
    setShowCreditShop(true);
  }, []);

  // Blog navigation handlers
  const handleNavigateToBlog = useCallback(() => {
    setCurrentView('blog');
    setBlogSlug(null);
    setBlogCategory(null);
    setBlogTag(null);
    window.history.pushState({ view: 'blog' }, '', '/blog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateToBlogPost = useCallback((slug: string) => {
    setCurrentView('blog-post');
    setBlogSlug(slug);
    window.history.pushState({ view: 'blog-post', blogSlug: slug }, '', `/blog/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBlogCategoryClick = useCallback((categorySlug: string) => {
    setCurrentView('blog');
    setBlogSlug(null);
    setBlogCategory(categorySlug);
    setBlogTag(null);
    window.history.pushState({ view: 'blog', blogCategory: categorySlug }, '', `/blog?category=${categorySlug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBlogTagClick = useCallback((tagSlug: string) => {
    setCurrentView('blog');
    setBlogSlug(null);
    setBlogCategory(null);
    setBlogTag(tagSlug);
    window.history.pushState({ view: 'blog', blogTag: tagSlug }, '', `/blog?tag=${tagSlug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Tarot Cards navigation handlers
  const handleNavigateToTarotCards = useCallback(() => {
    setCurrentView('tarot-cards');
    window.history.pushState({ view: 'tarot-cards' }, '', '/tarot/cards');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateToTarotCardsAll = useCallback(() => {
    setCurrentView('tarot-cards-all');
    window.history.pushState({ view: 'tarot-cards-all' }, '', '/tarot/cards/all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateToTarotCardsCategory = useCallback((category: CategoryType) => {
    const slug = CATEGORY_CONFIG[category].slug;
    setCurrentView('tarot-cards-category');
    setTarotCardsCategory(slug);
    window.history.pushState({ view: 'tarot-cards-category', tarotCardsCategory: slug }, '', `/tarot/cards/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTarotCardClick = useCallback((slug: string) => {
    setTarotArticleSlug(slug);
    setCurrentView('tarot-article');
    window.history.pushState({ view: 'tarot-article', tarotArticleSlug: slug }, '', `/tarot/articles/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Generic path navigation handler for internal links
  const handleNavigateToPath = useCallback((path: string) => {
    // Handle tarot article pages
    if (path.startsWith('/tarot/articles/')) {
      const slug = path.replace('/tarot/articles/', '');
      handleTarotCardClick(slug);
    }
    // Handle blog post pages
    else if (path.startsWith('/blog/') && !path.includes('?')) {
      const slug = path.replace('/blog/', '');
      handleNavigateToBlogPost(slug);
    }
    // Handle blog category pages
    else if (path.startsWith('/blog?category=')) {
      const categorySlug = path.split('category=')[1].split('&')[0];
      handleBlogCategoryClick(categorySlug);
    }
    // Handle blog tag pages
    else if (path.startsWith('/blog?tag=')) {
      const tagSlug = path.split('tag=')[1].split('&')[0];
      handleBlogTagClick(tagSlug);
    }
    // Handle other known paths
    else {
      // For other paths, use pushState and let the path handling useEffect take care of it
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [handleTarotCardClick, handleNavigateToBlogPost, handleBlogCategoryClick, handleBlogTagClick]);

  // Show branded loading screen while Clerk initializes
  if (!clerkLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0c29] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-amber-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Logo/Brand */}
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-purple-300 mb-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            MysticOracle
          </h1>

          {/* Animated tarot cards - sequential bounce */}
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-[46px] h-20 rounded-lg bg-gradient-to-br from-purple-800 to-indigo-900 border border-amber-500/40 shadow-lg"
                style={{
                  animation: 'bounce 1s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>

        </div>
      </div>
    );
  }

  const renderContent = () => {
    // 1. Payment Result Pages
    if (currentView === 'payment-success') {
      return <PaymentResult type="success" onNavigate={handlePaymentNavigate} />;
    }
    if (currentView === 'payment-cancelled') {
      return <PaymentResult type="cancelled" onNavigate={handlePaymentNavigate} />;
    }

    // 2. Profile View (requires Clerk sign-in)
    if (isSignedIn && currentView === 'profile') {
        return <UserProfile />;
    }

    // 3. Admin View (requires sign-in + admin flag)
    if (isSignedIn && isAdmin && currentView === 'admin') {
        return <AdminDashboard />;
    }

    // 3b. Admin route but not authorized - show 403
    if (currentView === 'admin') {
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
                {t('app.App.access_denied_description', 'You do not have permission to access this page. This area is restricted to administrators only.')}
              </p>
              {!isSignedIn && (
                <SignInButton mode="modal">
                  <Button variant="primary">
                    {t('app.App.sign_in', 'Sign In')}
                  </Button>
                </SignInButton>
              )}
              {isSignedIn && (
                <Button variant="outline" onClick={() => handleNavigate('home')}>
                  {t('app.App.go_home', 'Go Home')}
                </Button>
              )}
            </div>
          </div>
        );
    }

    // 4. Legal Pages (accessible to all)
    if (currentView === 'privacy') {
        return <PrivacyPolicy />;
    }
    if (currentView === 'terms') {
        return <TermsOfService />;
    }
    if (currentView === 'cookies') {
        return <CookiePolicy />;
    }

    // 5. How Credits Work (accessible to all)
    if (currentView === 'how-credits-work') {
        return (
          <HowCreditsWork
            onNavigate={handleNavigate}
            onOpenCreditShop={() => setShowCreditShop(true)}
          />
        );
    }

    // 6. FAQ (accessible to all)
    if (currentView === 'faq') {
        return <FAQ onNavigate={handleNavigate} />;
    }

    // 6b. About Us (accessible to all)
    if (currentView === 'about') {
        return <AboutUs onNavigate={handleNavigate} onNavigateToTarot={() => handleReadingModeSelect('tarot')} />;
    }

    // 7. Blog Pages (accessible to all)
    if (currentView === 'blog') {
        return (
          <BlogList
            onNavigateToPost={handleNavigateToBlogPost}
            initialCategory={blogCategory || undefined}
            initialTag={blogTag || undefined}
          />
        );
    }
    if (currentView === 'blog-post' && blogSlug) {
        return (
          <BlogPostView
            slug={blogSlug}
            onBack={handleNavigateToBlog}
            onNavigateToPost={handleNavigateToBlogPost}
            onCategoryClick={handleBlogCategoryClick}
            onTagClick={handleBlogTagClick}
          />
        );
    }

    // 8. Single Tarot Article view
    if (currentView === 'tarot-article' && tarotArticleSlug) {
        return (
          <TarotArticlePage
            slug={tarotArticleSlug}
            onBack={() => handleNavigate('tarot-cards-all')}
            onNavigate={handleNavigateToPath}
          />
        );
    }
    // 8b. Tarot Article Preview (admin only)
    if (currentView === 'tarot-preview' && tarotPreviewId) {
        return (
          <TarotArticlePage
            previewId={tarotPreviewId}
            onBack={() => handleNavigate('admin')}
            onNavigate={handleNavigateToPath}
          />
        );
    }
    // 7b. Blog Preview (admin only)
    if (currentView === 'blog-preview' && blogPreviewId) {
        return (
          <BlogPostView
            previewId={blogPreviewId}
            onBack={handleNavigateToBlog}
            onNavigateToPost={handleNavigateToBlogPost}
            onCategoryClick={handleBlogCategoryClick}
            onTagClick={handleBlogTagClick}
          />
        );
    }

    // 9. Tarot Cards Overview
    if (currentView === 'tarot-cards') {
      return (
        <TarotCardsOverview
          onCardClick={handleTarotCardClick}
          onViewAllCards={handleNavigateToTarotCardsAll}
          onViewCategory={handleNavigateToTarotCardsCategory}
        />
      );
    }

    // 9b. Tarot Cards All (uses existing TarotArticlesList)
    if (currentView === 'tarot-cards-all') {
      return (
        <TarotArticlesList
          onArticleClick={handleTarotCardClick}
        />
      );
    }

    // 9c. Tarot Cards Category (uses existing TarotArticlesList)
    if (currentView === 'tarot-cards-category' && tarotCardsCategory) {
      return (
        <TarotArticlesList
          onArticleClick={handleTarotCardClick}
          defaultCategory={tarotCardsCategory}
        />
      );
    }

    // 6. Active Reading View
    if (currentView === 'reading' && selectedSpread) {
      return (
        <ErrorBoundary>
          <ActiveReading
            key={selectedSpread.id}
            spread={selectedSpread}
            style={InterpretationStyle.CLASSIC}
            onFinish={handleReadingFinish}
          />
        </ErrorBoundary>
      );
    }

    // 6. Home / Dashboard View
    return (
      <div className="pb-20 relative z-10">
        {/* Hero Section - Only show on home (no readingMode selected) */}
        {!readingMode && (
          <div className="relative py-20 px-4 text-center overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

            <h1 className="text-5xl md:text-7xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-purple-300 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              MysticOracle
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              {language === 'en'
                ? 'Unveil the secrets of your destiny through the ancient wisdom of Tarot, guided by artificial intelligence.'
                : 'Dévoilez les secrets de votre destin grâce à la sagesse ancienne du Tarot, guidée par l\'intelligence artificielle.'}
            </p>

            {!user && (
              <SignInButton mode="modal">
                <Button size="lg">
                  {t('app.App.start_your_reading', 'Start Your Reading')}
                </Button>
              </SignInButton>
            )}
          </div>
        )}

        {/* Feature Highlights (Only for non-authenticated) */}
        {!user && (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 mb-20">
            <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
               <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400"><Star /></div>
               <h3 className="text-xl font-heading text-purple-200 mb-2">
                 {t('app.App.ai_powered_insights', 'AI Powered Insights')}
               </h3>
               <p className="text-slate-400 text-sm">
                 {t('app.App.deep_contextaware_interpretations', 'Deep, context-aware interpretations powered by AI.')}
               </p>
            </div>
            <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
               <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400"><Shield /></div>
               <h3 className="text-xl font-heading text-purple-200 mb-2">
                 {t('app.App.private_secure', 'Private & Secure')}
               </h3>
               <p className="text-slate-400 text-sm">
                 {t('app.App.your_spiritual_journey_is_personal', 'Your spiritual journey is personal. We respect your privacy.')}
               </p>
            </div>
            <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
               <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400"><Zap /></div>
               <h3 className="text-xl font-heading text-purple-200 mb-2">
                 {t('app.App.instant_clarity', 'Instant Clarity')}
               </h3>
               <p className="text-slate-400 text-sm">
                 {t('app.App.get_answers_to_lifes_pressing_questions', 'Get answers to life\'s pressing questions in seconds.')}
               </p>
            </div>
          </div>
        )}

        {/* Reading Mode Selector (Only if logged in) */}
        {user && currentView === 'home' && !readingMode && (
           <ReadingModeSelector onSelect={handleReadingModeSelect} />
        )}

        {/* Tarot Spread Selector */}
        {user && currentView === 'home' && readingMode === 'tarot' && (
           <SpreadSelector onSelect={handleSpreadSelect} />
        )}

        {/* Horoscope Reading */}
        {user && currentView === 'home' && readingMode === 'horoscope' && (
           <HoroscopeReading />
        )}

        {/* Oracle Placeholder */}
        {user && currentView === 'home' && readingMode === 'oracle' && (
           <div className="text-center p-8 text-purple-300">
             {t('app.App.oracle_reading_coming_soon', 'Oracle Reading Coming Soon...')}
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0c29] text-slate-200 selection:bg-purple-500/30 relative overflow-hidden flex flex-col">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
         {/* Deep Midnight Blue Base */}
         <div className="absolute inset-0 bg-[#0f0c29]"></div>
         {/* Radial Gradients for "Mystical" Atmosphere */}
         <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-purple-900/20 to-transparent"></div>
         <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-[radial-gradient(circle,_rgba(88,28,135,0.2)_0%,_transparent_70%)] blur-3xl"></div>
         <div className="absolute bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-[radial-gradient(circle,_rgba(251,191,36,0.05)_0%,_transparent_70%)] blur-3xl"></div>
         {/* Subtle Noise Texture */}
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      </div>

      <Header onNavigate={handleNavigate} currentView={currentView} />
      <SubNav
        onNavigate={handleNavigate}
        onSelectSpread={handleSpreadSelect}
        onSelectReadingMode={handleReadingModeSelect}
        currentView={currentView}
        readingMode={readingMode}
      />
      <Breadcrumb
        currentView={currentView}
        readingMode={readingMode}
        selectedSpread={selectedSpread}
        onNavigate={handleNavigate}
        onClearReadingMode={handleClearReadingMode}
      />
      <main className="relative z-10 flex-grow">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            {renderContent()}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer onNavigate={handleNavigate} />
      <CookieConsent onNavigate={handleNavigate} />
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onNavigateToReading={() => handleReadingModeSelect('tarot')}
        onOpenCreditShop={() => setShowCreditShop(true)}
        onNavigateToCreditsInfo={() => handleNavigate('how-credits-work')}
        onRefreshUser={refreshUser}
        credits={user?.credits ?? 3}
      />

      {/* Credit Shop Modal */}
      <CreditShop isOpen={showCreditShop} onClose={() => setShowCreditShop(false)} onNavigate={handleNavigate} />

      {/* Daily Bonus Popup */}
      <DailyBonusPopup isOpen={showDailyBonusPopup} onClose={() => setShowDailyBonusPopup(false)} />

      {/* No Credits Modal */}
      <AnimatePresence>
        {showNoCreditsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowNoCreditsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Coins className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-heading text-white mb-2">
                  {t('app.App.not_enough_credits', 'Not Enough Credits')}
                </h3>
                <p className="text-slate-400 mb-2">
                  {t('app.App.spread_requires_credits', `This spread requires ${pendingSpread?.cost} credits.`)}
                </p>
                <p className="text-slate-500 text-sm mb-6">
                  {t('app.App.credits_remaining', `You have ${user?.credits ?? 0} credits remaining.`)}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowNoCreditsModal(false)}
                  >
                    {t('app.App.cancel', 'Cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleBuyCredits}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    {t('app.App.buy_credits', 'Buy Credits')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Low Credits Warning Modal */}
      <AnimatePresence>
        {showLowCreditsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowLowCreditsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowLowCreditsModal(false)}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-heading text-white mb-2">
                  {t('app.App.running_low_on_credits', 'Running Low on Credits')}
                </h3>
                <p className="text-slate-400 mb-6">
                  {t('app.App.only_credits_left', `You only have ${user?.credits ?? 0} credits left. Top up now to continue your mystical journey without interruption.`)}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowLowCreditsModal(false)}
                  >
                    {t('app.App.later', 'Later')}
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleBuyCredits}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    {t('app.App.buy_credits', 'Buy Credits')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
