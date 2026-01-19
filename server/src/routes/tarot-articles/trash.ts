/**
 * Tarot Article Trash Routes
 *
 * Soft delete, restore, and permanent delete operations.
 * Requires authentication and admin privileges.
 */

import { Router } from 'express';
import { prisma, cacheService } from './shared.js';

const router = Router();

/**
 * DELETE /:id
 * Soft delete a tarot article (move to trash)
 */
router.delete('/:id', async (req, res) => {
  try {
    const article = await prisma.tarotArticle.findUnique({
      where: { id: req.params.id },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Save original slug and modify current slug to avoid conflicts
    const timestamp = Date.now();
    const trashedSlug = `_deleted_${timestamp}_${article.slug}`;

    await prisma.tarotArticle.update({
      where: { id: req.params.id },
      data: {
        deletedAt: new Date(),
        originalSlug: article.slug,
        slug: trashedSlug,
      },
    });

    await cacheService.invalidateTarotArticle(article.slug);

    res.json({ success: true, message: 'Article moved to trash' });
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
    const article = await prisma.tarotArticle.findUnique({
      where: { id: req.params.id },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (!article.deletedAt) {
      return res.status(400).json({ error: 'Article is not in trash' });
    }

    // Check if original slug is available
    const originalSlug = article.originalSlug || article.slug.replace(/^_deleted_\d+_/, '');
    const existingWithSlug = await prisma.tarotArticle.findFirst({
      where: {
        slug: originalSlug,
        id: { not: article.id },
      },
    });

    // Use original slug if available, otherwise generate new one
    const restoredSlug = existingWithSlug ? `${originalSlug}-restored-${Date.now()}` : originalSlug;

    await prisma.tarotArticle.update({
      where: { id: req.params.id },
      data: {
        deletedAt: null,
        slug: restoredSlug,
        originalSlug: null,
      },
    });

    await cacheService.invalidateTarot();

    res.json({
      success: true,
      message: 'Article restored',
      newSlug: restoredSlug !== originalSlug ? restoredSlug : undefined,
    });
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
    const article = await prisma.tarotArticle.findUnique({
      where: { id: req.params.id },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (!article.deletedAt) {
      return res.status(400).json({
        error: 'Article must be in trash before permanent deletion. Move to trash first.',
      });
    }

    // Also delete related junction table entries
    await prisma.tarotArticleCategory.deleteMany({
      where: { articleId: req.params.id },
    });
    await prisma.tarotArticleTag.deleteMany({
      where: { articleId: req.params.id },
    });

    await prisma.tarotArticle.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Article permanently deleted' });
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
    // Get all trashed article IDs
    const trashedArticles = await prisma.tarotArticle.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true },
    });

    const articleIds = trashedArticles.map((a) => a.id);

    // Delete junction table entries first
    await prisma.tarotArticleCategory.deleteMany({
      where: { articleId: { in: articleIds } },
    });
    await prisma.tarotArticleTag.deleteMany({
      where: { articleId: { in: articleIds } },
    });

    // Then delete articles
    const result = await prisma.tarotArticle.deleteMany({
      where: { deletedAt: { not: null } },
    });

    res.json({
      success: true,
      deleted: result.count,
      message: `${result.count} articles permanently deleted`,
    });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ error: 'Failed to empty trash' });
  }
});

export default router;
