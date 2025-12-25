import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import Button from './Button';
import { Sparkles, Coins, Star } from 'lucide-react';

const WELCOME_SEEN_KEY = 'mysticoracle_welcome_seen';

const WelcomeModal: React.FC = () => {
  const { user, language } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show welcome modal for new users who haven't seen it
    if (user && user.totalReadings === 0) {
      const hasSeenWelcome = localStorage.getItem(WELCOME_SEEN_KEY);
      if (!hasSeenWelcome) {
        // Small delay for better UX
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleClose = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative header */}
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-amber-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-24 h-24 border-2 border-dashed border-purple-500/30 rounded-full" />
              </motion.div>
            </div>

            {/* Welcome text */}
            <h2 className="text-2xl font-heading text-center text-white mb-2">
              {language === 'en' ? 'Welcome to MysticOracle!' : 'Bienvenue sur MysticOracle !'}
            </h2>

            <p className="text-slate-400 text-center mb-6">
              {language === 'en'
                ? `Hello ${user?.username || 'Seeker'}! Your mystical journey begins now.`
                : `Bonjour ${user?.username || 'Chercheur'} ! Votre voyage mystique commence maintenant.`}
            </p>

            {/* Credits earned */}
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-3">
                <Coins className="w-8 h-8 text-amber-400" />
                <div className="text-center">
                  <p className="text-sm text-slate-400">
                    {language === 'en' ? 'Welcome Bonus' : 'Bonus de Bienvenue'}
                  </p>
                  <p className="text-3xl font-bold text-amber-400">+10</p>
                  <p className="text-xs text-slate-500">
                    {language === 'en' ? 'Free credits' : 'Credits gratuits'}
                  </p>
                </div>
              </div>
            </div>

            {/* Features hint */}
            <div className="flex items-center justify-center gap-6 mb-6 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-400" />
                <span>{language === 'en' ? 'Tarot readings' : 'Lectures de tarot'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-400" />
                <span>{language === 'en' ? 'Horoscopes' : 'Horoscopes'}</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleClose}
            >
              {language === 'en' ? 'Begin Your Journey' : 'Commencer Votre Voyage'}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
