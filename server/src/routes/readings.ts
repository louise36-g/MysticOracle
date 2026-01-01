import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Server-side credit costs by spread type (NEVER trust client)
const SPREAD_CREDIT_COSTS: Record<string, number> = {
  SINGLE: 1,
  THREE_CARD: 2,
  CELTIC_CROSS: 5,
  HORSESHOE: 4,
};

// Follow-up question cost
const FOLLOW_UP_CREDIT_COST = 1;

// Spread types matching Prisma schema
const SPREAD_TYPES = ['SINGLE', 'THREE_CARD', 'CELTIC_CROSS', 'HORSESHOE'] as const;

// Interpretation styles matching Prisma schema
const INTERPRETATION_STYLES = ['CLASSIC', 'SPIRITUAL', 'PSYCHO_EMOTIONAL', 'NUMEROLOGY', 'ELEMENTAL'] as const;

// Validation schema for reading creation
const createReadingSchema = z.object({
  spreadType: z.enum(SPREAD_TYPES),
  interpretationStyle: z.enum(INTERPRETATION_STYLES).optional(),
  question: z.string().max(1000).optional(),
  cards: z.any(), // JSON field
  interpretation: z.string(),
});

// Create a new reading
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Validate input
    const validation = createReadingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validation.error.errors });
    }

    const { spreadType, interpretationStyle, question, cards, interpretation } = validation.data;

    // Get credit cost from server-side config (NEVER trust client)
    const creditCost = SPREAD_CREDIT_COSTS[spreadType] || 1;

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.credits < creditCost) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Create reading and deduct credits in a transaction
    const [reading] = await prisma.$transaction([
      prisma.reading.create({
        data: {
          userId,
          spreadType,
          interpretationStyle,
          question,
          cards,
          interpretation,
          creditCost
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: creditCost },
          totalCreditsSpent: { increment: creditCost },
          totalReadings: { increment: 1 }
        }
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'READING',
          amount: -creditCost,
          description: `${spreadType} reading`
        }
      })
    ]);

    res.status(201).json(reading);
  } catch (error) {
    console.error('Error creating reading:', error);
    res.status(500).json({ error: 'Failed to create reading' });
  }
});

// Get a specific reading
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const reading = await prisma.reading.findFirst({
      where: {
        id,
        userId // Ensure user owns this reading
      },
      include: {
        followUps: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!reading) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    res.json(reading);
  } catch (error) {
    console.error('Error fetching reading:', error);
    res.status(500).json({ error: 'Failed to fetch reading' });
  }
});

// Validation schema for follow-up questions
const followUpSchema = z.object({
  question: z.string().min(1).max(1000),
  answer: z.string(),
});

// Add follow-up question to a reading
router.post('/:id/follow-up', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    // Validate input
    const validation = followUpSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request data', details: validation.error.errors });
    }

    const { question, answer } = validation.data;

    // Use server-side credit cost (NEVER trust client)
    const creditCost = FOLLOW_UP_CREDIT_COST;

    // Verify reading belongs to user
    const reading = await prisma.reading.findFirst({
      where: { id, userId }
    });

    if (!reading) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    // Check credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user || user.credits < creditCost) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Create follow-up and deduct credits in a transaction
    const [followUp] = await prisma.$transaction([
      prisma.followUpQuestion.create({
        data: {
          readingId: id,
          question,
          answer,
          creditCost
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: creditCost },
          totalCreditsSpent: { increment: creditCost },
          totalQuestions: { increment: 1 }
        }
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'QUESTION',
          amount: -creditCost,
          description: 'Follow-up question'
        }
      })
    ]);

    res.status(201).json(followUp);
  } catch (error) {
    console.error('Error creating follow-up:', error);
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
});

// Get or create cached horoscope
router.get('/horoscope/:sign', requireAuth, async (req, res) => {
  try {
    const { sign } = req.params;
    const { language = 'en' } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check cache
    const cached = await prisma.horoscopeCache.findUnique({
      where: {
        sign_language_date: {
          sign,
          language: language as string,
          date: today
        }
      },
      include: {
        questions: true
      }
    });

    if (cached) {
      return res.json(cached);
    }

    // No cache - client needs to generate and POST
    res.status(404).json({ error: 'No cached horoscope', needsGeneration: true });
  } catch (error) {
    console.error('Error fetching horoscope:', error);
    res.status(500).json({ error: 'Failed to fetch horoscope' });
  }
});

// Cache a generated horoscope
router.post('/horoscope/:sign', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { sign } = req.params;
    const { language, horoscope } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cached = await prisma.horoscopeCache.upsert({
      where: {
        sign_language_date: {
          sign,
          language,
          date: today
        }
      },
      update: {
        horoscope
      },
      create: {
        userId,
        sign,
        language,
        date: today,
        horoscope
      }
    });

    res.json(cached);
  } catch (error) {
    console.error('Error caching horoscope:', error);
    res.status(500).json({ error: 'Failed to cache horoscope' });
  }
});

// NOTE: Generic deduct-credits endpoint removed for security
// Credit deductions should only happen through specific endpoints:
// - POST /readings (new reading)
// - POST /readings/:id/follow-up (follow-up question)
// This prevents client-side manipulation of credit amounts

export default router;
