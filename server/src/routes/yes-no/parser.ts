/**
 * Parser for extracting structured yes/no data from tarot article
 * key-takeaways HTML blocks.
 *
 * The key-takeaways section has this structure:
 *   <div class="key-takeaways">
 *     <h2>Key Takeaways</h2>
 *     <p><strong>Core Meaning:</strong> ...</p>
 *     <p><strong>Upright:</strong> ...</p>
 *     <p><strong>Reversed:</strong> ...</p>
 *     <p><strong>Element:</strong> ...</p>
 *     <p><strong>Zodiac:</strong> ...</p>
 *     <p><strong>Yes/No:</strong> ...</p>
 *     <p><strong>Best Advice:</strong> ...</p>
 *   </div>
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
 * Returns null if the block is not found.
 */
export function parseKeyTakeaways(htmlContent: string): KeyTakeaways | null {
  // Find the key-takeaways container
  const containerMatch = /<div class="key-takeaways">([\s\S]*?)<\/div>/i.exec(htmlContent);
  if (!containerMatch) return null;

  const block = containerMatch[1];

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
