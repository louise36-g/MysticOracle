import React from 'react';
import { ChevronRight, Home, Sparkles, User, Shield, FileText, Star, Moon, Eye, BookOpen, HelpCircle, CreditCard, Users, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BreadcrumbProps {
  currentView: string;
  readingMode: string | null;
  selectedSpread: { nameEn: string; nameFr: string } | null;
  onNavigate: (view: string) => void;
  onClearReadingMode?: () => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  currentView,
  readingMode,
  selectedSpread,
  onNavigate,
  onClearReadingMode,
}) => {
  const { language } = useApp();

  // Build breadcrumb items based on current state
  const buildBreadcrumbs = () => {
    const items: { label: string; icon?: React.ReactNode; onClick?: () => void }[] = [];

    // Always start with Home
    items.push({
      label: language === 'en' ? 'Home' : 'Accueil',
      icon: <Home className="w-3.5 h-3.5" />,
      onClick: () => onNavigate('home'),
    });

    // Handle different views
    switch (currentView) {
      case 'profile':
        items.push({
          label: language === 'en' ? 'Profile' : 'Profil',
          icon: <User className="w-3.5 h-3.5" />,
        });
        break;

      case 'admin':
        items.push({
          label: language === 'en' ? 'Admin Dashboard' : 'Tableau de Bord',
          icon: <Shield className="w-3.5 h-3.5" />,
        });
        break;

      case 'privacy':
        items.push({
          label: language === 'en' ? 'Privacy Policy' : 'Politique de Confidentialité',
          icon: <FileText className="w-3.5 h-3.5" />,
        });
        break;

      case 'terms':
        items.push({
          label: language === 'en' ? 'Terms of Service' : 'Conditions d\'Utilisation',
          icon: <FileText className="w-3.5 h-3.5" />,
        });
        break;

      case 'cookies':
        items.push({
          label: language === 'en' ? 'Cookie Policy' : 'Politique des Cookies',
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
          onClick: () => onNavigate('blog'),
        });
        items.push({
          label: language === 'en' ? 'Article' : 'Article',
          icon: <FileText className="w-3.5 h-3.5" />,
        });
        break;

      case 'faq':
        items.push({
          label: language === 'en' ? 'Help & FAQ' : 'Aide & FAQ',
          icon: <HelpCircle className="w-3.5 h-3.5" />,
        });
        break;

      case 'how-credits-work':
        items.push({
          label: language === 'en' ? 'How Credits Work' : 'Comment fonctionnent les crédits',
          icon: <CreditCard className="w-3.5 h-3.5" />,
        });
        break;

      case 'about':
        items.push({
          label: language === 'en' ? 'About Us' : 'À Propos',
          icon: <Users className="w-3.5 h-3.5" />,
        });
        break;

      case 'tarot-cards':
        items.push({
          label: language === 'en' ? 'Tarot Cards' : 'Cartes de Tarot',
          icon: <Layers className="w-3.5 h-3.5" />,
        });
        break;

      case 'tarot-cards-all':
        items.push({
          label: language === 'en' ? 'Tarot Cards' : 'Cartes de Tarot',
          icon: <Layers className="w-3.5 h-3.5" />,
          onClick: () => onNavigate('tarot-cards'),
        });
        items.push({
          label: language === 'en' ? 'All Cards' : 'Toutes les Cartes',
          icon: <Sparkles className="w-3.5 h-3.5" />,
        });
        break;

      case 'tarot-cards-category':
        items.push({
          label: language === 'en' ? 'Tarot Cards' : 'Cartes de Tarot',
          icon: <Layers className="w-3.5 h-3.5" />,
          onClick: () => onNavigate('tarot-cards'),
        });
        items.push({
          label: language === 'en' ? 'Category' : 'Catégorie',
          icon: <Sparkles className="w-3.5 h-3.5" />,
        });
        break;

      case 'reading':
        // Add reading mode crumb
        if (readingMode === 'tarot') {
          items.push({
            label: language === 'en' ? 'Tarot' : 'Tarot',
            icon: <Sparkles className="w-3.5 h-3.5" />,
            onClick: onClearReadingMode,
          });
        }
        // Add spread name
        if (selectedSpread) {
          items.push({
            label: language === 'en' ? selectedSpread.nameEn : selectedSpread.nameFr,
            icon: <Star className="w-3.5 h-3.5" />,
          });
        }
        break;

      case 'home':
      default:
        // If we're on home but have a reading mode selected
        if (readingMode === 'tarot') {
          items.push({
            label: language === 'en' ? 'Choose Your Spread' : 'Choisissez Votre Tirage',
            icon: <Sparkles className="w-3.5 h-3.5" />,
          });
        } else if (readingMode === 'horoscope') {
          items.push({
            label: language === 'en' ? 'Horoscope' : 'Horoscope',
            icon: <Moon className="w-3.5 h-3.5" />,
          });
        } else if (readingMode === 'oracle') {
          items.push({
            label: language === 'en' ? 'Oracle' : 'Oracle',
            icon: <Eye className="w-3.5 h-3.5" />,
          });
        }
        break;
    }

    return items;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <nav className="bg-slate-900/50 backdrop-blur-sm border-b border-purple-500/10">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <ol className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const isClickable = !!item.onClick && !isLast;

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-slate-600 mx-1" />
                )}
                {isClickable ? (
                  <button
                    onClick={item.onClick}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
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
