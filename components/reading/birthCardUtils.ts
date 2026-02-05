/**
 * Utility functions for Birth Card content formatting
 */

/**
 * Convert markdown inline formatting to HTML
 * - **text** → <strong>text</strong>
 * - *text* → <em>text</em>
 */
export function convertMarkdownInline(text: string): string {
  // Convert **bold** to <strong>
  let result = text.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #fcd34d;">$1</strong>');
  // Convert *italic* to <em> (but not if it's part of a list marker)
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  return result;
}

/**
 * Format HTML content by converting newlines to proper HTML structure
 * - Processes line-by-line to properly detect headers
 * - Detects plain text headers and wraps in h2
 * - Handles numbered lists (1. 2. 3.)
 * - Converts markdown bold/italic
 * - Preserves existing HTML block elements
 * - Ensures h2/h3 tags have visible styling
 */
export function formatHtmlContent(content: string): string {
  if (!content) return '';

  // Header style constants
  const h2Style = 'font-size: 1.5rem; font-weight: 600; color: #c4b5fd; text-align: center; margin: 1.5rem 0 0.75rem 0;';
  const h3Style = 'font-size: 1.25rem; font-weight: 600; color: #a78bfa; text-align: center; margin: 1.25rem 0 0.5rem 0;';

  // Exact header texts to detect (these appear on their own line)
  const exactHeaders = new Set([
    'what is a personality card?',
    'what is a soul card?',
    'how others experience you',
    'your visible gifts',
    'your growth edges',
    'working with your personality card',
    'working with your soul card',
    'daily awareness',
    'reflection questions',
    'your personality card in relationship',
    'your soul card in relationship',
  ]);

  // Check if line is a header
  const isHeaderLine = (line: string): boolean => {
    const trimmed = line.trim().toLowerCase();
    if (exactHeaders.has(trimmed)) return true;
    // Pattern: "The [Card Name]: Your Outer/Inner Expression" (card name can be 1-4 words)
    if (/^the [\w\s]+: your (outer |inner )?expression$/i.test(line.trim())) return true;
    // Pattern: "Embracing Your [Card] Expression/Energy"
    if (/^embracing your [\w\s]+ (expression|energy)$/i.test(line.trim())) return true;
    return false;
  };

  // Check if line is a numbered list item (1. 2. 3. etc)
  const isNumberedListItem = (line: string): boolean => {
    return /^\d+\.\s+/.test(line.trim());
  };

  // Process line by line
  const lines = content.split('\n');
  const elements: string[] = [];
  let currentParagraph: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      const listHtml = listItems
        .map(item => `<li style="margin-bottom: 0.75em; padding-left: 0.5em;">${convertMarkdownInline(item)}</li>`)
        .join('');
      elements.push(`<ol style="margin: 1em 0; padding-left: 1.5em; list-style-type: decimal;">${listHtml}</ol>`);
      listItems = [];
      inList = false;
    }
  };

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        if (/^<(h[1-6]|div|ul|ol|li|blockquote|p)/i.test(text)) {
          elements.push(text);
        } else {
          elements.push(`<p style="margin-bottom: 0.75em; font-size: 1rem; line-height: 1.7;">${convertMarkdownInline(text)}</p>`);
        }
      }
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line = paragraph break
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Check if this is a standalone header line
    if (isHeaderLine(trimmed)) {
      flushParagraph();
      flushList();
      elements.push(`<h2 style="${h2Style}">${convertMarkdownInline(trimmed)}</h2>`);
      continue;
    }

    // Check if this is a numbered list item
    if (isNumberedListItem(trimmed)) {
      flushParagraph();
      inList = true;
      // Extract the content after the number and period
      const listContent = trimmed.replace(/^\d+\.\s+/, '');
      listItems.push(listContent);
      continue;
    }

    // If we were in a list but this line isn't a list item, flush the list
    if (inList && !isNumberedListItem(trimmed)) {
      flushList();
    }

    // Regular content - add to current paragraph
    currentParagraph.push(trimmed);
  }

  // Flush any remaining content
  flushParagraph();
  flushList();

  // Italicize the last element if it's a reflective question (starts with How/What and ends with ?)
  if (elements.length > 0) {
    const lastIdx = elements.length - 1;
    const last = elements[lastIdx];
    // Check if it's a paragraph containing a question that isn't already italicized
    if (
      last.startsWith('<p') &&
      !last.includes('<em>') &&
      /\b(How|What)\b.*\?/.test(last)
    ) {
      // Extract the content and wrap in em
      elements[lastIdx] = last.replace(
        /<p([^>]*)>(.*)<\/p>/,
        '<p$1><em>$2</em></p>'
      );
    }
  }

  // Join all elements
  let result = elements.join('');

  // Ensure any existing h2/h3 tags in original content have visible styling
  result = result.replace(/<h2[^>]*>/gi, `<h2 style="${h2Style}">`);
  result = result.replace(/<h3[^>]*>/gi, `<h3 style="${h3Style}">`);

  return result;
}

/**
 * Calculate personal year number from birth date
 * (birth month + birth day + current year, reduced to 1-9)
 */
export function calculatePersonalYearNumber(birthMonth: number, birthDay: number, year: number): number {
  const sum = birthMonth + birthDay + year;
  let result = sum;
  while (result > 9) {
    result = result.toString().split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }
  return result;
}

/**
 * Major Arcana names for personal year display
 */
export const MAJOR_ARCANA_NAMES: Record<number, { en: string; fr: string }> = {
  1: { en: 'The Magician', fr: 'Le Bateleur' },
  2: { en: 'The High Priestess', fr: 'La Papesse' },
  3: { en: 'The Empress', fr: "L'Impératrice" },
  4: { en: 'The Emperor', fr: "L'Empereur" },
  5: { en: 'The Hierophant', fr: 'Le Pape' },
  6: { en: 'The Lovers', fr: "L'Amoureux" },
  7: { en: 'The Chariot', fr: 'Le Chariot' },
  8: { en: 'Strength', fr: 'La Force' },
  9: { en: 'The Hermit', fr: "L'Hermite" },
};
