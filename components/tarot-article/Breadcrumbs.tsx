import { Link } from 'react-router-dom';
import { ROUTES, buildRoute } from '../../routes/routes';
import { useApp } from '../../context/AppContext';

// Map breadcrumbCategory names to canonical URL slugs
const categoryToSlug: Record<string, string> = {
  'Major Arcana': 'major-arcana',
  'Suit of Wands': 'wands',
  'Suit of Cups': 'cups',
  'Suit of Swords': 'swords',
  'Suit of Pentacles': 'pentacles',
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
  const { t } = useApp();
  const cardName = title.split(':')[0].trim();
  const categorySlug = categoryToSlug[category] || category.toLowerCase().replace(/\s+/g, '-');
  const categoryUrl = buildRoute(ROUTES.TAROT_CARDS_CATEGORY, { category: categorySlug });

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-400 mb-6">
      <ol className="flex items-center flex-wrap gap-x-2 gap-y-1">
        <li>
          <Link
            to={ROUTES.HOME}
            className="hover:text-purple-400 transition-colors duration-200"
          >
            Home
          </Link>
        </li>
        <li className="text-slate-600">/</li>
        <li>
          <Link
            to={ROUTES.TAROT_CARDS}
            className="hover:text-purple-400 transition-colors duration-200"
          >
            {t('tarot.breadcrumbs.arcanas', 'The Arcanas')}
          </Link>
        </li>
        <li className="text-slate-600">/</li>
        <li>
          <Link
            to={categoryUrl}
            className="hover:text-purple-400 transition-colors duration-200"
          >
            {category}
          </Link>
        </li>
        <li className="text-slate-600">/</li>
        <li className="text-purple-200 font-medium">{cardName}</li>
      </ol>
    </nav>
  );
}
