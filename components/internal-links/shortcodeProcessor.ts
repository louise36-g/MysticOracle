/**
 * Shortcode Processor for Internal Linking
 *
 * Processes shortcodes in content and converts them to HTML anchor tags.
 * Shortcode format: [[type:slug]] or [[type:slug|Custom Text]]
 */

import type { LinkRegistry } from '../../services/api';

export type LinkType = 'tarot' | 'blog' | 'spread' | 'horoscope';

/**
 * Regex to match shortcodes
 * Captures: type, slug, optional custom text
 */
const SHORTCODE_REGEX = /\[\[(tarot|blog|spread|horoscope):([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/**
 * Category slugs that should route to /tarot/cards/{slug}
 */
const CATEGORY_SLUGS = new Set(['wands', 'cups', 'swords', 'pentacles', 'major-arcana', 'minor-arcana']);

/**
 * Spread type slugs that map to reading routes
 * Maps slug used in content -> URL slug for /reading/{slug}
 */
const SPREAD_SLUG_MAP: Record<string, string> = {
  'single': 'single',
  'single-card': 'single',
  'single-card-reading': 'single',
  'three-card': 'three-card',
  'three-card-reading': 'three-card',
  'love': 'love',
  'love-reading': 'love',
  'career': 'career',
  'career-reading': 'career',
  'horseshoe': 'horseshoe',
  'horseshoe-reading': 'horseshoe',
  'celtic-cross': 'celtic-cross',
  'celtic-cross-reading': 'celtic-cross',
};

/**
 * Get the URL for a given link type and slug
 */
export function getUrlForType(type: LinkType, slug: string): string {
  switch (type) {
    case 'tarot':
      // Tarot card articles go to /tarot/{slug}
      return `/tarot/${slug}`;
    case 'blog':
      return `/blog/${slug}`;
    case 'spread':
      // Category slugs (suits, arcana) route to /tarot/cards/{slug}
      if (CATEGORY_SLUGS.has(slug)) {
        return `/tarot/cards/${slug}`;
      }
      // Spread/reading types route to /reading/{slug}
      const readingSlug = SPREAD_SLUG_MAP[slug];
      if (readingSlug) {
        return `/reading/${readingSlug}`;
      }
      // Fallback for unknown spread slugs
      return `/reading`;
    case 'horoscope':
      return `/horoscopes/${slug}`;
    default:
      return '#';
  }
}

/**
 * Get the title for a slug from the registry
 */
function getTitleFromRegistry(type: LinkType, slug: string, registry: LinkRegistry | null): string {
  if (!registry) return slug;

  switch (type) {
    case 'tarot': {
      const item = registry.tarot.find((t) => t.slug === slug);
      return item?.title || slug;
    }
    case 'blog': {
      const item = registry.blog.find((b) => b.slug === slug);
      return item?.title || slug;
    }
    case 'spread': {
      const item = registry.spread.find((s) => s.slug === slug);
      return item?.title || slug;
    }
    case 'horoscope': {
      const item = registry.horoscope.find((h) => h.slug === slug);
      return item?.title || slug;
    }
    default:
      return slug;
  }
}

/**
 * Process shortcodes in content and convert to HTML links
 *
 * @param content - The content containing shortcodes
 * @param registry - Optional link registry for title lookups (pass null to use slug as fallback)
 * @returns Content with shortcodes replaced by HTML anchor tags
 */
export function processShortcodes(content: string, registry: LinkRegistry | null = null): string {
  return content.replace(SHORTCODE_REGEX, (match, type: LinkType, slug: string, customText?: string) => {
    const url = getUrlForType(type, slug);
    const text = customText || getTitleFromRegistry(type, slug, registry);
    return `<a href="${url}" class="internal-link" data-link-type="${type}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
}

/**
 * Extract all shortcodes from content
 * Useful for validation or preview
 */
export function extractShortcodes(content: string): Array<{
  fullMatch: string;
  type: LinkType;
  slug: string;
  customText?: string;
  position: number;
}> {
  const shortcodes: Array<{
    fullMatch: string;
    type: LinkType;
    slug: string;
    customText?: string;
    position: number;
  }> = [];

  let match;
  const regex = new RegExp(SHORTCODE_REGEX.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    shortcodes.push({
      fullMatch: match[0],
      type: match[1] as LinkType,
      slug: match[2],
      customText: match[3],
      position: match.index,
    });
  }

  return shortcodes;
}

/**
 * Validate shortcodes against the registry
 * Returns invalid shortcodes (those with slugs not in registry)
 */
export function validateShortcodes(
  content: string,
  registry: LinkRegistry
): Array<{ shortcode: string; type: LinkType; slug: string; reason: string }> {
  const shortcodes = extractShortcodes(content);
  const invalid: Array<{ shortcode: string; type: LinkType; slug: string; reason: string }> = [];

  for (const sc of shortcodes) {
    let isValid = false;

    switch (sc.type) {
      case 'tarot':
        isValid = registry.tarot.some((t) => t.slug === sc.slug);
        break;
      case 'blog':
        isValid = registry.blog.some((b) => b.slug === sc.slug);
        break;
      case 'spread':
        isValid = registry.spread.some((s) => s.slug === sc.slug);
        break;
      case 'horoscope':
        isValid = registry.horoscope.some((h) => h.slug === sc.slug);
        break;
    }

    if (!isValid) {
      invalid.push({
        shortcode: sc.fullMatch,
        type: sc.type,
        slug: sc.slug,
        reason: `No ${sc.type} found with slug "${sc.slug}"`,
      });
    }
  }

  return invalid;
}

/**
 * Count shortcodes by type
 */
export function countShortcodes(content: string): Record<LinkType | 'total', number> {
  const shortcodes = extractShortcodes(content);
  const counts: Record<LinkType | 'total', number> = {
    tarot: 0,
    blog: 0,
    spread: 0,
    horoscope: 0,
    total: shortcodes.length,
  };

  for (const sc of shortcodes) {
    counts[sc.type]++;
  }

  return counts;
}

/**
 * Strip all shortcodes from content (for plain text export)
 * Replaces shortcodes with their display text
 */
export function stripShortcodes(content: string, registry: LinkRegistry | null = null): string {
  return content.replace(SHORTCODE_REGEX, (match, type: LinkType, slug: string, customText?: string) => {
    return customText || getTitleFromRegistry(type, slug, registry);
  });
}
