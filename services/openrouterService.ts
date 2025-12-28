import OpenAI from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import { InterpretationStyle, Language, SpreadConfig, TarotCard } from '../types';

// Configuration
const CONFIG = {
  model: 'google/gemini-2.0-flash-exp:free',
  maxRetries: 3,
  baseDelayMs: 1000,
  timeoutMs: 60000, // Increased timeout for detailed prompts
  temperature: 0.7,
  topP: 0.95,
} as const;

// Error messages
const ERROR_MESSAGES = {
  en: {
    apiError: 'An error occurred while consulting the oracle. Please try again.',
    timeout: 'The oracle is taking too long to respond. Please try again.',
    silentSpirits: 'The spirits are silent...',
    connectionLost: 'The connection to the spirits was interrupted.',
    unclearPath: 'I cannot see that path clearly.',
  },
  fr: {
    apiError: "Une erreur est survenue lors de la consultation de l'oracle. Veuillez réessayer.",
    timeout: "L'oracle met trop de temps à répondre. Veuillez réessayer.",
    silentSpirits: 'Les esprits sont silencieux...',
    connectionLost: 'La connexion avec les esprits a été interrompue.',
    unclearPath: 'Je ne vois pas ce chemin clairement.',
  },
} as const;

let clientInstance: OpenAI | null = null;

const getClient = (): OpenAI => {
  if (clientInstance) return clientInstance;

  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_API_KEY is not configured. Please add your OpenRouter API key to a .env file (VITE_API_KEY=your_key) and restart the dev server.");
  }
  clientInstance = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://openrouter.ai/api/v1", // OpenRouter API base URL
    dangerouslyAllowBrowser: true,
  });
  return clientInstance;
};

/**
 * Exponential backoff delay calculation
 */
function getBackoffDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt) + Math.random() * 100;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable (network issues, rate limits, etc.)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('503') ||
      message.includes('502')
    );
  }
  return false;
}

/**
 * Execute a function with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = CONFIG.maxRetries
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = getBackoffDelay(attempt, CONFIG.baseDelayMs);
        console.warn(`API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);

    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

interface GenerateReadingParams {
  spread: SpreadConfig;
  style: InterpretationStyle[];
  cards: { card: TarotCard; positionIndex: number; isReversed: boolean }[];
  question: string;
  language: Language;
}

/**
 * Build style instructions based on selected interpretation styles
 */
function buildStyleInstructions(styles: InterpretationStyle[]): string[] {
  const instructions: string[] = [];

  if (styles.includes(InterpretationStyle.SPIRITUAL)) {
    instructions.push("- Spiritual: Focus on soul lessons, higher self, and karma.");
  }
  if (styles.includes(InterpretationStyle.PSYCHO_EMOTIONAL)) {
    instructions.push("- Psycho-Emotional: Focus on subconscious patterns, emotional blocks, and healing.");
  }
  if (styles.includes(InterpretationStyle.NUMEROLOGY)) {
    instructions.push("- Numerology: Analyze the numerological significance of the cards (card numbers, life path connections, and numerical patterns in the spread).");
  }
  if (styles.includes(InterpretationStyle.ELEMENTAL)) {
    instructions.push("- Elemental: Analyze the balance of elements (Fire/Wands, Water/Cups, Air/Swords, Earth/Pentacles).");
  }
  if (styles.includes(InterpretationStyle.CLASSIC) || styles.length === 0) {
    instructions.push("- Classic: Traditional divination focusing on events and practical advice.");
  }

  return instructions;
}

/**
 * Build the cards description for the prompt
 */
function buildCardsDescription(
  cards: GenerateReadingParams['cards'],
  spread: SpreadConfig,
  language: Language
): string {
  return cards.map((item, index) => {
    const cardName = language === 'en' ? item.card.nameEn : item.card.nameFr;
    const positionMeaning = language === 'en'
      ? spread.positionMeaningsEn[item.positionIndex]
      : spread.positionMeaningsFr[item.positionIndex];
    const reversedText = item.isReversed
      ? (language === 'en' ? '(Reversed)' : '(Renversée)')
      : '';
    return `${index + 1}. ${cardName} ${reversedText} (Position: ${positionMeaning})`;
  }).join('\n');
}

export const generateTarotReading = async ({
  spread,
  style,
  cards,
  question,
  language
}: GenerateReadingParams): Promise<string> => {
  const langName = language === 'en' ? 'English' : 'French';
  const cardsDescription = buildCardsDescription(cards, spread, language);
  const styleInstructions = buildStyleInstructions(style);

  // Build position guide for the spread
  const positionGuide = (language === 'en' ? spread.positionMeaningsEn : spread.positionMeaningsFr)
    .map((meaning, i) => `${i + 1} - ${meaning}`)
    .join(', ');

  const prompt = `
You are a mystical, wise, and empathetic Tarot Reader.

Task: Provide a comprehensive Tarot reading.
Language: ${langName}
Spread Type: ${language === 'en' ? spread.nameEn : spread.nameFr}

Interpretation Focus Areas:
${styleInstructions.join('\n')}

User's Question: "${question || (language === 'en' ? "General guidance" : "Guidance générale")}"

Cards Drawn:
${cardsDescription}

Important Guidelines:
- If a card is marked as (Reversed) or (Renversée), interpret its reversed meaning, which often implies internalization, blockage, or the opposite energy of the upright card.
- Consider how a card's POSITION modifies its traditional meaning. For example, a typically positive card in the "Obstacles" position may indicate that its energy is being blocked or misused. A challenging card in the "Advice" position may suggest confronting difficult truths.
- Interpret cards in CONTEXT of surrounding cards. Note how adjacent cards influence, reinforce, or contrast with each other. Look for patterns, elemental relationships, and narrative flow across the spread.

Structure your response naturally with these sections:

1. **The Spread Layout** - Begin with a brief explanation of the positions in this spread: ${positionGuide}. Explain what each position represents so the seeker understands the framework of the reading.

2. **Card Analysis** - Go through each card, explaining:
   - The card's traditional meaning
   - How its position in the spread shapes or modifies this meaning
   - How it relates to neighbouring cards and the overall narrative

3. **Synthesis** - How the cards interact with each other as a whole. Identify any themes, progressions, or tensions across the spread.

4. **Conclusion** - Actionable guidance and advice drawn from the reading.

IMPORTANT FORMATTING RULES:
- Write in flowing, natural prose paragraphs
- Use **bold** only for card names and section headings
- DO NOT use tables, grids, or any | pipe | formatting
- DO NOT use emojis or icons
- DO NOT use bullet point lists for the main reading content
- Write as a mystical oracle would speak, not as an AI assistant

Tone: Mystical, supportive, insightful, warm, and conversational.
`;

  try {
    const ai = getClient();

    const result = await withRetry(() =>
      withTimeout(
        ai.chat.completions.create({
          model: CONFIG.model,
          messages: [{ role: "user", content: prompt }],
          temperature: CONFIG.temperature,
          top_p: CONFIG.topP,
        }),
        CONFIG.timeoutMs
      )
    ) as ChatCompletion;

    return result.choices[0]?.message?.content || ERROR_MESSAGES[language].silentSpirits;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    if (error instanceof Error) {
      if (error.message === 'Request timeout') {
        return ERROR_MESSAGES[language].timeout;
      }
    }
    return ERROR_MESSAGES[language].apiError;
  }
};

interface FollowUpParams {
  context: string;
  history: { role: 'user' | 'model'; content: string }[];
  newQuestion: string;
  language: Language;
}

export const generateFollowUpReading = async ({
  context,
  history,
  newQuestion,
  language
}: FollowUpParams): Promise<string> => {
  const langName = language === 'en' ? 'English' : 'French';

  const prompt = `
You are a mystical Tarot Reader having a conversation with a seeker.

Context (The Reading so far):
${context}

Conversation History:
${history.map(h => `${h.role === 'user' ? 'Seeker' : 'Oracle'}: ${h.content}`).join('\n')}

Current Question: "${newQuestion}"

Language: ${langName}
Task: Answer the seeker's follow-up question based *only* on the cards and insights from the original reading. Do not draw new cards. Keep the mystical tone. Be concise but insightful.

IMPORTANT: Write naturally without tables, emojis, or icons. Speak as a wise oracle would.
`;

  try {
    const ai = getClient();

    const result = await withRetry(() =>
      withTimeout(
        ai.chat.completions.create({
          model: CONFIG.model,
          messages: [{ role: "user", content: prompt }],
          temperature: CONFIG.temperature,
          top_p: CONFIG.topP,
        }),
        CONFIG.timeoutMs
      )
    ) as ChatCompletion;

    return result.choices[0]?.message?.content || ERROR_MESSAGES[language].unclearPath;
  } catch (error) {
    console.error("OpenRouter API Error (FollowUp):", error);
    return ERROR_MESSAGES[language].connectionLost;
  }
};

interface HoroscopeFollowUpParams {
  horoscope: string;
  sign: string;
  history: { role: 'user' | 'model'; content: string }[];
  newQuestion: string;
  language: Language;
}

export const generateHoroscopeFollowUp = async ({
  horoscope,
  sign,
  history,
  newQuestion,
  language
}: HoroscopeFollowUpParams): Promise<string> => {
  const langName = language === 'en' ? 'English' : 'French';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const prompt = `
You are an expert astrologer continuing a conversation about a horoscope reading.

Today's Date: ${today}
Zodiac Sign: ${sign}

Original Horoscope Reading:
${horoscope}

Conversation History:
${history.map(h => `${h.role === 'user' ? 'Seeker' : 'Astrologer'}: ${h.content}`).join('\n')}

Current Question: "${newQuestion}"

Language: ${langName}

Task: Answer the question concisely and informatively. Draw upon:
- The planetary positions and transits mentioned in the original reading
- Current lunar phases and their significance
- The specific characteristics of ${sign} and how they interact with current cosmic energies
- Practical advice tied to astrological influences

Explain astrological concepts when relevant, but assume the reader is an intelligent adult - never be patronizing or overly simplistic.

IMPORTANT STYLE RULES:
- Be concise and direct
- DO NOT use phrases like "my dear", "well now", "as you know"
- No tables, emojis, or icons
- Write in flowing prose
`;

  try {
    const ai = getClient();

    const result = await withRetry(() =>
      withTimeout(
        ai.chat.completions.create({
          model: CONFIG.model,
          messages: [{ role: "user", content: prompt }],
          temperature: CONFIG.temperature,
          top_p: CONFIG.topP,
        }),
        CONFIG.timeoutMs
      )
    ) as ChatCompletion;

    return result.choices[0]?.message?.content || ERROR_MESSAGES[language].unclearPath;
  } catch (error) {
    console.error("OpenRouter API Error (Horoscope FollowUp):", error);
    return ERROR_MESSAGES[language].connectionLost;
  }
};

export const generateHoroscope = async (sign: string, language: Language = 'en'): Promise<string> => {
  const langName = language === 'en' ? 'English' : 'French';

  const prompt = `
You are an expert astrologer providing a daily horoscope reading.

Task: Write a concise daily horoscope.
Language: ${langName}
Zodiac Sign: ${sign}
Today's Date: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

Structure your horoscope with these sections (use **bold** for section headings):

**Overall Energy**
The key planetary influences affecting ${sign} today. Reference specific transits and aspects concisely.

**Personal & Relationships**
Love, family, friendships, and emotional wellbeing. Connect to relevant planetary positions.

**Career & Finances**
Professional life, money matters, and ambitions. Reference relevant planetary influences.

**Wellbeing & Advice**
Practical guidance for the day, tied to the astrological influences mentioned.

IMPORTANT STYLE RULES:
- Be CONCISE - get to the point without padding or filler
- Write for intelligent adults who are new to astrology - explain astrological terms when needed, but never be condescending or overly simplistic
- DO NOT use overly familiar phrases like "my dear ${sign}", "well now", "as you know", or similar patronizing language
- DO NOT over-explain basic concepts (e.g., don't explain what the Sun or Moon are)
- Reference planetary positions and transits naturally without excessive preamble
- Be direct and informative, not chatty
- DO NOT include lucky charms, lucky numbers, or lucky colours
- DO NOT use tables, emojis, or icons
- DO NOT use bullet points

Tone: Professional, informative, respectful, and direct.
`;

  try {
    const ai = getClient();

    const result = await withRetry(() =>
      withTimeout(
        ai.chat.completions.create({
          model: CONFIG.model,
          messages: [{ role: "user", content: prompt }],
          temperature: CONFIG.temperature,
          top_p: CONFIG.topP,
        }),
        CONFIG.timeoutMs
      )
    ) as ChatCompletion;

    return result.choices[0]?.message?.content || `The stars are quiet for ${sign} today.`;
  } catch (error) {
    console.error(`OpenRouter API Error (Horoscope for ${sign}):`, error);

    if (error instanceof Error && error.message === 'Request timeout') {
      return ERROR_MESSAGES[language].timeout;
    }
    return ERROR_MESSAGES[language].apiError;
  }
};

