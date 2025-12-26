import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useSpendingLimits } from '../context/SpendingLimitsContext';
import Button from './Button';
import SpendingLimitsSettings from './SpendingLimitsSettings';
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
  Gift,
  Star,
  TrendingUp,
} from 'lucide-react';
import {
  CreditPackage,
  fetchCreditPackages,
  createStripeCheckout,
  redirectToStripeCheckout,
  createPayPalOrder,
} from '../services/paymentService';

// PayPal icon component
const PayPalIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
  </svg>
);

// Stripe Link icon
const StripeLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// First-purchase bonus configuration
const FIRST_PURCHASE_BONUS_PERCENT = 25; // 25% bonus on first purchase
const FIRST_PURCHASE_STORAGE_KEY = 'mysticoracle_first_purchase_';

// Low balance threshold
const LOW_BALANCE_THRESHOLD = 5;

// Helper to check if user has made first purchase
const hasCompletedFirstPurchase = (userId: string | undefined): boolean => {
  if (!userId) return false;
  return localStorage.getItem(`${FIRST_PURCHASE_STORAGE_KEY}${userId}`) === 'true';
};

// Helper to mark first purchase as complete
const markFirstPurchaseComplete = (userId: string | undefined): void => {
  if (!userId) return;
  localStorage.setItem(`${FIRST_PURCHASE_STORAGE_KEY}${userId}`, 'true');
};

interface CreditShopProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreditShop: React.FC<CreditShopProps> = ({ isOpen, onClose }) => {
  const { language, user } = useApp();
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

  // First-purchase bonus tracking
  const isFirstPurchase = useMemo(() => {
    return !hasCompletedFirstPurchase(clerkUser?.id);
  }, [clerkUser?.id]);

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

  // Calculate bonus credits for first purchase
  const getFirstPurchaseBonus = useCallback((credits: number): number => {
    if (!isFirstPurchase) return 0;
    return Math.floor(credits * (FIRST_PURCHASE_BONUS_PERCENT / 100));
  }, [isFirstPurchase]);

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
      setError(result.reason || (language === 'en' ? 'Purchase not allowed' : 'Achat non autorisé'));
      return false;
    }
    if (result.warningLevel === 'soft' && result.reason) {
      setSpendingWarning(result.reason);
    }
    return true;
  }, [canSpend, language]);

  // Handle Stripe checkout
  const handleStripeCheckout = useCallback(async (useLink: boolean) => {
    if (!selectedPackage) return;

    // Check spending limits first
    if (!checkSpendingLimits(selectedPackage.priceEur)) {
      return;
    }

    setLoading(true);
    setError(null);
    setPaymentMethod(useLink ? 'stripe_link' : 'stripe');

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      // Record the purchase attempt (will be finalized by webhook)
      recordPurchase(selectedPackage.priceEur, selectedPackage.nameEn);

      const { url } = await createStripeCheckout(selectedPackage.id, token, useLink);
      if (url) {
        redirectToStripeCheckout(url);
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Stripe checkout error:', err);
      const message = err instanceof Error ? err.message : 'Payment failed';
      // Provide more helpful error for network failures
      if (message === 'Failed to fetch') {
        setError(language === 'en'
          ? 'Unable to connect to payment server. Please check your connection and try again.'
          : 'Impossible de se connecter au serveur de paiement. Veuillez vérifier votre connexion et réessayer.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
      setPaymentMethod(null);
    }
  }, [selectedPackage, getToken, language, checkSpendingLimits, recordPurchase]);

  // Handle PayPal checkout
  const handlePayPalCheckout = useCallback(async () => {
    if (!selectedPackage) return;

    // Check spending limits first
    if (!checkSpendingLimits(selectedPackage.priceEur)) {
      return;
    }

    setLoading(true);
    setError(null);
    setPaymentMethod('paypal');

    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      // Record the purchase attempt
      recordPurchase(selectedPackage.priceEur, selectedPackage.nameEn);

      const { approvalUrl } = await createPayPalOrder(selectedPackage.id, token);
      if (approvalUrl) {
        window.location.href = approvalUrl;
      } else {
        throw new Error('No approval URL received');
      }
    } catch (err) {
      console.error('PayPal checkout error:', err);
      const message = err instanceof Error ? err.message : 'Payment failed';
      if (message === 'Failed to fetch') {
        setError(language === 'en'
          ? 'Unable to connect to payment server. Please check your connection and try again.'
          : 'Impossible de se connecter au serveur de paiement. Veuillez vérifier votre connexion et réessayer.');
      } else {
        setError(message);
      }
      setLoading(false);
      setPaymentMethod(null);
    }
  }, [selectedPackage, getToken, language, checkSpendingLimits, recordPurchase]);

  // Get badge color based on type
  const getBadgeStyles = (badge: string | null) => {
    switch (badge) {
      case 'popular':
        return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'value':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'premium':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default:
        return 'bg-slate-600';
    }
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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-purple-600 rounded-full flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-heading text-white">
                {language === 'en' ? 'Credit Shop' : 'Boutique de Crédits'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSpendingLimits(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white text-sm border border-slate-600"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'Limits' : 'Limites'}</span>
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
                    {language === 'en' ? 'Payment Error' : 'Erreur de Paiement'}
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
                    {language === 'en' ? 'Spending Reminder' : 'Rappel de Dépenses'}
                  </p>
                  <p className="mt-1">{spendingWarning}</p>
                  <button
                    onClick={() => setShowSpendingLimits(true)}
                    className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline"
                  >
                    {language === 'en' ? 'Manage spending limits' : 'Gérer les limites de dépenses'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">

            {/* First Purchase Bonus Banner - Shiny */}
            {isFirstPurchase && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-gradient-to-r from-amber-900/50 via-yellow-800/40 to-amber-900/50 border border-amber-500/60 rounded-xl relative overflow-hidden"
              >
                {/* Animated shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-amber-200">
                        +{FIRST_PURCHASE_BONUS_PERCENT}% {language === 'en' ? 'BONUS' : 'BONUS'}
                      </span>
                    </div>
                    <span className="text-xs text-amber-200/70">
                      {language === 'en' ? 'Extra credits on your first purchase!' : 'Crédits bonus sur votre premier achat !'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Low Balance Nudge */}
            {hasLowBalance && !isFirstPurchase && (
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
                      {language === 'en'
                        ? `You have ${user?.credits ?? 0} credits remaining. Top up to continue your mystical journey!`
                        : `Il vous reste ${user?.credits ?? 0} crédits. Rechargez pour continuer votre voyage mystique !`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Package Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                const label = language === 'en' ? pkg.labelEn : pkg.labelFr;
                const name = language === 'en' ? pkg.nameEn : pkg.nameFr;
                const isBestValue = pkg.id === bestValuePackageId;
                const bonusCredits = getFirstPurchaseBonus(pkg.credits);
                const totalCredits = pkg.credits + bonusCredits;

                return (
                  <motion.button
                    key={pkg.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-amber-400 bg-amber-900/20 shadow-lg shadow-amber-500/20'
                        : isBestValue
                        ? 'border-green-500/60 bg-green-900/20 hover:border-green-400/80'
                        : pkg.badge
                        ? 'border-purple-500/50 bg-slate-800/70 hover:border-purple-400/70'
                        : 'border-white/10 bg-slate-800/50 hover:border-purple-500/30'
                    }`}
                  >
                    {/* Best Value badge - takes priority */}
                    {isBestValue && !pkg.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-xs font-bold text-white whitespace-nowrap shadow-lg flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {language === 'en' ? 'Best Value' : 'Meilleur Rapport'}
                      </div>
                    )}

                    {/* Original badge label */}
                    {pkg.badge && (
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 ${getBadgeStyles(pkg.badge)} rounded-full text-xs font-bold text-white whitespace-nowrap shadow-lg`}>
                        {label}
                      </div>
                    )}

                    {/* Discount badge */}
                    {pkg.discount > 0 && (
                      <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        -{pkg.discount}%
                      </div>
                    )}

                    {/* Package name */}
                    <p className="text-sm font-medium text-slate-400 mb-1">{name}</p>

                    {/* Credits */}
                    <div className="flex items-center gap-2 mb-1">
                      <Coins className={`w-6 h-6 ${isSelected ? 'text-amber-400' : isBestValue ? 'text-green-400' : 'text-purple-400'}`} />
                      <span className="text-3xl font-bold text-white">{pkg.credits}</span>
                      <span className="text-sm text-slate-400">{language === 'en' ? 'credits' : 'crédits'}</span>
                    </div>

                    {/* First purchase bonus display */}
                    {isFirstPurchase && bonusCredits > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1.5 mb-2 ml-8"
                      >
                        <Gift className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-400">+{bonusCredits}</span>
                        <span className="text-xs text-amber-400/70">
                          {language === 'en' ? 'bonus' : 'bonus'}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">
                          = {totalCredits} {language === 'en' ? 'total' : 'total'}
                        </span>
                      </motion.div>
                    )}

                    {/* Price */}
                    <div className={`flex items-baseline gap-2 ${isFirstPurchase ? '' : 'mt-2'}`}>
                      <p className={`text-2xl font-bold ${isBestValue ? 'text-green-400' : 'text-amber-400'}`}>€{pkg.priceEur.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        (€{(pkg.priceEur / (isFirstPurchase ? totalCredits : pkg.credits)).toFixed(2)}/{language === 'en' ? 'credit' : 'crédit'})
                      </p>
                    </div>

                    {/* Non-badge label */}
                    {!pkg.badge && !isBestValue && (
                      <p className="text-xs text-slate-500 mt-2">{label}</p>
                    )}

                    {/* Selected check */}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-slate-900" />
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Payment Methods */}
            {selectedPackage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-heading text-purple-200 mb-3">
                  {language === 'en' ? 'Payment Method' : 'Mode de Paiement'}
                </h3>

                <div className="grid gap-3">
                  {/* Stripe Link (fastest) */}
                  <button
                    onClick={() => handleStripeCheckout(true)}
                    disabled={loading}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl hover:border-green-400/50 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white flex items-center gap-2">
                          Stripe Link
                          <span className="px-1.5 py-0.5 bg-green-500/20 rounded text-xs text-green-400">
                            {language === 'en' ? 'Fastest' : 'Plus Rapide'}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400">
                          {language === 'en' ? 'One-click checkout with saved payment' : 'Paiement en un clic'}
                        </p>
                      </div>
                    </div>
                    {loading && paymentMethod === 'stripe_link' ? (
                      <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                    ) : (
                      <span className="text-lg font-bold text-green-400">€{selectedPackage.priceEur.toFixed(2)}</span>
                    )}
                  </button>

                  {/* Credit Card */}
                  <button
                    onClick={() => handleStripeCheckout(false)}
                    disabled={loading}
                    className="flex items-center justify-between p-4 bg-slate-800/50 border border-white/10 rounded-xl hover:border-purple-500/30 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">
                          {language === 'en' ? 'Credit / Debit Card' : 'Carte Bancaire'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Visa, Mastercard, Amex
                        </p>
                      </div>
                    </div>
                    {loading && paymentMethod === 'stripe' ? (
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    ) : (
                      <span className="text-lg font-bold text-purple-300">€{selectedPackage.priceEur.toFixed(2)}</span>
                    )}
                  </button>

                  {/* PayPal */}
                  <button
                    onClick={handlePayPalCheckout}
                    disabled={loading}
                    className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl hover:border-blue-400/50 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <PayPalIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">PayPal</p>
                        <p className="text-xs text-slate-400">
                          {language === 'en' ? 'Pay with your PayPal account' : 'Payez avec votre compte PayPal'}
                        </p>
                      </div>
                    </div>
                    {loading && paymentMethod === 'paypal' ? (
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    ) : (
                      <span className="text-lg font-bold text-blue-300">€{selectedPackage.priceEur.toFixed(2)}</span>
                    )}
                  </button>
                </div>

                {/* Security note */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4">
                  <Shield className="w-4 h-4" />
                  <span>
                    {language === 'en'
                      ? 'Secure payment processed by Stripe & PayPal'
                      : 'Paiement sécurisé par Stripe & PayPal'}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Benefits */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="text-slate-400">
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                  <p className="text-xs">
                    {language === 'en' ? 'Instant delivery' : 'Livraison instantanée'}
                  </p>
                </div>
                <div className="text-slate-400">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-green-400" />
                  <p className="text-xs">
                    {language === 'en' ? 'Secure payment' : 'Paiement sécurisé'}
                  </p>
                </div>
                <div className="text-slate-400">
                  <Coins className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <p className="text-xs">
                    {language === 'en' ? 'No expiration' : 'Sans expiration'}
                  </p>
                </div>
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
                    {language === 'en' ? 'Time for a Break?' : 'Temps de Faire une Pause ?'}
                  </h3>
                  <p className="text-slate-400 mb-6">
                    {language === 'en'
                      ? "You've made several purchases recently. Would you like to take a moment before continuing?"
                      : "Vous avez effectué plusieurs achats récemment. Souhaitez-vous prendre un moment avant de continuer ?"}
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
                      {language === 'en' ? 'Set Limits' : 'Définir des Limites'}
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => {
                        setShowBreakReminder(false);
                        dismissBreakReminder();
                      }}
                    >
                      {language === 'en' ? 'Continue' : 'Continuer'}
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
