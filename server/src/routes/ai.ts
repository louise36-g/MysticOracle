import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import prisma from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { getAISettings } from '../services/aiSettings.js';
import { creditService, CREDIT_COSTS } from '../services/CreditService.js';

const router = Router();

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

export default router;
