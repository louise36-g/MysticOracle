import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useSpendingLimits } from '../context/SpendingLimitsContext';
import Button from './Button';
import SpendingLimitsSettings from './SpendingLimitsSettings';
import { ROUTES } from '../routes/routes';
import {
  Coins,
  CreditCard,
  X,
  Check,
  Sparkles,
  Shield,
  Zap,
  Loader2,
  AlertTriangle,
  Coffee,
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

// PayPal icon component
const PayPalIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
  </svg>
);

// Quick-buy options: 1-5 credits at €0.50 each
const QUICK_BUY_OPTIONS = [1, 2, 3, 4, 5] as const;
const QUICK_BUY_PRICE_PER_CREDIT = 0.50;

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

  // Load packages on mount
  useEffect(() => {
    fetchCreditPackages().then(setPackages);
  }, []);

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

  // Get badge color based on type
  const getBadgeStyles = (badge: string | null) => {
    switch (badge) {
      case 'popular':
        return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'value':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'enthusiast':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default:
        return 'bg-slate-600';
    }
  };

  // Transform package labels for display
  const getDisplayLabel = (label: string): string => {
    // Map database labels to display labels
    const labelMap: Record<string, Record<string, string>> = {
      en: {
        'Most Savings': 'Good Value',
        'Ultimate Pack': 'Best Value',
      },
      fr: {
        "Plus d'économies": 'Bonne affaire',
        'Pack Ultime': 'Le plus avantageux',
      },
    };
    return labelMap[language]?.[label] || label;
  };

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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white text-sm border border-slate-600"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">{t('CreditShop.tsx.CreditShop.limits', 'Limits')}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
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
                      {t('CreditShop.tsx.CreditShop.you_have_credits', `You have ${user?.credits ?? 0} credits remaining. Top up to continue your mystical journey!`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Buy Section */}
            <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-medium text-slate-200">
                  {t('CreditShop.tsx.CreditShop.quick_buy', 'Quick Buy')}
                </h3>
                <span className="text-xs text-slate-400">
                  {t('CreditShop.tsx.CreditShop.price_per_credit', '€0.50 per credit')}
                </span>
              </div>
              <div className="flex gap-2">
                {QUICK_BUY_OPTIONS.map((credits) => {
                  const isSelected = selectedQuickBuy === credits;
                  const price = (credits * QUICK_BUY_PRICE_PER_CREDIT).toFixed(2);
                  return (
                    <button
                      key={credits}
                      onClick={() => handleSelectQuickBuy(credits)}
                      className={`flex-1 py-3 px-2 rounded-lg border-2 transition-all text-center ${
                        isSelected
                          ? 'border-amber-400 bg-amber-900/30 shadow-lg shadow-amber-500/20'
                          : 'border-slate-600 bg-slate-800/50 hover:border-purple-500/50'
                      }`}
                    >
                      <div className="text-xl font-bold text-white">{credits}</div>
                      <div className={`text-xs ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                        €{price}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Better Value Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                {t('CreditShop.tsx.CreditShop.better_value', 'Better Value')}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            </div>

            {/* Package Selection - Custom Layout: 2 small on top, 3 larger below */}
            <div className="space-y-4 mb-6">
              {/* First row: 2 smaller starter packages */}
              <div className="grid grid-cols-2 gap-3">
                {packages.slice(0, 2).map((pkg, index) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  const label = language === 'en' ? pkg.labelEn : pkg.labelFr;
                  const isBestValue = pkg.id === bestValuePackageId;
                  const isStarter = index === 0;

                  return (
                    <motion.button
                      key={pkg.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-amber-400 bg-gradient-to-br from-amber-900/30 to-amber-800/20 shadow-lg shadow-amber-500/20'
                          : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'
                      }`}
                    >
                      {/* Badge row */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-wrap gap-1.5">
                          {isStarter && (
                            <span className="px-2 py-0.5 bg-slate-600 rounded text-xs font-bold text-white">
                              {t('CreditShop.tsx.CreditShop.starter', 'Starter')}
                            </span>
                          )}
                          {pkg.badge && (
                            <span className={`px-2 py-0.5 ${getBadgeStyles(pkg.badge)} rounded text-xs font-bold text-white`}>
                              {getDisplayLabel(label)}
                            </span>
                          )}
                          {pkg.discount > 0 && (
                            <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded text-xs font-medium text-green-400">
                              -{pkg.discount}%
                            </span>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-slate-900" />}
                        </div>
                      </div>

                      {/* Credits + Price inline */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Coins className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-purple-400'}`} />
                          <span className="text-2xl font-bold text-white">{pkg.credits}</span>
                          {pkg.bonusCredits && pkg.bonusCredits > 0 && (
                            <span className="text-lg font-bold text-green-400">+{pkg.bonusCredits}</span>
                          )}
                          <span className="text-xs text-slate-400">{t('CreditShop.tsx.CreditShop.credits', 'credits')}</span>
                        </div>
                        <p className={`text-xl font-bold ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                          €{pkg.priceEur.toFixed(2)}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Second row: 3 larger packages */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {packages.slice(2).map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  const label = language === 'en' ? pkg.labelEn : pkg.labelFr;
                  const name = language === 'en' ? pkg.nameEn : pkg.nameFr;
                  const isBestValue = pkg.id === bestValuePackageId;
                  const pricePerCredit = pkg.priceEur / pkg.credits;

                  return (
                    <motion.button
                      key={pkg.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-amber-400 bg-gradient-to-br from-amber-900/30 to-amber-800/20 shadow-lg shadow-amber-500/20'
                          : isBestValue
                          ? 'border-green-500/50 bg-slate-800/70 hover:border-green-400/70'
                          : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'
                      }`}
                    >
                      {/* Top row: Badge + Selection indicator */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {pkg.badge && (
                            <span className={`px-2 py-0.5 ${getBadgeStyles(pkg.badge)} rounded text-xs font-bold text-white`}>
                              {getDisplayLabel(label)}
                            </span>
                          )}
                          {isBestValue && !pkg.badge && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded text-xs font-bold text-white flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {t('CreditShop.tsx.CreditShop.best_value', 'Best Value')}
                            </span>
                          )}
                          {pkg.discount > 0 && (
                            <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded text-xs font-medium text-green-400">
                              -{pkg.discount}%
                            </span>
                          )}
                        </div>
                        {/* Selection check */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-slate-900" />}
                        </div>
                      </div>

                      {/* Credits display - prominent */}
                      <div className="flex items-center gap-2 mb-1">
                        <Coins className={`w-6 h-6 ${isSelected ? 'text-amber-400' : isBestValue ? 'text-green-400' : 'text-purple-400'}`} />
                        <span className="text-3xl font-bold text-white">{pkg.credits}</span>
                        {pkg.bonusCredits && pkg.bonusCredits > 0 && (
                          <span className="text-xl font-bold text-green-400">+{pkg.bonusCredits}</span>
                        )}
                        <span className="text-sm text-slate-400">{t('CreditShop.tsx.CreditShop.credits_2', 'credits')}</span>
                      </div>

                      {/* Package name */}
                      <p className="text-sm text-slate-400 mb-3">{name}</p>

                      {/* Price section */}
                      <div className="pt-3 border-t border-slate-700/50">
                        <div className="flex items-baseline justify-between">
                          <p className={`text-2xl font-bold ${isSelected ? 'text-amber-400' : isBestValue ? 'text-green-400' : 'text-white'}`}>
                            €{pkg.priceEur.toFixed(2)}
                          </p>
                          <span className="text-xs text-slate-500">
                            €{pricePerCredit.toFixed(2)}/{t('CreditShop.tsx.CreditShop.credit', 'credit')}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Payment Methods Section */}
            <div ref={paymentSectionRef} className="mt-6 pt-6 border-t border-purple-500/20">
              {currentSelection ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Section header with selected summary */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-heading text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-400" />
                      {t('CreditShop.tsx.CreditShop.complete_purchase', 'Complete Purchase')}
                    </h3>
                    <div className="flex items-center gap-2 bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-500/30">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-amber-300">{currentSelection.credits}</span>
                      <span className="text-amber-200/70 text-sm">
                        {t('CreditShop.tsx.CreditShop.credits_3', 'credits')}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {/* Credit Card */}
                    <motion.button
                      onClick={() => handleStripeCheckout(false)}
                      disabled={loading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex items-center justify-between p-4 bg-slate-800/70 border border-purple-500/30 rounded-xl hover:border-purple-400/60 transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white">
                            {t('CreditShop.tsx.CreditShop.credit_debit_card', 'Credit / Debit Card')}
                          </p>
                          <p className="text-sm text-slate-400">
                            Visa, Mastercard, Amex
                          </p>
                        </div>
                      </div>
                      {loading && paymentMethod === 'stripe' ? (
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                      ) : (
                        <span className="text-xl font-bold text-purple-300">€{currentSelection.priceEur.toFixed(2)}</span>
                      )}
                    </motion.button>

                    {/* PayPal */}
                    <motion.button
                      onClick={handlePayPalCheckout}
                      disabled={loading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex items-center justify-between p-4 bg-blue-900/30 border border-blue-500/30 rounded-xl hover:border-blue-400/60 transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <PayPalIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white">PayPal</p>
                          <p className="text-sm text-slate-400">
                            {t('CreditShop.tsx.CreditShop.pay_with_paypal', 'Pay with PayPal')}
                          </p>
                        </div>
                      </div>
                      {loading && paymentMethod === 'paypal' ? (
                        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                      ) : (
                        <span className="text-xl font-bold text-blue-300">€{currentSelection.priceEur.toFixed(2)}</span>
                      )}
                    </motion.button>
                  </div>

                  {/* Security note */}
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4">
                    <Shield className="w-4 h-4" />
                    <span>
                      {t('CreditShop.tsx.CreditShop.secure_payment_processed', 'Secure payment processed by Stripe & PayPal')}
                    </span>
                  </div>
                </motion.div>
              ) : (
                /* Prompt to select a package */
                <div className="text-center py-6 text-slate-400">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {t('CreditShop.tsx.CreditShop.select_a_credit', 'Select a credit package above to continue')}
                  </p>
                </div>
              )}
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
        <AnimatePresence>
          {showBreakReminder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80"
              onClick={() => {
                setShowBreakReminder(false);
                dismissBreakReminder();
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <Coffee className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-heading text-white mb-2">
                    {t('CreditShop.tsx.CreditShop.time_for_a', 'Time for a Break?')}
                  </h3>
                  <p className="text-slate-400 mb-6">
                    {t('CreditShop.tsx.CreditShop.youve_made_several', "You've made several purchases recently. Would you like to take a moment before continuing?")}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowBreakReminder(false);
                        dismissBreakReminder();
                        setShowSpendingLimits(true);
                      }}
                    >
                      {t('CreditShop.tsx.CreditShop.set_limits', 'Set Limits')}
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => {
                        setShowBreakReminder(false);
                        dismissBreakReminder();
                      }}
                    >
                      {t('CreditShop.tsx.CreditShop.continue', 'Continue')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
