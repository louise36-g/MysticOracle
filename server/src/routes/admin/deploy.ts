/**
 * Admin Routes - Front-end Deploy Trigger
 *
 * One-click redeploy of the front-end app via Coolify, so newly published
 * articles get pre-rendered (correct self-referencing canonicals + sitemap
 * entries) without waiting for the next incidental deploy.
 */

import { Router } from './shared.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import coolifyService from '../../services/coolifyService.js';

const router = Router();

// GET /api/admin/deploy/configured
router.get('/configured', (_req, res) => {
  res.json({ configured: coolifyService.isConfigured() });
});

// POST /api/admin/deploy/trigger
router.post(
  '/trigger',
  asyncHandler(async (_req, res) => {
    const result = await coolifyService.triggerDeploy();
    res.json({ success: true, ...result });
  })
);

export default router;
