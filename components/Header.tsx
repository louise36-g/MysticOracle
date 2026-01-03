import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { Moon, Menu, X, Shield, User, Coins, FileText, HelpCircle, ChevronDown, BookOpen, CreditCard } from 'lucide-react';
import FlagFR from './icons/FlagFR';
import FlagEN from './icons/FlagEN';
import Button from './Button';
import CreditShop from './CreditShop';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  const { user, language, setLanguage } = useApp();
  const { user: clerkUser, isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCreditShop, setShowCreditShop] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Use Clerk user data if AppContext user not synced yet
  const displayName = user?.username || clerkUser?.username || clerkUser?.firstName || 'User';
  const userCredits = user?.credits ?? 3;
  const isAdmin = user?.isAdmin || false;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  }, [language, setLanguage]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const handleNavigate = useCallback((view: string, closeMobile = false) => {
    onNavigate(view);
    setIsMoreMenuOpen(false);
    if (closeMobile) setIsMobileMenuOpen(false);
  }, [onNavigate]);

  const handleMobileLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'fr' : 'en');
    setIsMobileMenuOpen(false);
  }, [language, setLanguage]);

  // Check if any "More" menu item is active
  const isMoreActive = ['blog', 'blog-post', 'faq', 'how-credits-work'].includes(currentView);

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
        <nav className="hidden md:flex items-center gap-4" role="navigation" aria-label="Main navigation">
          <button
            onClick={() => handleNavigate('home')}
            className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${currentView === 'home' ? 'text-amber-400 bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            aria-current={currentView === 'home' ? 'page' : undefined}
          >
            {language === 'en' ? 'Home' : 'Accueil'}
          </button>

          {/* More Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setIsMoreMenuOpen(prev => !prev)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${isMoreActive ? 'text-amber-400 bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              aria-expanded={isMoreMenuOpen}
              aria-haspopup="true"
            >
              {language === 'en' ? 'Explore' : 'Explorer'}
              <ChevronDown className={`w-4 h-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isMoreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                >
                  <div className="p-2">
                    <button
                      onClick={() => handleNavigate('blog')}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-colors ${currentView === 'blog' || currentView === 'blog-post' ? 'bg-purple-500/20 text-purple-200' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Blog</div>
                        <div className="text-xs text-slate-500">{language === 'en' ? 'Articles & guides' : 'Articles & guides'}</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavigate('how-credits-work')}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-colors ${currentView === 'how-credits-work' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{language === 'en' ? 'Credits' : 'Crédits'}</div>
                        <div className="text-xs text-slate-500">{language === 'en' ? 'How credits work' : 'Comment ça marche'}</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavigate('faq')}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-colors ${currentView === 'faq' ? 'bg-blue-500/20 text-blue-200' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{language === 'en' ? 'Help & FAQ' : 'Aide & FAQ'}</div>
                        <div className="text-xs text-slate-500">{language === 'en' ? 'Get answers' : 'Trouvez des réponses'}</div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isSignedIn && (
            <button
              onClick={() => setShowCreditShop(true)}
              data-credit-counter
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 hover:bg-purple-800/40 hover:border-purple-400/50 transition-colors cursor-pointer"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-purple-100">{userCredits}</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => handleNavigate('admin')}
              className={`flex items-center gap-1 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${currentView === 'admin' ? 'text-amber-400 bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNavigate('profile')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${currentView === 'profile' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                <User className="w-4 h-4" />
                <span className="text-sm hidden lg:inline">{displayName}</span>
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
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-b border-white/10 overflow-hidden"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="p-4 space-y-2">
              {isSignedIn && (
                <div className="flex items-center justify-between bg-purple-900/20 p-3 rounded-lg mb-4">
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
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'home' ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
                onClick={() => handleNavigate('home', true)}
              >
                <Moon className="w-5 h-5" />
                {language === 'en' ? 'Home' : 'Accueil'}
              </button>

              <button
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'blog' || currentView === 'blog-post' ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
                onClick={() => handleNavigate('blog', true)}
              >
                <BookOpen className="w-5 h-5" />
                Blog
              </button>

              <button
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'how-credits-work' ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
                onClick={() => handleNavigate('how-credits-work', true)}
              >
                <CreditCard className="w-5 h-5" />
                {language === 'en' ? 'How Credits Work' : 'Comment fonctionnent les crédits'}
              </button>

              <button
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'faq' ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
                onClick={() => handleNavigate('faq', true)}
              >
                <HelpCircle className="w-5 h-5" />
                {language === 'en' ? 'Help & FAQ' : 'Aide & FAQ'}
              </button>

              {isSignedIn && (
                <button
                  className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'profile' ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
                  onClick={() => handleNavigate('profile', true)}
                >
                  <User className="w-5 h-5" />
                  {language === 'en' ? 'My Account' : 'Mon Compte'}
                </button>
              )}

              {isAdmin && (
                <button
                  className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'admin' ? 'bg-white/5 text-amber-400' : 'text-amber-400/80 hover:bg-white/5'}`}
                  onClick={() => handleNavigate('admin', true)}
                >
                  <Shield className="w-5 h-5" />
                  Admin
                </button>
              )}

              <div className="border-t border-white/10 pt-4 mt-4">
                <button
                  className="flex items-center gap-3 w-full text-left p-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors"
                  onClick={handleMobileLanguage}
                >
                  {language === 'en' ? (
                    <>
                      <FlagFR className="w-5 h-5" />
                      <span>Passer en Français</span>
                    </>
                  ) : (
                    <>
                      <FlagEN className="w-5 h-5" />
                      <span>Switch to English</span>
                    </>
                  )}
                </button>
              </div>

              <SignedOut>
                <div className="pt-2">
                  <SignInButton mode="modal">
                    <Button className="w-full" variant="primary">
                      {language === 'en' ? 'Sign In' : 'Connexion'}
                    </Button>
                  </SignInButton>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center justify-center pt-4">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'w-10 h-10'
                      }
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Credit Shop Modal */}
      <CreditShop isOpen={showCreditShop} onClose={() => setShowCreditShop(false)} />
    </header>
  );
};

export default memo(Header);
