/**
 * Year Energy Routes - Combined Router
 *
 * Modular structure:
 * - public.ts: Universal year energy (/current, /:year)
 * - personal.ts: Personal year readings (/personal/*)
 * - threshold.ts: Threshold period readings (/threshold/*)
 */

import { Router } from 'express';

// Import route modules
import publicRoutes from './public.js';
import personalRoutes from './personal.js';
import thresholdRoutes from './threshold.js';

const router = Router();

// Mount personal routes BEFORE public routes to avoid /:year matching "personal"
router.use('/personal', personalRoutes);

// Mount threshold routes
router.use('/threshold', thresholdRoutes);

// Mount public routes (includes /:year which must come last)
router.use('/', publicRoutes);

export default router;
