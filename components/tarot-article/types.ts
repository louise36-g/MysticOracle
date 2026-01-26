import type { RefObject } from 'react';

/**
 * Tarot Article Component Types
 * Shared type definitions for the tarot article display system
 */

export interface Section {
  id: string;
  title: string;
  shortLabel: string;
}

export interface TarotArticlePageProps {
  previewId?: string;
}

export interface QuickNavChipsProps {
  sections: Section[];
  onSectionClick: (id: string) => void;
}

export interface TableOfContentsProps {
  sections: Section[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export interface ArticleHeaderProps {
  title: string;
  author: string;
  readTime: string;
  dateModified: string;
  cardType: string;
  astrologicalCorrespondence: string;
  element: string;
  isCourtCard: boolean;
  sections: Section[];
  onSectionClick: (id: string) => void;
  language: string;
}

export interface ArticleContentProps {
  sanitizedContent: string;
  contentRef: RefObject<HTMLDivElement>;
  onNavigate: (path: string) => void;
  onImageClick: (src: string) => void;
}

export interface LightboxProps {
  image: string | null;
  onClose: () => void;
}

// Navigation label mappings for short chip labels
export const NAV_LABEL_MAP: Record<string, string> = {
  'key takeaways': 'Takeaways',
  'quick reference': 'Reference',
  'understanding': 'Overview',
  'upright': 'Upright',
  'reversed': 'Reversed',
  'symbolism': 'Symbols',
  'spreads': 'Spreads',
  'combinations': 'Combos',
  'numerology': 'Numerology',
  'timing': 'Timing',
  'faq': 'FAQ',
  'frequently asked': 'FAQ',
  'reflection': 'Reflect',
  'wisdom': 'Wisdom',
  'love': 'Love',
  'career': 'Career',
  'finances': 'Finances',
  'spiritual': 'Spiritual',
  'life decisions': 'Decisions',
  'vs.': 'Compare',
  'difference': 'Compare',
};

/**
 * Get a short label for navigation chips (1-2 words max)
 */
export function getShortLabel(title: string): string {
  const lowerTitle = title.toLowerCase();

  // Check explicit keyword mappings first
  for (const [keyword, label] of Object.entries(NAV_LABEL_MAP)) {
    if (lowerTitle.includes(keyword)) {
      return label;
    }
  }

  // Special case: Card overview sections (pattern: "Card Name: Description")
  // These are the main overview sections that don't have specific keywords
  // Match if: has a colon, doesn't contain "reversed", "key takeaways", "faq", "frequently", "guidance"
  const excludedPatterns = ['reversed', 'key takeaways', 'faq', 'frequently', 'guidance'];
  const hasColon = title.includes(':');
  const isExcluded = excludedPatterns.some(p => lowerTitle.includes(p));

  if (hasColon && !isExcluded) {
    return 'Overview';
  }

  // Fallback: use first 1-2 words, max 12 chars
  const words = title.split(/\s+/).slice(0, 2);
  const result = words.join(' ');
  return result.length > 12 ? words[0].slice(0, 12) : result;
}

/**
 * Allowed short labels for navigation chips
 * Only these sections will be shown in the quick nav
 */
export const ALLOWED_NAV_LABELS = [
  'Takeaways',
  'Overview',
  'Upright',
  'Reversed',
  'Symbols',
  'FAQ',
];

/**
 * Check if a section should be shown in navigation
 */
export function isAllowedNavSection(shortLabel: string): boolean {
  return ALLOWED_NAV_LABELS.includes(shortLabel);
}
