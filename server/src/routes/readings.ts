import { Router } from 'express';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Create a new reading
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { spreadType, interpretationStyle, question, cards, interpretation, creditCost } = req.body;

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

// Add follow-up question to a reading
router.post('/:id/follow-up', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;
    const { question, answer, creditCost = 0 } = req.body;

    // Verify reading belongs to user
    const reading = await prisma.reading.findFirst({
      where: { id, userId }
    });

    if (!reading) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    // Check credits if needed
    if (creditCost > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true }
      });

      if (!user || user.credits < creditCost) {
        return res.status(400).json({ error: 'Insufficient credits' });
      }
    }

    // Create follow-up and deduct credits
    const operations: any[] = [
      prisma.followUpQuestion.create({
        data: {
          readingId: id,
          question,
          answer,
          creditCost
        }
      })
    ];

    if (creditCost > 0) {
      operations.push(
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
      );
    }

    const [followUp] = await prisma.$transaction(operations);

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

export default router;
