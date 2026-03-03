/**
 * Factory for creating trash management routers (soft delete, restore, permanent delete, empty).
 * Used by both blog posts and tarot articles.
 */

import { Router, Request, Response } from 'express';
import {
  softDeleteItem,
  restoreItem,
  permanentDeleteItem,
  emptyTrash,
  TrashConfig,
} from '../../services/content/TrashUtils.js';

interface TrashRouterOptions {
  config: TrashConfig;
  /** Route prefix for item-level routes, e.g. '/posts' → DELETE /posts/:id. Default: '' */
  itemPrefix?: string;
}

export function createTrashRouter({ config, itemPrefix = '' }: TrashRouterOptions): Router {
  const router = Router();
  const entity = config.entityName.toLowerCase();

  // Soft delete (move to trash)
  router.delete(`${itemPrefix}/:id`, async (req: Request, res: Response) => {
    try {
      const result = await softDeleteItem(config, req.params.id);
      res.status(result.status).json(result.body);
    } catch (error) {
      console.error(
        `Error deleting ${entity}:`,
        error instanceof Error ? error.message : String(error)
      );
      res.status(500).json({ error: `Failed to delete ${entity}` });
    }
  });

  // Restore from trash
  router.post(`${itemPrefix}/:id/restore`, async (req: Request, res: Response) => {
    try {
      const result = await restoreItem(config, req.params.id);
      res.status(result.status).json(result.body);
    } catch (error) {
      console.error(
        `Error restoring ${entity}:`,
        error instanceof Error ? error.message : String(error)
      );
      res.status(500).json({ error: `Failed to restore ${entity}` });
    }
  });

  // Permanently delete
  router.delete(`${itemPrefix}/:id/permanent`, async (req: Request, res: Response) => {
    try {
      const result = await permanentDeleteItem(config, req.params.id);
      res.status(result.status).json(result.body);
    } catch (error) {
      console.error(
        `Error permanently deleting ${entity}:`,
        error instanceof Error ? error.message : String(error)
      );
      res.status(500).json({ error: `Failed to permanently delete ${entity}` });
    }
  });

  // Empty trash
  router.delete('/trash/empty', async (_req: Request, res: Response) => {
    try {
      const result = await emptyTrash(config);
      res.status(result.status).json(result.body);
    } catch (error) {
      console.error(
        `Error emptying ${entity} trash:`,
        error instanceof Error ? error.message : String(error)
      );
      res.status(500).json({ error: `Failed to empty trash` });
    }
  });

  return router;
}
