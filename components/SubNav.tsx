import React, { useState, useRef, memo } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../context/TranslationContext';
import { SPREADS } from '../constants';
import { SpreadType, SpreadConfig } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Sparkles,
  Moon,
  Compass,
  BookOpen,
  HelpCircle,
  CreditCard,
  Users,
  Lock,
  Coins,
  Heart,
  Layers
} from 'lucide-react';

interface SubNavProps {
  onNavigate: (view: string) => void;
  onSelectSpread: (spread: SpreadConfig) => void;
  onSelectReadingMode: (mode: string) => void;
  currentView: string;
  readingMode: string | null;
}

interface DropdownItem {
  id: string;
  labelEn: string;
  labelFr: string;
  descriptionEn?: string;
  descriptionFr?: string;
  icon: React.ReactNode;
  iconBg: string;
  cost?: number;
  comingSoon?: boolean;
  onClick: () => void;
}

const SubNav: React.FC<SubNavProps> = ({
  onNavigate,
  onSelectSpread,
  onSelectReadingMode,
  currentView,
  readingMode
}) => {
  const { language, user } = useApp();
  const { t } = useTranslation();
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

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setOpenDropdown(null);
  };

  // Build Tarot spreads menu items
  const tarotItems: DropdownItem[] = Object.values(SPREADS).map(spread => ({
    id: spread.id,
    labelEn: spread.nameEn,
    labelFr: spread.nameFr,
    descriptionEn: t(`subnav.tarot.${spread.id}.desc`, `${spread.positions} cards`),
    descriptionFr: t(`subnav.tarot.${spread.id}.desc`, `${spread.positions} cartes`),
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    iconBg: 'bg-purple-500/20',
    cost: spread.cost,
    onClick: () => onSelectSpread(spread)
  }));

  // Coming Soon items
  const comingSoonItems: DropdownItem[] = [
    {
      id: 'runes',
      labelEn: t('subnav.comingSoon.runes.label', 'Rune Reading'),
      labelFr: t('subnav.comingSoon.runes.label', 'Lecture des Runes'),
      descriptionEn: t('subnav.comingSoon.runes.desc', 'Ancient Nordic wisdom'),
      descriptionFr: t('subnav.comingSoon.runes.desc', 'Sagesse nordique ancienne'),
      icon: <Compass className="w-4 h-4 text-amber-400" />,
      iconBg: 'bg-amber-500/20',
      comingSoon: true,
      onClick: () => {}
    },
    {
      id: 'birthchart',
      labelEn: t('subnav.comingSoon.birthchart.label', 'Birth Chart'),
      labelFr: t('subnav.comingSoon.birthchart.label', 'Thème Astral'),
      descriptionEn: t('subnav.comingSoon.birthchart.desc', 'Your cosmic blueprint'),
      descriptionFr: t('subnav.comingSoon.birthchart.desc', 'Votre empreinte cosmique'),
      icon: <Moon className="w-4 h-4 text-blue-400" />,
      iconBg: 'bg-blue-500/20',
      comingSoon: true,
      onClick: () => {}
    },
    {
      id: 'iching',
      labelEn: t('subnav.comingSoon.iching.label', 'I Ching'),
      labelFr: t('subnav.comingSoon.iching.label', 'Yi King'),
      descriptionEn: t('subnav.comingSoon.iching.desc', 'Book of Changes'),
      descriptionFr: t('subnav.comingSoon.iching.desc', 'Livre des mutations'),
      icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
      iconBg: 'bg-emerald-500/20',
      comingSoon: true,
      onClick: () => {}
    },
    {
      id: 'biofeedback',
      labelEn: t('subnav.comingSoon.biofeedback.label', 'Biofeedback'),
      labelFr: t('subnav.comingSoon.biofeedback.label', 'Biofeedback'),
      descriptionEn: t('subnav.comingSoon.biofeedback.desc', 'Mind-body connection'),
      descriptionFr: t('subnav.comingSoon.biofeedback.desc', 'Connexion corps-esprit'),
      icon: <Heart className="w-4 h-4 text-rose-400" />,
      iconBg: 'bg-rose-500/20',
      comingSoon: true,
      onClick: () => {}
    }
  ];

  // Learn items - About Us at top
  const learnItems: DropdownItem[] = [
    {
      id: 'about',
      labelEn: t('subnav.learn.about.label', 'About Us'),
      labelFr: t('subnav.learn.about.label', 'À Propos'),
      descriptionEn: t('subnav.learn.about.desc', 'Our story'),
      descriptionFr: t('subnav.learn.about.desc', 'Notre histoire'),
      icon: <Users className="w-4 h-4 text-pink-400" />,
      iconBg: 'bg-pink-500/20',
      onClick: () => onNavigate('about')
    },
    {
      id: 'tarot-cards',
      labelEn: t('subnav.learn.tarotCards.label', 'Tarot Cards'),
      labelFr: t('subnav.learn.tarotCards.label', 'Cartes de Tarot'),
      descriptionEn: t('subnav.learn.tarotCards.desc', 'Explore all 78 cards'),
      descriptionFr: t('subnav.learn.tarotCards.desc', 'Explorez les 78 cartes'),
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      iconBg: 'bg-purple-500/20',
      onClick: () => onNavigate('tarot-cards')
    },
    {
      id: 'blog',
      labelEn: t('subnav.learn.blog.label', 'Blog'),
      labelFr: t('subnav.learn.blog.label', 'Blog'),
      descriptionEn: t('subnav.learn.blog.desc', 'Articles & guides'),
      descriptionFr: t('subnav.learn.blog.desc', 'Articles & guides'),
      icon: <BookOpen className="w-4 h-4 text-purple-400" />,
      iconBg: 'bg-purple-500/20',
      onClick: () => onNavigate('blog')
    },
    {
      id: 'how-credits-work',
      labelEn: t('subnav.learn.credits.label', 'How Credits Work'),
      labelFr: t('subnav.learn.credits.label', 'Comment fonctionnent les crédits'),
      descriptionEn: t('subnav.learn.credits.desc', 'Pricing & packages'),
      descriptionFr: t('subnav.learn.credits.desc', 'Tarifs & forfaits'),
      icon: <CreditCard className="w-4 h-4 text-amber-400" />,
      iconBg: 'bg-amber-500/20',
      onClick: () => onNavigate('how-credits-work')
    },
    {
      id: 'faq',
      labelEn: t('subnav.learn.faq.label', 'Help & FAQ'),
      labelFr: t('subnav.learn.faq.label', 'Aide & FAQ'),
      descriptionEn: t('subnav.learn.faq.desc', 'Get answers'),
      descriptionFr: t('subnav.learn.faq.desc', 'Trouvez des réponses'),
      icon: <HelpCircle className="w-4 h-4 text-blue-400" />,
      iconBg: 'bg-blue-500/20',
      onClick: () => onNavigate('faq')
    }
  ];

  const renderDropdown = (items: DropdownItem[], showCost = false) => (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
    >
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {items.map(item => {
          const hasEnoughCredits = !item.cost || !user || user.credits >= item.cost;

          return (
            <button
              key={item.id}
              onClick={() => !item.comingSoon && hasEnoughCredits && handleItemClick(item.onClick)}
              disabled={item.comingSoon || !hasEnoughCredits}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all ${
                item.comingSoon
                  ? 'opacity-50 cursor-not-allowed'
                  : !hasEnoughCredits
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:bg-white/5 hover:scale-[1.02] cursor-pointer'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                {item.comingSoon ? <Lock className="w-4 h-4 text-slate-400" /> : item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-sm ${item.comingSoon ? 'text-slate-400' : 'text-slate-200'}`}>
                    {language === 'en' ? item.labelEn : item.labelFr}
                  </span>
                  {item.comingSoon && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                      {language === 'en' ? 'Soon' : 'Bientôt'}
                    </span>
                  )}
                </div>
                {(item.descriptionEn || item.descriptionFr) && (
                  <div className="text-xs text-slate-500 truncate">
                    {language === 'en' ? item.descriptionEn : item.descriptionFr}
                  </div>
                )}
              </div>
              {showCost && item.cost && (
                <div className={`flex items-center gap-1 ${hasEnoughCredits ? 'text-amber-400' : 'text-red-400'}`}>
                  <Coins className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{item.cost}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  const isTarotActive = readingMode === 'tarot';
  const isHoroscopeActive = readingMode === 'horoscope';
  const isLearnActive = ['blog', 'blog-post', 'faq', 'how-credits-work', 'about', 'tarot-cards', 'tarot-cards-all', 'tarot-cards-category'].includes(currentView);

  return (
    <nav className="hidden md:block bg-slate-900/60 backdrop-blur-md border-b border-white/5 relative z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-1 h-12">
          {/* Tarot Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('tarot')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isTarotActive || openDropdown === 'tarot'
                  ? 'text-purple-300 bg-purple-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('subnav.tarot.title', language === 'en' ? 'Tarot Readings' : 'Tirages Tarot')}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'tarot' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openDropdown === 'tarot' && renderDropdown(tarotItems, true)}
            </AnimatePresence>
          </div>

          {/* Horoscope Link */}
          <button
            onClick={() => onSelectReadingMode('horoscope')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isHoroscopeActive
                ? 'text-amber-300 bg-amber-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>{t('subnav.horoscope.title', 'Horoscope')}</span>
          </button>

          {/* Coming Soon Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('comingsoon')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                openDropdown === 'comingsoon'
                  ? 'text-slate-300 bg-white/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{t('subnav.comingSoon.title', language === 'en' ? 'Coming Soon' : 'Bientôt')}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'comingsoon' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openDropdown === 'comingsoon' && renderDropdown(comingSoonItems)}
            </AnimatePresence>
          </div>

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
              <span>{t('subnav.learn.title', language === 'en' ? 'Learn' : 'Découvrir')}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'learn' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openDropdown === 'learn' && renderDropdown(learnItems)}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default memo(SubNav);
