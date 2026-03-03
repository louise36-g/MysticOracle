/**
 * Shared reorder logic for drag-and-drop sorting.
 * Used by blog posts and tarot articles.
 *
 * IMPORTANT: The where clause built by each consumer MUST match the filters
 * used by the corresponding admin list endpoint. Otherwise position indices
 * mismatch and items bounce back on the frontend.
 */

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../db/prisma.js';

interface ReorderConfig {
  entityName: string;
  /** Extract item ID from the request body */
  getItemId: (body: Record<string, unknown>) => string | undefined;
  /** Find the item to verify it exists. Return null if not found. */
  findItem: (id: string) => Promise<Record<string, unknown> | null>;
  /** Optional extra validation after finding the item. Return error string or null. */
  validateItem?: (item: Record<string, unknown>, body: Record<string, unknown>) => string | null;
  /** Build the Prisma where clause matching the admin list endpoint filters */
  buildWhereClause: (body: Record<string, unknown>) => Prisma.BlogPostWhereInput;
  /** Invalidate relevant caches after reorder */
  invalidateCache: () => Promise<void>;
}

export async function handleReorder(config: ReorderConfig, req: Request, res: Response) {
  try {
    const itemId = config.getItemId(req.body);
    const { newPosition } = req.body;
    const entity = config.entityName.toLowerCase();

    if (!itemId || typeof newPosition !== 'number') {
      return res.status(400).json({
        error: `Missing required fields: ${entity}Id, newPosition`,
      });
    }

    if (newPosition < 0) {
      return res.status(400).json({ error: 'newPosition must be >= 0' });
    }

    const item = await config.findItem(itemId);
    if (!item) {
      return res.status(404).json({ error: `${config.entityName} not found` });
    }

    if (config.validateItem) {
      const validationError = config.validateItem(item, req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }
    }

    const whereClause = config.buildWhereClause(req.body);

    // Deterministic ordering: sortOrder ASC with createdAt tiebreaker
    const allItems = await prisma.blogPost.findMany({
      where: whereClause,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, sortOrder: true },
    });

    if (newPosition >= allItems.length) {
      return res.status(400).json({
        error: `newPosition (${newPosition}) exceeds number of items (${allItems.length})`,
      });
    }

    const oldIndex = allItems.findIndex(p => p.id === itemId);
    if (oldIndex === -1) {
      return res.status(404).json({ error: `${config.entityName} not found in list` });
    }

    if (oldIndex === newPosition) {
      return res.json({
        success: true,
        message: `${config.entityName} is already at the target position`,
      });
    }

    // Splice-and-insert reorder
    const [movedItem] = allItems.splice(oldIndex, 1);
    allItems.splice(newPosition, 0, movedItem);

    await prisma.$transaction(
      allItems.map((p, index) =>
        prisma.blogPost.update({
          where: { id: p.id },
          data: { sortOrder: index },
        })
      )
    );

    await config.invalidateCache();

    res.json({
      success: true,
      message: `${config.entityName} reordered successfully`,
    });
  } catch (error) {
    console.error(`Error reordering ${config.entityName.toLowerCase()}:`, error);
    res.status(500).json({ error: `Failed to reorder ${config.entityName.toLowerCase()}` });
  }
}
