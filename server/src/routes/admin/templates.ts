/**
 * Admin Routes - Email Templates CRUD
 */

import { Router, createTemplateSchema, updateTemplateSchema } from './shared.js';

const router = Router();

// ============================================
// EMAIL TEMPLATES CRUD
// ============================================

// List all templates
router.get('/', async (req, res) => {
  try {
    const listTemplatesUseCase = req.container.resolve('listTemplatesUseCase');
    const result = await listTemplatesUseCase.execute();
    res.json(result);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create template
router.post('/', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateTemplateSchema.parse(req.body);
    const updateTemplateUseCase = req.container.resolve('updateTemplateUseCase');
    const result = await updateTemplateUseCase.execute({ id, ...data });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, template: result.template });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteTemplateUseCase = req.container.resolve('deleteTemplateUseCase');
    const result = await deleteTemplateUseCase.execute({ id });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ============================================
// SEED TEMPLATES
// ============================================

router.post('/seed', async (req, res) => {
  try {
    const seedTemplatesUseCase = req.container.resolve('seedTemplatesUseCase');
    const result = await seedTemplatesUseCase.execute();

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, templates: result.templates, count: result.count });
  } catch (error) {
    console.error('Error seeding email templates:', error);
    res.status(500).json({ error: 'Failed to seed email templates' });
  }
});

export default router;
