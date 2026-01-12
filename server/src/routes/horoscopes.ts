import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma.js';
import { optionalAuth } from '../middleware/auth.js';
import { getAISettings } from '../services/aiSettings.js';
import cacheService, { CacheService } from '../services/cache.js';

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

// Generate horoscope via OpenRouter
async function generateHoroscope(sign: string, language: 'en' | 'fr'): Promise<string> {
  const aiSettings = await getAISettings();

  if (!aiSettings.apiKey) {
    console.error(
      'OpenRouter API key not configured (check database settings or OPENROUTER_API_KEY env var)'
    );
    throw new Error('AI service not configured. Please contact support.');
  }

  const langName = language === 'en' ? 'English' : 'French';
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const prompt = `
You are an expert astrologer providing a daily horoscope reading.

Task: Write a concise daily horoscope.
Language: ${langName}
Zodiac Sign: ${sign}
Today's Date: ${today}

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

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiSettings.apiKey}`,
      'HTTP-Referer': process.env.FRONTEND_URL || 'https://mysticoracle.com',
      'X-Title': 'MysticOracle',
    },
    body: JSON.stringify({
      model: aiSettings.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenRouter API error:', response.status, error);
    if (response.status === 401) {
      throw new Error('AI service authentication failed. Please check API key.');
    } else if (response.status === 429) {
      throw new Error('AI service rate limited. Please try again in a moment.');
    } else if (response.status === 402) {
      throw new Error('AI service credits exhausted. Please contact support.');
    }
    throw new Error(`AI service error (${response.status}). Please try again.`);
  }

  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content || 'Unable to generate horoscope';
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

    // Generate new answer
    const aiSettings = await getAISettings();
    if (!aiSettings.apiKey) {
      return res.status(500).json({ error: 'AI not configured' });
    }

    const langName = language === 'en' ? 'English' : 'French';
    const todayStr = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const historyText =
      history
        ?.map(
          (h: { role: string; content: string }) =>
            `${h.role === 'user' ? 'Seeker' : 'Astrologer'}: ${h.content}`
        )
        .join('\n') || '';

    const prompt = `
You are an expert astrologer continuing a conversation about a horoscope reading.

Today's Date: ${todayStr}
Zodiac Sign: ${normalizedSign}

Original Horoscope Reading:
${horoscope}

${historyText ? `Conversation History:\n${historyText}\n` : ''}
Current Question: "${question}"

Language: ${langName}

Task: Answer the question concisely and informatively. Draw upon:
- The planetary positions and transits mentioned in the original reading
- Current lunar phases and their significance
- The specific characteristics of ${normalizedSign} and how they interact with current cosmic energies
- Practical advice tied to astrological influences

Explain astrological concepts when relevant, but assume the reader is an intelligent adult - never be patronizing or overly simplistic.

IMPORTANT STYLE RULES:
- Be concise and direct
- DO NOT use phrases like "my dear", "well now", "as you know"
- No tables, emojis, or icons
- Write in flowing prose
`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiSettings.apiKey}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://mysticoracle.com',
        'X-Title': 'MysticOracle',
      },
      body: JSON.stringify({
        model: aiSettings.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate answer');
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    const answer = data.choices[0]?.message?.content || 'Unable to answer';

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
