/**
 * Language utilities for URL-based language detection.
 *
 * Language is determined by the URL path:
 *   - /fr/tarot/the-fool → French
 *   - /tarot/the-fool    → English (default)
 */

export type Language = 'en' | 'fr';

export const SITE_URL = 'https://celestiarcana.com';

/**
 * Detect language from a URL pathname.
 * Returns 'fr' if the path starts with /fr/ or is exactly /fr, otherwise 'en'.
 */
export function detectLanguageFromPath(pathname: string): Language {
  return pathname === '/fr' || pathname.startsWith('/fr/') ? 'fr' : 'en';
}

/**
 * Strip the /fr language prefix from a pathname to get the base route.
 *   /fr/tarot/the-fool → /tarot/the-fool
 *   /tarot/the-fool    → /tarot/the-fool
 *   /fr                → /
 */
export function stripLanguagePrefix(pathname: string): string {
  if (pathname === '/fr') return '/';
  if (pathname.startsWith('/fr/')) return pathname.slice(3);
  return pathname;
}

/**
 * Build a localized path by adding or removing the /fr prefix.
 *   localizedPath('/tarot/the-fool', 'fr') → /fr/tarot/the-fool
 *   localizedPath('/tarot/the-fool', 'en') → /tarot/the-fool
 *   localizedPath('/fr/tarot/the-fool', 'en') → /tarot/the-fool
 *   localizedPath('/fr/tarot/the-fool', 'fr') → /fr/tarot/the-fool
 */
export function localizedPath(path: string, lang: Language): string {
  const basePath = stripLanguagePrefix(path);
  if (lang === 'fr') {
    return basePath === '/' ? '/fr' : `/fr${basePath}`;
  }
  return basePath;
}

/**
 * Get the URL for the alternate language version of the current path.
 *   /tarot/the-fool    → /fr/tarot/the-fool
 *   /fr/tarot/the-fool → /tarot/the-fool
 */
export function getAlternatePath(pathname: string): string {
  const currentLang = detectLanguageFromPath(pathname);
  return localizedPath(pathname, currentLang === 'en' ? 'fr' : 'en');
}

/**
 * Get full canonical URLs for hreflang tags.
 */
export function getHreflangUrls(pathname: string): {
  en: string;
  fr: string;
  xDefault: string;
} {
  const basePath = stripLanguagePrefix(pathname);
  const enPath = basePath === '/' ? '' : basePath;
  const frPath = basePath === '/' ? '/fr' : `/fr${basePath}`;
  return {
    en: `${SITE_URL}${enPath}`,
    fr: `${SITE_URL}${frPath}`,
    xDefault: `${SITE_URL}${enPath}`,
  };
}
