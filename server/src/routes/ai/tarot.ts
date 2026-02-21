/**
 * AI Routes - Tarot Reading Generation
 *
 * Endpoints:
 * - POST /summarize-question - Summarize a tarot question
 * - POST /tarot/generate - Generate tarot reading interpretation
 * - POST /tarot/followup - Generate follow-up answer
 */

import {
  Router,
  z,
  requireAuth,
  creditService,
  CREDIT_COSTS,
  openRouterService,
  prisma,
  debug,
  getTarotReadingPrompt,
  getTarotFollowUpPrompt,
  getSingleCardReadingPrompt,
  getClarificationCardPrompt,
  summarizeQuestionSchema,
  generateTarotSchema,
  tarotFollowUpSchema,
  getOpenAIClient,
  getCardElement,
  getCardNumber,
  layoutPositions,
  styleDescriptions,
  styleMap,
} from './shared.js';

const router = Router();

// ============================================
// SUMMARIZE QUESTION
// ============================================

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

// ============================================
// TAROT READING GENERATION
// ============================================

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

    debug.log('[Tarot Generate] Request:', {
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
      debug.log('[Tarot Generate] Single card detected, building prompt...');
      // Use single card prompt
      const card = cards[0];
      const cardName = language === 'en' ? card.card.nameEn : card.card.nameFr;
      const isReversed = card.isReversed;

      // Get card metadata - parse ID as number for helper functions
      const cardIdNum = parseInt(card.card.id, 10) || 0;
      const cardElement = getCardElement(cardIdNum);
      const cardNumber = getCardNumber(cardIdNum);

      debug.log('[Tarot Generate] Card info:', { cardName, isReversed, cardElement, cardNumber });

      // Map style array to expected format (handles both EN and FR style names)
      const mappedStyles = style.map(s => styleMap[s.toLowerCase()] || s).filter(Boolean);
      debug.log('[Tarot Generate] Mapped styles:', mappedStyles);

      debug.log('[Tarot Generate] Calling getSingleCardReadingPrompt...');
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
      debug.log('[Tarot Generate] Prompt built, length:', prompt.length);

      // Base 2500 tokens + 500 per style (reasoning models need extra tokens for thinking)
      maxTokens = 2500 + mappedStyles.length * 500;
      debug.log('[Tarot Generate] Max tokens:', maxTokens);
    } else {
      // Existing multi-card logic
      const spreadType = spread.id;
      // Build detailed style instructions for multi-card readings
      let styleInstructions =
        'Use a classic interpretation style focusing on traditional tarot symbolism.';
      if (style.length > 0) {
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
      debug.log('[Tarot Generate] Styles received:', style);
      debug.log(
        '[Tarot Generate] Style instructions preview:',
        styleInstructions.substring(0, 100) + '...'
      );

      // Use layout-specific positions if layoutId is provided for THREE_CARD or FIVE_CARD
      let positionMeanings =
        language === 'en' ? spread.positionMeaningsEn : spread.positionMeaningsFr;
      debug.log('[Tarot Generate] Layout check:', {
        spreadType,
        layoutId,
        hasLayoutId: !!layoutId,
        layoutExists: layoutId ? !!layoutPositions[layoutId] : false,
      });
      if (
        (spreadType === 'two_card' || spreadType === 'three_card' || spreadType === 'five_card') &&
        layoutId &&
        layoutPositions[layoutId]
      ) {
        positionMeanings = layoutPositions[layoutId][language];
        debug.log('[Tarot Generate] Using layout-specific positions:', layoutId, positionMeanings);
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
          2: 1000,
          3: 1500, // Increased from 1200 for better coverage
          5: 2000,
          7: 2200,
          10: 2800,
        }[spread.positions] || 1500;

      // Add 300 tokens per style option for synthesis sections (100-150 words each)
      const styleBonus = style.length > 0 ? style.length * 300 : 0;
      maxTokens = baseTokens + styleBonus;
      debug.log('[Tarot Generate] Token calculation:', { baseTokens, styleBonus, maxTokens });
    }

    // Generate interpretation using unified service
    debug.log('[Tarot Generate] Calling OpenRouter service...');
    const startTime = Date.now();
    const interpretation = await openRouterService.generateTarotReading(prompt, {
      temperature: 0.7,
      maxTokens,
    });
    const elapsed = Date.now() - startTime;

    debug.log(
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

// ============================================
// TAROT FOLLOW-UP
// ============================================

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

    debug.log('[Tarot Follow-up] Request:', {
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

    debug.log('[Tarot Follow-up] ✅ Generated answer:', answer.length, 'chars');

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

// ============================================
// CLARIFICATION CARD
// ============================================

// Validation schema for clarification card
const clarificationSchema = z.object({
  readingId: z.string().min(1),
  card: z.object({
    id: z.number(),
    nameEn: z.string(),
    nameFr: z.string(),
  }),
  isReversed: z.boolean(),
  language: z.enum(['en', 'fr']),
});

/**
 * POST /api/v1/ai/tarot/clarification
 * Generate a clarification card interpretation for an existing reading
 */
router.post('/tarot/clarification', requireAuth, async (req, res) => {
  try {
    const validation = clarificationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { readingId, card, isReversed, language } = validation.data;
    const userId = req.auth.userId;

    debug.log('[Clarification] Request:', { userId, readingId, card: card.nameEn, isReversed });

    // Fetch reading and verify ownership
    const reading = await prisma.reading.findUnique({
      where: { id: readingId },
    });

    if (!reading) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    if (reading.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if clarification already used
    if (reading.hasClarification) {
      return res.status(400).json({ error: 'Clarification card already drawn for this reading' });
    }

    // Check credits
    const creditCost = CREDIT_COSTS.CLARIFICATION;
    const balanceCheck = await creditService.checkSufficientCredits(userId, creditCost);
    if (!balanceCheck.sufficient) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Build prompt
    const cardName = language === 'en' ? card.nameEn : card.nameFr;
    const orientation = isReversed
      ? language === 'en'
        ? 'Reversed'
        : 'Renversée'
      : language === 'en'
        ? 'Upright'
        : 'Droite';

    // Truncate original reading for prompt context (first 500 chars)
    const readingSummary =
      reading.interpretation.length > 500
        ? reading.interpretation.substring(0, 500) + '...'
        : reading.interpretation;

    const prompt = await getClarificationCardPrompt({
      originalQuestion: reading.question || '',
      originalReading: readingSummary,
      clarificationCard: cardName,
      orientation,
      language,
    });

    // Generate interpretation
    const interpretation = await openRouterService.generateTarotReading(prompt, {
      temperature: 0.7,
      maxTokens: 600,
    });

    debug.log('[Clarification] Generated:', interpretation.length, 'chars');

    // Deduct credits
    await creditService.deductCredits({
      userId,
      amount: creditCost,
      type: 'READING',
      description: 'Clarification card',
    });

    // Save to reading
    await prisma.reading.update({
      where: { id: readingId },
      data: {
        hasClarification: true,
        clarificationCard: {
          cardId: card.id,
          isReversed,
          cardNameEn: card.nameEn,
          cardNameFr: card.nameFr,
          interpretation,
        },
      },
    });

    res.json({
      interpretation,
      card: {
        id: card.id,
        nameEn: card.nameEn,
        nameFr: card.nameFr,
      },
      isReversed,
      creditsUsed: creditCost,
    });
  } catch (error) {
    console.error('[Clarification] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate clarification';
    res.status(500).json({ error: message });
  }
});

export default router;
