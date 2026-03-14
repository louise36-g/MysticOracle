/**
 * Readings Routes
 * Thin controller layer that delegates to use cases
 * Dependencies injected via DI container
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { idempotent } from '../middleware/idempotency.js';

import { debug } from '../lib/logger.js';

const router = Router();

// Validation schemas
const createReadingSchema = z.object({
  spreadType: z.string(),
  interpretationStyle: z.string().optional(),
  question: z.string().max(1000).optional(),
  cards: z
    .array(
      z.object({
        cardId: z.string(),
        position: z.number(),
        isReversed: z.boolean().optional(),
      })
    )
    .min(1, 'At least one card is required'),
  interpretation: z.string().min(1, 'Interpretation is required'),
  hasExtendedQuestion: z.boolean().optional(), // Flag for extended question cost (+1 credit)
  isUserSelected: z.boolean().optional(), // Flag for Interpret My Cards readings
});

const followUpSchema = z.object({
  question: z.string().min(1).max(1000),
  answer: z.string(),
});

const reflectionSchema = z.object({
  userReflection: z.string().max(1000),
});

// Create a new reading
// Uses idempotency middleware to prevent duplicate charges on retried requests
router.post(
  '/',
  requireAuth,
  idempotent,
  asyncHandler(async (req, res) => {
    debug.log('[Reading API] Received reading creation request from userId:', req.auth.userId);
    debug.log('[Reading API] Request body:', JSON.stringify(req.body, null, 2));

    const validation = createReadingSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request data', details: validation.error.errors });
    }

    debug.log('[Reading API] Validation passed, executing use case...');

    // Resolve use case from DI container
    const createReadingUseCase = req.container.resolve('createReadingUseCase');

    // Cast validation.data - Zod schema guarantees required fields exist after successful parse
    const result = await createReadingUseCase.execute({
      userId: req.auth.userId,
      ...(validation.data as {
        spreadType: string;
        interpretationStyle?: string;
        question?: string;
        cards: { cardId: string; position: number; isReversed?: boolean }[];
        interpretation: string;
        hasExtendedQuestion?: boolean;
      }),
    });

    if (!result.success) {
      const statusCode =
        result.errorCode === 'USER_NOT_FOUND'
          ? 404
          : result.errorCode === 'INSUFFICIENT_CREDITS'
            ? 402 // Payment Required
            : result.errorCode === 'VALIDATION_ERROR'
              ? 400
              : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    debug.log('[Reading API] Reading created successfully! ID:', result.reading?.id);
    res.status(201).json(result.reading);
  })
);

// Get a specific reading
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const getReadingUseCase = req.container.resolve('getReadingUseCase');

    const result = await getReadingUseCase.execute({
      userId: req.auth.userId,
      readingId: req.params.id,
    });

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result.reading);
  })
);

// Add follow-up question to a reading
// Uses idempotency middleware to prevent duplicate charges on retried requests
router.post(
  '/:id/follow-up',
  requireAuth,
  idempotent,
  asyncHandler(async (req, res) => {
    const validation = followUpSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request data', details: validation.error.errors });
    }

    const addFollowUpUseCase = req.container.resolve('addFollowUpUseCase');

    // Cast validation.data - Zod schema guarantees required fields exist after successful parse
    const result = await addFollowUpUseCase.execute({
      userId: req.auth.userId,
      readingId: req.params.id,
      ...(validation.data as { question: string; answer: string }),
    });

    if (!result.success) {
      const statusCode =
        result.errorCode === 'READING_NOT_FOUND'
          ? 404
          : result.errorCode === 'INSUFFICIENT_CREDITS'
            ? 402 // Payment Required
            : result.errorCode === 'VALIDATION_ERROR'
              ? 400
              : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.status(201).json(result.followUp);
  })
);

// Update reading with user reflection
router.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const validation = reflectionSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: 'Invalid request data', details: validation.error.errors });
    }

    const updateReflectionUseCase = req.container.resolve('updateReflectionUseCase');

    const result = await updateReflectionUseCase.execute({
      userId: req.auth.userId,
      readingId: req.params.id,
      userReflection: validation.data.userReflection,
    });

    if (!result.success) {
      const statusCode =
        result.errorCode === 'NOT_FOUND'
          ? 404
          : result.errorCode === 'VALIDATION_ERROR'
            ? 400
            : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ success: true, reading: result.reading });
  })
);

// Legacy horoscope endpoints removed — superseded by /api/horoscopes/:sign
// See server/src/routes/horoscopes/routes.ts for current implementation

export default router;
