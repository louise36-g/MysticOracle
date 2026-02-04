import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../routes/routes';
import Button from './Button';
import { Star, Shield, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ReadingModeSelector from './ReadingModeSelector';
import CategorySelector from './CategorySelector';
import HoroscopeReading from './HoroscopeReading';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { user, language, t } = useApp();
  const [readingMode, setReadingMode] = React.useState<string | null>(null);

  const handleReadingModeSelect = (mode: string) => {
    if (mode === 'tarot') {
      // Navigate directly to category selector page
      navigate(ROUTES.READING);
      return;
    }
    setReadingMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pb-20 relative z-10">
      {/* Hero Section - Only show on home (no readingMode selected) */}
      {!readingMode && (
        <div className="relative py-16 md:py-24 px-4 text-center overflow-hidden">
          {/* Atmospheric background layers */}
          <div className="absolute inset-0 -z-20">
            {/* Primary glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/8 rounded-full blur-[100px] animate-pulse" />
            {/* Secondary accent glows */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-fuchsia-500/5 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          {/* Floating star particles */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full"
                style={{
                  top: `${15 + i * 15}%`,
                  left: `${10 + i * 15}%`,
                }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          {/* Logo accent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Sparkles className="w-5 h-5 text-amber-400/80" />
            <span className="text-xs uppercase tracking-[0.3em] text-purple-300/70 font-medium">
              {language === 'en' ? 'Guidance & Self-Discovery' : 'Guidance & Découverte de Soi'}
            </span>
            <Sparkles className="w-5 h-5 text-amber-400/80" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-purple-200 to-purple-400 mb-6 leading-tight"
            style={{
              textShadow: '0 0 80px rgba(139, 92, 246, 0.3)',
            }}
          >
            MysticOracle
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-300/90 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {language === 'en'
              ? 'Unveil the secrets of your destiny through the ancient wisdom of Tarot, guided by artificial intelligence.'
              : "Dévoilez les secrets de votre destin grâce à la sagesse ancienne du Tarot, guidée par l'intelligence artificielle."}
          </motion.p>

          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <SignInButton mode="modal">
                <Button size="lg" variant="mystical" glow>
                  {t('app.App.start_your_reading', 'Start Your Reading')}
                </Button>
              </SignInButton>
            </motion.div>
          )}
        </div>
      )}

      {/* Feature Highlights (Only for non-authenticated) */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 mb-20"
        >
          {[
            {
              icon: Star,
              title: t('app.App.ai_powered_insights', 'AI Powered Insights'),
              description: t('app.App.deep_contextaware_interpretations', 'Deep, context-aware interpretations powered by AI.'),
              gradient: 'from-violet-500 to-purple-600',
              delay: 0
            },
            {
              icon: Shield,
              title: t('app.App.private_secure', 'Private & Secure'),
              description: t('app.App.your_spiritual_journey_is_personal', 'Your spiritual journey is personal. We respect your privacy.'),
              gradient: 'from-emerald-500 to-teal-600',
              delay: 0.1
            },
            {
              icon: Zap,
              title: t('app.App.instant_clarity', 'Instant Clarity'),
              description: t('app.App.get_answers_to_lifes_pressing_questions', "Get answers to life's pressing questions in seconds."),
              gradient: 'from-amber-500 to-orange-600',
              delay: 0.2
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 + feature.delay }}
              className="group relative bg-slate-900/50 p-6 rounded-2xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-1"
            >
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className={`relative w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="relative text-xl font-heading text-purple-100 mb-2">
                {feature.title}
              </h3>
              <p className="relative text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Reading Mode Selector (Only if logged in) */}
      {user && !readingMode && <ReadingModeSelector onSelect={handleReadingModeSelect} />}

      {/* Horoscope Reading */}
      {user && readingMode === 'horoscope' && <HoroscopeReading />}

    </div>
  );
};

export default HomePage;
