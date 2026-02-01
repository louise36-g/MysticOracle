/**
 * Horoscopes Routes - Combined Router
 *
 * Modular structure:
 * - shared.ts: Constants, helpers, schemas, re-exports
 * - generate.ts: Text cleaning and horoscope generation
 * - routes.ts: GET /:sign, POST /:sign/followup
 */

import { Router } from 'express';
import horoscopeRoutes from './routes.js';

const router = Router();

// Mount all horoscope routes
router.use('/', horoscopeRoutes);

export default router;
