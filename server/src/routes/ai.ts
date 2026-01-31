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
  getYearEnergyReadingPrompt,
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
  layoutId: z.string().optional(),
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

// Schema for year energy reading request
const yearEnergySchema = z.object({
  year: z.number().int().min(2020).max(2100),
  yearEnergy: z.object({
    primaryCardName: z.string(),
    primaryCardNameFr: z.string(),
    reducedCardName: z.string().optional(),
    reducedCardNameFr: z.string().optional(),
    isUnified: z.boolean(),
    description: z.string(), // Already in correct language
  }),
  personalityCard: z.object({
    cardName: z.string(),
    cardNameFr: z.string(),
    description: z.string(), // Already in correct language
  }),
  soulCard: z.object({
    cardName: z.string(),
    cardNameFr: z.string(),
    description: z.string(), // Already in correct language
  }),
  isUnifiedBirthCard: z.boolean(),
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

    const { spread, style, cards, question, language, category, layoutId } = validation.data;

    console.log('[Tarot Generate] Request:', {
      userId: req.auth.userId,
      spread: spread.nameEn,
      cardCount: cards.length,
      language,
      category,
      layoutId,
    });

    // Check if this is a single card reading
    const isSingleCard = spread.id === 'single' && spread.positions === 1;

    let prompt: string;
    let maxTokens: number;

    if (isSingleCard) {
      console.log('[Tarot Generate] Single card detected, building prompt...');
      // Use single card prompt
      const card = cards[0];
      const cardName = language === 'en' ? card.card.nameEn : card.card.nameFr;
      const isReversed = card.isReversed;

      // Get card metadata - parse ID as number for helper functions
      const cardIdNum = parseInt(card.card.id, 10) || 0;
      const cardElement = getCardElement(cardIdNum);
      const cardNumber = getCardNumber(cardIdNum);

      console.log('[Tarot Generate] Card info:', { cardName, isReversed, cardElement, cardNumber });

      // Map style array to expected format (handles both EN and FR style names)
      const styleMap: Record<string, string> = {
        // English
        spiritual: 'spiritual',
        psycho_emotional: 'psycho_emotional',
        numerology: 'numerology',
        elemental: 'elemental',
        // French
        spirituel: 'spiritual',
        'psycho-émotionnel': 'psycho_emotional',
        'psycho-emotionnel': 'psycho_emotional',
        psycho_emotionnel: 'psycho_emotional',
        numérologie: 'numerology',
        numerologie: 'numerology',
        élémentaire: 'elemental',
        elementaire: 'elemental',
      };
      const mappedStyles = style.map(s => styleMap[s.toLowerCase()] || s).filter(Boolean);
      console.log('[Tarot Generate] Mapped styles:', mappedStyles);

      console.log('[Tarot Generate] Calling getSingleCardReadingPrompt...');
      prompt = await getSingleCardReadingPrompt({
        category: category || 'general',
        question,
        cardName,
        isReversed,
        cardNumber,
        element: cardElement,
        styles: mappedStyles,
        language,
      });
      console.log('[Tarot Generate] Prompt built, length:', prompt.length);

      // Base 2500 tokens + 500 per style (reasoning models need extra tokens for thinking)
      maxTokens = 2500 + mappedStyles.length * 500;
      console.log('[Tarot Generate] Max tokens:', maxTokens);
    } else {
      // Existing multi-card logic
      const spreadType = spread.id;
      // Build detailed style instructions for multi-card readings
      let styleInstructions =
        'Use a classic interpretation style focusing on traditional tarot symbolism.';
      if (style.length > 0) {
        // Each style has inline guidance (woven into card interpretations) and synthesis (dedicated section)
        const styleDescriptions: Record<string, { inline: string; synthesis: string }> = {
          spiritual: {
            inline:
              'Weave spiritual insights into each card: soul lessons, higher purpose, karma, and spiritual growth.',
            synthesis: `**Spiritual Synthesis** (100-150 words): After the card interpretations, add a dedicated section exploring the collective spiritual message. What soul lesson emerges from these cards together? What is the higher purpose or spiritual invitation? How do the cards' spiritual themes interweave?`,
          },
          psycho_emotional: {
            inline:
              'Weave psychological insights into each card: inner patterns, emotional themes, shadow work, and self-awareness.',
            synthesis: `**Emotional Landscape** (100-150 words): After the card interpretations, add a dedicated section on the psychological narrative. What emotional patterns or inner dynamics are revealed across all cards? How do they inform each other psychologically?`,
          },
          numerology: {
            inline:
              'Reference the numerological significance of each card number: cycles, timing, and numerical symbolism.',
            synthesis: `**Numerological Pattern** (100-150 words): After the card interpretations, add a dedicated section analyzing the numbers. What is the combined numerological energy? Are there repeated numbers or a progression? What timing or cyclical message emerges from the numbers together?`,
          },
          elemental: {
            inline:
              'Connect each card to its elemental quality: Fire (Wands/action), Water (Cups/emotion), Air (Swords/thought), Earth (Pentacles/material).',
            synthesis: `**Elemental Interplay** (100-150 words): After the card interpretations, add a dedicated section on elemental dynamics. What elements are present? If the same element repeats, what does that concentrated energy signify? If elements differ, how do they interact - do they support, challenge, or balance each other? What is the overriding elemental energy of this reading?`,
          },
        };
        // Handle uppercase enum values
        styleDescriptions.SPIRITUAL = styleDescriptions.spiritual;
        styleDescriptions.PSYCHO_EMOTIONAL = styleDescriptions.psycho_emotional;
        styleDescriptions.NUMEROLOGY = styleDescriptions.numerology;
        styleDescriptions.ELEMENTAL = styleDescriptions.elemental;

        const matchedStyles = style
          .map(s => styleDescriptions[s] || styleDescriptions[s.toUpperCase()])
          .filter(Boolean);

        if (matchedStyles.length > 0) {
          const inlineInstructions = matchedStyles.map(s => s.inline).join('\n');
          const synthesisInstructions = matchedStyles.map(s => s.synthesis).join('\n\n');
          styleInstructions = `In addition to the traditional interpretation:

FOR EACH CARD, incorporate these perspectives:
${inlineInstructions}

AFTER all card interpretations, include these dedicated synthesis sections:
${synthesisInstructions}`;
        }
      }
      console.log('[Tarot Generate] Styles received:', style);
      console.log('[Tarot Generate] Style instructions:', styleInstructions);

      // Layout-specific position meanings for THREE_CARD and FIVE_CARD
      const layoutPositions: Record<string, { en: string[]; fr: string[] }> = {
        // Three-card layouts
        past_present_future: {
          en: ['Past', 'Present', 'Future'],
          fr: ['Passé', 'Présent', 'Futur'],
        },
        you_them_connection: {
          en: ['You', 'Them', 'The Connection'],
          fr: ['Vous', 'Eux', 'La Connexion'],
        },
        situation_action_outcome: {
          en: ['Situation', 'Action', 'Outcome'],
          fr: ['Situation', 'Action', 'Résultat'],
        },
        option_a_b_guidance: {
          en: ['Option A', 'Option B', 'Guidance'],
          fr: ['Option A', 'Option B', 'Conseil'],
        },
        situation_obstacle_path: {
          en: ['Situation', 'Obstacle', 'Path Forward'],
          fr: ['Situation', 'Obstacle', 'Voie à Suivre'],
        },
        mind_body_spirit: { en: ['Mind', 'Body', 'Spirit'], fr: ['Esprit', 'Corps', 'Âme'] },
        challenge_support_growth: {
          en: ['Challenge', 'Support', 'Growth'],
          fr: ['Défi', 'Soutien', 'Croissance'],
        },
        // Five-card layouts
        iceberg: {
          en: [
            "What's visible",
            "What's beneath",
            'Root cause',
            'How it serves you',
            'Path to integration',
          ],
          fr: [
            'Ce qui est visible',
            'Ce qui est caché',
            'Cause profonde',
            'Comment cela vous sert',
            "Chemin vers l'intégration",
          ],
        },
        mirror: {
          en: [
            'How you see yourself',
            'How others see you',
            'What you refuse to see',
            'The truth beneath',
            'Acceptance message',
          ],
          fr: [
            'Comment vous vous voyez',
            'Comment les autres vous voient',
            'Ce que vous refusez de voir',
            'La vérité profonde',
            "Message d'acceptation",
          ],
        },
        inner_child: {
          en: [
            'Your inner child now',
            'What they need',
            'What wounded them',
            'How to nurture them',
            'The gift they hold',
          ],
          fr: [
            'Votre enfant intérieur',
            'Ce dont il a besoin',
            "Ce qui l'a blessé",
            'Comment le nourrir',
            "Le cadeau qu'il porte",
          ],
        },
        safe_space: {
          en: [
            'Where you feel unsafe',
            'What safety means to you',
            'What blocks safety',
            'Creating internal safety',
            'Your protector energy',
          ],
          fr: [
            'Où vous vous sentez vulnérable',
            'Ce que la sécurité signifie',
            'Ce qui bloque la sécurité',
            'Créer la sécurité intérieure',
            'Votre énergie protectrice',
          ],
        },
        authentic_self: {
          en: [
            'Who you were taught to be',
            'Who you pretend to be',
            'Who you fear being',
            'Who you truly are',
            'How to embody your truth',
          ],
          fr: [
            'Qui on vous a appris à être',
            'Qui vous prétendez être',
            "Qui vous craignez d'être",
            'Qui vous êtes vraiment',
            'Comment incarner votre vérité',
          ],
        },
        values: {
          en: [
            'What you say you value',
            'What your actions reveal',
            'A value abandoned',
            'A value calling you',
            'Alignment message',
          ],
          fr: [
            'Ce que vous dites valoriser',
            'Ce que vos actions révèlent',
            'Une valeur abandonnée',
            'Une valeur qui vous appelle',
            "Message d'alignement",
          ],
        },
        alchemy: {
          en: [
            'The lead (what feels heavy)',
            'The fire (transformation needed)',
            'The process',
            "The gold (what you're becoming)",
            "The philosopher's stone",
          ],
          fr: [
            'Le plomb (ce qui pèse)',
            'Le feu (transformation)',
            'Le processus',
            "L'or (ce que vous devenez)",
            'La pierre philosophale',
          ],
        },
        seasons: {
          en: [
            'What needs to die (autumn)',
            'What needs rest (winter)',
            'Ready to sprout (spring)',
            'Ready to bloom (summer)',
            "The cycle's wisdom",
          ],
          fr: [
            'Ce qui doit mourir (automne)',
            'Ce qui a besoin de repos (hiver)',
            'Prêt à germer (printemps)',
            'Prêt à fleurir (été)',
            'La sagesse du cycle',
          ],
        },
        love_relationships: {
          en: ['Your Heart', 'Their Heart', 'The Connection', 'Challenges', 'Potential'],
          fr: ['Votre Cœur', 'Son Cœur', 'La Connexion', 'Défis', 'Potentiel'],
        },
        career_purpose: {
          en: ['Current Position', 'Obstacles', 'Hidden Factors', 'Action to Take', 'Outcome'],
          fr: ['Position Actuelle', 'Obstacles', 'Facteurs Cachés', 'Action à Prendre', 'Résultat'],
        },
      };

      // Use layout-specific positions if layoutId is provided for THREE_CARD or FIVE_CARD
      let positionMeanings =
        language === 'en' ? spread.positionMeaningsEn : spread.positionMeaningsFr;
      console.log('[Tarot Generate] Layout check:', {
        spreadType,
        layoutId,
        hasLayoutId: !!layoutId,
        layoutExists: layoutId ? !!layoutPositions[layoutId] : false,
      });
      if (
        (spreadType === 'three_card' || spreadType === 'five_card') &&
        layoutId &&
        layoutPositions[layoutId]
      ) {
        positionMeanings = layoutPositions[layoutId][language];
        console.log(
          '[Tarot Generate] Using layout-specific positions:',
          layoutId,
          positionMeanings
        );
      }

      const cardsDescription = cards
        .map((c, idx) => {
          const cardName = language === 'en' ? c.card.nameEn : c.card.nameFr;
          const position = positionMeanings?.[idx] || `Position ${idx + 1}`;
          // Only mention reversed when applicable - upright is the default
          const orientation = c.isReversed ? ' (Reversed)' : '';
          return `${position}: ${cardName}${orientation}`;
        })
        .join('\n');

      // Get prompt from service (with caching and fallback to defaults)
      prompt = await getTarotReadingPrompt({
        spreadType,
        styleInstructions,
        question,
        cardsDescription,
        language,
        layoutId,
      });

      // Calculate max tokens based on spread size
      // Base tokens for each spread size
      const baseTokens =
        {
          1: 600,
          3: 1500, // Increased from 1200 for better coverage
          5: 2000,
          7: 2200,
          10: 2800,
        }[spread.positions] || 1500;

      // Add 300 tokens per style option for synthesis sections (100-150 words each)
      const styleBonus = style.length > 0 ? style.length * 300 : 0;
      maxTokens = baseTokens + styleBonus;
      console.log('[Tarot Generate] Token calculation:', { baseTokens, styleBonus, maxTokens });
    }

    // Generate interpretation using unified service
    console.log('[Tarot Generate] Calling OpenRouter service...');
    const startTime = Date.now();
    const interpretation = await openRouterService.generateTarotReading(prompt, {
      temperature: 0.7,
      maxTokens,
    });
    const elapsed = Date.now() - startTime;

    console.log(
      '[Tarot Generate] ✅ Generated interpretation:',
      interpretation.length,
      'chars in',
      elapsed,
      'ms'
    );

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

/**
 * POST /api/v1/ai/birthcard/year-energy
 * Generate a personalized year energy reading based on birth cards
 */
router.post('/birthcard/year-energy', requireAuth, async (req, res) => {
  try {
    const validation = yearEnergySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { year, yearEnergy, personalityCard, soulCard, isUnifiedBirthCard, language } =
      validation.data;

    const userId = req.auth.userId;
    const creditCost = 3; // Year energy reading costs 3 credits

    console.log('[Year Energy] Request:', {
      userId,
      year,
      personalityCard: personalityCard.cardName,
      soulCard: soulCard.cardName,
      isUnifiedBirthCard,
      language,
    });

    // Check if user has enough credits
    const balanceCheck = await creditService.checkSufficientCredits(userId, creditCost);
    if (balanceCheck.balance === 0 && !balanceCheck.sufficient) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!balanceCheck.sufficient) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Build year energy section
    let yearEnergySection: string;
    if (yearEnergy.isUnified) {
      yearEnergySection = `This year carries the unified energy of ${yearEnergy.primaryCardName} (${yearEnergy.primaryCardNameFr}).

${yearEnergy.description || 'Year energy description not yet available.'}`;
    } else {
      yearEnergySection = `This year carries dual energy: ${yearEnergy.primaryCardName} (${yearEnergy.primaryCardNameFr}) reducing to ${yearEnergy.reducedCardName} (${yearEnergy.reducedCardNameFr}).

${yearEnergy.description || 'Year energy description not yet available.'}`;
    }

    // Build birth cards section
    let birthCardsSection: string;
    if (isUnifiedBirthCard) {
      birthCardsSection = `This person has unified birth card energy: their Personality and Soul are both ${personalityCard.cardName} (${personalityCard.cardNameFr}).

${personalityCard.description || 'Birth card description not yet available.'}`;
    } else {
      birthCardsSection = `**Personality Card (Outer Expression):** ${personalityCard.cardName} (${personalityCard.cardNameFr})
${personalityCard.description || 'Personality card description not yet available.'}

**Soul Card (Inner Essence):** ${soulCard.cardName} (${soulCard.cardNameFr})
${soulCard.description || 'Soul card description not yet available.'}`;
    }

    // Get prompt from service
    const prompt = await getYearEnergyReadingPrompt({
      year,
      yearEnergySection,
      birthCardsSection,
      language,
    });

    console.log('[Year Energy] Prompt built, length:', prompt.length);

    // Generate interpretation using OpenRouter service
    const startTime = Date.now();
    const interpretation = await openRouterService.generateTarotReading(prompt, {
      temperature: 0.7,
      maxTokens: 2000, // 800-1000 words ~= 1200-1500 tokens, need buffer for HTML
    });
    const elapsed = Date.now() - startTime;

    console.log(
      '[Year Energy] ✅ Generated interpretation:',
      interpretation.length,
      'chars in',
      elapsed,
      'ms'
    );

    // Deduct credits after successful generation
    await creditService.deductCredits({
      userId,
      amount: creditCost,
      type: 'READING',
      description: `Year Energy Reading ${year}`,
    });

    res.json({
      interpretation,
      creditsUsed: creditCost,
    });
  } catch (error) {
    console.error('[Year Energy] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate year energy reading';
    res.status(500).json({ error: message });
  }
});

export default router;
