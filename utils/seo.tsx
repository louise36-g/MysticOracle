import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { getHreflangUrls, stripLanguagePrefix, SITE_URL } from './language';

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
 * Correctly links EN and FR versions of the page.
 */
export const SEOTags: React.FC<{ path: string }> = ({ path }) => {
  const canonical = getCanonicalUrl(path);
  const hreflang = getHreflangUrls(path);
  return (
    <Helmet>
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="en" href={hreflang.en} />
      <link rel="alternate" hrefLang="fr" href={hreflang.fr} />
      <link rel="alternate" hrefLang="x-default" href={hreflang.xDefault} />
    </Helmet>
  );
};
