/**
 * Canonical URL builders — single source of truth for all server-side URL patterns.
 *
 * Rules enforced here:
 *   - Tarot articles: /tarot/{slug}  (never /tarot/articles/{slug})
 *   - No trailing slashes
 *   - Language prefix: /fr/... for French, none for English
 */

type Lang = 'en' | 'fr';

function siteBase(): string {
  return (process.env.FRONTEND_URL ?? 'https://celestiarcana.com').replace(/\/$/, '');
}

/** Relative path to a tarot article page. */
export function tarotPath(slug: string, lang: Lang = 'en'): string {
  return lang === 'fr' ? `/fr/tarot/${slug}` : `/tarot/${slug}`;
}

/** Absolute canonical URL for a tarot article. */
export function tarotUrl(slug: string, lang: Lang = 'en'): string {
  return `${siteBase()}${tarotPath(slug, lang)}`;
}

/** Relative path to a blog post page. */
export function blogPath(slug: string, lang: Lang = 'en'): string {
  return lang === 'fr' ? `/fr/blog/${slug}` : `/blog/${slug}`;
}

/** Absolute canonical URL for a blog post. */
export function blogUrl(slug: string, lang: Lang = 'en'): string {
  return `${siteBase()}${blogPath(slug, lang)}`;
}
