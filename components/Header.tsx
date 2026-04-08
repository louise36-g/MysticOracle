import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { useReading } from '../context/ReadingContext';
import { ROUTES } from '../routes/routes';
import { getAlternatePath } from '../utils/language';
import {
  Menu, X, Shield, User, Coins, ChevronDown, Plus,
  BookOpen, HelpCircle, CreditCard, Layers, Home,
  Sparkles, Hand, Moon, Mail, CircleHelp
} from 'lucide-react';
import FlagFR from './icons/FlagFR';
import FlagEN from './icons/FlagEN';
import Button from './Button';
import LocalizedLink from './LocalizedLink';
import CreditShop from './CreditShop';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownItem {
  id: string;
  labelEn: string;
  labelFr: string;
  descriptionEn?: string;
  descriptionFr?: string;
  icon: React.ReactNode;
  iconBg: string;
  href: string;
}

const Header: React.FC = () => {
  const { user, language, t } = useApp();
  const { user: clerkUser, isSignedIn } = useUser();
  const { hasStartedReading, clearReading } = useReading();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCreditShop, setShowCreditShop] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showAuthToast, setShowAuthToast] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayName = user?.username || clerkUser?.username || clerkUser?.firstName || 'User';
  const userCredits = user?.credits ?? 3;
  const isAdmin = user?.isAdmin || false;

  useEffect(() => {
    return () => {
      if (authToastTimeoutRef.current) clearTimeout(authToastTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // --- Handlers ---

  const toggleLanguage = useCallback(() => {
    const alternatePath = getAlternatePath(location.pathname);
    navigate(alternatePath + location.search + location.hash);
  }, [location, navigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleMobileLanguage = useCallback(() => {
    const alternatePath = getAlternatePath(location.pathname);
    navigate(alternatePath + location.search + location.hash);
    setIsMobileMenuOpen(false);
  }, [location, navigate]);

  const handleNewReading = useCallback((e: React.MouseEvent) => {
    if (location.pathname.startsWith('/tarot-card-reading') && hasStartedReading()) {
      e.preventDefault();
      const message = t('header.new_reading_confirm', 'Start a new reading? Current progress will be lost.');
      if (confirm(message)) {
        clearReading();
        navigate(ROUTES.READING);
      }
    }
  }, [location.pathname, hasStartedReading, clearReading, navigate, language]);

  const isActive = useCallback((path: string) => {
    if (path === ROUTES.HOME) return location.pathname === '/';
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  // --- Dropdown handlers ---

  const handleMouseEnter = (name: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(name);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const handleItemClick = () => {
    setOpenDropdown(null);
  };

  const handleDropdownKeyDown = (name: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpenDropdown(name);
      requestAnimationFrame(() => {
        const dropdown = document.getElementById(`${name}-dropdown`);
        const firstLink = dropdown?.querySelector<HTMLElement>('a');
        firstLink?.focus();
      });
    }
    if (e.key === 'Escape') {
      setOpenDropdown(null);
    }
  };

  const handleDropdownItemKeyDown = (name: string, index: number, total: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpenDropdown(null);
      document.getElementById(`${name}-trigger`)?.focus();
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const dropdown = document.getElementById(`${name}-dropdown`);
      const links = dropdown?.querySelectorAll<HTMLElement>('a');
      if (links && index < total - 1) links[index + 1]?.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index === 0) {
        setOpenDropdown(null);
        document.getElementById(`${name}-trigger`)?.focus();
      } else {
        const dropdown = document.getElementById(`${name}-dropdown`);
        const links = dropdown?.querySelectorAll<HTMLElement>('a');
        if (links) links[index - 1]?.focus();
      }
    }
  };

  // --- Learn dropdown items ---

  const learnItems: DropdownItem[] = [
    {
      id: 'about',
      labelEn: 'About Me',
      labelFr: 'À Propos de Moi',
      descriptionEn: 'My story',
      descriptionFr: 'Mon histoire',
      icon: <User className="w-4 h-4 text-pink-400" />,
      iconBg: 'bg-pink-500/20',
      href: ROUTES.ABOUT,
    },
    {
      id: 'tarot-cards',
      labelEn: 'The Arcanas',
      labelFr: 'Les Arcanes',
      descriptionEn: 'Explore all 78 cards',
      descriptionFr: 'Explorez les 78 cartes',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      iconBg: 'bg-purple-500/20',
      href: ROUTES.TAROT_CARDS,
    },
    {
      id: 'blog',
      labelEn: 'Blog',
      labelFr: 'Blog',
      descriptionEn: 'Articles & guides',
      descriptionFr: 'Articles & guides',
      icon: <BookOpen className="w-4 h-4 text-purple-400" />,
      iconBg: 'bg-purple-500/20',
      href: ROUTES.BLOG,
    },
    {
      id: 'how-credits-work',
      labelEn: 'How Credits Work',
      labelFr: 'Comment fonctionnent les crédits',
      descriptionEn: 'Pricing & packages',
      descriptionFr: 'Tarifs & forfaits',
      icon: <CreditCard className="w-4 h-4 text-amber-400" />,
      iconBg: 'bg-amber-500/20',
      href: ROUTES.HOW_CREDITS_WORK,
    },
    {
      id: 'faq',
      labelEn: 'Help & FAQ',
      labelFr: 'Aide & FAQ',
      descriptionEn: 'Get answers',
      descriptionFr: 'Trouvez des réponses',
      icon: <HelpCircle className="w-4 h-4 text-blue-400" />,
      iconBg: 'bg-blue-500/20',
      href: ROUTES.FAQ,
    }
  ];

  const isLearnActive = isActive('/blog') || isActive('/faq') || isActive('/how-credits-work') || isActive('/about') || isActive('/tarot');

  // --- Render helpers ---

  const renderDropdown = (name: string, items: DropdownItem[]) => (
    <motion.div
      id={`${name}-dropdown`}
      role="menu"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
    >
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {items.map((item, index) => (
          <LocalizedLink
            key={item.id}
            to={item.href}
            role="menuitem"
            onClick={handleItemClick}
            onKeyDown={handleDropdownItemKeyDown(name, index, items.length)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all hover:bg-white/5 hover:scale-[1.02] cursor-pointer"
          >
            <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm text-slate-200">
                {language === 'fr' ? item.labelFr : item.labelEn}
              </span>
              {(item.descriptionEn || item.descriptionFr) && (
                <div className="text-xs text-slate-500 truncate">
                  {language === 'fr' ? item.descriptionFr : item.descriptionEn}
                </div>
              )}
            </div>
          </LocalizedLink>
        ))}
      </div>
    </motion.div>
  );

  // Nav link style helper
  const linkClass = (active: boolean) =>
    `relative px-3 h-full flex items-center text-sm font-medium transition-colors ${
      active ? 'text-white' : 'text-slate-400 hover:text-white'
    }`;

  const activeBar = <span className="absolute bottom-0 inset-x-2 h-0.5 bg-amber-400 rounded-full" />;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-500/20 bg-[#0f0c29]/90 backdrop-blur-md" role="banner">
      <div className="container mx-auto px-4 h-14 flex items-center">
        {/* Logo */}
        <LocalizedLink
          to={ROUTES.HOME}
          className="flex items-center gap-2 flex-shrink-0"
          aria-label="CelestiArcana - Go to homepage"
        >
          <img
            src="/logos/celestiarcana-moon.webp"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 object-cover"
            aria-hidden="true"
          />
          <span className="text-lg font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-100 to-purple-200">
            CelestiArcana
          </span>
        </LocalizedLink>

        {/* Desktop Nav Links — text only, no icons */}
        <nav className="hidden lg:flex items-center justify-center flex-1 h-full gap-0.5 mx-4" role="navigation" aria-label="Main navigation">
          <LocalizedLink to={ROUTES.HOME} className={linkClass(isActive(ROUTES.HOME))}>
            {language === 'fr' ? 'Accueil' : 'Home'}
            {isActive(ROUTES.HOME) && activeBar}
          </LocalizedLink>

          <LocalizedLink
            to={ROUTES.READING}
            onClick={handleNewReading}
            className={linkClass(isActive('/tarot-card-reading'))}
          >
            {language === 'fr' ? 'Tirages de Tarot' : 'Tarot Readings'}
            {isActive('/tarot-card-reading') && activeBar}
          </LocalizedLink>

          <LocalizedLink to={ROUTES.YES_NO} className={linkClass(isActive('/tarot-yes-no'))}>
            {language === 'fr' ? 'Oui/Non' : 'Yes/No'}
            {isActive('/tarot-yes-no') && activeBar}
          </LocalizedLink>

          {/* My Cards — auth-gated */}
          {isSignedIn ? (
            <LocalizedLink to={ROUTES.INTERPRET} className={linkClass(isActive('/tarot-interpret'))}>
              {language === 'fr' ? 'Mes Cartes' : 'My Cards'}
              {isActive('/tarot-interpret') && activeBar}
            </LocalizedLink>
          ) : (
            <div className="relative h-full">
              <button
                onClick={() => {
                  setShowAuthToast(true);
                  if (authToastTimeoutRef.current) clearTimeout(authToastTimeoutRef.current);
                  authToastTimeoutRef.current = setTimeout(() => setShowAuthToast(false), 4000);
                }}
                className={`${linkClass(false)} cursor-pointer`}
              >
                {language === 'fr' ? 'Mes Cartes' : 'My Cards'}
              </button>
              <AnimatePresence>
                {showAuthToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-3 text-center z-[100]"
                  >
                    <p className="text-sm text-slate-300 mb-2">
                      {language === 'fr'
                        ? 'Pour interpréter vos cartes, veuillez vous connecter.'
                        : 'To interpret your cards, please sign in.'}
                    </p>
                    <Link
                      to={ROUTES.SIGN_IN}
                      onClick={() => setShowAuthToast(false)}
                      className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {language === 'fr' ? 'Se connecter' : 'Sign in'}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <LocalizedLink to={ROUTES.HOROSCOPES} className={linkClass(isActive('/horoscopes'))}>
            Horoscopes
            {isActive('/horoscopes') && activeBar}
          </LocalizedLink>

          {/* Divider */}
          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Learn Dropdown */}
          <div
            className="relative h-full"
            onMouseEnter={() => handleMouseEnter('learn')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              id="learn-trigger"
              aria-expanded={openDropdown === 'learn'}
              aria-controls="learn-dropdown"
              aria-haspopup="true"
              onKeyDown={handleDropdownKeyDown('learn')}
              className={`relative px-3 h-full flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer ${
                isLearnActive || openDropdown === 'learn' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'fr' ? 'Apprendre' : 'Learn'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'learn' ? 'rotate-180' : ''}`} />
              {isLearnActive && activeBar}
            </button>
            <AnimatePresence>
              {openDropdown === 'learn' && renderDropdown('learn', learnItems)}
            </AnimatePresence>
          </div>

          <LocalizedLink to={ROUTES.CONTACT} className={linkClass(isActive('/contact'))}>
            Contact
            {isActive('/contact') && activeBar}
          </LocalizedLink>
        </nav>

        {/* Desktop Utility Items */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <SignedIn>
            <button
              onClick={() => setShowCreditShop(true)}
              data-credit-counter
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 hover:bg-purple-800/40 hover:border-purple-400/50 transition-colors cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-bold text-purple-100">{userCredits}</span>
            </button>
            <LocalizedLink
              to={ROUTES.PROFILE}
              className={`text-sm font-medium transition-colors px-2.5 py-1.5 rounded-md ${
                isActive(ROUTES.PROFILE) ? 'text-amber-400 bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('header.my_account', 'My Account')}
            </LocalizedLink>
          </SignedIn>

          {isAdmin && (
            <Link
              to={ROUTES.ADMIN}
              className={`text-sm font-medium transition-colors px-2.5 py-1.5 rounded-md ${
                isActive(ROUTES.ADMIN) ? 'text-amber-400 bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Admin
            </Link>
          )}

          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 min-h-[44px] flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-amber-400/20 hover:border-amber-300/50 text-white transition-colors"
            aria-label={language === 'en' ? t('header.switch_to_french', 'Switch to French') : t('header.switch_to_english', 'Switch to English')}
            title={language === 'en' ? t('header.switch_to_french', 'Switch to French') : t('header.switch_to_english_fr', 'Passer en anglais')}
          >
            {language === 'en' ? <FlagFR className="w-7 h-7" aria-hidden="true" /> : <FlagEN className="w-7 h-7" aria-hidden="true" />}
            <span className="text-sm font-semibold tracking-wide">{language === 'en' ? 'FR' : 'EN'}</span>
          </button>

          <SignedOut>
            <Link to={ROUTES.SIGN_IN}>
              <Button variant="primary" size="sm">
                {t('nav.signIn', 'Sign In')}
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8'
                }
              }}
            />
          </SignedIn>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden ml-auto p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300"
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
            className="lg:hidden bg-[#0f0c29] border-b border-purple-500/20 overflow-hidden"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="p-4 space-y-2">
              {isSignedIn && (
                <div className="flex items-center justify-between bg-purple-900/20 p-3 rounded-lg mb-4">
                  <LocalizedLink to={ROUTES.PROFILE} onClick={closeMobileMenu} className="text-slate-300 font-bold hover:text-white transition-colors">
                    {displayName}
                  </LocalizedLink>
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

              <LocalizedLink
                to={ROUTES.HOME}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.HOME) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Home className="w-5 h-5" />
                {t('nav.home', 'Home')}
              </LocalizedLink>

              <LocalizedLink
                to={ROUTES.READING}
                onClick={(e) => { handleNewReading(e); closeMobileMenu(); }}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive('/tarot-card-reading') ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Sparkles className="w-5 h-5" />
                {t('header.new_reading', 'New Reading')}
              </LocalizedLink>

              <LocalizedLink
                to={ROUTES.YES_NO}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive('/tarot-yes-no') ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <CircleHelp className="w-5 h-5" />
                {language === 'fr' ? 'Oui/Non' : 'Yes/No'}
              </LocalizedLink>

              <LocalizedLink
                to={ROUTES.INTERPRET}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive('/tarot-interpret') ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Hand className="w-5 h-5" />
                {language === 'fr' ? 'Mes Cartes' : 'My Cards'}
              </LocalizedLink>

              <LocalizedLink
                to={ROUTES.HOROSCOPES}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive('/horoscopes') ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Moon className="w-5 h-5" />
                Horoscopes
              </LocalizedLink>

              <LocalizedLink
                to={ROUTES.BLOG}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.BLOG) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <BookOpen className="w-5 h-5" />
                Blog
              </LocalizedLink>

              <LocalizedLink
                to={ROUTES.HOW_CREDITS_WORK}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.HOW_CREDITS_WORK) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <CreditCard className="w-5 h-5" />
                {t('header.how_credits_work', 'How Credits Work')}
              </LocalizedLink>

              <LocalizedLink
                to={ROUTES.FAQ}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.FAQ) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <HelpCircle className="w-5 h-5" />
                {t('header.help_faq', 'Help & FAQ')}
              </LocalizedLink>

              <LocalizedLink
                to={ROUTES.CONTACT}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive('/contact') ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Mail className="w-5 h-5" />
                Contact
              </LocalizedLink>

              {isSignedIn && (
                <LocalizedLink
                  to={ROUTES.PROFILE}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors ${isActive(ROUTES.PROFILE) ? 'bg-white/5 text-amber-400' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <User className="w-5 h-5" />
                  {t('header.my_account', 'My Account')}
                </LocalizedLink>
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
                  className="flex items-center gap-3 w-full text-left p-3 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-amber-400/20 hover:border-amber-300/50 transition-colors"
                  onClick={handleMobileLanguage}
                >
                  {language === 'en' ? (
                    <>
                      <FlagFR className="w-8 h-8" />
                      <span className="font-semibold">{t('header.switch_to_french_label', 'Passer en Français')}</span>
                    </>
                  ) : (
                    <>
                      <FlagEN className="w-8 h-8" />
                      <span className="font-semibold">{t('header.switch_to_english_label', 'Switch to English')}</span>
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
