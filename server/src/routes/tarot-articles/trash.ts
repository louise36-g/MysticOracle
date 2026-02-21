/**
 * Tarot Article Trash Routes
 *
 * Soft delete, restore, and permanent delete operations.
 * Requires authentication and admin privileges.
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
  findUnique: id => prisma.tarotArticle.findUnique({ where: { id } }),
  updateItem: (id, data) => prisma.tarotArticle.update({ where: { id }, data }),
  deleteItem: id => prisma.tarotArticle.delete({ where: { id } }),
  findSlugConflict: (slug, excludeId) =>
    prisma.tarotArticle.findFirst({ where: { slug, id: { not: excludeId } } }),
  deleteAllTrashed: () => prisma.tarotArticle.deleteMany({ where: { deletedAt: { not: null } } }),
  onAfterSoftDelete: async item => {
    await cacheService.invalidateTarotArticle(item.slug);
  },
  onAfterRestore: async () => {
    await cacheService.invalidateTarot();
  },
  onBeforePermanentDelete: async id => {
    await prisma.tarotArticleCategory.deleteMany({ where: { articleId: id } });
    await prisma.tarotArticleTag.deleteMany({ where: { articleId: id } });
  },
  onBeforeEmptyTrash: async () => {
    const trashedArticles = await prisma.tarotArticle.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true },
    });
    const articleIds = trashedArticles.map(a => a.id);
    await prisma.tarotArticleCategory.deleteMany({ where: { articleId: { in: articleIds } } });
    await prisma.tarotArticleTag.deleteMany({ where: { articleId: { in: articleIds } } });
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
