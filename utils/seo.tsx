import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';

const SITE_URL = 'https://celestiarcana.com';

/**
 * Generate canonical URL for the current page
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path === '/' ? '' : path.replace(/\/$/, '');
  return `${SITE_URL}${cleanPath}`;
}

/**
 * SEO head tags — renders canonical URL and hreflang links via Helmet.
 * Place alongside (not inside) your page's <Helmet> block.
 */
export const SEOTags: React.FC<{ path: string }> = ({ path }) => {
  const canonical = getCanonicalUrl(path);
  return (
    <Helmet>
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="fr" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />
    </Helmet>
  );
};
