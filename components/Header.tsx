import React, { useState, useCallback, memo } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { Moon, Menu, X, Shield, User, Coins, BookOpen, HelpCircle, CreditCard, Home } from 'lucide-react';
import FlagFR from './icons/FlagFR';
import FlagEN from './icons/FlagEN';
import Button from './Button';
import CreditShop from './CreditShop';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartLink } from './SmartLink';

interface HeaderProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  const { user, language, setLanguage, t } = useApp();
  const { user: clerkUser, isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCreditShop, setShowCreditShop] = useState(false);

  const displayName = user?.username || clerkUser?.username || clerkUser?.firstName || 'User';
  const userCredits = user?.credits ?? 3;
  const isAdmin = user?.isAdmin || false;

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  }, [language, setLanguage]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

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
        <SmartLink
          href="/"
          onClick={() => handleNavigate('home')}
          className="flex items-center gap-2 cursor-pointer"
          ariaLabel="MysticOracle - Go to homepage"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center" aria-hidden="true">
            <Moon className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-100 to-purple-200">
            MysticOracle
          </span>
        </SmartLink>

        {/* Desktop Nav - Simplified */}
        <nav className="hidden md:flex items-center gap-3" role="navigation" aria-label="Main navigation">
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
            <SmartLink
              href="/admin"
              onClick={() => handleNavigate('admin')}
              className={`flex items-center gap-1 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${currentView === 'admin' ? 'text-amber-400 bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </SmartLink>
          )}

          <button
            onClick={toggleLanguage}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
            aria-label={t('nav.switchLanguageLabel', language === 'en' ? 'Switch to French' : 'Switch to English')}
            title={t('nav.switchLanguageTitle', language === 'en' ? 'Switch to French' : 'Passer en anglais')}
          >
            {language === 'en' ? <FlagEN className="w-5 h-5" aria-hidden="true" /> : <FlagFR className="w-5 h-5" aria-hidden="true" />}
          </button>

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="primary" size="sm">
                {t('nav.signIn', 'Sign In')}
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-3">
              <SmartLink
                href="/profile"
                onClick={() => handleNavigate('profile')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${currentView === 'profile' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                <User className="w-4 h-4" />
                <span className="text-sm hidden lg:inline">{displayName}</span>
              </SmartLink>
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
                  <SmartLink href="/profile" onClick={() => handleNavigate('profile', true)} className="text-slate-300 font-bold hover:text-white transition-colors">
                    {displayName}
                  </SmartLink>
                  <button
                    onClick={() => { setShowCreditShop(true); setIsMobileMenuOpen(false); }}
                    className="flex items-center gap-2 font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <Coins className="w-4 h-4" />
                    {userCredits} {t('nav.credits', 'Credits')}
                  </button>
                </div>
              )}

              <SmartLink
                href="/"
                onClick={() => handleNavigate('home', true)}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'home' && !isMobileMenuOpen ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Home className="w-5 h-5" />
                {t('nav.home', 'Home')}
              </SmartLink>

              <SmartLink
                href="/blog"
                onClick={() => handleNavigate('blog', true)}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'blog' || currentView === 'blog-post' ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <BookOpen className="w-5 h-5" />
                Blog
              </SmartLink>

              <SmartLink
                href="/how-credits-work"
                onClick={() => handleNavigate('how-credits-work', true)}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'how-credits-work' ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <CreditCard className="w-5 h-5" />
                {t('nav.howCreditsWork', 'How Credits Work')}
              </SmartLink>

              <SmartLink
                href="/faq"
                onClick={() => handleNavigate('faq', true)}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'faq' ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <HelpCircle className="w-5 h-5" />
                {t('nav.helpFaq', 'Help & FAQ')}
              </SmartLink>

              {isSignedIn && (
                <SmartLink
                  href="/profile"
                  onClick={() => handleNavigate('profile', true)}
                  className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'profile' ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <User className="w-5 h-5" />
                  {t('nav.myAccount', 'My Account')}
                </SmartLink>
              )}

              {isAdmin && (
                <SmartLink
                  href="/admin"
                  onClick={() => handleNavigate('admin', true)}
                  className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${currentView === 'admin' ? 'bg-white/5 text-amber-400' : 'text-amber-400/80 hover:bg-white/5'}`}
                >
                  <Shield className="w-5 h-5" />
                  Admin
                </SmartLink>
              )}

              <div className="border-t border-white/10 pt-4 mt-4">
                <button
                  className="flex items-center gap-3 w-full text-left p-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors"
                  onClick={handleMobileLanguage}
                >
                  {language === 'en' ? (
                    <>
                      <FlagFR className="w-5 h-5" />
                      <span>{t('nav.switchToFrench', 'Passer en Français')}</span>
                    </>
                  ) : (
                    <>
                      <FlagEN className="w-5 h-5" />
                      <span>{t('nav.switchToEnglish', 'Switch to English')}</span>
                    </>
                  )}
                </button>
              </div>

              <SignedOut>
                <div className="pt-2">
                  <SignInButton mode="modal">
                    <Button className="w-full" variant="primary">
                      {t('nav.signIn', 'Sign In')}
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
