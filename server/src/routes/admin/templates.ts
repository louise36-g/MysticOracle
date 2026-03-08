/**
 * Admin Routes - Email Templates CRUD
 */

import { Router, createTemplateSchema, updateTemplateSchema } from './shared.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';

const router = Router();

// ============================================
// EMAIL TEMPLATES CRUD
// ============================================

// List all templates
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const listTemplatesUseCase = req.container.resolve('listTemplatesUseCase');
    const result = await listTemplatesUseCase.execute();
    res.json(result);
  })
);

// Create template
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createTemplateSchema.parse(req.body);
    const createTemplateUseCase = req.container.resolve('createTemplateUseCase');
    const result = await createTemplateUseCase.execute({
      slug: data.slug,
      subjectEn: data.subjectEn,
      subjectFr: data.subjectFr,
      bodyEn: data.bodyEn,
      bodyFr: data.bodyFr,
      isActive: data.isActive,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, template: result.template });
  })
);

// Update template
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = updateTemplateSchema.parse(req.body);
    const updateTemplateUseCase = req.container.resolve('updateTemplateUseCase');
    const result = await updateTemplateUseCase.execute({ id, ...data });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, template: result.template });
  })
);

// Delete template
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleteTemplateUseCase = req.container.resolve('deleteTemplateUseCase');
    const result = await deleteTemplateUseCase.execute({ id });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  })
);

// ============================================
// SEED TEMPLATES
// ============================================

router.post(
  '/seed',
  asyncHandler(async (req, res) => {
    const seedTemplatesUseCase = req.container.resolve('seedTemplatesUseCase');
    const result = await seedTemplatesUseCase.execute();

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, templates: result.templates, count: result.count });
  })
);

export default router;
