/**
 * Content Scanner for Internal Linking
 *
 * Scans content for linkable terms and generates link suggestions.
 */

import type { LinkRegistry } from '../../services/apiService';

export interface LinkSuggestion {
  term: string;
  type: 'tarot' | 'blog';
  slug: string;
  title: string;
  shortcode: string;
  position: number;
  length: number; // Length of text to replace (may include surrounding <a> tag)
  selected: boolean;
}

export interface ScanOptions {
  skipExistingLinks?: boolean;
  skipExistingShortcodes?: boolean;
  firstOccurrenceOnly?: boolean;
  caseSensitive?: boolean;
  currentArticleSlug?: string; // Exclude self-links
}

const DEFAULT_OPTIONS: Required<ScanOptions> = {
  skipExistingLinks: true, // Skip terms already inside <a> tags
  skipExistingShortcodes: true, // Skip terms already inside shortcodes
  firstOccurrenceOnly: true,
  caseSensitive: false,
  currentArticleSlug: '', // Exclude self-links
};

/**
 * Number word mappings for card name variations
 */
const numberWords: Record<string, string> = {
  '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five',
  '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten'
};

const wordToNumber: Record<string, string> = {
  'two': '2', 'three': '3', 'four': '4', 'five': '5',
  'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
};

/**
 * Extract card name aliases from a title
 * e.g., "The Fool - Tarot Card Meaning" -> ["The Fool"]
 * e.g., "9 of Pentacles: The Ultimate Guide" -> ["9 of Pentacles", "Nine of Pentacles"]
 */
function extractCardNameAliases(title: string): string[] {
  const aliases: string[] = [];

  // Pattern: "Card Name - Something" or "Card Name: Something"
  const separatorMatch = title.match(/^(.+?)\s*[-–—:]\s*.+$/);
  if (separatorMatch && separatorMatch[1].length >= 3) {
    let extracted = separatorMatch[1].trim();
    aliases.push(extracted);

    // If it ends with "Tarot Card Meaning" or similar, extract the core name
    const coreMatch = extracted.match(/^(.+?)\s+(?:Tarot\s+)?(?:Card\s+)?(?:Meaning|Guide|Interpretation)$/i);
    if (coreMatch && coreMatch[1].length >= 3) {
      aliases.push(coreMatch[1].trim());
      extracted = coreMatch[1].trim();
    }

    // Also try to extract just "X of Y" pattern for numbered cards
    const numberedMatch = extracted.match(/^(\d+|(?:Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten))\s+of\s+(\w+)/i);
    if (numberedMatch) {
      const baseCard = numberedMatch[0];
      aliases.push(baseCard);
    }
  }

  // Pattern: "Something Card Name" -> extract just the card name part
  // Common patterns: "The Fool Card", "King of Cups Meaning"
  const cardSuffixMatch = title.match(/^(.+?)\s+(Card|Meaning|Guide|Interpretation)$/i);
  if (cardSuffixMatch && cardSuffixMatch[1].length >= 3) {
    aliases.push(cardSuffixMatch[1].trim());
  }

  // Generate number variations (9 of Pentacles <-> Nine of Pentacles)
  const withVariations: string[] = [...aliases];
  for (const alias of aliases) {
    // Convert "9 of X" to "Nine of X"
    const digitMatch = alias.match(/^(\d+)\s+of\s+(\w+)$/i);
    if (digitMatch && numberWords[digitMatch[1]]) {
      withVariations.push(`${numberWords[digitMatch[1]]} of ${digitMatch[2]}`);
    }

    // Convert "Nine of X" to "9 of X"
    const wordMatch = alias.match(/^(Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)\s+of\s+(\w+)$/i);
    if (wordMatch && wordToNumber[wordMatch[1].toLowerCase()]) {
      withVariations.push(`${wordToNumber[wordMatch[1].toLowerCase()]} of ${wordMatch[2]}`);
    }
  }

  // Remove duplicates
  return [...new Set(withVariations)];
}

interface TermInfo {
  type: 'tarot' | 'blog';
  slug: string;
  title: string;
  requiresCapital: boolean; // For terms like "The World" that shouldn't match "the world"
}

/**
 * Check if a term should require capital letters (to avoid false positives)
 * e.g., "The World" shouldn't match "the world around you"
 */
function shouldRequireCapital(term: string): boolean {
  // Terms starting with "The " followed by a common word need capital
  const commonWords = ['world', 'sun', 'moon', 'star', 'tower', 'devil', 'emperor', 'empress', 'fool', 'lovers', 'chariot', 'hermit', 'wheel', 'hanged'];
  const lowerTerm = term.toLowerCase();

  if (lowerTerm.startsWith('the ')) {
    const wordAfterThe = lowerTerm.slice(4).split(' ')[0];
    if (commonWords.includes(wordAfterThe)) {
      return true;
    }
  }

  return false;
}

/**
 * Build a searchable term map from the link registry
 */
function buildTermMap(registry: LinkRegistry): Map<string, TermInfo> {
  const termMap = new Map<string, TermInfo>();

  // Add tarot card titles and their aliases
  for (const item of registry.tarot) {
    const key = item.title.toLowerCase();
    const requiresCapital = shouldRequireCapital(item.title);
    if (!termMap.has(key)) {
      termMap.set(key, { type: 'tarot', slug: item.slug, title: item.title, requiresCapital });
    }

    // Add aliases (shorter versions of the title)
    const aliases = extractCardNameAliases(item.title);
    for (const alias of aliases) {
      const aliasKey = alias.toLowerCase();
      const aliasRequiresCapital = shouldRequireCapital(alias);
      if (!termMap.has(aliasKey)) {
        termMap.set(aliasKey, { type: 'tarot', slug: item.slug, title: item.title, requiresCapital: aliasRequiresCapital });
      }
    }
  }

  // Add blog post titles
  for (const item of registry.blog) {
    const key = item.title.toLowerCase();
    if (!termMap.has(key)) {
      termMap.set(key, { type: 'blog', slug: item.slug, title: item.title, requiresCapital: false });
    }
  }

  // Note: Spread and horoscope links are excluded - they're auto-linked by the backend regex system

  return termMap;
}

interface ExistingLink {
  start: number;
  end: number;
  text: string;
}

interface ExistingShortcode {
  start: number;
  end: number;
  type: string;
  slug: string;
  customText?: string;
}

/**
 * Find all existing <a> tags in the content
 */
function findExistingLinks(content: string): ExistingLink[] {
  const links: ExistingLink[] = [];
  const linkRegex = /<a[^>]*>(.*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[1], // The text inside the link
    });
  }
  return links;
}

/**
 * Find all existing shortcodes in the content
 */
function findExistingShortcodes(content: string): ExistingShortcode[] {
  const shortcodes: ExistingShortcode[] = [];
  const shortcodeRegex = /\[\[(tarot|blog|spread|horoscope):([^\]|]+)(?:\|([^\]]+))?\]\]/gi;
  let match;
  while ((match = shortcodeRegex.exec(content)) !== null) {
    shortcodes.push({
      start: match.index,
      end: match.index + match[0].length,
      type: match[1],
      slug: match[2],
      customText: match[3],
    });
  }
  return shortcodes;
}

/**
 * Check if a position is inside an existing shortcode
 */
function findContainingShortcode(position: number, existingShortcodes: ExistingShortcode[]): ExistingShortcode | null {
  for (const sc of existingShortcodes) {
    if (position >= sc.start && position < sc.end) {
      return sc;
    }
  }
  return null;
}

/**
 * Find positions where a term should NOT be linked
 * (inside shortcodes or HTML tag attributes)
 */
function findExcludedRanges(content: string, options: Required<ScanOptions>): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];

  // Exclude text inside existing <a> tags (only if skipExistingLinks is true)
  if (options.skipExistingLinks) {
    const linkRegex = /<a[^>]*>.*?<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      ranges.push([match.index, match.index + match[0].length]);
    }
  }

  // Exclude text inside existing shortcodes
  if (options.skipExistingShortcodes) {
    const shortcodeRegex = /\[\[(tarot|blog|spread|horoscope):[^\]]+\]\]/gi;
    let match;
    while ((match = shortcodeRegex.exec(content)) !== null) {
      ranges.push([match.index, match.index + match[0].length]);
    }
  }

  // Exclude text inside HTML tag attributes (but not <a> tag content)
  // This prevents matching text like <img alt="The Fool">
  const tagAttrRegex = /<(?!a\s|\/a>)[^>]+>/gi;
  let match;
  while ((match = tagAttrRegex.exec(content)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }

  return ranges;
}

/**
 * Check if a position falls within excluded ranges
 */
function isPositionExcluded(position: number, length: number, ranges: Array<[number, number]>): boolean {
  for (const [start, end] of ranges) {
    if (position >= start && position < end) return true;
    if (position + length > start && position + length <= end) return true;
    if (position <= start && position + length >= end) return true;
  }
  return false;
}

/**
 * Check if the match is a whole word (not part of a larger word)
 */
function isWholeWord(content: string, position: number, length: number): boolean {
  const before = position > 0 ? content[position - 1] : ' ';
  const after = position + length < content.length ? content[position + length] : ' ';

  const wordBoundary = /[\s\.,;:!?\-\(\)\[\]"'<>\/]/;
  return wordBoundary.test(before) && wordBoundary.test(after);
}

/**
 * Check if a position is inside an existing link, and return the link info if so
 */
function findContainingLink(position: number, existingLinks: ExistingLink[]): ExistingLink | null {
  for (const link of existingLinks) {
    if (position >= link.start && position < link.end) {
      return link;
    }
  }
  return null;
}

/**
 * Check if a matched term has proper capitalization
 * Only checks significant words - "the" and "of" can be any case.
 * e.g., "The World" and "the World" both match, but "the world" doesn't.
 */
function hasProperCapitalization(matchedText: string, termKey: string): boolean {
  // Compare against the term that was matched (e.g., "the emperor"), not the full title
  // The termKey is lowercase, so we just check if matched text has capitals where expected
  const matchedWords = matchedText.split(' ');
  const termWords = termKey.split(' ');

  if (matchedWords.length !== termWords.length) return false;

  for (let i = 0; i < matchedWords.length; i++) {
    const matchedWord = matchedWords[i];
    const termWord = termWords[i];

    // Skip capitalization check for "the" and "of" - they can be any case
    // This allows "the Emperor" to match "The Emperor" while still
    // avoiding false positives like "the world around me" for "The World"
    if (termWord === 'the' || termWord === 'of') {
      continue;
    }

    // Significant words must be capitalized to avoid false positives
    if (matchedWord[0] !== matchedWord[0].toUpperCase()) {
      return false;
    }
  }

  return true;
}

/**
 * Scan content for linkable terms
 */
export function scanForLinkableTerms(
  content: string,
  registry: LinkRegistry,
  options: ScanOptions = {}
): LinkSuggestion[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const suggestions: LinkSuggestion[] = [];
  const termMap = buildTermMap(registry);
  const excludedRanges = findExcludedRanges(content, opts);
  const existingLinks = findExistingLinks(content);
  const existingShortcodes = findExistingShortcodes(content);
  const foundTerms = new Set<string>();
  const processedLinkRanges = new Set<string>(); // Track which links we've already processed
  const processedShortcodeRanges = new Set<string>(); // Track which shortcodes we've already processed

  // Sort terms by length (longest first) to match longer phrases before shorter ones
  const sortedTerms = Array.from(termMap.entries()).sort((a, b) => b[0].length - a[0].length);

  for (const [term, info] of sortedTerms) {
    // Skip self-links (current article)
    if (opts.currentArticleSlug && info.slug === opts.currentArticleSlug) {
      continue;
    }

    // Skip if we already found this term and only want first occurrence
    if (opts.firstOccurrenceOnly && foundTerms.has(term)) {
      continue;
    }

    // Create regex for the term (always case-insensitive for finding, check case later)
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedTerm, 'gi');

    let match;
    while ((match = regex.exec(content)) !== null) {
      const position = match.index;
      const matchedText = match[0];

      // Skip if in excluded range (shortcodes, tag attributes)
      if (isPositionExcluded(position, matchedText.length, excludedRanges)) {
        continue;
      }

      // Check capitalization for terms that require it (e.g., "The World" not "the world")
      if (info.requiresCapital && !hasProperCapitalization(matchedText, term)) {
        continue;
      }

      // Check if term is inside an existing link
      const containingLink = findContainingLink(position, existingLinks);

      // If inside a link, check if we've already processed this link
      if (containingLink) {
        const linkKey = `${containingLink.start}-${containingLink.end}`;
        if (processedLinkRanges.has(linkKey)) {
          continue;
        }
        processedLinkRanges.add(linkKey);
      }

      // Check if term is inside an existing shortcode (for shortcodes with custom text)
      const containingShortcode = findContainingShortcode(position, existingShortcodes);

      // If inside a shortcode, check if we've already processed it
      if (containingShortcode) {
        const scKey = `${containingShortcode.start}-${containingShortcode.end}`;
        if (processedShortcodeRanges.has(scKey)) {
          continue;
        }
        processedShortcodeRanges.add(scKey);
      }

      // Skip if not a whole word (only check for plain text, not linked/shortcoded text)
      if (!containingLink && !containingShortcode && !isWholeWord(content, position, matchedText.length)) {
        continue;
      }

      // Skip if already found and only want first occurrence
      if (opts.firstOccurrenceOnly && foundTerms.has(term)) {
        break;
      }

      foundTerms.add(term);

      // Determine replacement range and display text based on context
      let replacePosition: number;
      let replaceLength: number;
      let displayText: string;

      if (containingLink) {
        // Inside an existing link - replace the entire link
        replacePosition = containingLink.start;
        replaceLength = containingLink.end - containingLink.start;
        displayText = containingLink.text;
      } else if (containingShortcode) {
        // Inside an existing shortcode - replace the entire shortcode
        replacePosition = containingShortcode.start;
        replaceLength = containingShortcode.end - containingShortcode.start;
        displayText = containingShortcode.customText || matchedText;
      } else {
        // Plain text
        replacePosition = position;
        replaceLength = matchedText.length;
        displayText = matchedText;
      }

      // Always preserve original text to avoid replacing "The Emperor" with "The Emperor: A Foundation of Power"
      const shortcode = `[[${info.type}:${info.slug}|${displayText}]]`;

      suggestions.push({
        term: displayText,
        type: info.type,
        slug: info.slug,
        title: info.title,
        shortcode,
        position: replacePosition,
        length: replaceLength,
        selected: true,
      });

      // If only first occurrence, break after finding one
      if (opts.firstOccurrenceOnly) {
        break;
      }
    }
  }

  // Sort by position
  return suggestions.sort((a, b) => a.position - b.position);
}

/**
 * Apply selected suggestions to content
 * Replaces matched terms (or entire links) with shortcodes
 */
export function applyLinkSuggestions(content: string, suggestions: LinkSuggestion[]): string {
  // Filter to only selected suggestions
  const selected = suggestions.filter((s) => s.selected);

  // Sort by position in reverse order (so replacements don't affect positions)
  const sorted = [...selected].sort((a, b) => b.position - a.position);

  let result = content;
  for (const suggestion of sorted) {
    const before = result.slice(0, suggestion.position);
    const after = result.slice(suggestion.position + suggestion.length);
    result = before + suggestion.shortcode + after;
  }

  return result;
}

/**
 * Generate a preview of content with highlighted suggestions
 */
export function generatePreview(content: string, suggestions: LinkSuggestion[]): string {
  // Sort by position in reverse order
  const sorted = [...suggestions].sort((a, b) => b.position - a.position);

  let result = content;
  for (const suggestion of sorted) {
    const before = result.slice(0, suggestion.position);
    const after = result.slice(suggestion.position + suggestion.length);
    const highlighted = suggestion.selected
      ? `<mark class="bg-purple-500/30">${suggestion.term}</mark>`
      : suggestion.term;
    result = before + highlighted + after;
  }

  return result;
}
