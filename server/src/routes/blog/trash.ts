/**
 * Trash management routes (soft delete, restore, permanent delete)
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

const blogTrashConfig: TrashConfig = {
  entityName: 'Post',
  findUnique: id => prisma.blogPost.findUnique({ where: { id } }),
  updateItem: (id, data) => prisma.blogPost.update({ where: { id }, data }),
  deleteItem: id => prisma.blogPost.delete({ where: { id } }),
  findSlugConflict: (slug, excludeId) =>
    prisma.blogPost.findFirst({ where: { slug, id: { not: excludeId } } }),
  deleteAllTrashed: () => prisma.blogPost.deleteMany({ where: { deletedAt: { not: null } } }),
  onAfterSoftDelete: async () => {
    await cacheService.flushPattern('blog:');
  },
  onAfterRestore: async () => {
    await cacheService.flushPattern('blog:');
  },
};

// Soft delete post (move to trash)
router.delete('/posts/:id', async (req, res) => {
  try {
    const result = await softDeleteItem(blogTrashConfig, req.params.id);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error deleting post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Restore post from trash
router.post('/posts/:id/restore', async (req, res) => {
  try {
    const result = await restoreItem(blogTrashConfig, req.params.id);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error restoring post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to restore post' });
  }
});

// Permanently delete post
router.delete('/posts/:id/permanent', async (req, res) => {
  try {
    const result = await permanentDeleteItem(blogTrashConfig, req.params.id);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(
      'Error permanently deleting post:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to permanently delete post' });
  }
});

// Empty trash (delete all trashed posts)
router.delete('/trash/empty', async (req, res) => {
  try {
    const result = await emptyTrash(blogTrashConfig);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Error emptying trash:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to empty trash' });
  }
});

export default router;
