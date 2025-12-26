import React, { useState, useCallback, useEffect } from 'react';
import { useUser, SignInButton } from '@clerk/clerk-react';
import Header from './components/Header';
import ReadingModeSelector from './components/ReadingModeSelector';
import SpreadSelector from './components/SpreadSelector';
import ActiveReading from './components/ActiveReading';
import HoroscopeReading from './components/HoroscopeReading';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/admin/AdminDashboard';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsOfService from './components/legal/TermsOfService';
import CookiePolicy from './components/legal/CookiePolicy';
import PaymentResult from './components/PaymentResult';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import ErrorBoundary from './components/ui/ErrorBoundary';
import WelcomeModal from './components/WelcomeModal';
import { useApp } from './context/AppContext';
import { SpreadConfig, InterpretationStyle } from './types';
import Button from './components/Button';
import { Star, Shield, Zap } from 'lucide-react';

const App: React.FC = () => {
  const { user, isLoading, language } = useApp();
  const { isSignedIn, isLoaded: clerkLoaded } = useUser();
  const [currentView, setCurrentView] = useState('home');
  const [selectedSpread, setSelectedSpread] = useState<SpreadConfig | null>(null);
  const [readingMode, setReadingMode] = useState<string | null>(null);

  // Check if user is admin (from AppContext or default false)
  const isAdmin = user?.isAdmin || false;

  // Handle payment callback URLs
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/payment/success') {
      setCurrentView('payment-success');
    } else if (path === '/payment/cancelled') {
      setCurrentView('payment-cancelled');
    }
  }, []);

  const handleReadingFinish = useCallback(() => {
    setSelectedSpread(null);
    setCurrentView('home');
    setReadingMode(null);
  }, []);

  const handleReadingModeSelect = (mode: string) => {
    setReadingMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    // Scroll to top when navigating to a new view
    window.scrollTo(0, 0);
    if (view === 'home') {
      setReadingMode(null);
      setSelectedSpread(null);
    }
  }

  const handleSpreadSelect = useCallback((spread: SpreadConfig) => {
    if (user && user.credits >= spread.cost) {
      setSelectedSpread(spread);
      setCurrentView('reading');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert(language === 'en' ? 'Not enough credits!' : 'Pas assez de crédits!');
    }
  }, [user, language]);

  // Navigate and clear URL path - MUST be before early return to follow Rules of Hooks
  const handlePaymentNavigate = useCallback((view: string) => {
    window.history.pushState({}, '', '/');
    setCurrentView(view);
  }, []);

  // Show branded loading screen while Clerk initializes
  if (!clerkLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0c29] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-amber-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Logo/Brand */}
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-purple-300 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            MysticOracle
          </h1>

          {/* Animated tarot cards - sequential bounce */}
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-10 h-14 rounded-lg bg-gradient-to-br from-purple-800 to-indigo-900 border border-amber-500/40 shadow-lg"
                style={{
                  animation: 'bounce 1s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>

          {/* Loading indicator */}
          <div className="flex items-center justify-center gap-2 text-purple-300">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // 1. Payment Result Pages
    if (currentView === 'payment-success') {
      return <PaymentResult type="success" onNavigate={handlePaymentNavigate} />;
    }
    if (currentView === 'payment-cancelled') {
      return <PaymentResult type="cancelled" onNavigate={handlePaymentNavigate} />;
    }

    // 2. Profile View (requires Clerk sign-in)
    if (isSignedIn && currentView === 'profile') {
        return <UserProfile />;
    }

    // 3. Admin View (requires sign-in + admin flag)
    if (isSignedIn && isAdmin && currentView === 'admin') {
        return <AdminDashboard />;
    }

    // 4. Legal Pages (accessible to all)
    if (currentView === 'privacy') {
        return <PrivacyPolicy />;
    }
    if (currentView === 'terms') {
        return <TermsOfService />;
    }
    if (currentView === 'cookies') {
        return <CookiePolicy />;
    }

    // 5. Active Reading View
    if (currentView === 'reading' && selectedSpread) {
      return (
        <ActiveReading
          spread={selectedSpread}
          style={InterpretationStyle.CLASSIC}
          onFinish={handleReadingFinish}
        />
      );
    }

    // 6. Home / Dashboard View
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
            <SignInButton mode="modal">
              <Button size="lg">
                {language === 'en' ? 'Start Your Reading' : 'Commencer Votre Lecture'}
              </Button>
            </SignInButton>
          )}
        </div>

        {/* Feature Highlights (Only for non-authenticated) */}
        {!user && (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 mb-20">
            <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
               <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400"><Star /></div>
               <h3 className="text-xl font-heading text-purple-200 mb-2">
                 {language === 'en' ? 'AI Powered Insights' : 'Insights par IA'}
               </h3>
               <p className="text-slate-400 text-sm">
                 {language === 'en' ? 'Deep, context-aware interpretations powered by AI.' : 'Interprétations profondes et contextuelles alimentées par l\'IA.'}
               </p>
            </div>
            <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
               <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400"><Shield /></div>
               <h3 className="text-xl font-heading text-purple-200 mb-2">
                 {language === 'en' ? 'Private & Secure' : 'Privé & Sécurisé'}
               </h3>
               <p className="text-slate-400 text-sm">
                 {language === 'en' ? 'Your spiritual journey is personal. We respect your privacy.' : 'Votre voyage spirituel est personnel. Nous respectons votre vie privée.'}
               </p>
            </div>
            <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 text-center backdrop-blur-sm hover:border-purple-500/30 transition-colors">
               <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400"><Zap /></div>
               <h3 className="text-xl font-heading text-purple-200 mb-2">
                 {language === 'en' ? 'Instant Clarity' : 'Clarté Instantanée'}
               </h3>
               <p className="text-slate-400 text-sm">
                 {language === 'en' ? 'Get answers to life\'s pressing questions in seconds.' : 'Obtenez des réponses à vos questions en quelques secondes.'}
               </p>
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
        
        {/* Horoscope Reading */}
        {user && currentView === 'home' && readingMode === 'horoscope' && (
           <HoroscopeReading />
        )}

        {/* Oracle Placeholder */}
        {user && currentView === 'home' && readingMode === 'oracle' && (
           <div className="text-center p-8 text-purple-300">
             {language === 'en' ? 'Oracle Reading Coming Soon...' : 'Lecture Oracle Bientôt Disponible...'}
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0c29] text-slate-200 selection:bg-purple-500/30 relative overflow-hidden flex flex-col">
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
      <main className="relative z-10 flex-grow">
        <ErrorBoundary>
          {renderContent()}
        </ErrorBoundary>
      </main>
      <Footer onNavigate={handleNavigate} />
      <CookieConsent onNavigate={handleNavigate} />
      <WelcomeModal />
    </div>
  );
};

export default App;
