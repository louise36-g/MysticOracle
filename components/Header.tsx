import React, { useState, useCallback, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { useReading } from '../context/ReadingContext';
import { ROUTES } from '../routes/routes';
import { Menu, X, Shield, User, Coins, BookOpen, HelpCircle, CreditCard, Home, Sparkles, Plus, Mail } from 'lucide-react';
import FlagFR from './icons/FlagFR';
import FlagEN from './icons/FlagEN';
import Button from './Button';
import CreditShop from './CreditShop';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  // Props no longer needed - navigation handled via React Router
}

const Header: React.FC<HeaderProps> = () => {
  const { user, language, setLanguage, t } = useApp();
  const { user: clerkUser, isSignedIn } = useUser();
  const { hasStartedReading, clearReading } = useReading();
  const navigate = useNavigate();
  const location = useLocation();
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

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleMobileLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'fr' : 'en');
    setIsMobileMenuOpen(false);
  }, [language, setLanguage]);

  // Handle "New Reading" with confirmation if mid-reading
  const handleNewReading = useCallback((e: React.MouseEvent) => {
    // If on reading page with in-progress reading, confirm before reset
    if (location.pathname.startsWith('/reading') && hasStartedReading()) {
      e.preventDefault();
      const message = t('header.new_reading_confirm', 'Start a new reading? Current progress will be lost.');
      if (confirm(message)) {
        clearReading();
        navigate(ROUTES.READING);
      }
    }
    // Otherwise let normal Link behavior happen
  }, [location.pathname, hasStartedReading, clearReading, navigate, language]);

  // Helper to check if path is active
  const isActive = useCallback((path: string) => {
    if (path === ROUTES.HOME) {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-500/20 bg-[#28174e]/95 backdrop-blur-md" role="banner">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2 cursor-pointer"
          aria-label="CelestiArcana - Go to homepage"
        >
          <img
            src="/logos/celestiarcana-comet-cream.svg"
            alt=""
            className="h-10 w-auto"
            aria-hidden="true"
          />
          <span className="text-xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-100 to-purple-200">
            CelestiArcana
          </span>
        </Link>

        {/* Desktop Nav - Simplified */}
        <nav className="hidden md:flex items-center gap-3" role="navigation" aria-label="Main navigation">
          {isSignedIn && (
            <>
              <button
                onClick={() => setShowCreditShop(true)}
                data-credit-counter
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 hover:bg-purple-800/40 hover:border-purple-400/50 transition-colors cursor-pointer"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-purple-100">{userCredits}</span>
              </button>
              <button
                onClick={() => setShowCreditShop(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/50 hover:border-purple-400 hover:bg-purple-900/30 transition-colors text-purple-200 hover:text-white text-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('header.buy_credits', 'Buy Credits')}</span>
              </button>
            </>
          )}

          {isAdmin && (
            <Link
              to={ROUTES.ADMIN}
              className={`flex items-center gap-1 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${isActive(ROUTES.ADMIN) ? 'text-amber-400 bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}

          <button
            onClick={toggleLanguage}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
            aria-label={language === 'en' ? t('header.switch_to_french', 'Switch to French') : t('header.switch_to_english', 'Switch to English')}
            title={language === 'en' ? t('header.switch_to_french', 'Switch to French') : t('header.switch_to_english_fr', 'Passer en anglais')}
          >
            {language === 'en' ? <FlagEN className="w-5 h-5" aria-hidden="true" /> : <FlagFR className="w-5 h-5" aria-hidden="true" />}
          </button>

          <SignedOut>
            <Link to={ROUTES.SIGN_IN}>
              <Button variant="primary" size="sm">
                {t('nav.signIn', 'Sign In')}
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-3">
              <Link
                to={ROUTES.PROFILE}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${isActive(ROUTES.PROFILE) ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                <User className="w-4 h-4" />
                <span className="text-sm hidden lg:inline">{displayName}</span>
              </Link>
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
            className="md:hidden bg-[#28174e] border-b border-purple-500/20 overflow-hidden"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="p-4 space-y-2">
              {isSignedIn && (
                <div className="flex items-center justify-between bg-purple-900/20 p-3 rounded-lg mb-4">
                  <Link to={ROUTES.PROFILE} onClick={closeMobileMenu} className="text-slate-300 font-bold hover:text-white transition-colors">
                    {displayName}
                  </Link>
                  <div className="flex items-center gap-2 text-amber-400">
                    <Coins className="w-4 h-4" />
                    <span className="font-bold">{userCredits}</span>
                  </div>
                </div>
              )}

              {isSignedIn && (
                <button
                  onClick={() => { setShowCreditShop(true); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full text-left p-3 rounded-lg bg-purple-900/40 border border-purple-500/30 hover:bg-purple-800/40 transition-colors text-purple-200 hover:text-white mb-2"
                >
                  <Plus className="w-5 h-5" />
                  {t('header.buy_credits_mobile', 'Buy Credits')}
                </button>
              )}

              <Link
                to={ROUTES.HOME}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.HOME) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Home className="w-5 h-5" />
                {t('nav.home', 'Home')}
              </Link>

              <Link
                to={ROUTES.READING}
                onClick={(e) => { handleNewReading(e); closeMobileMenu(); }}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.READING) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Sparkles className="w-5 h-5" />
                {t('header.new_reading', 'New Reading')}
              </Link>

              <Link
                to={ROUTES.BLOG}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.BLOG) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <BookOpen className="w-5 h-5" />
                Blog
              </Link>

              <Link
                to={ROUTES.HOW_CREDITS_WORK}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.HOW_CREDITS_WORK) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <CreditCard className="w-5 h-5" />
                {t('header.how_credits_work', 'How Credits Work')}
              </Link>

              <Link
                to={ROUTES.FAQ}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.FAQ) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <HelpCircle className="w-5 h-5" />
                {t('header.help_faq', 'Help & FAQ')}
              </Link>

              <Link
                to={ROUTES.CONTACT}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.CONTACT) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Mail className="w-5 h-5" />
                Contact
              </Link>

              {isSignedIn && (
                <Link
                  to={ROUTES.PROFILE}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.PROFILE) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <User className="w-5 h-5" />
                  {t('header.my_account', 'My Account')}
                </Link>
              )}

              {isAdmin && (
                <Link
                  to={ROUTES.ADMIN}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.ADMIN) ? 'bg-white/5 text-amber-400' : 'text-amber-400/80 hover:bg-white/5'}`}
                >
                  <Shield className="w-5 h-5" />
                  Admin
                </Link>
              )}

              <div className="border-t border-white/10 pt-4 mt-4">
                <button
                  className="flex items-center gap-3 w-full text-left p-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors"
                  onClick={handleMobileLanguage}
                >
                  {language === 'en' ? (
                    <>
                      <FlagFR className="w-5 h-5" />
                      <span>{t('header.switch_to_french_label', 'Passer en Français')}</span>
                    </>
                  ) : (
                    <>
                      <FlagEN className="w-5 h-5" />
                      <span>{t('header.switch_to_english_label', 'Switch to English')}</span>
                    </>
                  )}
                </button>
              </div>

              <SignedOut>
                <div className="pt-2">
                  <Link to={ROUTES.SIGN_IN} onClick={closeMobileMenu}>
                    <Button className="w-full" variant="primary">
                      {t('nav.signIn', 'Sign In')}
                    </Button>
                  </Link>
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
