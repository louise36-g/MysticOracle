/**
 * Trash management routes (soft delete, restore, permanent delete)
 */

import { Router } from 'express';
import { prisma, cacheService } from './shared.js';

const router = Router();

// Soft delete post (move to trash)
router.delete('/posts/:id', async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Save original slug and modify current slug to avoid conflicts
    const timestamp = Date.now();
    const trashedSlug = `_deleted_${timestamp}_${post.slug}`;

    await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        deletedAt: new Date(),
        originalSlug: post.slug,
        slug: trashedSlug,
      },
    });

    // Invalidate blog cache
    await cacheService.flushPattern('blog:');

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Restore post from trash
router.post('/posts/:id/restore', async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (!post.deletedAt) {
      return res.status(400).json({ error: 'Post is not in trash' });
    }

    // Check if original slug is available
    const originalSlug = post.originalSlug || post.slug.replace(/^_deleted_\d+_/, '');
    const existingWithSlug = await prisma.blogPost.findFirst({
      where: { slug: originalSlug, id: { not: post.id } },
    });

    // If original slug is taken, generate a new one
    let newSlug = originalSlug;
    if (existingWithSlug) {
      newSlug = `${originalSlug}-restored-${Date.now()}`;
    }

    await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        deletedAt: null,
        originalSlug: null,
        slug: newSlug,
      },
    });

    // Invalidate blog cache
    await cacheService.flushPattern('blog:');

    res.json({ success: true, slug: newSlug });
  } catch (error) {
    console.error('Error restoring post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to restore post' });
  }
});

// Permanently delete post
router.delete('/posts/:id/permanent', async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (!post.deletedAt) {
      return res.status(400).json({ error: 'Post must be in trash before permanent deletion' });
    }

    await prisma.blogPost.delete({ where: { id: req.params.id } });

    // Invalidate blog cache
    await cacheService.flushPattern('blog:');

    res.json({ success: true });
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
    const result = await prisma.blogPost.deleteMany({
      where: { deletedAt: { not: null } },
    });

    // Invalidate blog cache
    await cacheService.flushPattern('blog:');

    res.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error('Error emptying trash:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to empty trash' });
  }
});

export default router;
