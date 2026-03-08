/**
 * Admin Prompts Routes
 *
 * CRUD endpoints for managing AI prompts
 * All routes require admin authentication
 */

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { NotFoundError } from '../shared/errors/ApplicationError.js';
import { clearCache, seedPrompts } from '../services/promptService.js';
import { DEFAULT_PROMPTS } from '../shared/constants/prompts.js';

const router = Router();

// Apply admin auth to all routes
router.use(requireAuth, requireAdmin);

// ==================== SCHEMAS ====================

const updatePromptSchema = z.object({
  value: z
    .string()
    .min(50, 'Prompt must be at least 50 characters')
    .max(10000, 'Prompt cannot exceed 10,000 characters'),
});

// ==================== ROUTES ====================

/**
 * @openapi
 * /api/v1/admin/prompts:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all AI prompts
 *     description: Get all AI prompts with metadata, merging database overrides with defaults
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Prompts list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prompts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                         example: PROMPT_TAROT_READING
 *                       value:
 *                         type: string
 *                       description:
 *                         type: string
 *                       category:
 *                         type: string
 *                       characterCount:
 *                         type: integer
 *                       isCustom:
 *                         type: boolean
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    // Fetch all prompts from database
    const dbPrompts = await prisma.systemSetting.findMany({
      where: {
        OR: [{ key: { startsWith: 'PROMPT_' } }, { key: { startsWith: 'SPREAD_GUIDANCE_' } }],
      },
      orderBy: { key: 'asc' },
    });

    // Create a map of DB prompts
    const dbPromptsMap = new Map(dbPrompts.map(p => [p.key, p]));

    // Merge with defaults to ensure all prompts are listed
    const allPrompts = DEFAULT_PROMPTS.map(defaultPrompt => {
      const dbPrompt = dbPromptsMap.get(defaultPrompt.key);

      return {
        key: defaultPrompt.key,
        value: dbPrompt?.value || defaultPrompt.defaultValue,
        description: defaultPrompt.description,
        category: defaultPrompt.category,
        isBase: defaultPrompt.isBase || false,
        variables: defaultPrompt.variables,
        characterCount: (dbPrompt?.value || defaultPrompt.defaultValue).length,
        updatedAt: dbPrompt?.updatedAt?.toISOString() || null,
        isCustom: !!dbPrompt, // true if stored in DB
      };
    });

    res.json({ prompts: allPrompts });
  })
);

/**
 * GET /api/admin/prompts/:key
 * Get single prompt by key
 */
router.get(
  '/:key',
  asyncHandler(async (req, res) => {
    const { key } = req.params;

    // Validate key exists in defaults
    const defaultPrompt = DEFAULT_PROMPTS.find(p => p.key === key);
    if (!defaultPrompt) {
      throw new NotFoundError('Prompt');
    }

    // Fetch from database
    const dbPrompt = await prisma.systemSetting.findUnique({
      where: { key },
    });

    res.json({
      key: defaultPrompt.key,
      value: dbPrompt?.value || defaultPrompt.defaultValue,
      description: defaultPrompt.description,
      category: defaultPrompt.category,
      variables: defaultPrompt.variables,
      defaultValue: defaultPrompt.defaultValue,
      isCustom: !!dbPrompt,
      updatedAt: dbPrompt?.updatedAt?.toISOString() || null,
    });
  })
);

/**
 * @openapi
 * /api/v1/admin/prompts/{key}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update AI prompt
 *     description: Update or create custom prompt override
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Prompt key (e.g., PROMPT_TAROT_READING)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *                 minLength: 50
 *                 maxLength: 10000
 *                 description: The prompt text
 *     responses:
 *       200:
 *         description: Prompt updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 prompt:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:key',
  asyncHandler(async (req, res) => {
    const { key } = req.params;

    // Validate key exists in defaults
    const defaultPrompt = DEFAULT_PROMPTS.find(p => p.key === key);
    if (!defaultPrompt) {
      throw new NotFoundError('Prompt');
    }

    // Validate body
    const { value } = updatePromptSchema.parse(req.body);

    // Upsert to database
    const prompt = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: value.trim() },
      create: {
        key,
        value: value.trim(),
        isSecret: false,
        description: defaultPrompt.description,
      },
    });

    // Clear cache to pick up new value
    clearCache();

    res.json({
      success: true,
      prompt: {
        key: prompt.key,
        value: prompt.value,
        updatedAt: prompt.updatedAt.toISOString(),
      },
    });
  })
);

/**
 * POST /api/admin/prompts/:key/reset
 * Reset prompt to default value
 */
router.post(
  '/:key/reset',
  asyncHandler(async (req, res) => {
    const { key } = req.params;

    // Validate key exists in defaults
    const defaultPrompt = DEFAULT_PROMPTS.find(p => p.key === key);
    if (!defaultPrompt) {
      throw new NotFoundError('Prompt');
    }

    // Delete from database to fall back to default
    await prisma.systemSetting.deleteMany({
      where: { key },
    });

    // Clear cache
    clearCache();

    res.json({
      success: true,
      prompt: {
        key: defaultPrompt.key,
        value: defaultPrompt.defaultValue,
        updatedAt: new Date().toISOString(),
      },
    });
  })
);

/**
 * POST /api/admin/prompts/seed
 * Seed all default prompts to database
 */
router.post(
  '/seed',
  asyncHandler(async (_req, res) => {
    const result = await seedPrompts();

    res.json({
      success: true,
      seeded: result.seeded,
      count: result.count,
    });
  })
);

export default router;
