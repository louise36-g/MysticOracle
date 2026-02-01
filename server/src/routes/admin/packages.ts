/**
 * Admin Routes - Credit Packages CRUD
 */

import { Router, createPackageSchema, updatePackageSchema } from './shared.js';

const router = Router();

// ============================================
// CREDIT PACKAGES CRUD
// ============================================

// List all packages
router.get('/', async (req, res) => {
  try {
    const listPackagesUseCase = req.container.resolve('listPackagesUseCase');
    const result = await listPackagesUseCase.execute();
    res.json(result);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Create package
router.post('/', async (req, res) => {
  try {
    const data = createPackageSchema.parse(req.body);
    const createPackageUseCase = req.container.resolve('createPackageUseCase');
    const result = await createPackageUseCase.execute({
      credits: data.credits,
      priceEur: data.priceEur,
      nameEn: data.nameEn,
      nameFr: data.nameFr,
      labelEn: data.labelEn,
      labelFr: data.labelFr,
      discount: data.discount,
      badge: data.badge,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, package: result.package });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// Update package
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updatePackageSchema.parse(req.body);
    const updatePackageUseCase = req.container.resolve('updatePackageUseCase');
    const result = await updatePackageUseCase.execute({ id, ...data });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, package: result.package });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// Delete package
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletePackageUseCase = req.container.resolve('deletePackageUseCase');
    const result = await deletePackageUseCase.execute({ id });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

// ============================================
// SEED PACKAGES
// ============================================

router.post('/seed', async (req, res) => {
  try {
    const seedPackagesUseCase = req.container.resolve('seedPackagesUseCase');
    const result = await seedPackagesUseCase.execute();

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, packages: result.packages, count: result.count });
  } catch (error) {
    console.error('Error seeding packages:', error);
    res.status(500).json({ error: 'Failed to seed packages' });
  }
});

export default router;
