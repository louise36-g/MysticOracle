import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../db/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import cacheService, { CacheService } from '../services/cache.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ConflictError } from '../shared/errors/ApplicationError.js';
import { processBlogContent } from '../utils/urlReplacer.js';

const router = Router();

/**
 * Validate folder name to prevent path traversal attacks
 * - Rejects absolute paths
 * - Rejects path traversal attempts (..)
 * - Rejects path separators
 * - Only allows alphanumeric characters and hyphens
 */
function validateFolder(folder: string): string {
  if (
    !folder ||
    path.isAbsolute(folder) ||
    folder.includes('..') ||
    folder.includes('/') ||
    folder.includes('\\')
  ) {
    return 'blog'; // Default to safe value
  }
  // Only allow alphanumeric and hyphens
  return folder.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'blog';
}

/**
 * Sanitize filename for safe storage
 * - Removes path separators and null bytes
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters except hyphens and dots
 * - Preserve extension
 */
function sanitizeFilename(filename: string): string {
  // Security: Remove path separators and null bytes first
  if (filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
    filename = filename.replace(/[/\\\0]/g, '-');
  }

  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, path.extname(filename));

  const sanitized = base
    .toLowerCase()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/[^a-z0-9-]/g, '') // remove special chars
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // trim hyphens from ends

  return `${sanitized || 'image'}${ext}`;
}

/**
 * Get unique filename by appending number suffix if needed
 * - Has max iteration limit to prevent infinite loops
 */
function getUniqueFilename(dir: string, filename: string): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);

  let finalName = filename;
  let counter = 1;
  const maxAttempts = 1000;

  while (fs.existsSync(path.join(dir, finalName)) && counter < maxAttempts) {
    finalName = `${base}-${counter}${ext}`;
    counter++;
  }

  // Fall back to timestamp-based uniqueness if max attempts reached
  if (counter >= maxAttempts) {
    finalName = `${base}-${Date.now()}${ext}`;
  }

  return finalName;
}

// Base uploads directory
const baseUploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Configure multer for image uploads with folder support and original filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Get folder from request body, validate to prevent path traversal
      const folder = validateFolder((req.body?.folder as string) || 'blog');
      const folderPath = path.join(baseUploadDir, folder);

      // Create folder if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      cb(null, folderPath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    try {
      // Sanitize the original filename
      const sanitized = sanitizeFilename(file.originalname);

      // Get folder path for uniqueness check, validate to prevent path traversal
      const folder = validateFolder((req.body?.folder as string) || 'blog');
      const folderPath = path.join(baseUploadDir, folder);

      // Ensure folder exists before checking for unique filename
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Get unique filename (auto-rename if exists)
      const uniqueFilename = getUniqueFilename(folderPath, sanitized);

      cb(null, uniqueFilename);
    } catch (error) {
      cb(error as Error, '');
    }
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ============================================
// PUBLIC ENDPOINTS
// ============================================

// List published posts with pagination
router.get('/posts', async (req, res) => {
  try {
    const params = z
      .object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(50).default(12),
        category: z.string().optional(),
        tag: z.string().optional(),
        featured: z.coerce.boolean().optional(),
      })
      .parse(req.query);

    // Build cache key from sorted params
    const cacheKey = `blog:posts:${JSON.stringify({
      p: params.page,
      l: params.limit,
      c: params.category || '',
      t: params.tag || '',
      f: params.featured ?? '',
    })}`;

    // Check cache first
    const cached = await cacheService.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const where: Prisma.BlogPostWhereInput = {
      status: 'PUBLISHED',
      publishedAt: { not: null },
      deletedAt: null, // Exclude deleted posts
    };

    if (params.category) {
      where.categories = { some: { category: { slug: params.category } } };
    }
    if (params.tag) {
      where.tags = { some: { tag: { slug: params.tag } } };
    }
    if (params.featured !== undefined) {
      where.featured = params.featured;
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          slug: true,
          titleEn: true,
          titleFr: true,
          excerptEn: true,
          excerptFr: true,
          coverImage: true,
          coverImageAlt: true,
          authorName: true,
          featured: true,
          viewCount: true,
          readTimeMinutes: true,
          publishedAt: true,
          categories: {
            include: {
              category: { select: { slug: true, nameEn: true, nameFr: true, color: true } },
            },
          },
          tags: {
            include: { tag: { select: { slug: true, nameEn: true, nameFr: true } } },
          },
        },
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    const response = {
      posts: posts.map(p => ({
        ...p,
        categories: p.categories.map(c => c.category),
        tags: p.tags.map(t => t.tag),
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, response, CacheService.TTL.BLOG_POSTS);

    res.json(response);
  } catch (error) {
    console.error('Error fetching posts:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post by slug (with view count increment)
router.get('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        publishedAt: { not: null },
      },
      include: {
        categories: {
          include: { category: true },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count (non-blocking)
    prisma.blogPost
      .update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    // Get related posts (same category, excluding current and deleted)
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null },
        deletedAt: null,
        id: { not: post.id },
        categories: {
          some: {
            categoryId: { in: post.categories.map(c => c.categoryId) },
          },
        },
      },
      select: {
        slug: true,
        titleEn: true,
        titleFr: true,
        excerptEn: true,
        excerptFr: true,
        coverImage: true,
        publishedAt: true,
        readTimeMinutes: true,
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
    });

    res.json({
      post: {
        ...post,
        categories: post.categories.map(c => c.category),
        tags: post.tags.map(t => t.tag),
      },
      relatedPosts,
    });
  } catch (error) {
    console.error('Error fetching post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// List all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: {
                  status: 'PUBLISHED',
                  publishedAt: { not: null },
                },
              },
            },
          },
        },
      },
    });

    res.json({
      categories: categories.map(c => ({
        ...c,
        postCount: c._count.posts,
      })),
    });
  } catch (error) {
    console.error(
      'Error fetching categories:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// List all tags with post counts
router.get('/tags', async (req, res) => {
  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: {
                  status: 'PUBLISHED',
                  publishedAt: { not: null },
                },
              },
            },
          },
        },
      },
    });

    res.json({
      tags: tags.map(t => ({
        ...t,
        postCount: t._count.posts,
      })),
    });
  } catch (error) {
    console.error('Error fetching tags:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Preview any post (admin only) - bypasses published status check
router.get('/admin/preview/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id, deletedAt: null },
      include: {
        categories: {
          include: { category: true },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Transform to flat structure
    const transformedPost = {
      ...post,
      categories: post.categories.map(pc => pc.category),
      tags: post.tags.map(pt => pt.tag),
    };

    // Get related posts (same category) for preview
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null },
        deletedAt: null,
        id: { not: post.id },
        categories: {
          some: {
            categoryId: { in: post.categories.map(c => c.categoryId) },
          },
        },
      },
      select: {
        slug: true,
        titleEn: true,
        titleFr: true,
        excerptEn: true,
        excerptFr: true,
        coverImage: true,
        readTimeMinutes: true,
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
    });

    res.json({ post: transformedPost, relatedPosts });
  } catch (error) {
    console.error('Preview post error:', error);
    res.status(500).json({ error: 'Failed to load post preview' });
  }
});

// List all posts (including drafts) for admin
router.get('/admin/posts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const params = z
      .object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
        search: z.string().optional(),
        deleted: z.coerce.boolean().optional(), // true = show trash, false/undefined = show active
        category: z.string().optional(), // filter by category slug
      })
      .parse(req.query);

    const where: Prisma.BlogPostWhereInput = {};

    // Filter by deleted status
    if (params.deleted) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { titleEn: { contains: params.search, mode: 'insensitive' } },
        { titleFr: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.category) {
      where.categories = { some: { category: { slug: params.category } } };
    }

    // When filtering by category, order by sortOrder for drag-and-drop
    // Otherwise, order by updatedAt
    const orderBy = params.category
      ? { sortOrder: 'asc' as const }
      : { updatedAt: 'desc' as const };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      posts: posts.map(p => ({
        ...p,
        categories: p.categories.map(c => c.category),
        tags: p.tags.map(t => t.tag),
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error(
      'Error fetching admin posts:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post for editing
router.get('/admin/posts/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      post: {
        ...post,
        categoryIds: post.categories.map(c => c.categoryId),
        tagIds: post.tags.map(t => t.tagId),
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create post - use nullish() for optional fields to handle null from frontend
// Note: Only titleEn and authorName are required - all other language fields are optional
const createPostSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  titleEn: z.string().min(1),
  titleFr: z
    .string()
    .nullish()
    .transform(v => v || ''),
  excerptEn: z
    .string()
    .nullish()
    .transform(v => v || ''),
  excerptFr: z
    .string()
    .nullish()
    .transform(v => v || ''),
  contentEn: z
    .string()
    .nullish()
    .transform(v => v || ''),
  contentFr: z
    .string()
    .nullish()
    .transform(v => v || ''),
  coverImage: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  coverImageAlt: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  metaTitleEn: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  metaTitleFr: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  metaDescEn: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  metaDescFr: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  ogImage: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  authorName: z.string().min(1),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  readTimeMinutes: z.number().int().min(1).default(5),
  categoryIds: z
    .array(z.string())
    .nullish()
    .transform(v => v || []),
  tagIds: z
    .array(z.string())
    .nullish()
    .transform(v => v || []),
});

router.post('/admin/posts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = createPostSchema.parse(req.body);
    const { categoryIds, tagIds } = data;

    // Check slug uniqueness
    const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictError(`Post with slug "${data.slug}" already exists`);
    }

    // Process content to replace placeholder URLs
    const processedContent = processBlogContent(data.contentEn, data.contentFr);

    const post = await prisma.blogPost.create({
      data: {
        slug: data.slug,
        titleEn: data.titleEn,
        titleFr: data.titleFr,
        excerptEn: data.excerptEn,
        excerptFr: data.excerptFr,
        contentEn: processedContent.contentEn,
        contentFr: processedContent.contentFr,
        coverImage: data.coverImage,
        coverImageAlt: data.coverImageAlt,
        metaTitleEn: data.metaTitleEn,
        metaTitleFr: data.metaTitleFr,
        metaDescEn: data.metaDescEn,
        metaDescFr: data.metaDescFr,
        ogImage: data.ogImage,
        authorName: data.authorName,
        authorId: req.auth.userId,
        status: data.status,
        featured: data.featured,
        readTimeMinutes: data.readTimeMinutes,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        categories: {
          create: categoryIds.map(categoryId => ({ categoryId })),
        },
        tags: {
          create: tagIds.map(tagId => ({ tagId })),
        },
      },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    // Invalidate blog cache
    await cacheService.flushPattern('blog:');

    res.json({ success: true, post });
  } catch (error) {
    console.error('Error creating post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.patch('/admin/posts/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = createPostSchema.partial().parse(req.body);
    const { categoryIds, tagIds, ...postData } = data;

    // Check slug uniqueness if changing
    if (postData.slug) {
      const existing = await prisma.blogPost.findFirst({
        where: { slug: postData.slug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictError(`Post with slug "${postData.slug}" already exists`);
      }
    }

    // Get current post to check status change
    const current = await prisma.blogPost.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Set publishedAt if transitioning to published
    if (postData.status === 'PUBLISHED' && current.status !== 'PUBLISHED') {
      (postData as Record<string, unknown>).publishedAt = new Date();
    }

    // Process content to replace placeholder URLs
    if (postData.contentEn || postData.contentFr) {
      const processedContent = processBlogContent(
        postData.contentEn || current.contentEn,
        postData.contentFr || current.contentFr || undefined
      );
      postData.contentEn = processedContent.contentEn;
      postData.contentFr = processedContent.contentFr;
    }

    // Update post
    const updateData: Prisma.BlogPostUpdateInput = { ...postData };

    // Handle category updates
    if (categoryIds !== undefined) {
      await prisma.blogPostCategory.deleteMany({ where: { postId: id } });
      updateData.categories = {
        create: categoryIds.map(categoryId => ({ categoryId })),
      };
    }

    // Handle tag updates
    if (tagIds !== undefined) {
      await prisma.blogPostTag.deleteMany({ where: { postId: id } });
      updateData.tags = {
        create: tagIds.map(tagId => ({ tagId })),
      };
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    // Invalidate blog cache
    await cacheService.flushPattern('blog:');

    res.json({ success: true, post });
  } catch (error) {
    console.error('Error updating post:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Soft delete post (move to trash)
router.delete('/admin/posts/:id', requireAuth, requireAdmin, async (req, res) => {
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
router.post('/admin/posts/:id/restore', requireAuth, requireAdmin, async (req, res) => {
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
router.delete('/admin/posts/:id/permanent', requireAuth, requireAdmin, async (req, res) => {
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
router.delete('/admin/posts/trash/empty', requireAuth, requireAdmin, async (req, res) => {
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

// Reorder blog post (for admin drag-and-drop within category)
router.patch('/admin/posts/reorder', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { postId, categorySlug, newPosition } = req.body;

    console.log('=== REORDER REQUEST ===');
    console.log('postId:', postId);
    console.log('categorySlug:', categorySlug);
    console.log('newPosition:', newPosition);

    // Validate input
    if (!postId || typeof newPosition !== 'number') {
      console.log('❌ Validation failed: missing fields');
      return res.status(400).json({
        error: 'Missing required fields: postId, newPosition',
      });
    }

    if (newPosition < 0) {
      return res.status(400).json({
        error: 'newPosition must be >= 0',
      });
    }

    // Verify post exists
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: { categories: { include: { category: true } } },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Build where clause based on whether we're filtering by category
    const whereClause: Prisma.BlogPostWhereInput = {
      deletedAt: null,
    };

    if (categorySlug) {
      whereClause.categories = {
        some: { category: { slug: categorySlug } },
      };
    }

    // Get all posts in the same context (all posts or posts in category), ordered by current sortOrder
    const posts = await prisma.blogPost.findMany({
      where: whereClause,
      orderBy: { sortOrder: 'asc' },
      select: { id: true, sortOrder: true },
    });

    console.log('Posts in context:', posts.length);
    console.log('Requested newPosition:', newPosition);

    if (newPosition >= posts.length) {
      console.log('❌ Position exceeds post count');
      return res.status(400).json({
        error: `newPosition (${newPosition}) exceeds number of posts (${posts.length})`,
      });
    }

    // Reorder logic: remove post from old position, insert at new position
    const oldIndex = posts.findIndex(p => p.id === postId);
    if (oldIndex === -1) {
      return res.status(404).json({ error: 'Post not found in list' });
    }

    if (oldIndex === newPosition) {
      // No change needed
      return res.json({
        success: true,
        message: 'Post is already at the target position',
      });
    }

    // Remove from old position
    const [movedPost] = posts.splice(oldIndex, 1);
    // Insert at new position
    posts.splice(newPosition, 0, movedPost);

    // Update sortOrder for all posts in transaction
    await prisma.$transaction(
      posts.map((post, index) =>
        prisma.blogPost.update({
          where: { id: post.id },
          data: { sortOrder: index },
        })
      )
    );

    // Invalidate blog cache
    await cacheService.flushPattern('blog:');

    console.log('✅ Reorder successful');
    res.json({
      success: true,
      message: 'Post reordered successfully',
    });
  } catch (error) {
    console.error('❌ Error reordering post:', error);
    res.status(500).json({
      error: 'Failed to reorder post',
    });
  }
});

// ============================================
// CATEGORY ADMIN
// ============================================

router.get('/admin/categories', requireAuth, requireAdmin, async (req, res) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
    res.json({ categories });
  } catch (error) {
    console.error(
      'Error fetching categories:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

const categorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  nameEn: z.string().min(1),
  nameFr: z.string().min(1),
  descEn: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  descFr: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  color: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  icon: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  sortOrder: z.number().int().default(0),
});

router.post('/admin/categories', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = categorySchema.parse(req.body);

    // Check for duplicate slug
    const existing = await prisma.blogCategory.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictError(`Category with slug "${data.slug}" already exists`);
    }

    const category = await prisma.blogCategory.create({
      data: {
        slug: data.slug,
        nameEn: data.nameEn,
        nameFr: data.nameFr,
        descEn: data.descEn,
        descFr: data.descFr,
        color: data.color,
        icon: data.icon,
        sortOrder: data.sortOrder,
      },
    });
    res.json({ success: true, category });
  } catch (error) {
    console.error(
      'Error creating category:',
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.patch('/admin/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = categorySchema.partial().parse(req.body);

    // Check for duplicate slug if changing
    if (data.slug) {
      const existing = await prisma.blogCategory.findFirst({
        where: { slug: data.slug, id: { not: req.params.id } },
      });
      if (existing) {
        return res.status(400).json({ error: 'A category with this slug already exists' });
      }
    }

    const category = await prisma.blogCategory.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, category });
  } catch (error) {
    console.error(
      'Error updating category:',
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/admin/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.blogCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error(
      'Error deleting category:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============================================
// TAG ADMIN
// ============================================

router.get('/admin/tags', requireAuth, requireAdmin, async (req, res) => {
  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { nameEn: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

const tagSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  nameEn: z.string().min(1),
  nameFr: z.string().min(1),
});

router.post('/admin/tags', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = tagSchema.parse(req.body);

    // Check for duplicate slug
    const existing = await prisma.blogTag.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictError(`Tag with slug "${data.slug}" already exists`);
    }

    const tag = await prisma.blogTag.create({
      data: {
        slug: data.slug,
        nameEn: data.nameEn,
        nameFr: data.nameFr,
      },
    });
    res.json({ success: true, tag });
  } catch (error) {
    console.error('Error creating tag:', error instanceof Error ? error.message : String(error));
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

router.patch('/admin/tags/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = tagSchema.partial().parse(req.body);

    // Check for duplicate slug if changing
    if (data.slug) {
      const existing = await prisma.blogTag.findFirst({
        where: { slug: data.slug, id: { not: req.params.id } },
      });
      if (existing) {
        return res.status(400).json({ error: 'A tag with this slug already exists' });
      }
    }

    const tag = await prisma.blogTag.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, tag });
  } catch (error) {
    console.error('Error updating tag:', error instanceof Error ? error.message : String(error));
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

router.delete('/admin/tags/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.blogTag.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// ============================================
// MEDIA UPLOAD
// ============================================

router.post(
  '/admin/upload',
  requireAuth,
  requireAdmin,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Get folder from request body, validate to prevent path traversal
      const folder = validateFolder(req.body.folder || 'blog');

      const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
      const url = `${baseUrl}/uploads/${folder}/${req.file.filename}`;

      const media = await prisma.mediaUpload.create({
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url,
          altText: req.body.altText || null,
          caption: req.body.caption || null,
          folder,
        },
      });

      // Invalidate media cache after successful upload
      await cacheService.flushPattern('media:');

      res.json({ success: true, media });
    } catch (error) {
      console.error(
        'Error uploading file:',
        error instanceof Error ? error.message : String(error)
      );
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);

router.get('/admin/media', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Optional folder filter via query parameter, validate to prevent injection
    const folderParam = req.query.folder as string | undefined;
    const folder = folderParam ? validateFolder(folderParam) : undefined;
    const cacheKey = folder ? `media:list:${folder}` : 'media:list';

    // Check cache first
    const cached = await cacheService.get<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      return res.json({ media: cached });
    }

    const where = folder ? { folder } : {};

    const media = await prisma.mediaUpload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Cache result
    await cacheService.set(cacheKey, media, CacheService.TTL.MEDIA);

    res.json({ media });
  } catch (error) {
    console.error('Error fetching media:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

router.delete('/admin/media/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const media = await prisma.mediaUpload.findUnique({ where: { id: req.params.id } });
    if (media) {
      // Delete file from disk using folder from DB record, validate to prevent path traversal
      const folder = validateFolder(media.folder);
      const folderPath = path.join(baseUploadDir, folder);
      const filePath = path.join(folderPath, media.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await prisma.mediaUpload.delete({ where: { id: req.params.id } });

      // Invalidate media cache after successful delete
      await cacheService.flushPattern('media:');
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// ============================================
// JSON IMPORT
// ============================================

// Schema for imported article
const importArticleSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  author: z.string().optional(),
  read_time: z.union([z.string(), z.number()]).optional(),
  image_alt_text: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  seo_meta: z
    .object({
      focus_keyword: z.string().optional(),
      meta_title: z.string().optional(),
      meta_description: z.string().optional(),
      og_title: z.string().optional(),
      og_description: z.string().optional(),
    })
    .optional(),
});

// Import one or more articles from JSON
router.post('/admin/import', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { articles, options } = req.body;

    // Allow single article or array
    const articlesToImport = Array.isArray(articles) ? articles : [articles];
    const skipDuplicates = options?.skipDuplicates ?? true;
    const createMissingTaxonomies = options?.createMissingTaxonomies ?? true;

    const results = {
      imported: 0,
      skipped: 0,
      skippedSlugs: [] as string[],
      errors: [] as { slug: string; error: string }[],
      createdCategories: [] as string[],
      createdTags: [] as string[],
    };

    for (const articleData of articlesToImport) {
      try {
        // Validate article structure
        const validation = importArticleSchema.safeParse(articleData);
        if (!validation.success) {
          results.errors.push({
            slug: articleData.slug || 'unknown',
            error: validation.error.errors.map(e => e.message).join(', '),
          });
          continue;
        }

        const article = validation.data;

        // Check if slug exists
        const existing = await prisma.blogPost.findUnique({ where: { slug: article.slug } });
        if (existing) {
          if (skipDuplicates) {
            results.skipped++;
            results.skippedSlugs.push(article.slug);
            continue;
          } else {
            results.errors.push({ slug: article.slug, error: 'Slug already exists' });
            continue;
          }
        }

        // Process categories - find or create
        const categoryIds: string[] = [];
        if (article.categories && article.categories.length > 0) {
          for (const catName of article.categories) {
            const catSlug = catName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-');

            let category = await prisma.blogCategory.findUnique({ where: { slug: catSlug } });

            if (!category && createMissingTaxonomies) {
              category = await prisma.blogCategory.create({
                data: {
                  slug: catSlug,
                  nameEn: catName,
                  nameFr: catName, // Default same, can edit later
                },
              });
              results.createdCategories.push(catName);
            }

            if (category) {
              categoryIds.push(category.id);
            }
          }
        }

        // Process tags - find or create
        const tagIds: string[] = [];
        if (article.tags && article.tags.length > 0) {
          for (const tagName of article.tags) {
            const tagSlug = tagName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-');

            let tag = await prisma.blogTag.findUnique({ where: { slug: tagSlug } });

            if (!tag && createMissingTaxonomies) {
              tag = await prisma.blogTag.create({
                data: {
                  slug: tagSlug,
                  nameEn: tagName,
                  nameFr: tagName, // Default same, can edit later
                },
              });
              results.createdTags.push(tagName);
            }

            if (tag) {
              tagIds.push(tag.id);
            }
          }
        }

        // Parse read time
        let readTimeMinutes = 5;
        if (article.read_time) {
          if (typeof article.read_time === 'number') {
            readTimeMinutes = article.read_time;
          } else {
            const match = article.read_time.match(/(\d+)/);
            if (match) readTimeMinutes = parseInt(match[1]);
          }
        }

        // Create the post
        await prisma.blogPost.create({
          data: {
            slug: article.slug,
            titleEn: article.title,
            titleFr: '', // English only for imports
            excerptEn: article.excerpt || '',
            excerptFr: '',
            contentEn: article.content || '',
            contentFr: '',
            coverImageAlt: article.image_alt_text,
            authorName: article.author || 'MysticOracle',
            authorId: req.auth.userId,
            status: 'DRAFT', // Import as draft for review
            readTimeMinutes,
            metaTitleEn: article.seo_meta?.meta_title || article.seo_meta?.og_title,
            metaDescEn: article.seo_meta?.meta_description || article.seo_meta?.og_description,
            categories: {
              create: categoryIds.map(categoryId => ({ categoryId })),
            },
            tags: {
              create: tagIds.map(tagId => ({ tagId })),
            },
          },
        });

        results.imported++;
      } catch (err) {
        results.errors.push({
          slug: articleData.slug || 'unknown',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(
      'Error importing articles:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to import articles' });
  }
});

// ============================================
// SEED DEFAULT DATA
// ============================================

router.post('/admin/seed', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Create default categories
    const categories = await Promise.all([
      prisma.blogCategory.upsert({
        where: { slug: 'tarot-guides' },
        create: {
          slug: 'tarot-guides',
          nameEn: 'Tarot Guides',
          nameFr: 'Guides Tarot',
          descEn: 'Learn about tarot cards and spreads',
          descFr: 'Apprenez sur les cartes et tirages',
          color: '#8b5cf6',
          sortOrder: 0,
        },
        update: {},
      }),
      prisma.blogCategory.upsert({
        where: { slug: 'astrology' },
        create: {
          slug: 'astrology',
          nameEn: 'Astrology',
          nameFr: 'Astrologie',
          descEn: 'Zodiac signs and horoscopes',
          descFr: 'Signes du zodiaque et horoscopes',
          color: '#f59e0b',
          sortOrder: 1,
        },
        update: {},
      }),
      prisma.blogCategory.upsert({
        where: { slug: 'spirituality' },
        create: {
          slug: 'spirituality',
          nameEn: 'Spirituality',
          nameFr: 'Spiritualité',
          descEn: 'Mindfulness and spiritual growth',
          descFr: 'Pleine conscience et croissance spirituelle',
          color: '#10b981',
          sortOrder: 2,
        },
        update: {},
      }),
      prisma.blogCategory.upsert({
        where: { slug: 'news' },
        create: {
          slug: 'news',
          nameEn: 'News & Updates',
          nameFr: 'Actualités',
          descEn: 'Platform news and updates',
          descFr: 'Nouvelles et mises à jour',
          color: '#3b82f6',
          sortOrder: 3,
        },
        update: {},
      }),
    ]);

    // Create default tags
    const tags = await Promise.all([
      prisma.blogTag.upsert({
        where: { slug: 'beginners' },
        create: { slug: 'beginners', nameEn: 'Beginners', nameFr: 'Débutants' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'advanced' },
        create: { slug: 'advanced', nameEn: 'Advanced', nameFr: 'Avancé' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'major-arcana' },
        create: { slug: 'major-arcana', nameEn: 'Major Arcana', nameFr: 'Arcanes Majeurs' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'minor-arcana' },
        create: { slug: 'minor-arcana', nameEn: 'Minor Arcana', nameFr: 'Arcanes Mineurs' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'love' },
        create: { slug: 'love', nameEn: 'Love', nameFr: 'Amour' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'career' },
        create: { slug: 'career', nameEn: 'Career', nameFr: 'Carrière' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'meditation' },
        create: { slug: 'meditation', nameEn: 'Meditation', nameFr: 'Méditation' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'zodiac' },
        create: { slug: 'zodiac', nameEn: 'Zodiac', nameFr: 'Zodiaque' },
        update: {},
      }),
    ]);

    res.json({
      success: true,
      categories: categories.length,
      tags: tags.length,
    });
  } catch (error) {
    console.error(
      'Error seeding blog data:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to seed blog data' });
  }
});

// ============================================
// DYNAMIC SITEMAP FOR BLOG
// ============================================

router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://mysticoracle.com';

    // Get all published posts
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    // Get all categories
    const categories = await prisma.blogCategory.findMany({
      select: { slug: true, updatedAt: true },
    });

    // Get all tags
    const tags = await prisma.blogTag.findMany({
      select: { slug: true, updatedAt: true },
    });

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/tarot</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/horoscope</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/cookies</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
`;

    // Add blog posts
    for (const post of posts) {
      const lastmod = post.updatedAt.toISOString().split('T')[0];
      xml += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    // Add category pages
    for (const cat of categories) {
      xml += `  <url>
    <loc>${baseUrl}/blog?category=${cat.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
    }

    // Add tag pages
    for (const tag of tags) {
      xml += `  <url>
    <loc>${baseUrl}/blog?tag=${tag.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error(
      'Error generating sitemap:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
