
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ReadingModeSelector from './components/ReadingModeSelector';
import SpreadSelector from './components/SpreadSelector';
import ActiveReading from './components/ActiveReading';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { useApp } from './context/AppContext';
import { SpreadConfig, InterpretationStyle } from './types';
import Button from './components/Button';
import { Star, Shield, Zap } from 'lucide-react';

const App: React.FC = () => {
  const { user, isLoading, language } = useApp();
  const [currentView, setCurrentView] = useState('home');
  const [selectedSpread, setSelectedSpread] = useState<SpreadConfig | null>(null);
  const [readingMode, setReadingMode] = useState<string | null>(null);

  const handleAuthSuccess = useCallback(() => {
    setCurrentView('home');
    setReadingMode(null);
  }, []);

  const handleReadingFinish = useCallback(() => {
    setSelectedSpread(null);
    setCurrentView('home');
    setReadingMode(null);
  }, []);

  const handleReadingModeSelect = (mode: string) => {
    setReadingMode(mode);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view === 'home') {
      setReadingMode(null);
      setSelectedSpread(null);
    }
  }

  const handleSpreadSelect = useCallback((spread: SpreadConfig) => {
    if (user && user.credits >= spread.cost) {
      setSelectedSpread(spread);
      setCurrentView('reading');
    } else {
      alert(language === 'en' ? 'Not enough credits!' : 'Pas assez de crédits!');
    }
  }, [user, language]);

  const handleLoginClick = useCallback(() => setCurrentView('login'), []);

  if (isLoading) return <div className="min-h-screen bg-[#0f0c29] flex items-center justify-center text-purple-500">Loading...</div>;

  const renderContent = () => {
    // 1. Login View
    if (!user && currentView === 'login') {
      return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 relative z-10 py-10">
          <AuthModal onSuccess={handleAuthSuccess} />
        </div>
      );
    }

    // 2. Profile View
    if (user && currentView === 'profile') {
        return <UserProfile />;
    }

    // 3. Active Reading View
    if (currentView === 'reading' && selectedSpread) {
      return (
        <ActiveReading
          spread={selectedSpread}
          style={InterpretationStyle.CLASSIC}
          onFinish={handleReadingFinish}
        />
      );
    }

    // 4. Home / Dashboard View
    return (
      <div className="pb-20 relative z-10">
        {/* Hero Section */}
        <div className="relative py-20 px-4 text-center overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

          <h1 className="text-5xl md:text-7xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-purple-300 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            MysticOracle
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            {language === 'en' 
              ? 'Unveil the secrets of your destiny through the ancient wisdom of Tarot, guided by artificial intelligence.' 
              : 'Dévoilez les secrets de votre destin grâce à la sagesse ancienne du Tarot, guidée par l\'intelligence artificielle.'}
          </p>
          
          {!user && (
            <Button size="lg" onClick={handleLoginClick}>
              {language === 'en' ? 'Start Your Reading' : 'Commencer Votre Lecture'}
            </Button>
          )}
        </div>

        {/* Feature Highlights (Only for non-authenticated) */}
        {!user && (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 mb-20">
            <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
               <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400"><Star /></div>
               <h3 className="text-xl font-heading text-purple-200 mb-2">AI Powered Insights</h3>
               <p className="text-slate-400 text-sm">Deep, context-aware interpretations powered by Gemini.</p>
            </div>
            <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
               <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400"><Shield /></div>
               <h3 className="text-xl font-heading text-purple-200 mb-2">Private & Secure</h3>
               <p className="text-slate-400 text-sm">Your spiritual journey is personal. We respect your privacy.</p>
            </div>
            <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
               <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400"><Zap /></div>
               <h3 className="text-xl font-heading text-purple-200 mb-2">Instant Clarity</h3>
               <p className="text-slate-400 text-sm">Get answers to life's pressing questions in seconds.</p>
            </div>
          </div>
        )}

        {/* Reading Mode Selector (Only if logged in) */}
        {user && currentView === 'home' && !readingMode && (
           <ReadingModeSelector onSelect={handleReadingModeSelect} />
        )}

        {/* Tarot Spread Selector */}
        {user && currentView === 'home' && readingMode === 'tarot' && (
           <SpreadSelector onSelect={handleSpreadSelect} />
        )}
        
        {/* Horoscope Placeholder */}
        {user && currentView === 'home' && readingMode === 'horoscope' && (
           <div className="text-center p-8">Horoscope Reading Coming Soon...</div>
        )}

        {/* Oracle Placeholder */}
        {user && currentView === 'home' && readingMode === 'oracle' && (
           <div className="text-center p-8">Oracle Reading Coming Soon...</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0c29] text-slate-200 selection:bg-purple-500/30 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
         {/* Deep Midnight Blue Base */}
         <div className="absolute inset-0 bg-[#0f0c29]"></div>
         {/* Radial Gradients for "Mystical" Atmosphere */}
         <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-purple-900/20 to-transparent"></div>
         <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-[radial-gradient(circle,_rgba(88,28,135,0.2)_0%,_transparent_70%)] blur-3xl"></div>
         <div className="absolute bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-[radial-gradient(circle,_rgba(251,191,36,0.05)_0%,_transparent_70%)] blur-3xl"></div>
         {/* Subtle Noise Texture */}
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      </div>

      <Header onNavigate={handleNavigate} currentView={currentView} />
      <main className="relative z-10">
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
