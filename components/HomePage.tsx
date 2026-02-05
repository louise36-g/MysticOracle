import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../routes/routes';
import Button from './Button';
import { Star, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import ReadingModeSelector from './ReadingModeSelector';
import HoroscopeReading from './HoroscopeReading';

// Floating mystical star component
const FloatingStar: React.FC<{
  size: number;
  x: string;
  y: string;
  delay: number;
  duration: number;
}> = ({ size, x, y, delay, duration }) => (
  <motion.div
    className="absolute text-amber-300/40"
    style={{ left: x, top: y }}
    animate={{
      opacity: [0.2, 0.8, 0.2],
      scale: [1, 1.3, 1],
      y: [0, -8, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
    </svg>
  </motion.div>
);

// Crescent moon for divider
const CrescentMoon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
  </svg>
);

// Tarot card silhouette for background
const TarotCardSilhouette: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 100 160" fill="currentColor">
    <rect x="5" y="5" width="90" height="150" rx="8" ry="8" strokeWidth="2" stroke="currentColor" fill="none" opacity="0.3" />
    <rect x="12" y="12" width="76" height="136" rx="4" ry="4" strokeWidth="1" stroke="currentColor" fill="none" opacity="0.2" />
    {/* Star in center */}
    <path d="M50 45 L53 55 L63 57 L55 63 L57 73 L50 68 L43 73 L45 63 L37 57 L47 55 Z" opacity="0.15" />
    {/* Bottom decorative element */}
    <circle cx="50" cy="120" r="15" strokeWidth="1" stroke="currentColor" fill="none" opacity="0.15" />
    <circle cx="50" cy="120" r="8" strokeWidth="1" stroke="currentColor" fill="none" opacity="0.1" />
  </svg>
);

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { user, language, t } = useApp();
  const [readingMode, setReadingMode] = React.useState<string | null>(null);

  const handleReadingModeSelect = (mode: string) => {
    if (mode === 'tarot') {
      navigate(ROUTES.READING);
      return;
    }
    setReadingMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pb-12 relative z-10">
      {/* Atmospheric background - persistent */}
      <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-violet-500/4 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-amber-500/3 rounded-full blur-[80px]" />

        {/* Floating stars scattered across background */}
        <FloatingStar size={12} x="10%" y="15%" delay={0} duration={4} />
        <FloatingStar size={8} x="85%" y="20%" delay={1.5} duration={5} />
        <FloatingStar size={10} x="20%" y="70%" delay={0.8} duration={4.5} />
        <FloatingStar size={6} x="75%" y="65%" delay={2} duration={3.5} />
        <FloatingStar size={14} x="50%" y="85%" delay={0.5} duration={5.5} />
        <FloatingStar size={8} x="30%" y="40%" delay={1.2} duration={4} />
        <FloatingStar size={10} x="90%" y="50%" delay={2.5} duration={4.8} />
        <FloatingStar size={6} x="5%" y="55%" delay={1.8} duration={3.8} />

        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Compact Header - Only show on home (no readingMode selected) */}
      {!readingMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative pt-6 pb-4 px-4"
        >
          {/* Tarot card silhouettes in background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <motion.div
              className="absolute -left-8 top-1/2 -translate-y-1/2 text-purple-500/[0.07] -rotate-12"
              animate={{ y: [0, -5, 0], rotate: [-12, -10, -12] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              <TarotCardSilhouette className="w-32 h-48" />
            </motion.div>
            <motion.div
              className="absolute -right-8 top-1/2 -translate-y-1/2 text-purple-500/[0.07] rotate-12"
              animate={{ y: [0, 5, 0], rotate: [12, 14, 12] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <TarotCardSilhouette className="w-32 h-48" />
            </motion.div>
          </div>

          {/* Elegant header with integrated branding */}
          <div className="max-w-4xl mx-auto relative">
            {/* Upper tagline with decorative elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-3 mb-2"
            >
              <Star className="w-3 h-3 text-amber-400/50" />
              <span className="text-xs uppercase tracking-[0.25em] text-amber-100/90 font-medium">
                {language === 'en' ? 'Guidance & Self-Discovery' : 'Guidance & Découverte de Soi'}
              </span>
              <Star className="w-3 h-3 text-amber-400/50" />
            </motion.div>

            {/* Title with breathing glow animation */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative text-center text-5xl md:text-6xl font-heading font-bold mb-2"
            >
              {/* Breathing glow layer behind text */}
              <motion.span
                className="absolute inset-0 text-purple-400 blur-xl"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                MysticOracle
              </motion.span>
              {/* Secondary amber glow for warmth */}
              <motion.span
                className="absolute inset-0 text-amber-400 blur-2xl"
                animate={{ opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                aria-hidden="true"
              >
                MysticOracle
              </motion.span>
              {/* Main text with gradient */}
              <span className="relative text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-purple-200 to-purple-400">
                MysticOracle
              </span>
            </motion.h1>

            {/* Tagline - slightly brighter */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center text-sm text-slate-300 max-w-md mx-auto"
            >
              {language === 'en'
                ? 'Where ancient knowledge meets modern innovation — wisdom for all'
                : 'Où la sagesse ancienne rencontre l\'innovation moderne — pour tous'}
            </motion.p>

            {/* Simplified elegant divider - just a crescent moon */}
            <motion.div
              className="flex items-center justify-center gap-4 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/40" />
              <motion.div
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <CrescentMoon className="w-4 h-4 text-amber-400/70" />
              </motion.div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500/40" />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Main Content Area */}
      {user ? (
        <>
          {/* Reading Mode Selector (logged in, no mode selected) */}
          {!readingMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-4"
            >
              <ReadingModeSelector onSelect={handleReadingModeSelect} />
            </motion.div>
          )}

          {/* Horoscope Reading */}
          {readingMode === 'horoscope' && <HoroscopeReading />}
        </>
      ) : (
        /* Non-authenticated view */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-4xl mx-auto px-4 mt-6"
        >
          {/* Compelling value proposition */}
          <div className="text-center mb-8">
            <p className="text-base md:text-lg text-slate-300/90 max-w-xl mx-auto mb-6 leading-relaxed">
              {language === 'en'
                ? 'Unveil the secrets of your destiny through Tarot, guided by artificial intelligence.'
                : "Dévoilez les secrets de votre destin grâce au Tarot, guidé par l'intelligence artificielle."}
            </p>

            <SignInButton mode="modal">
              <Button size="lg" variant="mystical" glow>
                {t('app.App.start_your_reading', 'Start Your Reading')}
              </Button>
            </SignInButton>
          </div>

          {/* Feature cards - horizontal compact layout */}
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[
              {
                icon: Star,
                title: t('app.App.ai_powered_insights', 'AI Insights'),
                description: t('app.App.deep_contextaware_interpretations', 'Deep, context-aware interpretations'),
                gradient: 'from-violet-500 to-purple-600',
              },
              {
                icon: Shield,
                title: t('app.App.private_secure', 'Private & Secure'),
                description: t('app.App.your_spiritual_journey_is_personal', 'Your spiritual journey stays personal'),
                gradient: 'from-emerald-500 to-teal-600',
              },
              {
                icon: Zap,
                title: t('app.App.instant_clarity', 'Instant Clarity'),
                description: t('app.App.get_answers_to_lifes_pressing_questions', "Answers in seconds"),
                gradient: 'from-amber-500 to-orange-600',
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className="group relative bg-slate-900/40 p-4 rounded-xl border border-white/5 backdrop-blur-sm hover:border-purple-500/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-heading text-purple-100 mb-0.5">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-tight truncate">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HomePage;
