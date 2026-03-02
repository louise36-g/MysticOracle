/**
 * Tarot Article Trash Routes
 *
 * Soft delete, restore, and permanent delete operations.
 * Requires authentication and admin privileges.
 *
 * Now operates on BlogPost table with contentType = 'TAROT_ARTICLE'.
 */

import { Router } from 'express';
import { prisma, cacheService } from './shared.js';
import {
  softDeleteItem,
  restoreItem,
  permanentDeleteItem,
  emptyTrash,
  TrashConfig,
} from '../../services/content/TrashUtils.js';

const router = Router();

const tarotTrashConfig: TrashConfig = {
  entityName: 'Article',
  findUnique: id => prisma.blogPost.findFirst({ where: { id, contentType: 'TAROT_ARTICLE' } }),
  updateItem: (id, data) => prisma.blogPost.update({ where: { id }, data }),
  deleteItem: id => prisma.blogPost.delete({ where: { id } }),
  findSlugConflict: (slug, excludeId) =>
    prisma.blogPost.findFirst({ where: { slug, id: { not: excludeId } } }),
  deleteAllTrashed: () =>
    prisma.blogPost.deleteMany({
      where: { contentType: 'TAROT_ARTICLE', deletedAt: { not: null } },
    }),
  onAfterSoftDelete: async item => {
    await cacheService.invalidateTarotArticle(item.slug);
  },
  onAfterRestore: async () => {
    await cacheService.invalidateTarot();
  },
  onBeforePermanentDelete: async _id => {
    // BlogPostCategory and BlogPostTag have onDelete: Cascade, so junction
    // records are automatically cleaned up when the BlogPost is deleted.
    // No manual cleanup needed.
  },
  onBeforeEmptyTrash: async () => {
    // Same as above - cascade handles junction cleanup
  },
};

/**
 * DELETE /:id
 * Soft delete a tarot article (move to trash)
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await softDeleteItem(tarotTrashConfig, req.params.id);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error deleting tarot article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

/**
 * POST /:id/restore
 * Restore a trashed article
 */
router.post('/:id/restore', async (req, res) => {
  try {
    const result = await restoreItem(tarotTrashConfig, req.params.id);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error restoring tarot article:', error);
    res.status(500).json({ error: 'Failed to restore article' });
  }
});

/**
 * DELETE /:id/permanent
 * Permanently delete a trashed article
 */
router.delete('/:id/permanent', async (req, res) => {
  try {
    const result = await permanentDeleteItem(tarotTrashConfig, req.params.id);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error permanently deleting tarot article:', error);
    res.status(500).json({ error: 'Failed to permanently delete article' });
  }
});

/**
 * DELETE /trash/empty
 * Empty trash (permanently delete all trashed articles)
 */
router.delete('/trash/empty', async (req, res) => {
  try {
    const result = await emptyTrash(tarotTrashConfig);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ error: 'Failed to empty trash' });
  }
});

export default router;
