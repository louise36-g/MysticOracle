/**
 * Canonical URL builders — single source of truth for all URL patterns.
 *
 * Rules enforced here:
 *   - Tarot articles: /tarot/{slug}  (never /tarot/articles/{slug})
 *   - No trailing slashes
 *   - Language prefix: /fr/... for French, none for English
 */

import { SITE_URL, type Language } from './language';

/** Relative path to a tarot article page. */
export function tarotPath(slug: string, lang: Language = 'en'): string {
  return lang === 'fr' ? `/fr/tarot/${slug}` : `/tarot/${slug}`;
}

/** Absolute canonical URL for a tarot article (for <link rel="canonical"> and og:url). */
export function tarotUrl(slug: string, lang: Language = 'en'): string {
  return `${SITE_URL}${tarotPath(slug, lang)}`;
}

/** Relative path to a blog post page. */
export function blogPath(slug: string, lang: Language = 'en'): string {
  return lang === 'fr' ? `/fr/blog/${slug}` : `/blog/${slug}`;
}

/** Absolute canonical URL for a blog post. */
export function blogUrl(slug: string, lang: Language = 'en'): string {
  return `${SITE_URL}${blogPath(slug, lang)}`;
}

/**
 * Resolve the canonical path for any content item.
 * TAROT_ARTICLE → /tarot/{slug}, BLOG_POST → /blog/{slug}
 */
export function contentPath(
  item: { slug: string; contentType: string },
  lang: Language = 'en'
): string {
  return item.contentType === 'TAROT_ARTICLE'
    ? tarotPath(item.slug, lang)
    : blogPath(item.slug, lang);
}
