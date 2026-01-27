import { Link } from 'react-router-dom';
import { ROUTES, buildRoute } from '../../routes/routes';

interface BreadcrumbsProps {
  category: string;
  title: string;
}

/**
 * Breadcrumb navigation component
 * Shows: Home / Category / Card Name
 */
export function Breadcrumbs({ category, title }: BreadcrumbsProps) {
  const cardName = title.split(':')[0].trim();
  const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
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
