/**
 * TarotArticleService
 *
 * Business logic for tarot article operations.
 * Handles CRUD, validation, schema generation, and caching.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { CacheService } from '../cache.js';
import { ContentService, ListParams, PaginatedResult } from './ContentService.js';
import {
  validateTarotArticle,
  validateArticleWithWarnings,
  convertToPrismaFormatLenient,
} from '../../lib/validation.js';
import { processArticleSchema, type TarotArticleData } from '../../lib/schema-builder.js';
import { sortByCardNumber } from '../../lib/tarot/sorting.js';

// Types for tarot articles
export interface TarotArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  cardType: string;
  cardNumber: string;
  categories: string[];
  tags: string[];
  deletedAt: Date | null;
  [key: string]: unknown;
}

export interface TarotArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  featuredImageAlt: string;
  cardType: string;
  cardNumber: string;
  status: string;
  datePublished: Date;
  readTime: string;
}

export interface TarotArticleCreateInput {
  [key: string]: unknown;
}

export interface TarotArticleUpdateInput {
  [key: string]: unknown;
}

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    wordCount: number;
    faqCount: number;
    tagsCount: number;
    categoriesCount: number;
    contentLength: number;
  };
  data?: unknown;
  schema?: object | null;
}

export interface ImportResult {
  success: boolean;
  article?: {
    id: string;
    title: string;
    slug: string;
    status: string;
  };
  forceSaved?: boolean;
  errors?: string[];
  warnings: string[];
  stats?: ValidationResult['stats'];
}

/**
 * Service for tarot article operations
 */
export class TarotArticleService extends ContentService<
  TarotArticle,
  TarotArticleListItem,
  TarotArticleCreateInput,
  TarotArticleUpdateInput
> {
  protected cachePrefix = 'tarot';
  protected listCacheTTL = CacheService.TTL.ARTICLES;
  protected itemCacheTTL = CacheService.TTL.ARTICLE;

  // Select fields for list operations
  private listSelectFields = {
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    featuredImage: true,
    featuredImageAlt: true,
    cardType: true,
    cardNumber: true,
    datePublished: true,
    readTime: true,
    tags: true,
    categories: true,
    status: true,
  };

  // Include fields for full article with relations
  private fullIncludeFields = {
    articleCategories: {
      include: { category: true },
    },
    articleTags: {
      include: { tag: true },
    },
  };

  // ============================================
  // Core CRUD Operations
  // ============================================

  async findById(id: string): Promise<TarotArticle | null> {
    const article = await prisma.tarotArticle.findUnique({
      where: { id },
      include: this.fullIncludeFields,
    });

    if (!article) return null;

    return this.transformArticle(article);
  }

  async findBySlug(slug: string): Promise<TarotArticle | null> {
    // Check cache first
    const cached = await this.getCachedItem(slug);
    if (cached) return cached;

    const article = await prisma.tarotArticle.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: this.fullIncludeFields,
    });

    if (!article) return null;

    const transformed = this.transformArticle(article);
    await this.cacheItem(slug, transformed);

    return transformed;
  }

  async list(params: ListParams): Promise<PaginatedResult<TarotArticleListItem>> {
    const { page, limit, status, search, deleted } = params;

    const where: Prisma.TarotArticleWhereInput = {};

    // Filter by trash status
    if (deleted === true) {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.tarotArticle.findMany({
        where,
        select: this.listSelectFields,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.tarotArticle.count({ where }),
    ]);

    return {
      items: articles as unknown as TarotArticleListItem[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: TarotArticleCreateInput): Promise<TarotArticle> {
    const prismaData = convertToPrismaFormatLenient(
      data as Parameters<typeof convertToPrismaFormatLenient>[0]
    );

    // Generate schema
    let schema: object | null = null;
    let schemaHtml = '';
    try {
      const schemaResult = processArticleSchema(data as unknown as TarotArticleData);
      schema = schemaResult.schema;
      schemaHtml = schemaResult.schemaHtml;
    } catch {
      // Schema generation failed - continue without it
    }

    const article = await prisma.tarotArticle.create({
      data: {
        ...prismaData,
        schemaJson: (schema as Prisma.InputJsonValue) || {},
        schemaHtml,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: this.fullIncludeFields,
    });

    await this.invalidateListCache();

    return this.transformArticle(article);
  }

  async update(id: string, data: TarotArticleUpdateInput): Promise<TarotArticle> {
    const existing = await prisma.tarotArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Article not found');
    }

    const prismaData = convertToPrismaFormatLenient(
      data as Parameters<typeof convertToPrismaFormatLenient>[0]
    );

    // Generate schema
    let schema: object | null = null;
    let schemaHtml = '';
    try {
      const schemaResult = processArticleSchema(data as unknown as TarotArticleData);
      schema = schemaResult.schema;
      schemaHtml = schemaResult.schemaHtml;
    } catch {
      // Keep existing schema
      schema = existing.schemaJson as object;
      schemaHtml = existing.schemaHtml;
    }

    const article = await prisma.tarotArticle.update({
      where: { id },
      data: {
        ...prismaData,
        schemaJson: schema
          ? (schema as Prisma.InputJsonValue)
          : ((existing.schemaJson as Prisma.InputJsonValue) ?? Prisma.JsonNull),
        schemaHtml: schemaHtml || existing.schemaHtml,
        updatedAt: new Date(),
      },
      include: this.fullIncludeFields,
    });

    await this.invalidateOnUpdate(existing.slug, prismaData.slug);

    return this.transformArticle(article);
  }

  async softDelete(id: string): Promise<void> {
    const article = await prisma.tarotArticle.findUnique({ where: { id } });
    if (!article) {
      throw new Error('Article not found');
    }

    const timestamp = Date.now();
    const trashedSlug = `_deleted_${timestamp}_${article.slug}`;

    await prisma.tarotArticle.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        originalSlug: article.slug,
        slug: trashedSlug,
      },
    });

    await this.invalidateOnUpdate(article.slug);
  }

  async restore(id: string): Promise<{ slug: string }> {
    const article = await prisma.tarotArticle.findUnique({ where: { id } });
    if (!article) {
      throw new Error('Article not found');
    }

    if (!article.deletedAt) {
      throw new Error('Article is not in trash');
    }

    const originalSlug = article.originalSlug || article.slug.replace(/^_deleted_\d+_/, '');

    // Check if original slug is available
    const existingWithSlug = await prisma.tarotArticle.findFirst({
      where: {
        slug: originalSlug,
        id: { not: article.id },
      },
    });

    const restoredSlug = existingWithSlug ? `${originalSlug}-restored-${Date.now()}` : originalSlug;

    await prisma.tarotArticle.update({
      where: { id },
      data: {
        deletedAt: null,
        slug: restoredSlug,
        originalSlug: null,
      },
    });

    await this.invalidateListCache();

    return { slug: restoredSlug };
  }

  async permanentDelete(id: string): Promise<void> {
    const article = await prisma.tarotArticle.findUnique({ where: { id } });
    if (!article) {
      throw new Error('Article not found');
    }

    if (!article.deletedAt) {
      throw new Error('Article must be in trash before permanent deletion');
    }

    // Delete junction table entries first
    await prisma.tarotArticleCategory.deleteMany({ where: { articleId: id } });
    await prisma.tarotArticleTag.deleteMany({ where: { articleId: id } });

    await prisma.tarotArticle.delete({ where: { id } });
  }

  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.tarotArticle.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !existing;
  }

  // ============================================
  // Specialized Operations
  // ============================================

  /**
   * Get overview of all published articles grouped by card type
   */
  async getOverview(): Promise<{
    majorArcana: TarotArticleListItem[];
    wands: TarotArticleListItem[];
    cups: TarotArticleListItem[];
    swords: TarotArticleListItem[];
    pentacles: TarotArticleListItem[];
  }> {
    const cacheKey = `${this.cachePrefix}:overview`;
    const cached = (await this.getCachedItem(cacheKey)) as unknown;
    if (cached) {
      return cached as ReturnType<typeof this.getOverview> extends Promise<infer R> ? R : never;
    }

    const selectFields = {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      featuredImageAlt: true,
      cardType: true,
      cardNumber: true,
      readTime: true,
    };

    const [majorArcana, wands, cups, swords, pentacles] = await Promise.all([
      prisma.tarotArticle.findMany({
        where: { cardType: 'MAJOR_ARCANA', status: 'PUBLISHED', deletedAt: null },
        select: selectFields,
      }),
      prisma.tarotArticle.findMany({
        where: { cardType: 'SUIT_OF_WANDS', status: 'PUBLISHED', deletedAt: null },
        select: selectFields,
      }),
      prisma.tarotArticle.findMany({
        where: { cardType: 'SUIT_OF_CUPS', status: 'PUBLISHED', deletedAt: null },
        select: selectFields,
      }),
      prisma.tarotArticle.findMany({
        where: { cardType: 'SUIT_OF_SWORDS', status: 'PUBLISHED', deletedAt: null },
        select: selectFields,
      }),
      prisma.tarotArticle.findMany({
        where: { cardType: 'SUIT_OF_PENTACLES', status: 'PUBLISHED', deletedAt: null },
        select: selectFields,
      }),
    ]);

    const result = {
      majorArcana: sortByCardNumber(majorArcana) as unknown as TarotArticleListItem[],
      wands: sortByCardNumber(wands) as unknown as TarotArticleListItem[],
      cups: sortByCardNumber(cups) as unknown as TarotArticleListItem[],
      swords: sortByCardNumber(swords) as unknown as TarotArticleListItem[],
      pentacles: sortByCardNumber(pentacles) as unknown as TarotArticleListItem[],
    };

    await this.cacheItem(cacheKey, result as unknown as TarotArticle);

    return result;
  }

  /**
   * Validate article data without saving
   */
  validate(data: unknown): ValidationResult {
    const result = validateTarotArticle(data);
    const warningMessages = result.warnings.map(w => w.message);

    if (!result.success) {
      return {
        success: false,
        errors: result.errors || [],
        warnings: warningMessages,
        stats: result.stats,
        schema: null,
      };
    }

    // Generate schema preview
    let schema = null;
    try {
      const schemaResult = processArticleSchema(result.data as TarotArticleData);
      schema = schemaResult.schema;
    } catch {
      // Schema generation failed - not critical
    }

    return {
      success: true,
      errors: [],
      warnings: warningMessages,
      stats: result.stats,
      data: result.data,
      schema,
    };
  }

  /**
   * Import an article (with optional force mode)
   */
  async import(data: unknown, forceMode: boolean = false): Promise<ImportResult> {
    if (forceMode) {
      return this.forceImport(data);
    }

    const validationResult = this.validate(data);

    if (!validationResult.success || !validationResult.data) {
      return {
        success: false,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      };
    }

    const validatedData = validationResult.data as Record<string, unknown>;
    const slug = (validatedData.slug as string) || `article-${Date.now()}`;

    // Check slug availability
    if (!(await this.isSlugAvailable(slug))) {
      return {
        success: false,
        errors: [`Article with slug "${slug}" already exists`],
        warnings: validationResult.warnings,
      };
    }

    const article = await this.create({ ...validatedData, slug });

    return {
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
      },
      warnings: validationResult.warnings,
      stats: validationResult.stats,
    };
  }

  /**
   * Force import with warnings only (no blocking errors)
   */
  private async forceImport(data: unknown): Promise<ImportResult> {
    const warningsResult = validateArticleWithWarnings(data);
    const slug = warningsResult.data.slug;

    if (!slug) {
      return {
        success: false,
        errors: ['Slug is required even in force-save mode'],
        warnings: warningsResult.warnings,
      };
    }

    if (!(await this.isSlugAvailable(slug))) {
      return {
        success: false,
        errors: [`Article with slug "${slug}" already exists`],
        warnings: warningsResult.warnings,
      };
    }

    const prismaData = convertToPrismaFormatLenient(warningsResult.data);

    let schema: object | null = null;
    let schemaHtml = '';
    try {
      const schemaResult = processArticleSchema(warningsResult.data as TarotArticleData);
      schema = schemaResult.schema;
      schemaHtml = schemaResult.schemaHtml;
    } catch {
      warningsResult.warnings.push('[Schema] Could not generate structured data');
    }

    const article = await prisma.tarotArticle.create({
      data: {
        ...prismaData,
        schemaJson: (schema as Prisma.InputJsonValue) || {},
        schemaHtml,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.invalidateListCache();

    return {
      success: true,
      forceSaved: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
      },
      warnings: warningsResult.warnings,
      stats: {
        wordCount: warningsResult.stats.wordCount,
        faqCount: warningsResult.stats.faqCount,
        tagsCount: (warningsResult.data.tags || []).length,
        categoriesCount: (warningsResult.data.categories || []).length,
        contentLength: (warningsResult.data.content || '').length,
      },
    };
  }

  /**
   * Reorder an article within its card type
   */
  async reorder(articleId: string, cardType: string, newPosition: number): Promise<void> {
    const article = await prisma.tarotArticle.findUnique({ where: { id: articleId } });

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.cardType !== cardType) {
      throw new Error(
        `Article cardType (${article.cardType}) does not match provided cardType (${cardType})`
      );
    }

    const articles = await prisma.tarotArticle.findMany({
      where: { cardType: cardType as Prisma.EnumCardTypeFilter, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, sortOrder: true },
    });

    if (newPosition < 0 || newPosition >= articles.length) {
      throw new Error(`Invalid position: ${newPosition}`);
    }

    const oldIndex = articles.findIndex(a => a.id === articleId);
    if (oldIndex === -1) {
      throw new Error('Article not found in card type');
    }

    if (oldIndex === newPosition) {
      return; // No change needed
    }

    // Reorder
    const [movedArticle] = articles.splice(oldIndex, 1);
    articles.splice(newPosition, 0, movedArticle);

    // Update all positions in transaction
    await prisma.$transaction(
      articles.map((a, index) =>
        prisma.tarotArticle.update({
          where: { id: a.id },
          data: { sortOrder: index },
        })
      )
    );

    await this.invalidateListCache();
  }

  /**
   * Empty trash (permanently delete all trashed articles)
   */
  async emptyTrash(): Promise<number> {
    const trashedArticles = await prisma.tarotArticle.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true },
    });

    const articleIds = trashedArticles.map(a => a.id);

    // Delete junction entries first
    await prisma.tarotArticleCategory.deleteMany({
      where: { articleId: { in: articleIds } },
    });
    await prisma.tarotArticleTag.deleteMany({
      where: { articleId: { in: articleIds } },
    });

    const result = await prisma.tarotArticle.deleteMany({
      where: { deletedAt: { not: null } },
    });

    return result.count;
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Transform Prisma article to service response format
   */
  private transformArticle(article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    status: string;
    cardType: string;
    cardNumber: string;
    categories: unknown;
    tags: unknown;
    deletedAt: Date | null;
    articleCategories?: Array<{
      category: { id: string; slug: string; nameEn: string; nameFr: string };
    }>;
    articleTags?: Array<{
      tag: { id: string; slug: string; nameEn: string; nameFr: string };
    }>;
    [key: string]: unknown;
  }): TarotArticle {
    const categories = Array.isArray(article.categories) ? (article.categories as string[]) : [];
    const tags = Array.isArray(article.tags) ? (article.tags as string[]) : [];

    return {
      ...article,
      status: article.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
      categories,
      tags,
      categoryObjects: article.articleCategories?.map(ac => ({
        id: ac.category.id,
        slug: ac.category.slug,
        name: ac.category.nameEn,
        nameFr: ac.category.nameFr,
      })),
      tagObjects: article.articleTags?.map(at => ({
        id: at.tag.id,
        slug: at.tag.slug,
        name: at.tag.nameEn,
        nameFr: at.tag.nameFr,
      })),
    };
  }
}

// Singleton instance
export const tarotArticleService = new TarotArticleService();
