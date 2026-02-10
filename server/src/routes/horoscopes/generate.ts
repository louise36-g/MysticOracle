/**
 * Horoscopes Routes - Generation Logic
 *
 * Functions:
 * - cleanHoroscopeText() - Post-process to remove astrological jargon
 * - generateHoroscope() - Generate horoscope with planetary data
 */

import { getHoroscopePrompt, openRouterService, PlanetaryCalculationService } from './shared.js';

const planetaryService = new PlanetaryCalculationService();

// ============================================
// TEXT CLEANING
// ============================================

/**
 * Post-process horoscope to remove excessive astrological jargon
 * Keeps the practical advice, removes planet name padding
 */
export function cleanHoroscopeText(text: string): string {
  let cleaned = text;

  // Replace em-dashes with commas first
  cleaned = cleaned.replace(/[—–]/g, ',');

  // Planet names for matching
  const planets = 'Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto';
  const zodiacSignsRegex =
    'Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces';
  const aspects = 'trine|sextile|square|conjunction|opposition|aspect|quincunx';

  // Remove entire sentences that are mostly astrological jargon
  const sentencePatterns = [
    // Any sentence starting with "The [Planet]"
    new RegExp(`[^.]*\\bThe\\s+(${planets})\\s+[^.]*\\.`, 'gi'),
    // Any sentence with "[Planet] is/are/continues/has [verb]"
    new RegExp(`[^.]*\\b(${planets})\\s+(is|are|continues|has|have)\\s+[^.]*\\.`, 'gi'),
    // Any sentence with "[Planet]'s" possessive
    new RegExp(`[^.]*\\b(${planets})'s\\s+[^.]*\\.`, 'gi'),
    // Sentences about aspects
    new RegExp(`[^.]*\\b(${aspects})\\b[^.]*\\.`, 'gi'),
    // Sentences with retrograde
    /[^.]*\bretrograde\b[^.]*\./gi,
    // Sentences with "in [Zodiac Sign]" in astrological context
    new RegExp(
      `[^.]*\\b(${planets})\\s+(in|through|enters|moves|transits)\\s+(${zodiacSignsRegex})[^.]*\\.`,
      'gi'
    ),
    // "[Planet]-[Sign]" combinations in sentences
    new RegExp(`[^.]*\\b(${planets})[,\\-–](${zodiacSignsRegex})\\b[^.]*\\.`, 'gi'),
    // "Today's [aspect/alignment/energy] brings..."
    /[^.]*Today's\s+(alignment|aspect|energy|cosmic|celestial|planetary)[^.]*\./gi,
    // "With [Planet]..." sentences
    new RegExp(`[^.]*\\bWith\\s+(the\\s+)?(${planets})\\b[^.]*\\.`, 'gi'),
    // "As [Planet] [verbs]..." sentences
    new RegExp(`[^.]*\\bAs\\s+(the\\s+)?(${planets})\\s+\\w+s?\\b[^.]*\\.`, 'gi'),
    // Sentences starting with "At the same time" with planets
    new RegExp(`At the same time,\\s+[^.]*\\b(${planets})[^.]*\\.`, 'gi'),
    // "This [astrological term]..." sentences
    /This\s+(aspect|conjunction|trine|sextile|square|opposition|alignment|configuration|transit|energy)[^.]*\./gi,
    // "Under the influence of..."
    /[^.]*\bunder\s+the\s+influence\s+of[^.]*\./gi,
    // "The cosmic/celestial [noun]..."
    /[^.]*\bthe\s+(cosmic|celestial)\s+\w+[^.]*\./gi,
    // Sentences mentioning zodiac sign influence directly
    new RegExp(`[^.]*\\b(${zodiacSignsRegex})('s|\\s+)influence[^.]*\\.`, 'gi'),
    // "When [Planet]..." sentences
    new RegExp(`[^.]*\\bWhen\\s+(the\\s+)?(${planets})\\s+[^.]*\\.`, 'gi'),
    // "[Planet], [description]," type constructions at sentence start
    new RegExp(`^(${planets}),\\s+[^.]*\\.`, 'gim'),
    // Sentences with "the sky" in astrological context
    /[^.]*\bthe\s+sky\s+(is|offers|invites|brings|shows)[^.]*\./gi,
  ];

  for (const pattern of sentencePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove astrological clause fragments within sentences
  const fragmentPatterns = [
    // ", while/as/and [Planet]..." clauses
    new RegExp(
      `,\\s*(while|as|and|with|since|because)\\s+[^,]*\\b(${planets})\\b[^,.]*(,|\\.)`,
      'gi'
    ),
    // "the Sun-Mercury duo" type phrases
    new RegExp(`\\bthe\\s+(${planets})[,\\-–](${planets})\\s+[a-z]+`, 'gi'),
    // ", thanks to [Planet]" clauses
    new RegExp(`,\\s*thanks\\s+to\\s+(the\\s+)?(${planets})[^,]*`, 'gi'),
    // ", as [Planet] [aspect]..." clauses
    new RegExp(`,\\s*as\\s+(the\\s+)?(${planets})\\s+\\w+[^,]*`, 'gi'),
    // ", offering/bringing cosmic/celestial..." clauses
    /,\s*(offer|bring)[a-z]*\s+[^,]*(cosmic|celestial|planetary|subtle|gentle|steady|strong)\s+[^,]*/gi,
    // "the [Planet]-" fragments at end
    new RegExp(`\\bthe\\s+(${planets})[,\\-–]?\\s*$`, 'gi'),
    // ", courtesy of [Planet]"
    new RegExp(`,\\s*courtesy\\s+of\\s+(the\\s+)?(${planets})[^,]*`, 'gi'),
    // ", under [Planet]'s" clauses
    new RegExp(`,\\s*under\\s+(the\\s+)?(${planets})('s)?\\s+[^,]*`, 'gi'),
    // ", when [Planet]" clauses
    new RegExp(`,\\s*when\\s+(the\\s+)?(${planets})\\s+[^,]*`, 'gi'),
    // "[Planet]-[Sign]'s" constructions
    new RegExp(`(${planets})[,\\-–](${zodiacSignsRegex})('s)?\\s+\\w+`, 'gi'),
  ];

  for (const pattern of fragmentPatterns) {
    cleaned = cleaned.replace(pattern, '.');
  }

  // Remove any remaining standalone planet mentions (as inline replacements)
  // Replace "the [Planet] energy" with just "the energy"
  cleaned = cleaned.replace(
    new RegExp(`the\\s+(${planets})\\s+(energy|influence|power)`, 'gi'),
    'the $2'
  );
  // Replace "[Planet] energy" with "today's energy"
  cleaned = cleaned.replace(new RegExp(`(${planets})\\s+(energy|influence)`, 'gi'), "today's $2");
  // Remove inline planet mentions like "Venus helps you" -> "You may find"
  cleaned = cleaned.replace(
    new RegExp(`(${planets})\\s+(helps?|supports?|encourages?|invites?)\\s+(you|us)`, 'gi'),
    'You may find it easier'
  );
  // Replace "the [Planet]'s [description]" with "the day's [description]" or "today's [description]"
  cleaned = cleaned.replace(new RegExp(`the\\s+(${planets})('s|'s)\\s+(\\w+)`, 'gi'), "today's $3");
  // Replace "[Planet]'s [noun]" with "the [noun]"
  cleaned = cleaned.replace(new RegExp(`(${planets})('s|'s)\\s+(\\w+\\s+\\w+)`, 'gi'), 'the $3');
  // Replace "When the [Planet]" with "When the day"
  cleaned = cleaned.replace(new RegExp(`When\\s+the\\s+(${planets})`, 'gi'), 'When the day');
  // Replace "let [Planet]'s" with "let the"
  cleaned = cleaned.replace(new RegExp(`let\\s+(${planets})('s|'s)`, 'gi'), 'let the');
  // Replace remaining "[Planet] in [Sign]" inline references
  cleaned = cleaned.replace(
    new RegExp(`(${planets})\\s+in\\s+(${zodiacSignsRegex})`, 'gi'),
    'the current energy'
  );
  // Remove "in [Sign]" zodiac references after other words
  cleaned = cleaned.replace(new RegExp(`\\s+in\\s+(${zodiacSignsRegex})`, 'gi'), '');

  // Clean up punctuation issues (preserve newlines for paragraph formatting)
  cleaned = cleaned.replace(/[^\S\n]+/g, ' '); // Collapse spaces but keep newlines
  cleaned = cleaned.replace(/\s+\./g, '.');
  cleaned = cleaned.replace(/\s+,/g, ',');
  cleaned = cleaned.replace(/,\s*,+/g, ',');
  cleaned = cleaned.replace(/\.+/g, '.');
  cleaned = cleaned.replace(/,\s*\./g, '.');
  cleaned = cleaned.replace(/\.\s*,/g, '.');
  cleaned = cleaned.replace(/^\s+/gm, '');

  // Normalize multiple newlines to double newline (paragraph break)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/  +/g, ' ');

  // Fix sentences that now start with lowercase
  cleaned = cleaned.replace(/\.\s+([a-z])/g, (_, letter) => `. ${letter.toUpperCase()}`);

  // Remove section headers with no content after them
  cleaned = cleaned.replace(/\*\*[^*]+\*\*\s*\./g, '');
  cleaned = cleaned.replace(/\*\*[^*]+\*\*\s*\n\s*\*\*/g, '**');

  // Ensure section headers have content
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*\s*\n\s*\n/g, '**$1**\n');

  // Fix text that ends mid-sentence (trim to last complete sentence)
  cleaned = cleaned.trim();
  if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
    const lastPeriod = cleaned.lastIndexOf('.');
    const lastExclaim = cleaned.lastIndexOf('!');
    const lastQuestion = cleaned.lastIndexOf('?');
    const lastPunctuation = Math.max(lastPeriod, lastExclaim, lastQuestion);
    if (lastPunctuation > cleaned.length * 0.5) {
      // Only trim if we're not losing more than half the text
      cleaned = cleaned.substring(0, lastPunctuation + 1);
    }
  }

  // Add paragraph breaks before common section-starting phrases
  // Only match after sentence-ending punctuation to avoid breaking mid-sentence
  const paragraphStarters = [
    // English patterns
    /([.!?])\s+(In the realm of|When it comes to|In terms of|Regarding your|As for your)\s+/gi,
    /([.!?])\s+(In matters of|On the work front|At work today|Career-wise|Financially speaking)\s+/gi,
    /([.!?])\s+(As you navigate|As you move through|As the day unfolds|As evening approaches|The evening)\s+/gi,
    /([.!?])\s+(Inside,|Internally,|Emotionally,|For self-care,|Take time to)\s+/gi,
    /([.!?])\s+(For practical|Practical steps|Here are some|Today's tip:)\s+/gi,
    /([.!?])\s+(May you|May the day|As you close|As the day draws)\s+/gi,
    // French patterns
    /([.!?])\s+(Dans le domaine|En ce qui concerne|Concernant|Quant à|Pour ce qui est)\s+/gi,
    /([.!?])\s+(Sur le plan|Au niveau|En matière de|Du côté de|Côté)\s+/gi,
    /([.!?])\s+(Au travail|Professionnellement|Financièrement|Pour les finances|Pour le travail)\s+/gi,
    /([.!?])\s+(Pour votre bien-être|Prenez soin|Accordez-vous|N'oubliez pas de|Pensez à)\s+/gi,
    /([.!?])\s+(Aujourd'hui,? essayez|Conseil du jour|Pour aujourd'hui|Le conseil)\s+/gi,
    /([.!?])\s+(Dans votre vie|Dans vos relations|En amour|Pour l'amour|Les relations)\s+/gi,
  ];

  for (const pattern of paragraphStarters) {
    cleaned = cleaned.replace(
      pattern,
      (match, punctuation, phrase) => punctuation + '\n\n' + phrase + ' '
    );
  }

  // Clean up any excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

// ============================================
// GENERATION
// ============================================

/**
 * Generate horoscope with real planetary data using unified OpenRouterService
 * Phase 3: Enhanced with astronomy-engine calculations
 */
export async function generateHoroscope(sign: string, language: 'en' | 'fr'): Promise<string> {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    // Note: year omitted - AI models may refuse dates beyond their training cutoff
  });

  try {
    // Calculate real planetary positions
    const planetaryData = await planetaryService.calculatePlanetaryData(new Date());
    const formattedData = planetaryService.formatForPrompt(planetaryData);

    // Get prompt with planetary data
    const prompt = await getHoroscopePrompt({
      sign,
      today,
      language,
      planetaryData: formattedData,
    });

    // Use unified service with retry logic and proper error handling
    const horoscope = await openRouterService.generateHoroscope(prompt, {
      temperature: 0.8,
      maxTokens: 2000,
    });

    // Return horoscope as-is - the prompt now handles tone and formatting
    return horoscope;
  } catch (error) {
    // If planetary calculations fail, throw explicit error
    // Don't silently fallback to generating without data
    if (error instanceof Error && error.message.includes('planetary')) {
      console.error('[Horoscope] Planetary calculation failed:', error.message);
      throw new Error('PLANETARY_CALCULATION_FAILED');
    }
    throw error;
  }
}
