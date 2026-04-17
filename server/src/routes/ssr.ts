import { Router, Request, Response } from 'express';
import { tarotPath } from '../utils/urls.js';

const router = Router();

/**
 * Legacy /tarot/articles/:slug URLs — permanent redirect to canonical /tarot/:slug.
 * Caddy handles this for the main domain; this covers direct API server hits.
 */
router.get('/tarot/articles/:slug', (req: Request, res: Response) => {
  res.redirect(301, tarotPath(req.params.slug));
});

/**
 * Legacy /fr/tarot/articles/:slug — permanent redirect to canonical /fr/tarot/:slug.
 */
router.get('/fr/tarot/articles/:slug', (req: Request, res: Response) => {
  res.redirect(301, tarotPath(req.params.slug, 'fr'));
});

export default router;
