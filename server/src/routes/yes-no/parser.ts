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
 * Accepts multiple label variants (English and French) and handles both
 * English typography (Label:) and French typography (Label :) where a
 * space precedes the colon.
 * Pattern: <strong>Label[space]?:[space]?</strong>[space]?:[space]? value</p>
 */
function extractField(html: string, ...labels: string[]): string {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Colon may be inside or outside <strong>, with optional surrounding spaces
    const regex = new RegExp(
      `<strong>\\s*${escaped}\\s*:?\\s*<\\/strong>\\s*:?\\s*(.+?)<\\/p>`,
      'is'
    );
    const match = regex.exec(html);
    if (match) {
      return match[1].replace(/<[^>]+>/g, '').trim();
    }
  }
  return '';
}

/**
 * Derive the yes/no verdict from the yesNo text.
 * Handles both English (YES/NO/WAIT) and French (OUI/NON/ATTENDEZ) first words.
 */
function parseVerdict(yesNoText: string): Verdict {
  const firstWord = yesNoText
    .split(/[,.\s—–-]/)[0]
    .toUpperCase()
    .trim();

  if (firstWord === 'YES' || firstWord === 'OUI') return 'YES';
  if (firstWord === 'NO' || firstWord === 'NON') return 'NO';
  if (firstWord === 'WAIT' || firstWord === 'ATTENDEZ') return 'WAIT';
  // MAYBE, UNCLEAR, NEUTRAL, INCERTAIN, or anything else
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
  // Format 2: <h2>Key Takeaways...</h2> or French <h2>Points Clés...</h2>
  const h2Match = /<h2>(?:Key Takeaways|Points\s+Cl[eé]s)[^<]*<\/h2>([\s\S]*?)(?=<h2|$)/i.exec(
    htmlContent
  );

  const block = containerMatch?.[1] ?? h2Match?.[1];
  if (!block) return null;

  // Try English labels first, then French equivalents
  const coreMeaning = extractField(
    block,
    'Core Meaning',
    'Signification Centrale',
    'Signification principale'
  );
  const upright = extractField(block, 'Upright', "À l'Endroit", "A l'Endroit", 'Droite');
  const reversed = extractField(
    block,
    'Reversed',
    "À l'Envers",
    "A l'Envers",
    'Renversée',
    'Inversée'
  );
  const element = extractField(block, 'Element', 'Élément');
  const zodiac = extractField(block, 'Zodiac', 'Zodiaque');
  const yesNo = extractField(block, 'Yes/No', 'Oui/Non', 'Oui / Non');
  const bestAdvice = extractField(block, 'Best Advice', 'Meilleur Conseil', 'Conseil');

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
