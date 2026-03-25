/**
 * Parser for extracting structured yes/no data from tarot article
 * key-takeaways HTML blocks.
 *
 * The key-takeaways section can appear in two formats:
 *
 * Format 1 (wrapped):
 *   <div class="key-takeaways">
 *     <h2>Key Takeaways</h2>
 *     <p><strong>Core Meaning:</strong> ...</p>
 *     ...
 *   </div>
 *
 * Format 2 (inline):
 *   <h2>Key Takeaways: Card Name</h2>
 *   <p><strong>Core Meaning:</strong> ...</p>
 *   ...
 */

export type Verdict = 'YES' | 'NO' | 'UNCLEAR' | 'WAIT';

export interface KeyTakeaways {
  coreMeaning: string;
  upright: string;
  reversed: string;
  element: string;
  zodiac: string;
  yesNo: string;
  bestAdvice: string;
  verdict: Verdict;
}

/**
 * Extract a field value from key-takeaways HTML.
 * Pattern: <strong>Label:</strong> value</p>
 */
function extractField(html: string, label: string): string {
  const regex = new RegExp(`<strong>${label}:<\\/strong>\\s*(.+?)<\\/p>`, 'is');
  const match = regex.exec(html);
  if (!match) return '';
  // Strip any remaining HTML tags from the value
  return match[1].replace(/<[^>]+>/g, '').trim();
}

/**
 * Derive the yes/no verdict from the yesNo text.
 * Looks at the first word: YES, NO, UNCLEAR, WAIT, MAYBE → UNCLEAR
 */
function parseVerdict(yesNoText: string): Verdict {
  const firstWord = yesNoText
    .split(/[,.\s—–-]/)[0]
    .toUpperCase()
    .trim();

  if (firstWord === 'YES') return 'YES';
  if (firstWord === 'NO') return 'NO';
  if (firstWord === 'WAIT') return 'WAIT';
  // MAYBE, UNCLEAR, NEUTRAL, or anything else
  return 'UNCLEAR';
}

/**
 * Parse the key-takeaways block from an article's HTML content.
 * Supports two formats:
 *   1. Wrapped in <div class="key-takeaways">...</div>
 *   2. Starting with <h2>Key Takeaways...</h2> followed by <p><strong>...</strong>...</p> fields
 * Returns null if the block is not found.
 */
export function parseKeyTakeaways(htmlContent: string): KeyTakeaways | null {
  // Format 1: wrapped in a <div class="key-takeaways">
  const containerMatch = /<div class="key-takeaways">([\s\S]*?)<\/div>/i.exec(htmlContent);
  // Format 2: <h2>Key Takeaways...</h2> followed by fields until next <h2> or end
  const h2Match = /<h2>Key Takeaways[^<]*<\/h2>([\s\S]*?)(?=<h2|$)/i.exec(htmlContent);

  const block = containerMatch?.[1] ?? h2Match?.[1];
  if (!block) return null;

  const coreMeaning = extractField(block, 'Core Meaning');
  const upright = extractField(block, 'Upright');
  const reversed = extractField(block, 'Reversed');
  const element = extractField(block, 'Element');
  const zodiac = extractField(block, 'Zodiac');
  const yesNo = extractField(block, 'Yes/No');
  const bestAdvice = extractField(block, 'Best Advice');

  // Must have at least a yes/no field to be useful
  if (!yesNo) return null;

  return {
    coreMeaning,
    upright,
    reversed,
    element,
    zodiac,
    yesNo,
    bestAdvice,
    verdict: parseVerdict(yesNo),
  };
}

/**
 * Strip all HTML tags from a string.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract reversed-specific sections from the full article HTML.
 * Looks for h2/h3 headings containing "Reversed" and grabs the following paragraphs.
 */
function extractReversedSections(htmlContent: string): string {
  const sections: string[] = [];
  // Match h2 or h3 containing "Reversed" followed by content until next heading or end
  const regex = /<h[23][^>]*>[^<]*Reversed[^<]*<\/h[23]>([\s\S]*?)(?=<h[23]|$)/gi;
  let match = regex.exec(htmlContent);
  while (match) {
    const text = stripHtml(match[1]).trim();
    if (text) {
      sections.push(text);
    }
    match = regex.exec(htmlContent);
  }
  return sections.join(' ');
}

/**
 * Extract keywords section from the full article HTML.
 */
function extractKeywordsSection(htmlContent: string): string {
  // Look for a heading containing "Keywords" followed by content
  const regex = /<h[23][^>]*>[^<]*Keywords?[^<]*<\/h[23]>([\s\S]*?)(?=<h[23]|$)/gi;
  const match = regex.exec(htmlContent);
  if (!match) return '';
  return stripHtml(match[1]).trim();
}

/**
 * Truncate text to approximately the given word count.
 */
function truncateToWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Extract article context for AI interpretation.
 * Returns a clean text block with structured data from the article,
 * suitable for grounding AI responses. Kept under ~300 words.
 */
export function extractArticleContext(htmlContent: string, isReversed: boolean): string {
  if (!htmlContent || !htmlContent.trim()) {
    return '';
  }

  const takeaways = parseKeyTakeaways(htmlContent);
  const parts: string[] = [];

  if (takeaways) {
    if (takeaways.coreMeaning) {
      parts.push(`Core Meaning: ${takeaways.coreMeaning}`);
    }

    if (isReversed) {
      if (takeaways.reversed) {
        parts.push(`Reversed: ${takeaways.reversed}`);
      }
    } else {
      if (takeaways.upright) {
        parts.push(`Upright: ${takeaways.upright}`);
      }
    }

    if (takeaways.yesNo) {
      parts.push(`Yes/No: ${takeaways.yesNo}`);
    }

    if (takeaways.bestAdvice) {
      parts.push(`Best Advice: ${takeaways.bestAdvice}`);
    }
  }

  // For reversed cards, extract additional reversed context from the article body
  if (isReversed) {
    const reversedText = extractReversedSections(htmlContent);
    if (reversedText) {
      parts.push(`Additional Context: ${reversedText}`);
    }
  }

  // Extract keywords if available
  const keywords = extractKeywordsSection(htmlContent);
  if (keywords) {
    parts.push(`Keywords: ${keywords}`);
  }

  const fullContext = parts.join('\n');
  return truncateToWords(fullContext, 300);
}
