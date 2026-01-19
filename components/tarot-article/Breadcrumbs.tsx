import { SmartLink } from '../SmartLink';
import { BreadcrumbsProps } from './types';

/**
 * Breadcrumb navigation component
 * Shows: Home / Category / Card Name
 */
export function Breadcrumbs({ category, title, onNavigate }: BreadcrumbsProps) {
  const cardName = title.split(':')[0].trim();
  const categorySlug = category.toLowerCase().replace(/\s+/g, '-');

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-400 mb-6">
      <ol className="flex items-center flex-wrap gap-x-2 gap-y-1">
        <li>
          <SmartLink href="/" onClick={() => onNavigate('/')}>
            <button className="hover:text-purple-400 transition-colors duration-200">
              Home
            </button>
          </SmartLink>
        </li>
        <li className="text-slate-600">/</li>
        <li>
          <SmartLink
            href={`/tarot/${categorySlug}`}
            onClick={() => onNavigate(`/tarot/${categorySlug}`)}
          >
            <button className="hover:text-purple-400 transition-colors duration-200">
              {category}
            </button>
          </SmartLink>
        </li>
        <li className="text-slate-600">/</li>
        <li className="text-purple-200 font-medium">{cardName}</li>
      </ol>
    </nav>
  );
}
