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
router.get('/', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('[Admin Prompts] Error listing prompts:', error);
    res.status(500).json({ error: 'Failed to list prompts' });
  }
});

/**
 * GET /api/admin/prompts/:key
 * Get single prompt by key
 */
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    // Validate key exists in defaults
    const defaultPrompt = DEFAULT_PROMPTS.find(p => p.key === key);
    if (!defaultPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
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
  } catch (error) {
    console.error('[Admin Prompts] Error fetching prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

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
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    // Validate key exists in defaults
    const defaultPrompt = DEFAULT_PROMPTS.find(p => p.key === key);
    if (!defaultPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Validate body
    const validation = updatePromptSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const { value } = validation.data;

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
  } catch (error) {
    console.error('[Admin Prompts] Error updating prompt:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

/**
 * POST /api/admin/prompts/:key/reset
 * Reset prompt to default value
 */
router.post('/:key/reset', async (req, res) => {
  try {
    const { key } = req.params;

    // Validate key exists in defaults
    const defaultPrompt = DEFAULT_PROMPTS.find(p => p.key === key);
    if (!defaultPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
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
  } catch (error) {
    console.error('[Admin Prompts] Error resetting prompt:', error);
    res.status(500).json({ error: 'Failed to reset prompt' });
  }
});

/**
 * POST /api/admin/prompts/seed
 * Seed all default prompts to database
 */
router.post('/seed', async (req, res) => {
  try {
    const result = await seedPrompts();

    res.json({
      success: true,
      seeded: result.seeded,
      count: result.count,
    });
  } catch (error) {
    console.error('[Admin Prompts] Error seeding prompts:', error);
    res.status(500).json({ error: 'Failed to seed prompts' });
  }
});

export default router;
