import React, { useState, useRef, useCallback, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../routes/routes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Sparkles,
  Moon,
  BookOpen,
  HelpCircle,
  CreditCard,
  Users,
  User,
  Layers,
  Home,
  Mail
} from 'lucide-react';

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

const SubNav: React.FC = () => {
  const { language } = useApp();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Helper to check if path is active
  const isActive = useCallback((path: string) => {
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  // Learn items
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

  const renderDropdown = (items: DropdownItem[]) => (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
    >
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {items.map(item => (
          <Link
            key={item.id}
            to={item.href}
            onClick={handleItemClick}
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
          </Link>
        ))}
      </div>
    </motion.div>
  );

  const isTarotActive = isActive('/reading') || isActive('/tarot');
  const isHoroscopeActive = isActive('/horoscopes');
  const isLearnActive = isActive('/blog') || isActive('/faq') || isActive('/how-credits-work') || isActive('/about') || location.pathname.startsWith('/tarot/cards');

  return (
    <nav className="hidden md:block bg-slate-900/60 backdrop-blur-md border-b border-white/5 relative z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-1 h-12">
          {/* Home Link */}
          <Link
            to={ROUTES.HOME}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/'
                ? 'text-amber-300 bg-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{language === 'fr' ? 'Accueil' : 'Home'}</span>
          </Link>

          {/* Tarot Link - simple, no dropdown */}
          <Link
            to={ROUTES.READING}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isTarotActive
                ? 'text-purple-300 bg-purple-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'fr' ? 'Tirages de Tarot' : 'Tarot Readings'}</span>
          </Link>

          {/* Horoscope Link */}
          <Link
            to={ROUTES.HOROSCOPES}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isHoroscopeActive
                ? 'text-amber-300 bg-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>{language === 'fr' ? 'Horoscopes' : 'Horoscopes'}</span>
          </Link>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* Learn Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('learn')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isLearnActive || openDropdown === 'learn'
                  ? 'text-blue-300 bg-blue-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{language === 'fr' ? 'Apprendre' : 'Learn'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'learn' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openDropdown === 'learn' && renderDropdown(learnItems)}
            </AnimatePresence>
          </div>

          {/* Contact Link */}
          <Link
            to={ROUTES.CONTACT}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/contact')
                ? 'text-amber-300 bg-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Contact</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default memo(SubNav);
