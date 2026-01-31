/**
 * Prompt Service
 *
 * Central service for fetching, caching, and interpolating AI prompts.
 * Prompts are stored in SystemSetting table with 5-minute cache.
 * Falls back to hardcoded defaults if database is unavailable.
 */

import prisma from '../db/prisma.js';
import { DEFAULT_PROMPTS, getDefaultPrompt } from '../shared/constants/prompts.js';

// Cache interface
interface CachedPrompt {
  value: string;
  expiry: number;
}

// Service configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (matches aiSettings.ts pattern)

// In-memory cache
const promptCache = new Map<string, CachedPrompt>();

/**
 * Get a prompt by key from database with fallback to hardcoded default
 */
export async function getPrompt(key: string): Promise<string> {
  const now = Date.now();

  // Check cache first
  const cached = promptCache.get(key);
  if (cached && now < cached.expiry) {
    return cached.value;
  }

  try {
    // Query database
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (setting && setting.value.trim()) {
      // Cache the result
      promptCache.set(key, {
        value: setting.value,
        expiry: now + CACHE_TTL_MS,
      });
      return setting.value;
    }

    // No value in DB, fall back to default
    const defaultPrompt = getDefaultPrompt(key);
    if (defaultPrompt) {
      console.warn(`[PromptService] No DB value for ${key}, using default`);
      // Cache the default too
      promptCache.set(key, {
        value: defaultPrompt.defaultValue,
        expiry: now + CACHE_TTL_MS,
      });
      return defaultPrompt.defaultValue;
    }

    throw new Error(`Prompt not found and no default available: ${key}`);
  } catch (error) {
    console.error(`[PromptService] Failed to fetch prompt ${key}:`, error);

    // Try fallback to default
    const defaultPrompt = getDefaultPrompt(key);
    if (defaultPrompt) {
      console.warn(`[PromptService] Using fallback default for ${key} due to DB error`);
      return defaultPrompt.defaultValue;
    }

    throw new Error(`Prompt not found: ${key}`);
  }
}

/**
 * Interpolate variables in a prompt template
 * Replaces {{variableName}} with values from the variables object
 */
export function interpolatePrompt(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in variables) {
      return variables[key];
    }
    // Leave unmatched placeholders as-is for debugging
    return match;
  });
}

// Mapping from 5-card layoutId to prompt key
const FIVE_CARD_LAYOUT_GUIDANCE_MAP: Record<string, string> = {
  iceberg: 'SPREAD_GUIDANCE_FIVE_CARD_ICEBERG',
  mirror: 'SPREAD_GUIDANCE_FIVE_CARD_MIRROR',
  inner_child: 'SPREAD_GUIDANCE_FIVE_CARD_INNER_CHILD',
  safe_space: 'SPREAD_GUIDANCE_FIVE_CARD_SAFE_SPACE',
  authentic_self: 'SPREAD_GUIDANCE_FIVE_CARD_AUTHENTIC_SELF',
  values: 'SPREAD_GUIDANCE_FIVE_CARD_VALUES',
  alchemy: 'SPREAD_GUIDANCE_FIVE_CARD_ALCHEMY',
  seasons: 'SPREAD_GUIDANCE_FIVE_CARD_SEASONS',
  love_relationships: 'SPREAD_GUIDANCE_FIVE_CARD_LOVE_RELATIONSHIPS',
  career_purpose: 'SPREAD_GUIDANCE_FIVE_CARD_CAREER_PURPOSE',
};

/**
 * Get assembled tarot reading prompt (base + spread guidance + variables)
 */
export async function getTarotReadingPrompt(params: {
  spreadType: string;
  styleInstructions: string;
  question: string;
  cardsDescription: string;
  language: 'en' | 'fr';
  layoutId?: string;
}): Promise<string> {
  try {
    // Fetch base template and spread guidance
    const basePrompt = await getPrompt('PROMPT_TAROT_BASE');

    // Determine which guidance key to use
    let spreadGuidanceKey = `SPREAD_GUIDANCE_${params.spreadType.toUpperCase()}`;

    // For THREE_CARD with layout, use layout-specific guidance
    if (params.spreadType.toUpperCase() === 'THREE_CARD' && params.layoutId) {
      const layoutKey = params.layoutId.toUpperCase();
      spreadGuidanceKey = `SPREAD_GUIDANCE_THREE_CARD_${layoutKey}`;
    }

    // For FIVE_CARD with layout, use layout-specific guidance
    if (params.spreadType.toUpperCase() === 'FIVE_CARD' && params.layoutId) {
      const guidanceKey = FIVE_CARD_LAYOUT_GUIDANCE_MAP[params.layoutId];
      if (guidanceKey) {
        spreadGuidanceKey = guidanceKey;
      }
    }

    const spreadGuidance = await getPrompt(spreadGuidanceKey);

    // Interpolate variables
    const languageName = params.language === 'en' ? 'English' : 'French';

    const variables = {
      language: languageName,
      spreadName: '', // Will be filled by caller if needed
      styleInstructions: params.styleInstructions,
      question: params.question,
      cardsDescription: params.cardsDescription,
      spreadLayoutGuidance: spreadGuidance,
    };

    return interpolatePrompt(basePrompt, variables);
  } catch (error) {
    console.error('[PromptService] Error assembling tarot reading prompt:', error);
    throw error;
  }
}

/**
 * Get assembled single card oracle reading prompt
 */
export async function getSingleCardReadingPrompt(params: {
  category: string;
  question: string;
  cardName: string;
  isReversed: boolean;
  cardNumber?: string;
  element?: string;
  styles: string[];
  language: 'en' | 'fr';
}): Promise<string> {
  try {
    const basePrompt = await getPrompt('PROMPT_TAROT_BASE_SINGLE');
    const reframingGuidance = await getPrompt('SINGLE_CARD_REFRAMING');

    const languageName = params.language === 'en' ? 'English' : 'French';

    // Build style instructions if any styles selected
    let styleInstructions = '';
    if (params.styles.length > 0) {
      const styleSections: string[] = [];

      for (const style of params.styles) {
        let stylePrompt: string;
        switch (style) {
          case 'spiritual':
            stylePrompt = await getPrompt('SINGLE_CARD_STYLE_SPIRITUAL');
            styleSections.push(stylePrompt);
            break;
          case 'numerology':
            stylePrompt = await getPrompt('SINGLE_CARD_STYLE_NUMEROLOGY');
            stylePrompt = stylePrompt.replace('{{cardNumber}}', params.cardNumber || "this card's");
            styleSections.push(stylePrompt);
            break;
          case 'elemental':
            stylePrompt = await getPrompt('SINGLE_CARD_STYLE_ELEMENTAL');
            stylePrompt = stylePrompt.replace('{{element}}', params.element || 'elemental');
            styleSections.push(stylePrompt);
            break;
          case 'psycho_emotional':
            stylePrompt = await getPrompt('SINGLE_CARD_STYLE_PSYCHO');
            styleSections.push(stylePrompt);
            break;
        }
      }

      styleInstructions = styleSections.join('\n\n');
    }

    // Build orientation context for the AI (not to be mentioned explicitly in output)
    const orientationContext = params.isReversed
      ? 'The card was drawn REVERSED. Interpret using reversed meanings.'
      : 'The card was drawn UPRIGHT. Interpret using upright meanings.';

    const variables = {
      language: languageName,
      category: params.category,
      question: params.question,
      cardName: params.cardName,
      orientationContext,
      styleInstructions,
      reframingGuidance,
    };

    return interpolatePrompt(basePrompt, variables);
  } catch (error) {
    console.error('[PromptService] Error assembling single card prompt:', error);
    throw error;
  }
}

/**
 * Get tarot follow-up prompt with variables
 */
export async function getTarotFollowUpPrompt(params: {
  context: string;
  history: string;
  newQuestion: string;
  language: 'en' | 'fr';
}): Promise<string> {
  try {
    const template = await getPrompt('PROMPT_TAROT_FOLLOWUP');

    const languageName = params.language === 'en' ? 'English' : 'French';

    const variables = {
      context: params.context,
      history: params.history,
      newQuestion: params.newQuestion,
      language: languageName,
    };

    return interpolatePrompt(template, variables);
  } catch (error) {
    console.error('[PromptService] Error assembling tarot follow-up prompt:', error);
    throw error;
  }
}

/**
 * Get horoscope prompt with variables
 */
export async function getHoroscopePrompt(params: {
  sign: string;
  today: string;
  language: 'en' | 'fr';
  planetaryData?: string;
}): Promise<string> {
  try {
    const template = await getPrompt('PROMPT_HOROSCOPE');

    const languageName = params.language === 'en' ? 'English' : 'French';

    const variables = {
      language: languageName,
      sign: params.sign,
      today: params.today,
      planetaryData: params.planetaryData || '',
    };

    return interpolatePrompt(template, variables);
  } catch (error) {
    console.error('[PromptService] Error assembling horoscope prompt:', error);
    throw error;
  }
}

/**
 * Get horoscope follow-up prompt with variables
 */
export async function getHoroscopeFollowUpPrompt(params: {
  sign: string;
  today: string;
  horoscope: string;
  history: string;
  question: string;
  language: 'en' | 'fr';
}): Promise<string> {
  try {
    const template = await getPrompt('PROMPT_HOROSCOPE_FOLLOWUP');

    const languageName = params.language === 'en' ? 'English' : 'French';

    const variables = {
      today: params.today,
      sign: params.sign,
      horoscope: params.horoscope,
      history: params.history,
      question: params.question,
      language: languageName,
    };

    return interpolatePrompt(template, variables);
  } catch (error) {
    console.error('[PromptService] Error assembling horoscope follow-up prompt:', error);
    throw error;
  }
}

/**
 * Get year energy reading prompt with birth card context
 */
export async function getYearEnergyReadingPrompt(params: {
  year: number;
  yearEnergySection: string;
  birthCardsSection: string;
  language: 'en' | 'fr';
}): Promise<string> {
  try {
    const template = await getPrompt('PROMPT_YEAR_ENERGY_READING');

    const languageName = params.language === 'en' ? 'English' : 'French';

    const variables = {
      language: languageName,
      year: String(params.year),
      yearEnergySection: params.yearEnergySection,
      birthCardsSection: params.birthCardsSection,
    };

    return interpolatePrompt(template, variables);
  } catch (error) {
    console.error('[PromptService] Error assembling year energy prompt:', error);
    throw error;
  }
}

/**
 * Get birth card synthesis prompt (for depth 2 readings)
 * Weaves together Personality, Soul, zodiac, and elemental energies
 */
export async function getBirthCardSynthesisPrompt(params: {
  personalitySection: string;
  soulSection: string;
  zodiacSection: string;
  elementalSection: string;
  language: 'en' | 'fr';
}): Promise<string> {
  try {
    const template = await getPrompt('PROMPT_BIRTH_CARD_SYNTHESIS');

    const languageName = params.language === 'en' ? 'English' : 'French';

    const variables = {
      language: languageName,
      personalitySection: params.personalitySection,
      soulSection: params.soulSection,
      zodiacSection: params.zodiacSection,
      elementalSection: params.elementalSection,
    };

    return interpolatePrompt(template, variables);
  } catch (error) {
    console.error('[PromptService] Error assembling birth card synthesis prompt:', error);
    throw error;
  }
}

/**
 * Clear the prompt cache (call after prompt updates)
 */
export function clearCache(): void {
  const size = promptCache.size;
  promptCache.clear();
  console.log(`[PromptService] Cache cleared, ${size} entries removed`);
}

/**
 * Seed all default prompts to database
 */
export async function seedPrompts(): Promise<{
  seeded: Array<{ key: string; created: boolean }>;
  count: number;
}> {
  const results: Array<{ key: string; created: boolean }> = [];

  for (const prompt of DEFAULT_PROMPTS) {
    try {
      // Use upsert to avoid duplicates
      const existing = await prisma.systemSetting.findUnique({
        where: { key: prompt.key },
      });

      if (!existing) {
        await prisma.systemSetting.create({
          data: {
            key: prompt.key,
            value: prompt.defaultValue,
            isSecret: false,
            description: prompt.description,
          },
        });
        results.push({ key: prompt.key, created: true });
      } else {
        results.push({ key: prompt.key, created: false });
      }
    } catch (error) {
      console.error(`[PromptService] Failed to seed prompt ${prompt.key}:`, error);
      results.push({ key: prompt.key, created: false });
    }
  }

  // Clear cache after seeding
  clearCache();

  return {
    seeded: results,
    count: results.filter(r => r.created).length,
  };
}

/**
 * Get service instance (for backwards compatibility with existing patterns)
 */
export function getPromptService() {
  return {
    getPrompt,
    getTarotReadingPrompt,
    getSingleCardReadingPrompt,
    getTarotFollowUpPrompt,
    getHoroscopePrompt,
    getHoroscopeFollowUpPrompt,
    getYearEnergyReadingPrompt,
    getBirthCardSynthesisPrompt,
    interpolatePrompt,
    clearCache,
    seedPrompts,
  };
}

// Default export
export default {
  getPrompt,
  getTarotReadingPrompt,
  getSingleCardReadingPrompt,
  getTarotFollowUpPrompt,
  getHoroscopePrompt,
  getHoroscopeFollowUpPrompt,
  getYearEnergyReadingPrompt,
  getBirthCardSynthesisPrompt,
  interpolatePrompt,
  clearCache,
  seedPrompts,
  getPromptService,
};
