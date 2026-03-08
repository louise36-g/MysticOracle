/**
 * Admin Routes - Credit Packages CRUD
 */

import { Router, createPackageSchema, updatePackageSchema } from './shared.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';

const router = Router();

// ============================================
// CREDIT PACKAGES CRUD
// ============================================

// List all packages
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const listPackagesUseCase = req.container.resolve('listPackagesUseCase');
    const result = await listPackagesUseCase.execute();
    res.json(result);
  })
);

// Create package
router.post(
  '/',
  asyncHandler(async (req, res) => {
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
  })
);

// Update package
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = updatePackageSchema.parse(req.body);
    const updatePackageUseCase = req.container.resolve('updatePackageUseCase');
    const result = await updatePackageUseCase.execute({ id, ...data });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, package: result.package });
  })
);

// Delete package
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletePackageUseCase = req.container.resolve('deletePackageUseCase');
    const result = await deletePackageUseCase.execute({ id });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  })
);

// ============================================
// SEED PACKAGES
// ============================================

router.post(
  '/seed',
  asyncHandler(async (req, res) => {
    const seedPackagesUseCase = req.container.resolve('seedPackagesUseCase');
    const result = await seedPackagesUseCase.execute();

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, packages: result.packages, count: result.count });
  })
);

export default router;
