import OpenAI from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import { InterpretationStyle, Language, SpreadConfig, TarotCard } from '../types';

// Debug mode key - must match AdminDebug.tsx
const DEBUG_AI_MODE_KEY = 'mystic_debug_ai_mode';

/**
 * Check if debug AI mode is enabled
 */
function isDebugAIModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEBUG_AI_MODE_KEY) === 'true';
}

/**
 * Mock reading for debug mode - saves OpenRouter credits during testing
 */
const MOCK_READING = {
  en: `**The Spread Layout**

This reading follows the traditional arrangement where each position reveals a different facet of your journey. The first position speaks about past circumstances which led up to the second card, present circumstances and the third card is the likely outcome in the future if you keep on this trajectory.

**Individual Card Meanings**

**The Fool**

The Fool represents infinite potential, new beginnings, and the courageous leap into the unknown. This card embodies innocence, spontaneity, and the willingness to trust in the journey ahead without knowing the destination. In the Past position, The Fool suggests that your journey began with a bold step into unfamiliar territory - a time when you embraced possibility over certainty. This energy of fresh starts and open-hearted curiosity has shaped the path that led you to where you stand today.

**The Tower**

The Tower signifies sudden change, revelation, and the necessary destruction of false structures. Lightning strikes the tower, toppling illusions and forcing transformation. In the Present position, The Tower indicates you are currently experiencing or about to experience a significant shift - old patterns, beliefs, or situations are crumbling to make way for truth. While this energy can feel chaotic, it clears ground for authentic rebuilding.

**The Star**

The Star brings hope, healing, inspiration, and renewed faith after crisis. This card shines with promise, showing the light at the end of darkness. In the Future position, The Star reveals that beyond the current upheaval lies a period of peace, clarity, and spiritual renewal. This card assures you that the challenges you face are leading toward a brighter, more aligned future.

**How the Cards Work Together**

The narrative arc of your reading tells a powerful story of transformation through crisis toward renewal. The Fool's innocent beginning set you on a path that inevitably led to The Tower's necessary destruction. What you thought was your journey needed to be shaken to reveal its true foundation. The Tower's chaos isn't random - it's the universe clearing away what The Fool's naive optimism couldn't see needed releasing.

Looking at these three cards together, we see a classic journey from innocence through trial to wisdom. The Fool's leap led you into experiences that built structures - some true, some false. Now The Tower reveals which structures were built on solid ground and which must fall. The Star promises that this painful clarity leads to genuine hope, not the blind optimism of The Fool, but the earned wisdom of someone who has walked through fire and emerged transformed.

The progression shows that your current disruption (The Tower) is actually the fulfillment of the journey The Fool began - you are becoming more authentically yourself. The Star's future isn't a return to The Fool's innocence but an ascension to conscious, grounded hope that knows the value of what remains after the storm.

The interplay between the cards suggests that external circumstances and internal readiness are aligning. This is not coincidence but rather the natural rhythm of your path unfolding.

**Conclusion**

Trust in your intuition during this time. The cards indicate that you already possess the wisdom needed to navigate what lies ahead. Take measured steps forward, remain open to unexpected guidance, and remember that every ending carries within it the seed of a new beginning.

*[This is a mock reading generated in debug mode. Enable real AI readings in Admin > Debug Tools.]*`,

  fr: `**La Disposition du Tirage**

Cette lecture suit l'arrangement traditionnel où chaque position révèle une facette différente de votre voyage. La première position parle des circonstances passées qui ont mené à la deuxième carte, les circonstances présentes, et la troisième carte est le résultat probable dans le futur si vous continuez sur cette trajectoire.

**Signification des Cartes Individuelles**

**Le Mat**

Le Mat représente le potentiel infini, les nouveaux départs, et le saut courageux vers l'inconnu. Cette carte incarne l'innocence, la spontanéité, et la volonté de faire confiance au voyage sans connaître la destination. Dans la position Passé, Le Mat suggère que votre voyage a commencé par un pas audacieux en territoire inconnu - un moment où vous avez embrassé la possibilité plutôt que la certitude. Cette énergie de nouveaux commencements et de curiosité à cœur ouvert a façonné le chemin qui vous a mené là où vous êtes aujourd'hui.

**La Maison Dieu**

La Maison Dieu signifie le changement soudain, la révélation, et la destruction nécessaire des fausses structures. La foudre frappe la tour, renversant les illusions et forçant la transformation. Dans la position Présent, La Maison Dieu indique que vous vivez actuellement ou êtes sur le point de vivre un changement significatif - d'anciens schémas, croyances ou situations s'effondrent pour faire place à la vérité. Bien que cette énergie puisse sembler chaotique, elle dégage le terrain pour une reconstruction authentique.

**L'Étoile**

L'Étoile apporte l'espoir, la guérison, l'inspiration, et la foi renouvelée après la crise. Cette carte brille de promesse, montrant la lumière au bout des ténèbres. Dans la position Futur, L'Étoile révèle qu'au-delà du bouleversement actuel se trouve une période de paix, de clarté et de renouveau spirituel. Cette carte vous assure que les défis auxquels vous faites face mènent vers un avenir plus lumineux et plus aligné.

**Comment les Cartes Fonctionnent Ensemble**

L'arc narratif de votre lecture raconte une histoire puissante de transformation à travers la crise vers le renouveau. Le commencement innocent du Mat vous a mis sur un chemin qui a inévitablement mené à la destruction nécessaire de La Maison Dieu. Ce que vous pensiez être votre voyage devait être secoué pour révéler sa vraie fondation. Le chaos de La Maison Dieu n'est pas aléatoire - c'est l'univers qui dégage ce que l'optimisme naïf du Mat ne pouvait pas voir devait être libéré.

En regardant ces trois cartes ensemble, nous voyons un voyage classique de l'innocence à travers l'épreuve vers la sagesse. Le saut du Mat vous a conduit dans des expériences qui ont construit des structures - certaines vraies, certaines fausses. Maintenant La Maison Dieu révèle quelles structures étaient construites sur un sol solide et lesquelles doivent tomber. L'Étoile promet que cette clarté douloureuse mène à un espoir véritable, non l'optimisme aveugle du Mat, mais la sagesse gagnée de quelqu'un qui a traversé le feu et émergé transformé.

La progression montre que votre perturbation actuelle (La Maison Dieu) est en fait l'accomplissement du voyage que Le Mat a commencé - vous devenez plus authentiquement vous-même. Le futur de L'Étoile n'est pas un retour à l'innocence du Mat mais une ascension vers un espoir conscient et ancré qui connaît la valeur de ce qui reste après la tempête.

L'interaction entre les cartes suggère que les circonstances extérieures et la préparation intérieure s'alignent. Ce n'est pas une coïncidence mais plutôt le rythme naturel de votre chemin qui se déploie.

**Conclusion**

Faites confiance à votre intuition pendant cette période. Les cartes indiquent que vous possédez déjà la sagesse nécessaire pour naviguer ce qui vous attend. Avancez par étapes mesurées, restez ouvert aux conseils inattendus, et rappelez-vous que chaque fin porte en elle la graine d'un nouveau commencement.

*[Ceci est une lecture fictive générée en mode debug. Activez les vraies lectures IA dans Admin > Outils de Débogage.]*`
};

const MOCK_FOLLOW_UP = {
  en: `The cards have already spoken on this matter, and their wisdom remains consistent. What you seek is already within reach, though perhaps not in the form you expected.

The energy surrounding your question suggests patience will serve you well. The path forward becomes clearer with each step you take, not before.

*[Mock follow-up response - debug mode active]*`,

  fr: `Les cartes ont déjà parlé sur cette question, et leur sagesse reste cohérente. Ce que vous cherchez est déjà à portée de main, bien que peut-être pas sous la forme que vous attendiez.

L'énergie entourant votre question suggère que la patience vous servira bien. Le chemin à suivre devient plus clair à chaque pas que vous faites, pas avant.

*[Réponse de suivi fictive - mode debug actif]*`
};

// Configuration
const CONFIG = {
  model: 'openai/gpt-oss-120b:free',  // Free model via OpenRouter
  maxRetries: 3,
  baseDelayMs: 1000,
  timeoutMs: 60000, // Increased timeout for detailed prompts
  temperature: 0.7,
  topP: 0.95,
  // Dynamic token limits by spread type
  maxTokensBySpread: {
    SINGLE: 600,
    THREE_CARD: 1200,
    HORSESHOE: 2000,
    CELTIC_CROSS: 2500,
  } as Record<string, number>,
  // Token limits for other functions
  maxTokens: {
    followUp: 500,
    horoscope: 800,
    horoscopeFollowUp: 400,
  },
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
  // Check for debug mode - return mock reading to save API credits
  if (isDebugAIModeEnabled()) {
    console.log('[Debug Mode] Returning mock tarot reading instead of calling OpenRouter');
    // Simulate a brief delay to feel more realistic
    await new Promise(resolve => setTimeout(resolve, 1500));
    return MOCK_READING[language];
  }

  const langName = language === 'en' ? 'English' : 'French';
  const cardsDescription = buildCardsDescription(cards, spread, language);
  const styleInstructions = buildStyleInstructions(style);

  // Build position guide for the spread
  const positionGuide = (language === 'en' ? spread.positionMeaningsEn : spread.positionMeaningsFr)
    .map((meaning, i) => `${i + 1} - ${meaning}`)
    .join(', ');

  // Build spread-specific layout description
  const spreadLayoutGuidance = spread.positions === 3
    ? (language === 'en'
      ? 'Explain that this is the traditional Past-Present-Future spread: The first position speaks about past circumstances which led up to the second card representing present circumstances, and the third card is the likely outcome in the future if you keep on this trajectory.'
      : 'Expliquez qu\'il s\'agit du tirage traditionnel Passé-Présent-Futur : La première position parle des circonstances passées qui ont mené à la deuxième carte représentant les circonstances présentes, et la troisième carte est le résultat probable dans le futur si vous continuez sur cette trajectoire.')
    : `Explain the positions in this spread: ${positionGuide}. Explain what each position represents.`;

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

1. **The Spread Layout** - ${spreadLayoutGuidance}

2. **Individual Card Meanings** - Analyze EACH card that was drawn. For each card, create a subheading with the card name (e.g., "**The Fool**" or "**Three of Cups**") and explain:
   - What this specific card means in Tarot (its core symbolism, energy, and traditional interpretation)
   - What this card means specifically in its position in this spread
   - If the card is reversed, explain the reversed meaning

   DO NOT use generic labels like "The First Card" or "Card 1". Use the ACTUAL card names as headings.

3. **How the Cards Work Together** - Write ONE concise paragraph that synthesizes the cards into a unified narrative. Show the natural progression and flow between the cards, revealing the complete story they tell together. Be direct and avoid repetition - state each insight once clearly rather than rephrasing the same idea multiple times. AVOID contrasting constructions like "not X, but Y" or "X, not Y; rather Z" - simply state what IS. Focus on the forward movement and transformation across the spread.

4. **Conclusion** - Actionable guidance and advice drawn from the complete reading. Naturally weave the themes and topics from the user's question throughout this section. Use vocabulary and language specific to their situation (relationships, career, personal growth, etc.) to make the guidance feel directly tailored to what they asked about. Do not mechanically restate their question - instead, let the advice resonate with their concern through thematic alignment and relevant terminology.

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

    // Get dynamic token limit based on spread type
    const maxTokens = CONFIG.maxTokensBySpread[spread.id] || CONFIG.maxTokensBySpread.THREE_CARD;

    const result = await withRetry(() =>
      withTimeout(
        ai.chat.completions.create({
          model: CONFIG.model,
          messages: [{ role: "user", content: prompt }],
          temperature: CONFIG.temperature,
          top_p: CONFIG.topP,
          max_tokens: maxTokens,
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
      // In development, show actual error for debugging
      if (import.meta.env.DEV) {
        console.error('Full error details:', JSON.stringify(error, null, 2));
        return `API Error: ${error.message}. Check console for details.`;
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
  // Check for debug mode - return mock follow-up to save API credits
  if (isDebugAIModeEnabled()) {
    console.log('[Debug Mode] Returning mock follow-up instead of calling OpenRouter');
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_FOLLOW_UP[language];
  }

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
          max_tokens: CONFIG.maxTokens.followUp,
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
          max_tokens: CONFIG.maxTokens.horoscopeFollowUp,
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
          max_tokens: CONFIG.maxTokens.horoscope,
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

