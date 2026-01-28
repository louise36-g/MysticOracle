import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, Sparkles, User, Shield, FileText, Star, Moon, Eye, BookOpen, HelpCircle, CreditCard, Users, Layers, Clock, Heart, TrendingUp, Compass } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SpreadType } from '../types';

interface BreadcrumbProps {
  currentView: string;
  readingMode: string | null;
  selectedSpread: { id: SpreadType; nameEn: string; nameFr: string } | null;
}

// Spread icons matching SpreadSelector theme
const SPREAD_ICONS: Record<SpreadType, React.ReactNode> = {
  [SpreadType.SINGLE]: <Eye className="w-3.5 h-3.5" />,
  [SpreadType.THREE_CARD]: <Clock className="w-3.5 h-3.5" />,
  [SpreadType.FIVE_CARD]: <Layers className="w-3.5 h-3.5" />,
  [SpreadType.LOVE]: <Heart className="w-3.5 h-3.5" />,
  [SpreadType.CAREER]: <TrendingUp className="w-3.5 h-3.5" />,
  [SpreadType.HORSESHOE]: <Sparkles className="w-3.5 h-3.5" />,
  [SpreadType.CELTIC_CROSS]: <Compass className="w-3.5 h-3.5" />,
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  currentView,
  readingMode,
  selectedSpread,
}) => {
  const { language, t } = useApp();

  // Build breadcrumb items based on current state
  const buildBreadcrumbs = () => {
    const items: { label: string; icon?: React.ReactNode; to?: string }[] = [];

    // Always start with Home
    items.push({
      label: t('Breadcrumb.tsx.Breadcrumb.home', 'Home'),
      icon: <Home className="w-3.5 h-3.5" />,
      to: '/',
    });

    // Handle different views
    switch (currentView) {
      case 'profile':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.profile', 'Profile'),
          icon: <User className="w-3.5 h-3.5" />,
        });
        break;

      case 'admin':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.admin_dashboard', 'Admin Dashboard'),
          icon: <Shield className="w-3.5 h-3.5" />,
        });
        break;

      case 'privacy':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.privacy_policy', 'Privacy Policy'),
          icon: <FileText className="w-3.5 h-3.5" />,
        });
        break;

      case 'terms':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.terms_of_service', 'Terms of Service'),
          icon: <FileText className="w-3.5 h-3.5" />,
        });
        break;

      case 'cookies':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.cookie_policy', 'Cookie Policy'),
          icon: <FileText className="w-3.5 h-3.5" />,
        });
        break;

      case 'blog':
        items.push({
          label: 'Blog',
          icon: <BookOpen className="w-3.5 h-3.5" />,
        });
        break;

      case 'blog-post':
        items.push({
          label: 'Blog',
          icon: <BookOpen className="w-3.5 h-3.5" />,
          to: '/blog',
        });
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.article', 'Article'),
          icon: <FileText className="w-3.5 h-3.5" />,
        });
        break;

      case 'faq':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.help_faq', 'Help & FAQ'),
          icon: <HelpCircle className="w-3.5 h-3.5" />,
        });
        break;

      case 'how-credits-work':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.how_credits_work', 'How Credits Work'),
          icon: <CreditCard className="w-3.5 h-3.5" />,
        });
        break;

      case 'about':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.about_us', 'About Us'),
          icon: <Users className="w-3.5 h-3.5" />,
        });
        break;

      case 'tarot-article':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.tarot_cards', 'The Arcanas'),
          icon: <Layers className="w-3.5 h-3.5" />,
          to: '/tarot/cards',
        });
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.all_cards', 'All Cards'),
          icon: <Layers className="w-3.5 h-3.5" />,
          to: '/tarot/cards/all',
        });
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.card_details', 'Card Details'),
          icon: <Sparkles className="w-3.5 h-3.5" />,
        });
        break;

      case 'tarot-cards':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.tarot_cards_2', 'The Arcanas'),
          icon: <Layers className="w-3.5 h-3.5" />,
        });
        break;

      case 'tarot-cards-all':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.tarot_cards_3', 'The Arcanas'),
          icon: <Layers className="w-3.5 h-3.5" />,
          to: '/tarot/cards',
        });
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.all_cards_2', 'All Cards'),
          icon: <Sparkles className="w-3.5 h-3.5" />,
        });
        break;

      case 'tarot-cards-category':
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.tarot_cards_4', 'The Arcanas'),
          icon: <Layers className="w-3.5 h-3.5" />,
          to: '/tarot/cards',
        });
        items.push({
          label: t('Breadcrumb.tsx.Breadcrumb.category', 'Category'),
          icon: <Sparkles className="w-3.5 h-3.5" />,
        });
        break;

      case 'reading':
        // Add reading mode crumb - links to spread selector
        if (readingMode === 'tarot') {
          items.push({
            label: t('Breadcrumb.tsx.Breadcrumb.tarot_readings', 'Tarot Readings'),
            icon: <Sparkles className="w-3.5 h-3.5" />,
            to: '/tarot',
          });
        }
        // Add spread name with themed icon
        if (selectedSpread) {
          const spreadIcon = SPREAD_ICONS[selectedSpread.id] || <Star className="w-3.5 h-3.5" />;
          items.push({
            label: language === 'en' ? selectedSpread.nameEn : selectedSpread.nameFr,
            icon: spreadIcon,
          });
        }
        break;

      case 'home':
      default:
        // If we're on home but have a reading mode selected
        if (readingMode === 'tarot') {
          items.push({
            label: t('Breadcrumb.tsx.Breadcrumb.tarot_readings_2', 'Tarot Readings'),
            icon: <Sparkles className="w-3.5 h-3.5" />,
          });
        } else if (readingMode === 'horoscope') {
          items.push({
            label: t('Breadcrumb.tsx.Breadcrumb.horoscope', 'Horoscope'),
            icon: <Moon className="w-3.5 h-3.5" />,
          });
        } else if (readingMode === 'oracle') {
          items.push({
            label: t('Breadcrumb.tsx.Breadcrumb.oracle', 'Oracle'),
            icon: <Eye className="w-3.5 h-3.5" />,
          });
        }
        break;
    }

    return items;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <nav className="bg-slate-900/50 backdrop-blur-sm border-b border-purple-500/10 relative z-30">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <ol className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const isClickable = !!item.to && !isLast;

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-slate-600 mx-1" />
                )}
                {isClickable ? (
                  <Link
                    to={item.to!}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={`flex items-center gap-1.5 px-2 py-1 ${
                      isLast
                        ? 'text-purple-300 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumb;
