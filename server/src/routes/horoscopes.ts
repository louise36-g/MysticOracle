import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma.js';
import { optionalAuth } from '../middleware/auth.js';
import cacheService, { CacheService } from '../services/cache.js';
import { getHoroscopePrompt, getHoroscopeFollowUpPrompt } from '../services/promptService.js';
import { openRouterService, type OpenRouterMessage } from '../services/openRouterService.js';

const router = Router();

const zodiacSigns = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
  // French names
  'Bélier',
  'Taureau',
  'Gémeaux',
  'Cancer',
  'Lion',
  'Vierge',
  'Balance',
  'Scorpion',
  'Sagittaire',
  'Capricorne',
  'Verseau',
  'Poissons',
];

// Normalize sign to English for caching consistency
const normalizeSign = (sign: string): string => {
  const frToEn: Record<string, string> = {
    Bélier: 'Aries',
    Taureau: 'Taurus',
    Gémeaux: 'Gemini',
    Cancer: 'Cancer',
    Lion: 'Leo',
    Vierge: 'Virgo',
    Balance: 'Libra',
    Scorpion: 'Scorpio',
    Sagittaire: 'Sagittarius',
    Capricorne: 'Capricorn',
    Verseau: 'Aquarius',
    Poissons: 'Pisces',
  };
  return frToEn[sign] || sign;
};

const getHoroscopeSchema = z.object({
  sign: z.string().refine(s => zodiacSigns.includes(s), 'Invalid zodiac sign'),
  language: z.enum(['en', 'fr']).default('en'),
});

/**
 * Generate horoscope using unified OpenRouterService
 * Phase 2: Migrated to use centralized service
 */
async function generateHoroscope(sign: string, language: 'en' | 'fr'): Promise<string> {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Get prompt from service (with caching and fallback to defaults)
  const prompt = await getHoroscopePrompt({
    sign,
    today,
    language,
  });

  // Use unified service with retry logic and proper error handling
  return openRouterService.generateHoroscope(prompt, {
    temperature: 0.8,
    maxTokens: 1000,
  });
}

// GET /api/horoscopes/:sign - Get daily horoscope (cached)
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
      // Populate memory cache from DB
      await cacheService.set(
        memoryCacheKey,
        {
          horoscope: dbCached.horoscope,
          createdAt: dbCached.createdAt,
        },
        CacheService.TTL.HOROSCOPE
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

    // Save to memory cache
    await cacheService.set(memoryCacheKey, { horoscope, createdAt }, CacheService.TTL.HOROSCOPE);

    res.json({
      horoscope,
      cached: false,
      generatedAt: createdAt,
    });
  } catch (error) {
    console.error('Horoscope error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get horoscope';
    res.status(500).json({ error: message });
  }
});

// POST /api/horoscopes/:sign/followup - Ask follow-up question
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
      year: 'numeric',
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
