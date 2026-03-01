import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import Header from '../Header';
import SubNav from '../SubNav';
import Footer from '../Footer';
import CookieConsent from '../CookieConsent';
import WelcomeModal from '../WelcomeModal';
import CreditShop from '../CreditShop';
import { DailyBonusPopup } from '../rewards';
import ErrorBoundary from '../ui/ErrorBoundary';
import Button from '../Button';
import { useApp } from '../../context/AppContext';
import { trackPageView } from '../../utils/analytics';
import { Coins, AlertTriangle, X } from 'lucide-react';
import PWAUpdatePrompt from '../PWAUpdatePrompt';

// Low credits threshold
const LOW_CREDITS_WARNING_THRESHOLD = 5;

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
  const { user, refreshUser, t } = useApp();
  const location = useLocation();

  // Track page views on route changes (only if user consented to analytics)
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  // Capture ?ref= referral code from URL and store in localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');
    if (refCode) {
      localStorage.setItem('celestiarcana-referral-code', refCode.toUpperCase());
      // Clean the URL by removing the ref param
      params.delete('ref');
      const newSearch = params.toString();
      const newUrl = location.pathname + (newSearch ? `?${newSearch}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search]);

  // Modal states
  const [showCreditShop, setShowCreditShop] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showDailyBonusPopup, setShowDailyBonusPopup] = useState(false);
  const [showLowCreditsModal, setShowLowCreditsModal] = useState(false);
  const [hasShownLowCreditsWarning, setHasShownLowCreditsWarning] = useState(false);
  const [hasCheckedDailyBonus, setHasCheckedDailyBonus] = useState(false);

  // Check for low credits and show warning (once per session, not for brand new users)
  useEffect(() => {
    if (user && !user.welcomeCompleted) return;

    const hasShownLowCreditsThisSession = sessionStorage.getItem('low_credits_warning_shown');
    if (user && user.credits <= LOW_CREDITS_WARNING_THRESHOLD && user.credits > 0 && !hasShownLowCreditsWarning && !hasShownLowCreditsThisSession) {
      setShowLowCreditsModal(true);
      setHasShownLowCreditsWarning(true);
      sessionStorage.setItem('low_credits_warning_shown', 'true');
    }
  }, [user?.credits, user?.welcomeCompleted, hasShownLowCreditsWarning]);

  // Show welcome modal for new users (once per session, not on auth pages)
  useEffect(() => {
    const isAuthPage = location.pathname.startsWith('/sign-up') || location.pathname.startsWith('/sign-in');
    if (isAuthPage) return;

    const hasShownWelcomeThisSession = sessionStorage.getItem('welcome_modal_shown');
    if (user && !user.welcomeCompleted && user.totalReadings === 0 && !hasShownWelcomeThisSession) {
      setShowWelcomeModal(true);
      sessionStorage.setItem('welcome_modal_shown', 'true');
    }
  }, [user, location.pathname]);

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

    // Mark as checked immediately to prevent re-runs during this session
    setHasCheckedDailyBonus(true);
    sessionStorage.setItem('daily_bonus_checked_today', today);

    // Check if user can claim daily bonus (different calendar day, matching backend logic)
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    const now = new Date();

    if (!lastLogin) {
      // Never claimed before
      setShowDailyBonusPopup(true);
    } else {
      // Check if it's a different calendar day (matching backend logic)
      const todayDate = new Date(now);
      todayDate.setHours(0, 0, 0, 0);
      const lastLoginDay = new Date(lastLogin);
      lastLoginDay.setHours(0, 0, 0, 0);

      if (todayDate.getTime() !== lastLoginDay.getTime()) {
        setShowDailyBonusPopup(true);
      }
    }
  }, [user, hasCheckedDailyBonus, showWelcomeModal]);

  const handleBuyCredits = () => {
    setShowLowCreditsModal(false);
    setShowCreditShop(true);
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen text-slate-200 selection:bg-purple-500/30 relative overflow-hidden flex flex-col">
      {/* Cosmic Background Image */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `image-set(url("/background-celestiarcana.avif") type("image/avif"), url("/background-celestiarcana.webp") type("image/webp"), url("/background-celestiarcana.png") type("image/png"))`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <Header />
      <SubNav />
      <main className="relative z-10 flex-grow">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <CookieConsent />

      {/* Scroll Restoration for React Router */}
      <ScrollRestoration />

      {/* PWA Update Prompt */}
      <PWAUpdatePrompt />

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onOpenCreditShop={() => setShowCreditShop(true)}
        onRefreshUser={refreshUser}
        credits={user?.credits ?? 3}
      />

      {/* Credit Shop Modal */}
      <CreditShop isOpen={showCreditShop} onClose={() => setShowCreditShop(false)} />

      {/* Daily Bonus Popup */}
      <DailyBonusPopup isOpen={showDailyBonusPopup} onClose={() => setShowDailyBonusPopup(false)} />

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
                className="absolute top-3 right-3 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
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
    </MotionConfig>
  );
}
