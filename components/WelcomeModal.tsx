import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Coins, ArrowRight, X } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { markWelcomeCompleted } from '../services/apiService';
import { ROUTES } from '../routes/routes';
import Button from './Button';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreditShop: () => void;
  onRefreshUser: () => Promise<void>;
  credits: number;
}

const TOTAL_STEPS = 3;

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onOpenCreditShop, onRefreshUser, credits }) => {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

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
                {currentStep === 0 && (
                  <motion.div
                    key="step-0"
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
                      {t('welcome.step1.title', 'Welcome to MysticOracle')}
                    </h2>
                    <p className="text-slate-300 leading-relaxed">
                      {t('welcome.step1.description', 'Your personal guide to tarot wisdom. Each reading is crafted uniquely for you, blending ancient symbolism with modern insight.')}
                    </p>
                  </motion.div>
                )}

                {currentStep === 1 && (
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

                {currentStep === 2 && (
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
                        {t('welcome.step3.description', 'You have 3 free credits to start. A single card reading costs 1 credit, larger spreads cost more. Earn extra credits through daily bonuses and referrals — or purchase more anytime.')}
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
