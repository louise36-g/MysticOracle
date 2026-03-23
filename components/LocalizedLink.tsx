import { forwardRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { localizedPath } from '../utils/language';

/**
 * Drop-in replacement for React Router's <Link> that auto-prefixes /fr/
 * when the current language is French. Use this for all public-facing links.
 *
 * Usage: <LocalizedLink to="/blog">Blog</LocalizedLink>
 *   - On English page → renders <a href="/blog">
 *   - On French page  → renders <a href="/fr/blog">
 */
const LocalizedLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, ...props }, ref) => {
    const { language } = useApp();
    const localTo = typeof to === 'string' ? localizedPath(to, language) : to;
    return <Link ref={ref} to={localTo} {...props} />;
  }
);

LocalizedLink.displayName = 'LocalizedLink';

export default LocalizedLink;
