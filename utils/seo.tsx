import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useLocation } from 'react-router-dom';
import { stripLanguagePrefix, SITE_URL } from './language';

/**
 * Generate canonical URL for the current page.
 * Handles both /path and /fr/path — canonical always uses the correct language URL.
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.replace(/\/$/, '') || '/';
  // For French paths, canonical should be the /fr/ version
  if (cleanPath === '/fr' || cleanPath.startsWith('/fr/')) {
    return `${SITE_URL}${cleanPath}`;
  }
  return `${SITE_URL}${cleanPath === '/' ? '' : cleanPath}`;
}

/**
 * SEO head tags — renders canonical URL and hreflang links via Helmet.
 * Auto-detects current language from URL so components can pass a base path
 * (e.g. "/blog") and the canonical will correctly resolve to "/fr/blog" on French pages.
 */
export const SEOTags: React.FC<{ path: string }> = ({ path }) => {
  const location = useLocation();
  const isFr = location.pathname === '/fr' || location.pathname.startsWith('/fr/');

  // If the path already includes /fr/, use as-is. Otherwise, prefix for French pages.
  const basePath = stripLanguagePrefix(path);
  const resolvedPath = isFr
    ? (basePath === '/' ? '/fr' : `/fr${basePath}`)
    : basePath;

  const canonical = getCanonicalUrl(resolvedPath);
  return (
    <Helmet>
      <link rel="canonical" href={canonical} />
    </Helmet>
  );
};
