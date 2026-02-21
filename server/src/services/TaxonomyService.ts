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
  blogPostCount: number;
  tarotArticleCount: number;
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
            posts: true,
            tarotArticles: true,
          },
        },
      },
    });

    const result = categories.map(cat => ({
      id: cat.id,
      name: cat.nameEn,
      nameFr: cat.nameFr,
      slug: cat.slug,
      description: cat.descEn,
      descriptionFr: cat.descFr,
      color: cat.color,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
      blogPostCount: cat._count.posts,
      tarotArticleCount: cat._count.tarotArticles,
    }));

    await cacheService.set(cacheKey, result, this.cacheTTL);

    return result;
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
            posts: true,
            tarotArticles: true,
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
      blogPostCount: category._count.posts,
      tarotArticleCount: category._count.tarotArticles,
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
      },
      include: {
        _count: {
          select: {
            posts: true,
            tarotArticles: true,
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
      blogPostCount: category._count.posts,
      tarotArticleCount: category._count.tarotArticles,
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

    const category = await prisma.blogCategory.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            posts: true,
            tarotArticles: true,
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
      blogPostCount: category._count.posts,
      tarotArticleCount: category._count.tarotArticles,
    };
  }

  /**
   * Delete a category
   * Note: Will fail if used by blog posts (only tarot associations are removed)
   */
  async deleteCategory(id: string): Promise<void> {
    // Remove tarot article associations first
    await prisma.tarotArticleCategory.deleteMany({
      where: { categoryId: id },
    });

    // Delete the category (will fail if blog posts use it)
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
            posts: true,
            tarotArticles: true,
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
      tarotArticleCount: tag._count.tarotArticles,
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
            posts: true,
            tarotArticles: true,
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
      tarotArticleCount: tag._count.tarotArticles,
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
            posts: true,
            tarotArticles: true,
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
      tarotArticleCount: tag._count.tarotArticles,
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
            posts: true,
            tarotArticles: true,
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
      tarotArticleCount: tag._count.tarotArticles,
    };
  }

  /**
   * Delete a tag
   * Note: Will fail if used by blog posts (only tarot associations are removed)
   */
  async deleteTag(id: string): Promise<void> {
    // Remove tarot article associations first
    await prisma.tarotArticleTag.deleteMany({
      where: { tagId: id },
    });

    // Delete the tag (will fail if blog posts use it)
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
