/**
 * AI Routes - Combined Router
 *
 * Modular structure:
 * - tarot.ts: Tarot reading generation (/summarize-question, /tarot/generate, /tarot/followup)
 * - birthcard.ts: Birth card readings (/birthcard/year-energy, /birthcard/synthesis)
 */

import { Router } from 'express';

// Import route modules
import tarotRoutes from './tarot.js';
import birthcardRoutes from './birthcard.js';

const router = Router();

// Mount tarot routes at root level (handles /summarize-question and /tarot/*)
router.use('/', tarotRoutes);

// Mount birthcard routes (handles /birthcard/*)
router.use('/birthcard', birthcardRoutes);

export default router;
