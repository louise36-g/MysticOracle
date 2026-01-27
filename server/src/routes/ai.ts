import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { requireAuth } from '../middleware/auth.js';
import { getAISettings } from '../services/aiSettings.js';
import { creditService, CREDIT_COSTS } from '../services/CreditService.js';
import { openRouterService } from '../services/openRouterService.js';
import {
  getTarotReadingPrompt,
  getTarotFollowUpPrompt,
  getSingleCardReadingPrompt,
} from '../services/promptService.js';

const router = Router();

// Helper to get card element based on card ID
function getCardElement(cardId: number): string {
  // Major Arcana (0-21) - varies by card, default to Spirit
  if (cardId <= 21) return 'Spirit';

  // Minor Arcana: Wands (22-35), Cups (36-49), Swords (50-63), Pentacles (64-77)
  if (cardId <= 35) return 'Fire';
  if (cardId <= 49) return 'Water';
  if (cardId <= 63) return 'Air';
  return 'Earth';
}

// Helper to get card number for numerology
function getCardNumber(cardId: number): string {
  // Major Arcana
  if (cardId <= 21) return String(cardId);

  // Minor Arcana - extract the number (Ace=1 through 10, then Page=11, Knight=12, Queen=13, King=14)
  const suitPosition = (cardId - 22) % 14;
  return String(suitPosition + 1);
}

// Initialize OpenAI client for OpenRouter with dynamic settings
const getOpenAIClient = async () => {
  const settings = await getAISettings();
  if (!settings.apiKey) {
    throw new Error('OpenRouter API key not configured');
  }
  return {
    client: new OpenAI({
      apiKey: settings.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
    model: settings.model,
  };
};

// Validation schema
const summarizeQuestionSchema = z.object({
  question: z.string().min(1).max(2000),
  language: z.enum(['en', 'fr']),
});

/**
 * @openapi
 * /api/v1/ai/summarize-question:
 *   post:
 *     tags:
 *       - AI
 *     summary: Summarize a tarot question
 *     description: Uses AI to condense long questions while preserving intent and emotional context. Costs 1 credit.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - language
 *             properties:
 *               question:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 description: The question to summarize
 *               language:
 *                 type: string
 *                 enum: [en, fr]
 *                 description: Language of the question
 *     responses:
 *       200:
 *         description: Question summarized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                   description: Summarized question
 *                 creditsUsed:
 *                   type: integer
 *                   example: 1
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       402:
 *         description: Insufficient credits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Insufficient credits
 */
router.post('/summarize-question', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Validate input
    const validation = summarizeQuestionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { question, language } = validation.data;
    const creditCost = CREDIT_COSTS.SUMMARIZE_QUESTION;

    // Check if user has enough credits using CreditService
    const balanceCheck = await creditService.checkSufficientCredits(userId, creditCost);
    if (balanceCheck.balance === 0 && !balanceCheck.sufficient) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!balanceCheck.sufficient) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Build the prompt
    const prompt =
      language === 'en'
        ? `Summarize this tarot question while preserving the core intent and emotional context. Keep it under 400 characters. Return only the summarized question, nothing else.

Original question: "${question}"`
        : `Résumez cette question de tarot en préservant l'intention principale et le contexte émotionnel. Gardez moins de 400 caractères. Retournez uniquement la question résumée, rien d'autre.

Question originale: "${question}"`;

    // Call OpenRouter API
    const { client, model } = await getOpenAIClient();
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.5,
    });

    const summary = response.choices[0]?.message?.content?.trim();

    if (!summary) {
      return res.status(500).json({ error: 'Failed to generate summary' });
    }

    // Deduct credits using CreditService (handles transaction + audit)
    await creditService.deductCredits({
      userId,
      amount: creditCost,
      type: 'QUESTION',
      description: 'Question summary',
    });

    res.json({
      summary,
      creditsUsed: creditCost,
    });
  } catch (error) {
    console.error('Error summarizing question:', error);
    res.status(500).json({ error: 'Failed to summarize question' });
  }
});

// Validation schemas for tarot generation
const generateTarotSchema = z.object({
  spread: z.object({
    id: z.string(),
    nameEn: z.string(),
    nameFr: z.string(),
    positions: z.number(),
    positionMeaningsEn: z.array(z.string()).optional(),
    positionMeaningsFr: z.array(z.string()).optional(),
    creditCost: z.number(),
  }),
  style: z.array(z.string()),
  cards: z.array(
    z.object({
      card: z.object({
        id: z.string(),
        nameEn: z.string(),
        nameFr: z.string(),
        suit: z.string().optional(),
        rank: z.string().optional(),
        arcana: z.string().optional(),
      }),
      positionIndex: z.number(),
      isReversed: z.boolean(),
    })
  ),
  question: z.string(),
  language: z.enum(['en', 'fr']),
  category: z.string().optional(),
});

const tarotFollowUpSchema = z.object({
  reading: z.string().min(1),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  question: z.string().min(1).max(500),
  language: z.enum(['en', 'fr']),
});

/**
 * POST /api/v1/ai/tarot/generate
 * Generate a tarot reading interpretation
 * Phase 3: New endpoint for backend-generated tarot readings
 */
router.post('/tarot/generate', requireAuth, async (req, res) => {
  try {
    const validation = generateTarotSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { spread, style, cards, question, language, category } = validation.data;

    console.log('[Tarot Generate] Request:', {
      userId: req.auth.userId,
      spread: spread.nameEn,
      cardCount: cards.length,
      language,
      category,
    });

    // Check if this is a single card reading
    const isSingleCard = spread.id === 'single' && spread.positions === 1;

    let prompt: string;
    let maxTokens: number;

    if (isSingleCard) {
      // Use single card prompt
      const card = cards[0];
      const cardName = language === 'en' ? card.card.nameEn : card.card.nameFr;
      const orientation = card.isReversed ? '(Reversed)' : '(Upright)';
      const cardDescription = `${cardName} ${orientation}`;

      // Get card metadata - parse ID as number for helper functions
      const cardIdNum = parseInt(card.card.id, 10) || 0;
      const cardElement = getCardElement(cardIdNum);
      const cardNumber = getCardNumber(cardIdNum);

      // Map style array to expected format
      const styleMap: Record<string, string> = {
        spiritual: 'spiritual',
        psycho_emotional: 'psycho_emotional',
        numerology: 'numerology',
        elemental: 'elemental',
      };
      const mappedStyles = style.map(s => styleMap[s.toLowerCase()] || s).filter(Boolean);

      prompt = await getSingleCardReadingPrompt({
        category: category || 'general',
        question,
        cardDescription,
        cardNumber,
        element: cardElement,
        styles: mappedStyles,
        language,
      });

      // Base 800 tokens + 200 per style
      maxTokens = 800 + mappedStyles.length * 200;
    } else {
      // Existing multi-card logic
      const spreadType = spread.id;
      const styleInstructions =
        style.length > 0
          ? `Interpretation styles: ${style.join(', ')}`
          : 'Use a classic interpretation style';

      // Format cards description with position meanings
      const positionMeanings =
        language === 'en' ? spread.positionMeaningsEn : spread.positionMeaningsFr;
      const cardsDescription = cards
        .map((c, idx) => {
          const cardName = language === 'en' ? c.card.nameEn : c.card.nameFr;
          const position = positionMeanings?.[idx] || `Position ${idx + 1}`;
          const orientation = c.isReversed ? '(Reversed)' : '(Upright)';
          return `${position}: ${cardName} ${orientation}`;
        })
        .join('\n');

      // Get prompt from service (with caching and fallback to defaults)
      prompt = await getTarotReadingPrompt({
        spreadType,
        styleInstructions,
        question,
        cardsDescription,
        language,
      });

      // Calculate max tokens based on spread size
      maxTokens =
        {
          1: 600,
          3: 1200,
          5: 2000,
          7: 2000,
          10: 2500,
        }[spread.positions] || 1500;
    }

    // Generate interpretation using unified service
    const interpretation = await openRouterService.generateTarotReading(prompt, {
      temperature: 0.7,
      maxTokens,
    });

    console.log('[Tarot Generate] ✅ Generated interpretation:', interpretation.length, 'chars');

    res.json({
      interpretation,
      creditsRequired: spread.creditCost,
    });
  } catch (error) {
    console.error('[Tarot Generate] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate reading';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/v1/ai/tarot/followup
 * Generate a follow-up answer for a tarot reading
 * Phase 3: New endpoint for backend-generated follow-ups
 */
router.post('/tarot/followup', requireAuth, async (req, res) => {
  try {
    const validation = tarotFollowUpSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { reading, history, question, language } = validation.data;

    console.log('[Tarot Follow-up] Request:', {
      userId: req.auth.userId,
      question: question.substring(0, 50) + '...',
      language,
    });

    // Get prompt from service
    const prompt = await getTarotFollowUpPrompt({
      context: reading,
      history: history.map(h => `${h.role}: ${h.content}`).join('\n'),
      newQuestion: question,
      language,
    });

    // Generate answer using unified service
    // Cast history to OpenRouterMessage[] since Zod validation guarantees both role and content exist
    const answer = await openRouterService.generateTarotFollowUp(
      prompt,
      history as { role: 'user' | 'assistant'; content: string }[],
      {
        temperature: 0.7,
        maxTokens: 500,
      }
    );

    console.log('[Tarot Follow-up] ✅ Generated answer:', answer.length, 'chars');

    res.json({
      answer,
      creditsRequired: CREDIT_COSTS.FOLLOW_UP,
    });
  } catch (error) {
    console.error('[Tarot Follow-up] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate follow-up';
    res.status(500).json({ error: message });
  }
});

export default router;
