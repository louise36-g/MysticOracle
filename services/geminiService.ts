import { GoogleGenAI } from "@google/genai";
import { InterpretationStyle, Language, SpreadConfig, TarotCard } from '../types';

// Configuration
const CONFIG = {
  model: 'gemini-2.5-flash-preview-05-20',
  maxRetries: 3,
  baseDelayMs: 1000,
  timeoutMs: 30000,
  temperature: 0.7,
  topK: 40,
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

let clientInstance: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (clientInstance) return clientInstance;

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined");
  }
  clientInstance = new GoogleGenAI({ apiKey });
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
  if (styles.includes(InterpretationStyle.METAPHYSICAL)) {
    instructions.push("- Metaphysical: Focus on energy flow, chakras, and universal laws.");
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

Important: If a card is marked as (Reversed) or (Renversée), interpret its reversed meaning, which often implies internalization, blockage, or the opposite energy of the upright card.

Structure your response with Markdown:
1. **Introduction**: Brief connection to the user's question or energy.
2. **Card Analysis**: Go through each card, explaining its meaning in its specific position, integrating the selected focus areas.
3. **Synthesis**: How the cards interact with each other.
4. **Conclusion/Advice**: Actionable guidance.

Tone: Mystical, supportive, insightful, and clear.
`;

  try {
    const ai = getClient();

    const result = await withRetry(() =>
      withTimeout(
        ai.models.generateContent({
          model: CONFIG.model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: CONFIG.temperature,
            topK: CONFIG.topK,
            topP: CONFIG.topP,
          }
        }),
        CONFIG.timeoutMs
      )
    );

    const response = result.response;
    return response.text() || ERROR_MESSAGES[language].silentSpirits;
  } catch (error) {
    console.error("Gemini API Error:", error);

    if (error instanceof Error && error.message === 'Request timeout') {
      return ERROR_MESSAGES[language].timeout;
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
`;

  try {
    const ai = getClient();

    const result = await withRetry(() =>
      withTimeout(
        ai.models.generateContent({
          model: CONFIG.model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: CONFIG.temperature,
            topK: CONFIG.topK,
            topP: CONFIG.topP,
          }
        }),
        CONFIG.timeoutMs
      )
    );

    const response = result.response;
    return response.text() || ERROR_MESSAGES[language].unclearPath;
  } catch (error) {
    console.error("Gemini API Error (FollowUp):", error);
    return ERROR_MESSAGES[language].connectionLost;
  }
};

export const generateHoroscope = async (sign: string, language: Language = 'en'): Promise<string> => {
  const langName = language === 'en' ? 'English' : 'French';
  
  const prompt = `
You are an expert astrologer with a mystical and positive tone.

Task: Write a daily horoscope.
Language: ${langName}
Zodiac Sign: ${sign}

Structure your response with Markdown:
1.  **Headline**: A catchy, positive summary for the day.
2.  **Full Reading**: A 2-3 paragraph detailed reading covering love, career, and personal growth.
3.  **Lucky Charm**: A simple, tangible object or concept for the day (e.g., "A silver coin," "The color blue," "The scent of lavender").

Tone: Uplifting, insightful, and slightly mystical.
`;

  try {
    const ai = getClient();

    const result = await withRetry(() =>
      withTimeout(
        ai.models.generateContent({
          model: CONFIG.model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: CONFIG.temperature,
            topK: CONFIG.topK,
            topP: CONFIG.topP,
          }
        }),
        CONFIG.timeoutMs
      )
    );

    const response = result.response;
    return response.text() || `The stars are quiet for ${sign} today.`;
  } catch (error) {
    console.error(`Gemini API Error (Horoscope for ${sign}):`, error);

    if (error instanceof Error && error.message === 'Request timeout') {
      return ERROR_MESSAGES[language].timeout;
    }

    return ERROR_MESSAGES[language].apiError;
  }
};

