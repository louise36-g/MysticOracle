/**
 * Horoscopes Routes - API Endpoints
 *
 * Endpoints:
 * - GET /:sign - Get daily horoscope (cached)
 * - POST /:sign/followup - Ask follow-up question
 */

import {
  Router,
  prisma,
  optionalAuth,
  cacheService,
  getHoroscopeFollowUpPrompt,
  openRouterService,
  type OpenRouterMessage,
  getHoroscopeSchema,
  normalizeSign,
} from './shared.js';
import { generateHoroscope } from './generate.js';

const router = Router();

// ============================================
// GET DAILY HOROSCOPE
// ============================================

/**
 * GET /api/horoscopes/:sign
 * Get daily horoscope (cached)
 */
router.get('/:sign', optionalAuth, async (req, res) => {
  try {
    const { sign } = req.params;
    const language = (req.query.language as 'en' | 'fr') || 'en';

    // Validate
    const validation = getHoroscopeSchema.safeParse({ sign, language });
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid sign or language' });
    }

    // Normalize sign for consistent caching
    const normalizedSign = normalizeSign(sign);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateKey = today.toISOString().split('T')[0];
    const memoryCacheKey = `horoscope:${normalizedSign}:${language}:${dateKey}`;

    // Calculate seconds until midnight for cache TTL
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);

    // Check in-memory cache first (reduces DB load)
    const memoryCached = await cacheService.get<{ horoscope: string; createdAt: Date }>(
      memoryCacheKey
    );
    if (memoryCached) {
      return res.json({
        horoscope: memoryCached.horoscope,
        cached: true,
        generatedAt: memoryCached.createdAt,
      });
    }

    // Check database cache
    const dbCached = await prisma.horoscopeCache.findUnique({
      where: {
        sign_language_date: {
          sign: normalizedSign,
          language,
          date: today,
        },
      },
    });

    if (dbCached) {
      // Populate memory cache from DB (expires at midnight)
      await cacheService.set(
        memoryCacheKey,
        {
          horoscope: dbCached.horoscope,
          createdAt: dbCached.createdAt,
        },
        secondsUntilMidnight
      );

      return res.json({
        horoscope: dbCached.horoscope,
        cached: true,
        generatedAt: dbCached.createdAt,
      });
    }

    // Generate new horoscope
    const horoscope = await generateHoroscope(normalizedSign, language);
    const createdAt = new Date();

    // Save to database (upsert to handle race conditions)
    await prisma.horoscopeCache.upsert({
      where: {
        sign_language_date: {
          sign: normalizedSign,
          language,
          date: today,
        },
      },
      create: {
        sign: normalizedSign,
        language,
        date: today,
        horoscope,
        userId: req.auth?.userId || null,
      },
      update: {
        horoscope,
        userId: req.auth?.userId || null,
      },
    });

    // Save to memory cache (expires at midnight)
    await cacheService.set(memoryCacheKey, { horoscope, createdAt }, secondsUntilMidnight);

    res.json({
      horoscope,
      cached: false,
      generatedAt: createdAt,
    });
  } catch (error) {
    console.error('Horoscope error:', error);

    // Check if this is a planetary calculation failure
    if (error instanceof Error && error.message === 'PLANETARY_CALCULATION_FAILED') {
      return res.status(503).json({
        error:
          "The stars appear a bit clouded right now - we're having trouble reading the planetary positions. Please try again in a few moments. We've been notified and are working to fix the issue.",
        code: 'PLANETARY_CALCULATION_FAILED',
        retryable: true,
      });
    }

    const message = error instanceof Error ? error.message : 'Failed to get horoscope';
    res.status(500).json({ error: message });
  }
});

// ============================================
// FOLLOW-UP QUESTION
// ============================================

/**
 * POST /api/horoscopes/:sign/followup
 * Ask follow-up question about horoscope
 */
router.post('/:sign/followup', optionalAuth, async (req, res) => {
  try {
    const { sign } = req.params;
    const { question, horoscope, history } = req.body;
    const language = (req.query.language as 'en' | 'fr') || 'en';

    if (!question || !horoscope) {
      return res.status(400).json({ error: 'Question and horoscope required' });
    }

    const normalizedSign = normalizeSign(sign);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if answer is cached
    const cachedHoroscope = await prisma.horoscopeCache.findUnique({
      where: {
        sign_language_date: {
          sign: normalizedSign,
          language,
          date: today,
        },
      },
      include: { questions: true },
    });

    // Look for cached answer
    const normalizedQuestion = question.trim().toLowerCase();
    const cachedAnswer = cachedHoroscope?.questions.find(
      q => q.question.trim().toLowerCase() === normalizedQuestion
    );

    if (cachedAnswer) {
      return res.json({
        answer: cachedAnswer.answer,
        cached: true,
      });
    }

    // Generate new answer using unified service
    const todayStr = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      // Note: year omitted - AI models may refuse dates beyond their training cutoff
    });

    // Convert history to OpenRouter message format
    const conversationHistory: OpenRouterMessage[] =
      history?.map((h: { role: string; content: string }) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })) || [];

    // Get prompt from service (with caching and fallback to defaults)
    const historyText =
      history
        ?.map(
          (h: { role: string; content: string }) =>
            `${h.role === 'user' ? 'Seeker' : 'Astrologer'}: ${h.content}`
        )
        .join('\n') || '';

    const prompt = await getHoroscopeFollowUpPrompt({
      sign: normalizedSign,
      today: todayStr,
      horoscope,
      history: historyText,
      question,
      language,
    });

    // Use unified service
    const answer = await openRouterService.generateHoroscopeFollowUp(prompt, conversationHistory, {
      temperature: 0.7,
      maxTokens: 500,
    });

    // Cache the Q&A if we have a horoscope cache entry
    if (cachedHoroscope) {
      await prisma.horoscopeQA.create({
        data: {
          horoscopeCacheId: cachedHoroscope.id,
          question: question.trim(),
          answer,
        },
      });
    }

    res.json({ answer, cached: false });
  } catch (error) {
    console.error('Follow-up error:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

export default router;
