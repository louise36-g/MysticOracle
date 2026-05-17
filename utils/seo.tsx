import React, { useEffect } from 'react';
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
 * SEO head tags — sets the canonical URL via direct DOM manipulation.
 * Uses DOM manipulation rather than Helmet to guarantee it takes over any
 * pre-existing canonical tag (e.g. the homepage canonical in the HTML template),
 * preventing duplicate conflicting canonicals that cause GSC indexing failures.
 */
export const SEOTags: React.FC<{ path: string }> = ({ path }) => {
  const location = useLocation();
  const isFr = location.pathname === '/fr' || location.pathname.startsWith('/fr/');

  const basePath = stripLanguagePrefix(path);
  const resolvedPath = isFr
    ? (basePath === '/' ? '/fr' : `/fr${basePath}`)
    : basePath;

  const canonical = getCanonicalUrl(resolvedPath);

  useEffect(() => {
    // Take over the existing canonical (template or previously set) rather than
    // appending a duplicate alongside it.
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;
  }, [canonical]);

  return null;
};
