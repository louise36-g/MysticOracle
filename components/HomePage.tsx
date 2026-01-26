import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../routes/routes';
import Button from './Button';
import { Star, Shield, Zap } from 'lucide-react';
import ReadingModeSelector from './ReadingModeSelector';
import SpreadSelector from './SpreadSelector';
import HoroscopeReading from './HoroscopeReading';
import { SpreadConfig } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { user, language, t } = useApp();
  const [readingMode, setReadingMode] = React.useState<string | null>(null);

  const handleReadingModeSelect = (mode: string) => {
    setReadingMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSpreadSelect = (spread: SpreadConfig) => {
    // Navigate to reading with spread in state
    navigate(ROUTES.READING, { state: { spread } });
  };

  return (
    <div className="pb-20 relative z-10">
      {/* Hero Section - Only show on home (no readingMode selected) */}
      {!readingMode && (
        <div className="relative py-20 px-4 text-center overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

          <h1 className="text-5xl md:text-7xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-purple-300 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            MysticOracle
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            {language === 'en'
              ? 'Unveil the secrets of your destiny through the ancient wisdom of Tarot, guided by artificial intelligence.'
              : "Dévoilez les secrets de votre destin grâce à la sagesse ancienne du Tarot, guidée par l'intelligence artificielle."}
          </p>

          {!user && (
            <SignInButton mode="modal">
              <Button size="lg">
                {t('app.App.start_your_reading', 'Start Your Reading')}
              </Button>
            </SignInButton>
          )}
        </div>
      )}

      {/* Feature Highlights (Only for non-authenticated) */}
      {!user && (
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 mb-20">
          <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Star />
            </div>
            <h3 className="text-xl font-heading text-purple-200 mb-2">
              {t('app.App.ai_powered_insights', 'AI Powered Insights')}
            </h3>
            <p className="text-slate-400 text-sm">
              {t(
                'app.App.deep_contextaware_interpretations',
                'Deep, context-aware interpretations powered by AI.'
              )}
            </p>
          </div>
          <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Shield />
            </div>
            <h3 className="text-xl font-heading text-purple-200 mb-2">
              {t('app.App.private_secure', 'Private & Secure')}
            </h3>
            <p className="text-slate-400 text-sm">
              {t(
                'app.App.your_spiritual_journey_is_personal',
                'Your spiritual journey is personal. We respect your privacy.'
              )}
            </p>
          </div>
          <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Zap />
            </div>
            <h3 className="text-xl font-heading text-purple-200 mb-2">
              {t('app.App.instant_clarity', 'Instant Clarity')}
            </h3>
            <p className="text-slate-400 text-sm">
              {t(
                'app.App.get_answers_to_lifes_pressing_questions',
                "Get answers to life's pressing questions in seconds."
              )}
            </p>
          </div>
        </div>
      )}

      {/* Reading Mode Selector (Only if logged in) */}
      {user && !readingMode && <ReadingModeSelector onSelect={handleReadingModeSelect} />}

      {/* Tarot Spread Selector */}
      {user && readingMode === 'tarot' && <SpreadSelector onSelect={handleSpreadSelect} />}

      {/* Horoscope Reading */}
      {user && readingMode === 'horoscope' && <HoroscopeReading />}

      {/* Oracle Placeholder */}
      {user && readingMode === 'oracle' && (
        <div className="text-center p-8 text-purple-300">
          {t('app.App.oracle_reading_coming_soon', 'Oracle Reading Coming Soon...')}
        </div>
      )}
    </div>
  );
};

export default HomePage;
