import { ROUTES, buildRoute } from '../../routes/routes';
import { useApp } from '../../context/AppContext';
import LocalizedLink from '../LocalizedLink';

// Map breadcrumbCategory names to canonical URL slugs
const categoryToSlug: Record<string, string> = {
  'Major Arcana': 'major-arcana',
  'Suit of Wands': 'wands',
  'Suit of Cups': 'cups',
  'Suit of Swords': 'swords',
  'Suit of Pentacles': 'pentacles',
};

// French translations for category names
const categoryFr: Record<string, string> = {
  'Major Arcana': 'Arcanes Majeures',
  'Suit of Wands': 'Bâtons',
  'Suit of Cups': 'Coupes',
  'Suit of Swords': 'Épées',
  'Suit of Pentacles': 'Deniers',
};

interface BreadcrumbsProps {
  category: string;
  title: string;
}

/**
 * Breadcrumb navigation component
 * Shows: Home / The Arcanas / Category / Card Name
 */
export function Breadcrumbs({ category, title }: BreadcrumbsProps) {
  const { t, language } = useApp();
  const cardName = title.split(':')[0].trim();
  const categorySlug = categoryToSlug[category] || category.toLowerCase().replace(/\s+/g, '-');
  const categoryUrl = buildRoute(ROUTES.TAROT_CARDS_CATEGORY, { category: categorySlug });
  const categoryLabel = language === 'fr' ? (categoryFr[category] || category) : category;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-400 mb-6">
      <ol className="flex items-center flex-wrap gap-x-2 gap-y-1">
        <li>
          <LocalizedLink
            to={ROUTES.HOME}
            className="hover:text-purple-400 transition-colors duration-200"
          >
            {t('tarot.breadcrumbs.home', 'Home')}
          </LocalizedLink>
        </li>
        <li className="text-slate-600">/</li>
        <li>
          <LocalizedLink
            to={ROUTES.TAROT_CARDS}
            className="hover:text-purple-400 transition-colors duration-200"
          >
            {t('tarot.breadcrumbs.arcanas', 'The Arcanas')}
          </LocalizedLink>
        </li>
        <li className="text-slate-600">/</li>
        <li>
          <LocalizedLink
            to={categoryUrl}
            className="hover:text-purple-400 transition-colors duration-200"
          >
            {categoryLabel}
          </LocalizedLink>
        </li>
        <li className="text-slate-600">/</li>
        <li className="text-purple-200 font-medium">{cardName}</li>
      </ol>
    </nav>
  );
}
