import React, { useState, useCallback, memo } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { Moon, Menu, X, Shield, User, Coins, FileText } from 'lucide-react';
import FlagFR from './icons/FlagFR';
import FlagEN from './icons/FlagEN';
import Button from './Button';
import CreditShop from './CreditShop';

interface HeaderProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  const { user, language, setLanguage, logout } = useApp();
  const { user: clerkUser, isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCreditShop, setShowCreditShop] = useState(false);

  // Use Clerk user data if AppContext user not synced yet
  const displayName = user?.username || clerkUser?.username || clerkUser?.firstName || 'User';
  const userCredits = user?.credits ?? 10; // Default 10 credits for new users
  const isAdmin = user?.isAdmin || false;

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  }, [language, setLanguage]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Consolidated navigation handler for both desktop and mobile
  const handleNavigate = useCallback((view: string, closeMobile = false) => {
    onNavigate(view);
    if (closeMobile) setIsMobileMenuOpen(false);
  }, [onNavigate]);

  const handleMobileLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'fr' : 'en');
    setIsMobileMenuOpen(false);
  }, [language, setLanguage]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md" role="banner">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 cursor-pointer"
          onClick={(e) => { e.preventDefault(); handleNavigate('home'); }}
          aria-label="MysticOracle - Go to homepage"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center" aria-hidden="true">
            <Moon className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-100 to-purple-200">
            MysticOracle
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Main navigation">
          <button
            onClick={() => handleNavigate('home')}
            className={`text-sm font-medium transition-colors ${currentView === 'home' ? 'text-amber-400' : 'text-slate-300 hover:text-white'}`}
            aria-current={currentView === 'home' ? 'page' : undefined}
          >
            {language === 'en' ? 'Home' : 'Accueil'}
          </button>

          <button
            onClick={() => handleNavigate('blog')}
            className={`flex items-center gap-1 text-sm font-medium transition-colors ${currentView === 'blog' || currentView === 'blog-post' ? 'text-amber-400' : 'text-slate-300 hover:text-white'}`}
            aria-current={currentView === 'blog' ? 'page' : undefined}
          >
            <FileText className="w-4 h-4" />
            Blog
          </button>

          {isSignedIn && (
             <button
                onClick={() => setShowCreditShop(true)}
                data-credit-counter
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 hover:bg-purple-800/40 hover:border-purple-400/50 transition-colors cursor-pointer"
             >
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-purple-100">{userCredits} {language === 'en' ? 'Credits' : 'Crédits'}</span>
             </button>
          )}

          {isAdmin && (
            <button
              onClick={() => handleNavigate('admin')}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${currentView === 'admin' ? 'text-amber-400' : 'text-slate-300 hover:text-white'}`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
          )}

          <button
            onClick={toggleLanguage}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
            aria-label={language === 'en' ? 'Switch to French' : 'Switch to English'}
            title={language === 'en' ? 'Switch to French' : 'Passer en anglais'}
          >
            {language === 'en' ? <FlagEN className="w-5 h-5" aria-hidden="true" /> : <FlagFR className="w-5 h-5" aria-hidden="true" />}
          </button>

          {/* Clerk Auth Components */}
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="primary" size="sm">
                {language === 'en' ? 'Sign In' : 'Connexion'}
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleNavigate('profile')}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${currentView === 'profile' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                <User className="w-4 h-4" />
                <span className="text-sm">{displayName}</span>
              </button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8'
                  }
                }}
              />
            </div>
          </SignedIn>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-slate-300"
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <nav id="mobile-menu" className="md:hidden bg-slate-900 border-b border-white/10 p-4 space-y-4" role="navigation" aria-label="Mobile navigation">
           {isSignedIn && (
             <div className="flex items-center justify-between bg-purple-900/20 p-3 rounded-lg">
                <button onClick={() => handleNavigate('profile', true)} className="text-slate-300 font-bold hover:text-white transition-colors">
                  {displayName}
                </button>
                <button
                  onClick={() => { setShowCreditShop(true); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-2 font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Coins className="w-4 h-4" />
                  {userCredits} {language === 'en' ? 'Credits' : 'Crédits'}
                </button>
             </div>
          )}
          <button
            className="block w-full text-left py-2 text-slate-300"
            onClick={() => handleNavigate('home', true)}
          >
            {language === 'en' ? 'Home' : 'Accueil'}
          </button>

          <button
            className="flex items-center gap-2 w-full text-left py-2 text-slate-300"
            onClick={() => handleNavigate('blog', true)}
          >
            <FileText className="w-4 h-4" />
            Blog
          </button>

          {isSignedIn && (
              <button
                className="block w-full text-left py-2 text-slate-300"
                onClick={() => handleNavigate('profile', true)}
              >
                {language === 'en' ? 'My Account' : 'Mon Compte'}
              </button>
          )}

          {isAdmin && (
              <button
                className="flex items-center gap-2 w-full text-left py-2 text-amber-400"
                onClick={() => handleNavigate('admin', true)}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
          )}

          <button
            className="flex items-center gap-2 w-full text-left py-2 text-slate-300"
            onClick={handleMobileLanguage}
          >
             {language === 'en' ? (
                <>
                   <FlagFR className="w-5 h-5" />
                   <span>Switch to French</span>
                </>
             ) : (
                <>
                   <FlagEN className="w-5 h-5" />
                   <span>Passer en Anglais</span>
                </>
             )}
          </button>
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="w-full" variant="primary">
                {language === 'en' ? 'Sign In' : 'Connexion'}
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center justify-center py-2">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10'
                  }
                }}
              />
            </div>
          </SignedIn>
        </nav>
      )}

      {/* Credit Shop Modal */}
      <CreditShop isOpen={showCreditShop} onClose={() => setShowCreditShop(false)} />
    </header>
  );
};

export default memo(Header);
