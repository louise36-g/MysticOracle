import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useSpendingLimits } from '../context/SpendingLimitsContext';
import SpendingLimitsSettings from './SpendingLimitsSettings';
import { ROUTES } from '../routes/routes';
import {
  Coins,
  X,
  Sparkles,
  Shield,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  CreditPackage,
  fetchCreditPackages,
  createStripeCheckout,
  redirectToStripeCheckout,
  createPayPalOrder,
} from '../services/paymentService';
import { trackCreditShopOpen } from '../utils/analytics';
import BreakReminderModal from './credit-shop/BreakReminderModal';
import PackageGrid from './credit-shop/PackageGrid';
import QuickBuySection, { QUICK_BUY_PRICE_PER_CREDIT } from './credit-shop/QuickBuySection';
import PaymentSection from './credit-shop/PaymentSection';

// Low balance threshold
const LOW_BALANCE_THRESHOLD = 5;

interface CreditShopProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreditShop: React.FC<CreditShopProps> = ({ isOpen, onClose }) => {
  const { language, user, t } = useApp();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const {
    canSpend,
    recordPurchase,
    shouldShowBreakReminder,
    dismissBreakReminder,
    getLimitStatus,
  } = useSpendingLimits();

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [packagesLoaded, setPackagesLoaded] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'stripe_link' | 'paypal' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [spendingWarning, setSpendingWarning] = useState<string | null>(null);
  const [showSpendingLimits, setShowSpendingLimits] = useState(false);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{ method: 'stripe' | 'stripe_link' | 'paypal' } | null>(null);
  const [selectedQuickBuy, setSelectedQuickBuy] = useState<number | null>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Track when credit shop opens
  useEffect(() => {
    if (isOpen) {
      trackCreditShopOpen('modal');
    }
  }, [isOpen]);

  // Unified selection for payment section
  const currentSelection = useMemo(() => {
    if (selectedQuickBuy) {
      return {
        type: 'quick' as const,
        credits: selectedQuickBuy,
        priceEur: selectedQuickBuy * QUICK_BUY_PRICE_PER_CREDIT,
        packageId: `quick-${selectedQuickBuy}`,
        name: `${selectedQuickBuy} Credit${selectedQuickBuy > 1 ? 's' : ''}`,
      };
    }
    if (selectedPackage) {
      return {
        type: 'package' as const,
        credits: selectedPackage.credits,
        priceEur: selectedPackage.priceEur,
        packageId: selectedPackage.id,
        name: selectedPackage.nameEn,
      };
    }
    return null;
  }, [selectedQuickBuy, selectedPackage]);

  // Handle package selection with auto-scroll to payment inside modal
  const handleSelectPackage = useCallback((pkg: CreditPackage) => {
    setSelectedQuickBuy(null);
    setSelectedPackage(pkg);
    // Scroll to payment section within the modal after animation settles
    setTimeout(() => {
      if (paymentSectionRef.current && modalContentRef.current) {
        const modal = modalContentRef.current;
        const paymentSection = paymentSectionRef.current;
        const paymentTop = paymentSection.offsetTop - 100; // Offset for header
        const startTop = modal.scrollTop;
        const distance = paymentTop - startTop;
        const duration = 800; // Slower scroll duration in ms
        const startTime = performance.now();

        // Custom smooth scroll with easing
        const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutQuart(progress);

          modal.scrollTop = startTop + (distance * eased);

          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };

        requestAnimationFrame(animateScroll);
      }
    }, 300);
  }, []);

  const handleSelectQuickBuy = useCallback((credits: number) => {
    setSelectedQuickBuy(credits);
    setSelectedPackage(null);
    // Scroll to payment section
    setTimeout(() => {
      if (paymentSectionRef.current && modalContentRef.current) {
        const modal = modalContentRef.current;
        const paymentSection = paymentSectionRef.current;
        const paymentTop = paymentSection.offsetTop - 100;
        modal.scrollTo({ top: paymentTop, behavior: 'smooth' });
      }
    }, 300);
  }, []);

  // Low balance detection
  const hasLowBalance = useMemo(() => {
    return (user?.credits ?? 0) <= LOW_BALANCE_THRESHOLD;
  }, [user?.credits]);

  // Calculate best value package (lowest price per credit)
  const bestValuePackageId = useMemo(() => {
    if (packages.length === 0) return null;
    return packages.reduce((best, pkg) => {
      const bestPricePerCredit = best.priceEur / best.credits;
      const currentPricePerCredit = pkg.priceEur / pkg.credits;
      return currentPricePerCredit < bestPricePerCredit ? pkg : best;
    }, packages[0]).id;
  }, [packages]);

  // Load packages only when modal is opened (not on mount - saves 3.5s from critical path)
  useEffect(() => {
    if (!isOpen || packagesLoaded) return;
    fetchCreditPackages()
      .then(setPackages)
      .catch((err) => console.warn('[CreditShop] Failed to load packages:', err))
      .finally(() => setPackagesLoaded(true));
  }, [isOpen, packagesLoaded]);

  // Show break reminder when needed
  useEffect(() => {
    if (shouldShowBreakReminder && isOpen) {
      setShowBreakReminder(true);
    }
  }, [shouldShowBreakReminder, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Check spending limits before checkout
  const checkSpendingLimits = useCallback((amount: number): boolean => {
    const result = canSpend(amount);
    if (!result.allowed) {
      setError(result.reason || t('CreditShop.tsx.CreditShop.purchase_not_allowed', 'Purchase not allowed'));
      return false;
    }
    if (result.warningLevel === 'soft' && result.reason) {
      setSpendingWarning(result.reason);
    }
    return true;
  }, [canSpend, language]);

  // Handle Stripe checkout
  const handleStripeCheckout = useCallback(async (useLink: boolean) => {
    if (!currentSelection) return;

    // Check spending limits first
    if (!checkSpendingLimits(currentSelection.priceEur)) {
      return;
    }

    setLoading(true);
    setError(null);
    setPaymentMethod(useLink ? 'stripe_link' : 'stripe');

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      // Record the purchase attempt
      recordPurchase(currentSelection.priceEur, currentSelection.name);

      const { url } = await createStripeCheckout(token, currentSelection.packageId, useLink);
      if (url) {
        redirectToStripeCheckout(url);
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Stripe checkout error:', err);
      const message = err instanceof Error ? err.message : 'Payment failed';
      if (message === 'Failed to fetch') {
        setError(t('CreditShop.tsx.CreditShop.unable_to_connect', 'Unable to connect to payment server. Please check your connection and try again.'));
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
      setPaymentMethod(null);
    }
  }, [currentSelection, getToken, checkSpendingLimits, recordPurchase, t]);

  // Handle PayPal checkout
  const handlePayPalCheckout = useCallback(async () => {
    if (!currentSelection) return;

    // Check spending limits first
    if (!checkSpendingLimits(currentSelection.priceEur)) {
      return;
    }

    setLoading(true);
    setError(null);
    setPaymentMethod('paypal');

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      // Record the purchase attempt
      recordPurchase(currentSelection.priceEur, currentSelection.name);

      const { approvalUrl } = await createPayPalOrder(token, currentSelection.packageId);
      if (approvalUrl) {
        window.location.href = approvalUrl;
      } else {
        throw new Error('No approval URL received');
      }
    } catch (err) {
      console.error('PayPal checkout error:', err);
      const message = err instanceof Error ? err.message : 'Payment failed';
      if (message === 'Failed to fetch') {
        setError(t('CreditShop.tsx.CreditShop.unable_to_connect', 'Unable to connect to payment server. Please check your connection and try again.'));
      } else {
        setError(message);
      }
      setLoading(false);
      setPaymentMethod(null);
    }
  }, [currentSelection, getToken, checkSpendingLimits, recordPurchase, t]);

  if (!isOpen) return null;

  // Use portal to render modal at body level for proper centering
  const modalContent = createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          ref={modalContentRef}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl scroll-smooth"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-purple-600 rounded-full flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-heading text-white">
                {t('CreditShop.tsx.CreditShop.credit_shop', 'Credit Shop')}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSpendingLimits(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white text-sm border border-slate-600"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">{t('CreditShop.tsx.CreditShop.limits', 'Limits')}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error message - sticky at top */}
          {error && (
            <div className="sticky top-[64px] z-10 mx-4 mt-3 p-3 bg-red-900/90 border border-red-500/50 rounded-lg text-red-200 text-sm backdrop-blur-sm shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center">
                  <X className="w-3 h-3 text-red-300" />
                </div>
                <div>
                  <p className="font-medium text-red-100">
                    {t('CreditShop.tsx.CreditShop.payment_error', 'Payment Error')}
                  </p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Spending limit warning (soft) */}
          {spendingWarning && !error && (
            <div className="mx-6 mt-4 p-4 bg-amber-900/50 border border-amber-500/30 rounded-lg text-amber-200 text-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-100">
                    {t('CreditShop.tsx.CreditShop.spending_reminder', 'Spending Reminder')}
                  </p>
                  <p className="mt-1">{spendingWarning}</p>
                  <button
                    onClick={() => setShowSpendingLimits(true)}
                    className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline"
                  >
                    {t('CreditShop.tsx.CreditShop.manage_spending_limits', 'Manage spending limits')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">

            {/* Low Balance Nudge */}
            {hasLowBalance && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-slate-800/50 border border-purple-500/30 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">
                      {t('CreditShop.tsx.CreditShop.you_have_credits', 'You have {{credits}} credits remaining. Top up to continue your mystical journey!', { credits: user?.credits ?? 0 })}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <QuickBuySection
              selectedQuickBuy={selectedQuickBuy}
              onSelectQuickBuy={handleSelectQuickBuy}
              t={t}
            />

            {/* Package Selection */}
            <PackageGrid
              packages={packages}
              packagesLoaded={packagesLoaded}
              selectedPackageId={selectedPackage?.id ?? null}
              bestValuePackageId={bestValuePackageId}
              language={language}
              onSelectPackage={handleSelectPackage}
              t={t}
            />

            {/* Payment Methods Section */}
            <div ref={paymentSectionRef} className="mt-6 pt-6 border-t border-purple-500/20">
              <PaymentSection
                currentSelection={currentSelection}
                loading={loading}
                paymentMethod={paymentMethod}
                onStripeCheckout={() => handleStripeCheckout(false)}
                onPayPalCheckout={handlePayPalCheckout}
                t={t}
              />
            </div>

            {/* Benefits */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="text-slate-400">
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                  <p className="text-xs">
                    {t('CreditShop.tsx.CreditShop.instant_delivery', 'Instant delivery')}
                  </p>
                </div>
                <div className="text-slate-400">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-green-400" />
                  <p className="text-xs">
                    {t('CreditShop.tsx.CreditShop.secure_payment', 'Secure payment')}
                  </p>
                </div>
                <div className="text-slate-400">
                  <Coins className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <p className="text-xs">
                    {t('CreditShop.tsx.CreditShop.no_expiration', 'No expiration')}
                  </p>
                </div>
              </div>

              {/* How credits work link */}
              <div className="text-center mt-4">
                <Link
                  to={ROUTES.HOW_CREDITS_WORK}
                  onClick={onClose}
                  className="text-sm text-slate-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                >
                  {t('CreditShop.tsx.CreditShop.how_do_credits', 'How do credits work?')}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Break Reminder Modal */}
        <BreakReminderModal
          isOpen={showBreakReminder}
          onDismiss={() => {
            setShowBreakReminder(false);
            dismissBreakReminder();
          }}
          onSetLimits={() => {
            setShowBreakReminder(false);
            dismissBreakReminder();
            setShowSpendingLimits(true);
          }}
          t={t}
        />
      </motion.div>
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      {modalContent}
      <SpendingLimitsSettings
        isOpen={showSpendingLimits}
        onClose={() => setShowSpendingLimits(false)}
      />
    </>
  );
};

export default memo(CreditShop);
