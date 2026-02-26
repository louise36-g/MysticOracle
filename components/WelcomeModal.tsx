import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Coins, ArrowRight, X, User, Check, AlertCircle, Gift, Loader2 } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { markWelcomeCompleted, checkUsernameAvailability, updateUsername } from '../services/api';
import { redeemReferralCode } from '../services/api/user';
import { ROUTES } from '../routes/routes';
import Button from './Button';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreditShop: () => void;
  onRefreshUser: () => Promise<void>;
  credits: number;
}

const TOTAL_STEPS = 5;

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onOpenCreditShop, onRefreshUser, credits }) => {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);

  // Referral code state
  const [referralCode, setReferralCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [referralRedeemed, setReferralRedeemed] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [referralCredits, setReferralCredits] = useState(0);

  // Check if user needs to set username (auto-generated or missing)
  React.useEffect(() => {
    const checkUsername = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await response.json();

        if (!userData.username || userData.username.startsWith('user_')) {
          setNeedsUsername(true);
        }
      } catch (error) {
        console.error('Failed to check username:', error);
      }
    };

    if (isOpen) {
      checkUsername();
    }
  }, [isOpen, getToken]);

  const markComplete = useCallback(async () => {
    try {
      const token = await getToken();
      if (token) {
        await markWelcomeCompleted(token);
        // Refresh user state to update welcomeCompleted flag
        await onRefreshUser();
      }
    } catch (error) {
      console.error('Failed to mark welcome as completed:', error);
    }
  }, [getToken, onRefreshUser]);

  const validateUsername = useCallback(async (value: string) => {
    setUsername(value);
    setUsernameError(null);

    if (!value) {
      setUsernameStatus('idle');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(value)) {
      setUsernameStatus('invalid');
      setUsernameError(
        t('welcome.username.invalid_format', 'Must be 3-20 characters: letters, numbers, underscores')
      );
      return;
    }

    setUsernameStatus('checking');
    try {
      const result = await checkUsernameAvailability(value);
      if (result.available) {
        setUsernameStatus('available');
      } else {
        setUsernameStatus('taken');
        setUsernameError(
          result.reason === 'reserved'
            ? t('welcome.username.reserved', 'This username is reserved')
            : t('welcome.username.taken', 'This username is already taken')
        );
      }
    } catch (error) {
      setUsernameStatus('idle');
      console.error('Failed to check username:', error);
    }
  }, [t]);

  const handleSaveUsername = useCallback(async () => {
    if (usernameStatus !== 'available') return;

    try {
      const token = await getToken();
      if (!token) return;

      await updateUsername(token, username);
      await onRefreshUser();
      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to save username:', error);
      setUsernameError(t('welcome.username.save_error', 'Failed to save username. Please try again.'));
    }
  }, [username, usernameStatus, getToken, onRefreshUser, t]);

  const handleSkipUsername = useCallback(() => {
    setCurrentStep(1);
  }, []);

  const handleRedeemReferral = useCallback(async () => {
    if (!referralCode.trim() || isRedeeming) return;

    setIsRedeeming(true);
    setReferralError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const result = await redeemReferralCode(token, referralCode.trim());
      setReferralRedeemed(true);
      setReferralCredits(result.creditsAwarded);
      await onRefreshUser();

      // Auto-advance after showing success
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 3000);
    } catch (error: any) {
      setReferralError(
        error?.message || t('welcome.referral.invalid', 'Invalid referral code. Please check and try again.')
      );
    } finally {
      setIsRedeeming(false);
    }
  }, [referralCode, isRedeeming, getToken, onRefreshUser, t]);

  const handleSkipReferral = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(async () => {
    setIsClosing(true);
    await markComplete();
    onClose();
  }, [markComplete, onClose]);

  const handleStartReading = useCallback(async () => {
    setIsClosing(true);
    await markComplete();
    onClose();
    navigate(ROUTES.READING);
  }, [markComplete, onClose, navigate]);

  const handlePurchase = useCallback(async () => {
    setIsClosing(true);
    await markComplete();
    onClose();
    onOpenCreditShop();
  }, [markComplete, onClose, onOpenCreditShop]);

  const handleLearnMore = useCallback(async () => {
    setIsClosing(true);
    await markComplete();
    onClose();
    navigate(ROUTES.HOW_CREDITS_WORK);
  }, [markComplete, onClose, navigate]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleSkip();
    }
  }, [handleSkip]);

  if (!isOpen) return null;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && !isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/30 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
          >
            <div className="flex justify-end p-4">
              <button
                onClick={handleSkip}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                aria-label={t('common.close', 'Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 pb-8 pt-2 min-h-[320px] flex flex-col">
              <AnimatePresence mode="wait" custom={1}>
                {currentStep === 0 && needsUsername && (
                  <motion.div
                    key="step-username"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-heading text-amber-100 mb-2">
                      {t('welcome.username.title', 'Choose Your Mystical Name')}
                    </h2>
                    <p className="text-slate-400 mb-6">
                      {t('welcome.username.subtitle', "This is how you'll be known in the realm of the cards")}
                    </p>

                    <div className="w-full max-w-xs">
                      <div className="relative">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => validateUsername(e.target.value)}
                          placeholder={t('welcome.username.placeholder', 'Enter username...')}
                          className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                            usernameStatus === 'available'
                              ? 'border-green-500 focus:ring-green-500/50'
                              : usernameStatus === 'taken' || usernameStatus === 'invalid'
                              ? 'border-red-500 focus:ring-red-500/50'
                              : 'border-slate-700 focus:ring-purple-500/50'
                          }`}
                          maxLength={20}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {usernameStatus === 'checking' && (
                            <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                          )}
                          {usernameStatus === 'available' && (
                            <Check className="w-5 h-5 text-green-500" />
                          )}
                          {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </div>

                      {usernameError && (
                        <p className="mt-2 text-sm text-red-400">{usernameError}</p>
                      )}
                      {usernameStatus === 'available' && (
                        <p className="mt-2 text-sm text-green-400">
                          {t('welcome.username.available', 'Username is available!')}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button
                        onClick={handleSkipUsername}
                        className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {t('welcome.username.skip', 'Skip for now')}
                      </button>
                      <Button
                        onClick={handleSaveUsername}
                        disabled={usernameStatus !== 'available'}
                        className="flex items-center gap-2"
                      >
                        {t('welcome.username.continue', 'Continue')}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {((currentStep === 0 && !needsUsername) || currentStep === 1) && (
                  <motion.div
                    key="step-referral"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col items-center text-center"
                  >
                    {referralRedeemed ? (
                      <>
                        {/* Success state */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.1 }}
                          className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6"
                        >
                          <Check className="w-10 h-10 text-white" />
                        </motion.div>
                        <h2 className="text-2xl font-heading text-amber-100 mb-2">
                          {t('welcome.referral.success_title', 'Welcome to CelestiArcana!')}
                        </h2>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="my-4"
                        >
                          <div className="text-5xl font-bold text-amber-400 flex items-center justify-center gap-2">
                            <Coins className="w-10 h-10" />
                            +{referralCredits}
                          </div>
                          <p className="text-slate-400 mt-1">
                            {t('welcome.referral.credits_earned', 'credits earned')}
                          </p>
                        </motion.div>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-green-400 font-medium"
                        >
                          {t('welcome.referral.added_to_account', 'Credits added to your account!')}
                        </motion.p>
                      </>
                    ) : (
                      <>
                        {/* Input state */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center mb-6">
                          <Gift className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-heading text-amber-100 mb-2">
                          {t('welcome.referral.title', 'Do you have a referral code?')}
                        </h2>
                        <p className="text-slate-400 mb-6">
                          {t('welcome.referral.subtitle', 'Enter a code from a friend and you both get 5 free credits!')}
                        </p>

                        <div className="w-full max-w-xs">
                          <input
                            type="text"
                            value={referralCode}
                            onChange={(e) => {
                              setReferralCode(e.target.value.toUpperCase());
                              setReferralError(null);
                            }}
                            placeholder={t('welcome.referral.placeholder', 'Paste your code here...')}
                            maxLength={20}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono tracking-wider
                                       placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 uppercase text-center"
                          />

                          {referralError && (
                            <p className="mt-2 text-sm text-red-400">{referralError}</p>
                          )}
                        </div>

                        <div className="flex gap-3 mt-8">
                          <button
                            onClick={handleSkipReferral}
                            className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
                          >
                            {t('welcome.referral.skip', "I don't have one")}
                          </button>
                          <Button
                            onClick={handleRedeemReferral}
                            disabled={!referralCode.trim() || isRedeeming}
                            className="flex items-center gap-2"
                          >
                            {isRedeeming ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('welcome.referral.redeeming', 'Redeeming...')}
                              </>
                            ) : (
                              <>
                                <Gift className="w-4 h-4" />
                                {t('welcome.referral.redeem', 'Redeem')}
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step-welcome"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center mb-6">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-heading text-amber-100 mb-4">
                      {t('welcome.step1.title', 'Welcome to CelestiArcana')}
                    </h2>
                    <p className="text-slate-300 leading-relaxed">
                      {t('welcome.step1.description', 'Your personal guide to tarot wisdom. Each reading is crafted uniquely for you, blending ancient symbolism with modern insight.')}
                    </p>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step-1"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mb-6">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-heading text-amber-100 mb-4">
                      {t('welcome.step2.title', 'How It Works')}
                    </h2>
                    <div className="text-slate-300 leading-relaxed space-y-3 text-left">
                      <p>
                        <span className="text-amber-400 font-medium">1.</span>{' '}
                        {t('welcome.step2.point1', 'Ask a question (or let the cards guide you)')}
                      </p>
                      <p>
                        <span className="text-amber-400 font-medium">2.</span>{' '}
                        {t('welcome.step2.point2', 'Choose your spread — from a single card to a full Celtic Cross')}
                      </p>
                      <p>
                        <span className="text-amber-400 font-medium">3.</span>{' '}
                        {t('welcome.step2.point3', 'Receive a personalized interpretation that speaks to your situation')}
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step-2"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6">
                      <Coins className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-heading text-amber-100 mb-4">
                      {t('welcome.step3.title', 'Your Credits')}
                    </h2>
                    <div className="text-slate-300 leading-relaxed space-y-3">
                      <p>
                        {referralRedeemed
                          ? t('welcome.step3.description_with_referral', `All new users receive 3 free credits to get started. Plus, thanks to your referral code, you've earned an extra ${referralCredits} credits! A single card reading costs 1 credit, larger spreads cost more. Earn even more through daily bonuses — or purchase anytime.`)
                          : t('welcome.step3.description', 'All new users receive 3 free credits to get started. A single card reading costs 1 credit, larger spreads cost more. Earn extra credits through daily bonuses and referrals — or purchase more anytime.')
                        }
                      </p>
                      <div className="flex items-center justify-center gap-4 mt-2">
                        <button
                          onClick={handlePurchase}
                          className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors text-sm font-medium"
                        >
                          {t('welcome.step3.purchaseNow', 'Purchase now')}
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          onClick={handleLearnMore}
                          className="text-slate-400 hover:text-slate-300 underline underline-offset-2 transition-colors text-sm"
                        >
                          {t('welcome.step3.learnMore', 'Learn more')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-center gap-2 mt-8 mb-6">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? 'bg-amber-500 w-6'
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                    aria-label={`Go to step ${i + 1}`}
                  />
                ))}
              </div>

              {/* Hide bottom nav on referral step (it has its own buttons) unless already redeemed */}
              {(((currentStep === 0 && !needsUsername) || currentStep === 1) ? referralRedeemed : true) && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSkip}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {t('welcome.skip', 'Skip')}
                  </button>

                  {currentStep < TOTAL_STEPS - 1 ? (
                    <Button onClick={handleNext} className="flex items-center gap-2">
                      {t('welcome.next', 'Next')}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleStartReading} className="flex items-center gap-2">
                      {t('welcome.startReading', 'Start Your First Reading')}
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
