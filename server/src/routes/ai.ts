import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Initialize OpenAI client for OpenRouter
const getOpenAIClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });
};

// Cost for summarizing a question
const SUMMARIZE_QUESTION_COST = 1;

// Validation schema
const summarizeQuestionSchema = z.object({
  question: z.string().min(1).max(2000),
  language: z.enum(['en', 'fr']),
});

/**
 * POST /api/ai/summarize-question
 * Summarizes a long question while preserving intent and emotional context
 * Costs 1 credit
 */
router.post('/summarize-question', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Validate input
    const validation = summarizeQuestionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors
      });
    }

    const { question, language } = validation.data;

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.credits < SUMMARIZE_QUESTION_COST) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Build the prompt
    const prompt = language === 'en'
      ? `Summarize this tarot question while preserving the core intent and emotional context. Keep it under 400 characters. Return only the summarized question, nothing else.

Original question: "${question}"`
      : `Résumez cette question de tarot en préservant l'intention principale et le contexte émotionnel. Gardez moins de 400 caractères. Retournez uniquement la question résumée, rien d'autre.

Question originale: "${question}"`;

    // Call OpenRouter API
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.5,
    });

    const summary = response.choices[0]?.message?.content?.trim();

    if (!summary) {
      return res.status(500).json({ error: 'Failed to generate summary' });
    }

    // Deduct credits in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: SUMMARIZE_QUESTION_COST },
          totalCreditsSpent: { increment: SUMMARIZE_QUESTION_COST }
        }
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'QUESTION',
          amount: -SUMMARIZE_QUESTION_COST,
          description: 'Question summary'
        }
      })
    ]);

    res.json({
      summary,
      creditsUsed: SUMMARIZE_QUESTION_COST
    });

  } catch (error) {
    console.error('Error summarizing question:', error);
    res.status(500).json({ error: 'Failed to summarize question' });
  }
});

export default router;
