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

// Mystical decorative symbol
const MysticalSymbol: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
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
          {/* Elegant header with integrated branding */}
          <div className="max-w-4xl mx-auto relative">
            {/* Upper tagline with decorative elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-3 mb-2"
            >
              <MysticalSymbol className="w-4 h-4 text-amber-400/60" />
              <span className="text-xs uppercase tracking-[0.25em] text-purple-300/70 font-medium">
                {language === 'en' ? 'Guidance & Self-Discovery' : 'Guidance & Découverte de Soi'}
              </span>
              <MysticalSymbol className="w-4 h-4 text-amber-400/60" />
            </motion.div>

            {/* Title with enhanced glow */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative text-center text-4xl md:text-5xl font-heading font-bold mb-2"
            >
              {/* Glow layer behind text */}
              <span
                className="absolute inset-0 text-purple-400 blur-xl opacity-50"
                aria-hidden="true"
              >
                MysticOracle
              </span>
              {/* Main text with gradient */}
              <span className="relative text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-purple-200 to-purple-400">
                MysticOracle
              </span>
            </motion.h1>

            {/* Subtle tagline about modern tech */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center text-sm text-slate-400/80 max-w-md mx-auto"
            >
              {language === 'en'
                ? 'Where ancient knowledge meets modern innovation — wisdom for all'
                : 'Où la sagesse ancienne rencontre l\'innovation moderne — pour tous'}
            </motion.p>

            {/* Enhanced decorative divider */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-500/40" />
              <MysticalSymbol className="w-3 h-3 text-purple-400/40" />
              <div className="h-px w-8 bg-purple-500/30" />
              <div className="w-2 h-2 rounded-full bg-amber-400/60 shadow-lg shadow-amber-400/30" />
              <div className="h-px w-8 bg-purple-500/30" />
              <MysticalSymbol className="w-3 h-3 text-purple-400/40" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-500/40" />
            </div>
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
