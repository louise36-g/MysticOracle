/**
 * TaxonomyService
 *
 * Unified service for category and tag management.
 * Used by both blog and tarot article systems.
 */

import { prisma } from '../db/prisma.js';
import { cacheService } from './cache.js';

// Types
export interface Category {
  id: string;
  name: string;
  nameFr: string;
  slug: string;
  description?: string | null;
  descriptionFr?: string | null;
  color?: string | null;
  icon?: string | null;
  sortOrder: number;
  parentId?: string | null;
  blogPostCount: number;
  tarotArticleCount: number;
  children?: Category[];
}

export interface Tag {
  id: string;
  name: string;
  nameFr: string;
  slug: string;
  blogPostCount: number;
  tarotArticleCount: number;
}

export interface CreateCategoryInput {
  name: string;
  nameFr?: string;
  slug: string;
  description?: string;
  descriptionFr?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
}

export interface CreateTagInput {
  name: string;
  nameFr?: string;
  slug: string;
}

/**
 * Service for unified taxonomy management
 */
class TaxonomyService {
  private cachePrefix = 'taxonomy';
  private cacheTTL = 600; // 10 minutes

  // ============================================
  // Category Operations
  // ============================================

  /**
   * List all categories with counts
   */
  async listCategories(): Promise<Category[]> {
    const cacheKey = `${this.cachePrefix}:categories`;
    const cached = await cacheService.get<Category[]>(cacheKey);
    if (cached) return cached;

    const categories = await prisma.blogCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            posts: { where: { post: { deletedAt: null } } },
          },
        },
      },
    });

    // Build flat list with parentId
    const flat: Category[] = categories.map(cat => ({
      id: cat.id,
      name: cat.nameEn,
      nameFr: cat.nameFr,
      slug: cat.slug,
      description: cat.descEn,
      descriptionFr: cat.descFr,
      color: cat.color,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
      parentId: cat.parentId,
      blogPostCount: cat._count.posts,
      tarotArticleCount: 0, // Now included in blogPostCount via BlogPostCategory
    }));

    // Build tree: nest children under parents
    const childrenByParent = new Map<string, Category[]>();
    const roots: Category[] = [];

    for (const cat of flat) {
      if (cat.parentId) {
        const siblings = childrenByParent.get(cat.parentId) || [];
        siblings.push(cat);
        childrenByParent.set(cat.parentId, siblings);
      } else {
        roots.push(cat);
      }
    }

    // Attach children to parents and sum child counts into parent
    for (const root of roots) {
      const children = childrenByParent.get(root.id) || [];
      root.children = children;
    }

    await cacheService.set(cacheKey, roots, this.cacheTTL);

    return roots;
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    const category = await prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: { where: { post: { deletedAt: null } } },
          },
        },
      },
    });

    if (!category) return null;

    return {
      id: category.id,
      name: category.nameEn,
      nameFr: category.nameFr,
      slug: category.slug,
      description: category.descEn,
      descriptionFr: category.descFr,
      color: category.color,
      icon: category.icon,
      sortOrder: category.sortOrder,
      parentId: category.parentId,
      blogPostCount: category._count.posts,
      tarotArticleCount: 0, // Now included in blogPostCount via BlogPostCategory
    };
  }

  /**
   * Create a new category
   */
  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const category = await prisma.blogCategory.create({
      data: {
        nameEn: input.name,
        nameFr: input.nameFr ?? input.name,
        slug: input.slug,
        descEn: input.description,
        descFr: input.descriptionFr,
        color: input.color,
        icon: input.icon,
        parentId: input.parentId ?? null,
      },
      include: {
        _count: {
          select: {
            posts: { where: { post: { deletedAt: null } } },
          },
        },
      },
    });

    await this.invalidateCategoryCache();

    return {
      id: category.id,
      name: category.nameEn,
      nameFr: category.nameFr,
      slug: category.slug,
      description: category.descEn,
      descriptionFr: category.descFr,
      color: category.color,
      icon: category.icon,
      sortOrder: category.sortOrder,
      parentId: category.parentId,
      blogPostCount: category._count.posts,
      tarotArticleCount: 0, // Now included in blogPostCount via BlogPostCategory
    };
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, input: Partial<CreateCategoryInput>): Promise<Category> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.nameEn = input.name;
    if (input.nameFr !== undefined) updateData.nameFr = input.nameFr;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.description !== undefined) updateData.descEn = input.description;
    if (input.descriptionFr !== undefined) updateData.descFr = input.descriptionFr;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.parentId !== undefined) updateData.parentId = input.parentId;

    const category = await prisma.blogCategory.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            posts: { where: { post: { deletedAt: null } } },
          },
        },
      },
    });

    await this.invalidateCategoryCache();

    return {
      id: category.id,
      name: category.nameEn,
      nameFr: category.nameFr,
      slug: category.slug,
      description: category.descEn,
      descriptionFr: category.descFr,
      color: category.color,
      icon: category.icon,
      sortOrder: category.sortOrder,
      parentId: category.parentId,
      blogPostCount: category._count.posts,
      tarotArticleCount: 0, // Now included in blogPostCount via BlogPostCategory
    };
  }

  /**
   * Delete a category
   * Note: Will fail if used by blog posts (only tarot associations are removed)
   */
  async deleteCategory(id: string): Promise<void> {
    // Delete the category (will fail if posts use it via BlogPostCategory)
    await prisma.blogCategory.delete({ where: { id } });

    await this.invalidateCategoryCache();
  }

  /**
   * Check if a category slug is available
   */
  async isCategorySlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.blogCategory.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !existing;
  }

  // ============================================
  // Tag Operations
  // ============================================

  /**
   * List all tags with counts
   */
  async listTags(): Promise<Tag[]> {
    const cacheKey = `${this.cachePrefix}:tags`;
    const cached = await cacheService.get<Tag[]>(cacheKey);
    if (cached) return cached;

    const tags = await prisma.blogTag.findMany({
      orderBy: { nameEn: 'asc' },
      include: {
        _count: {
          select: {
            posts: { where: { post: { deletedAt: null } } },
          },
        },
      },
    });

    const result = tags.map(tag => ({
      id: tag.id,
      name: tag.nameEn,
      nameFr: tag.nameFr,
      slug: tag.slug,
      blogPostCount: tag._count.posts,
      tarotArticleCount: 0, // Now included in blogPostCount via BlogPostTag
    }));

    await cacheService.set(cacheKey, result, this.cacheTTL);

    return result;
  }

  /**
   * Get a single tag by ID
   */
  async getTagById(id: string): Promise<Tag | null> {
    const tag = await prisma.blogTag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: { where: { post: { deletedAt: null } } },
          },
        },
      },
    });

    if (!tag) return null;

    return {
      id: tag.id,
      name: tag.nameEn,
      nameFr: tag.nameFr,
      slug: tag.slug,
      blogPostCount: tag._count.posts,
      tarotArticleCount: 0, // Now included in blogPostCount via BlogPostTag
    };
  }

  /**
   * Create a new tag
   */
  async createTag(input: CreateTagInput): Promise<Tag> {
    const tag = await prisma.blogTag.create({
      data: {
        nameEn: input.name,
        nameFr: input.nameFr ?? input.name,
        slug: input.slug,
      },
      include: {
        _count: {
          select: {
            posts: { where: { post: { deletedAt: null } } },
          },
        },
      },
    });

    await this.invalidateTagCache();

    return {
      id: tag.id,
      name: tag.nameEn,
      nameFr: tag.nameFr,
      slug: tag.slug,
      blogPostCount: tag._count.posts,
      tarotArticleCount: 0, // Now included in blogPostCount via BlogPostTag
    };
  }

  /**
   * Update a tag
   */
  async updateTag(id: string, input: Partial<CreateTagInput>): Promise<Tag> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.nameEn = input.name;
    if (input.nameFr !== undefined) updateData.nameFr = input.nameFr;
    if (input.slug !== undefined) updateData.slug = input.slug;

    const tag = await prisma.blogTag.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            posts: { where: { post: { deletedAt: null } } },
          },
        },
      },
    });

    await this.invalidateTagCache();

    return {
      id: tag.id,
      name: tag.nameEn,
      nameFr: tag.nameFr,
      slug: tag.slug,
      blogPostCount: tag._count.posts,
      tarotArticleCount: 0, // Now included in blogPostCount via BlogPostTag
    };
  }

  /**
   * Delete a tag
   * Note: Will fail if used by blog posts (only tarot associations are removed)
   */
  async deleteTag(id: string): Promise<void> {
    // Delete the tag (will fail if posts use it via BlogPostTag)
    await prisma.blogTag.delete({ where: { id } });

    await this.invalidateTagCache();
  }

  /**
   * Check if a tag slug is available
   */
  async isTagSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.blogTag.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !existing;
  }

  /**
   * Reorder a category within its sibling group (parents among parents, children within same parent)
   */
  async reorderCategory(categoryId: string, newPosition: number): Promise<void> {
    const category = await prisma.blogCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new Error('Category not found');

    // Get siblings: same parentId
    const siblings = await prisma.blogCategory.findMany({
      where: { parentId: category.parentId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, sortOrder: true },
    });

    if (newPosition < 0 || newPosition >= siblings.length) {
      throw new Error(`newPosition (${newPosition}) out of range (0-${siblings.length - 1})`);
    }

    const oldIndex = siblings.findIndex(s => s.id === categoryId);
    if (oldIndex === -1) throw new Error('Category not found in sibling list');
    if (oldIndex === newPosition) return;

    // Splice-and-insert
    const [moved] = siblings.splice(oldIndex, 1);
    siblings.splice(newPosition, 0, moved);

    await prisma.$transaction(
      siblings.map((s, index) =>
        prisma.blogCategory.update({
          where: { id: s.id },
          data: { sortOrder: index },
        })
      )
    );

    await this.invalidateCategoryCache();
    // Also flush public blog category cache
    await cacheService.flushPattern('blog:categories');
  }

  /**
   * Get a category slug and all its child slugs (for inclusive filtering)
   */
  async getCategorySlugsWithChildren(slug: string): Promise<string[]> {
    const category = await prisma.blogCategory.findUnique({
      where: { slug },
      include: { children: { select: { slug: true } } },
    });
    if (!category) return [slug];
    return [slug, ...category.children.map(c => c.slug)];
  }

  // ============================================
  // Cache Management
  // ============================================

  private async invalidateCategoryCache(): Promise<void> {
    await cacheService.del(`${this.cachePrefix}:categories`);
  }

  private async invalidateTagCache(): Promise<void> {
    await cacheService.del(`${this.cachePrefix}:tags`);
  }

  async invalidateAll(): Promise<void> {
    await cacheService.flushPattern(`${this.cachePrefix}:`);
  }
}

// Singleton instance
export const taxonomyService = new TaxonomyService();
