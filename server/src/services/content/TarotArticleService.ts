/**
 * TarotArticleService
 *
 * Business logic for tarot article operations.
 * Handles CRUD, validation, schema generation, and caching.
 *
 * Now queries BlogPost table with contentType = 'TAROT_ARTICLE'.
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

// Types for tarot articles (API response shape)
export interface TarotArticle {
  id: string;
  title: string;
  titleFr?: string;
  slug: string;
  excerpt: string;
  excerptFr?: string;
  content: string;
  contentFr?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  cardType: string;
  cardNumber: string;
  categories: string[];
  tags: string[];
  deletedAt: Date | null;
  // SEO fields
  seoFocusKeyword?: string;
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  seoFocusKeywordFr?: string;
  seoMetaTitleFr?: string;
  seoMetaDescriptionFr?: string;
  [key: string]: unknown;
}

export interface TarotArticleListItem {
  id: string;
  title: string;
  titleFr?: string;
  slug: string;
  excerpt: string;
  excerptFr?: string;
  featuredImage: string;
  featuredImageAlt: string;
  featuredImageAltFr?: string;
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
 * Convert validated tarot data to BlogPost create data
 */
function tarotToBlogPostData(prismaData: ReturnType<typeof convertToPrismaFormatLenient>) {
  return {
    titleEn: prismaData.title,
    excerptEn: prismaData.excerpt,
    contentEn: prismaData.content,
    authorName: prismaData.author,
    coverImage: prismaData.featuredImage,
    coverImageAlt: prismaData.featuredImageAlt,
    readTimeMinutes:
      typeof prismaData.readTime === 'string'
        ? parseInt(prismaData.readTime.replace(/[^0-9]/g, ''), 10) || 5
        : 5,
    metaTitleEn: prismaData.seoMetaTitle,
    metaDescEn: prismaData.seoMetaDescription,
    seoFocusKeyword: prismaData.seoFocusKeyword,
    slug: prismaData.slug,
    cardType: prismaData.cardType,
    cardNumber: prismaData.cardNumber,
    element: prismaData.element,
    astrologicalCorrespondence: prismaData.astrologicalCorrespondence,
    isCourtCard: prismaData.isCourtCard,
    isChallengeCard: prismaData.isChallengeCard,
    relatedCards: prismaData.relatedCards,
    faq: prismaData.faq,
    breadcrumbCategory: prismaData.breadcrumbCategory,
    breadcrumbCategoryUrl: prismaData.breadcrumbCategoryUrl,
    datePublished: prismaData.datePublished,
    dateModified: prismaData.dateModified,
    status: prismaData.status as Prisma.EnumBlogPostStatusFieldUpdateOperationsInput['set'],
    contentType: 'TAROT_ARTICLE' as const,
  };
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
    titleEn: true,
    titleFr: true,
    slug: true,
    excerptEn: true,
    excerptFr: true,
    coverImage: true,
    coverImageAlt: true,
    coverImageAltFr: true,
    cardType: true,
    cardNumber: true,
    datePublished: true,
    readTimeMinutes: true,
    status: true,
  };

  // Include fields for full article with relations
  private fullIncludeFields = {
    categories: {
      include: { category: true },
    },
    tags: {
      include: { tag: true },
    },
  };

  // ============================================
  // Core CRUD Operations
  // ============================================

  async findById(id: string): Promise<TarotArticle | null> {
    const article = await prisma.blogPost.findFirst({
      where: { id, contentType: 'TAROT_ARTICLE' },
      include: this.fullIncludeFields,
    });

    if (!article) return null;

    return this.transformArticle(article);
  }

  async findBySlug(slug: string): Promise<TarotArticle | null> {
    // Check cache first
    const cached = await this.getCachedItem(slug);
    if (cached) return cached;

    const article = await prisma.blogPost.findFirst({
      where: {
        slug,
        contentType: 'TAROT_ARTICLE',
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

    const where: Prisma.BlogPostWhereInput = {
      contentType: 'TAROT_ARTICLE',
    };

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
        { titleEn: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: this.listSelectFields,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.blogPost.count({ where }),
    ]);

    return {
      items: articles.map(a => ({
        id: a.id,
        title: a.titleEn,
        titleFr: a.titleFr,
        slug: a.slug,
        excerpt: a.excerptEn,
        excerptFr: a.excerptFr,
        featuredImage: a.coverImage || '',
        featuredImageAlt: a.coverImageAlt || '',
        featuredImageAltFr: a.coverImageAltFr || '',
        cardType: a.cardType || '',
        cardNumber: a.cardNumber || '',
        status: a.status,
        datePublished: a.datePublished as Date,
        readTime: `${a.readTimeMinutes} min read`,
      })),
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
    const blogPostData = tarotToBlogPostData(prismaData);

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

    const article = await prisma.blogPost.create({
      data: {
        ...blogPostData,
        schemaJson: (schema as Prisma.InputJsonValue) || {},
        schemaHtml,
        status: 'DRAFT',
        contentType: 'TAROT_ARTICLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: this.fullIncludeFields,
    });

    await this.invalidateListCache();

    return this.transformArticle(article);
  }

  async update(id: string, data: TarotArticleUpdateInput): Promise<TarotArticle> {
    const existing = await prisma.blogPost.findFirst({
      where: { id, contentType: 'TAROT_ARTICLE' },
    });
    if (!existing) {
      throw new Error('Article not found');
    }

    const prismaData = convertToPrismaFormatLenient(
      data as Parameters<typeof convertToPrismaFormatLenient>[0]
    );
    const blogPostData = tarotToBlogPostData(prismaData);

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
      schemaHtml = existing.schemaHtml || '';
    }

    const article = await prisma.blogPost.update({
      where: { id },
      data: {
        ...blogPostData,
        schemaJson: schema
          ? (schema as Prisma.InputJsonValue)
          : ((existing.schemaJson as Prisma.InputJsonValue) ?? Prisma.JsonNull),
        schemaHtml: schemaHtml || existing.schemaHtml || '',
        updatedAt: new Date(),
      },
      include: this.fullIncludeFields,
    });

    await this.invalidateOnUpdate(existing.slug, blogPostData.slug);

    return this.transformArticle(article);
  }

  async softDelete(id: string): Promise<void> {
    const article = await prisma.blogPost.findFirst({
      where: { id, contentType: 'TAROT_ARTICLE' },
    });
    if (!article) {
      throw new Error('Article not found');
    }

    const timestamp = Date.now();
    const trashedSlug = `_deleted_${timestamp}_${article.slug}`;

    await prisma.blogPost.update({
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
    const article = await prisma.blogPost.findFirst({
      where: { id, contentType: 'TAROT_ARTICLE' },
    });
    if (!article) {
      throw new Error('Article not found');
    }

    if (!article.deletedAt) {
      throw new Error('Article is not in trash');
    }

    const originalSlug = article.originalSlug || article.slug.replace(/^_deleted_\d+_/, '');

    // Check if original slug is available
    const existingWithSlug = await prisma.blogPost.findFirst({
      where: {
        slug: originalSlug,
        id: { not: article.id },
      },
    });

    const restoredSlug = existingWithSlug ? `${originalSlug}-restored-${Date.now()}` : originalSlug;

    await prisma.blogPost.update({
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
    const article = await prisma.blogPost.findFirst({
      where: { id, contentType: 'TAROT_ARTICLE' },
    });
    if (!article) {
      throw new Error('Article not found');
    }

    if (!article.deletedAt) {
      throw new Error('Article must be in trash before permanent deletion');
    }

    // BlogPostCategory and BlogPostTag have onDelete: Cascade
    await prisma.blogPost.delete({ where: { id } });
  }

  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.blogPost.findFirst({
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
      titleEn: true,
      titleFr: true,
      slug: true,
      excerptEn: true,
      excerptFr: true,
      coverImage: true,
      coverImageAlt: true,
      coverImageAltFr: true,
      cardType: true,
      cardNumber: true,
      readTimeMinutes: true,
    };

    const baseWhere = {
      contentType: 'TAROT_ARTICLE' as const,
      status: 'PUBLISHED' as const,
      deletedAt: null,
    };

    const [majorArcana, wands, cups, swords, pentacles] = await Promise.all([
      prisma.blogPost.findMany({
        where: { ...baseWhere, cardType: 'MAJOR_ARCANA' },
        select: selectFields,
      }),
      prisma.blogPost.findMany({
        where: { ...baseWhere, cardType: 'SUIT_OF_WANDS' },
        select: selectFields,
      }),
      prisma.blogPost.findMany({
        where: { ...baseWhere, cardType: 'SUIT_OF_CUPS' },
        select: selectFields,
      }),
      prisma.blogPost.findMany({
        where: { ...baseWhere, cardType: 'SUIT_OF_SWORDS' },
        select: selectFields,
      }),
      prisma.blogPost.findMany({
        where: { ...baseWhere, cardType: 'SUIT_OF_PENTACLES' },
        select: selectFields,
      }),
    ]);

    const transformItems = (items: typeof majorArcana) =>
      sortByCardNumber(
        items.map(a => ({
          id: a.id,
          title: a.titleEn,
          titleFr: a.titleFr,
          slug: a.slug,
          excerpt: a.excerptEn,
          excerptFr: a.excerptFr,
          featuredImage: a.coverImage || '',
          featuredImageAlt: a.coverImageAlt || '',
          featuredImageAltFr: a.coverImageAltFr || '',
          cardType: a.cardType || '',
          cardNumber: a.cardNumber || '',
          readTime: `${a.readTimeMinutes} min read`,
          status: 'PUBLISHED',
          datePublished: new Date(),
        }))
      ) as unknown as TarotArticleListItem[];

    const result = {
      majorArcana: transformItems(majorArcana),
      wands: transformItems(wands),
      cups: transformItems(cups),
      swords: transformItems(swords),
      pentacles: transformItems(pentacles),
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
    const blogPostData = tarotToBlogPostData(prismaData);

    let schema: object | null = null;
    let schemaHtml = '';
    try {
      const schemaResult = processArticleSchema(warningsResult.data as TarotArticleData);
      schema = schemaResult.schema;
      schemaHtml = schemaResult.schemaHtml;
    } catch {
      warningsResult.warnings.push('[Schema] Could not generate structured data');
    }

    const article = await prisma.blogPost.create({
      data: {
        ...blogPostData,
        schemaJson: (schema as Prisma.InputJsonValue) || {},
        schemaHtml,
        status: 'DRAFT',
        contentType: 'TAROT_ARTICLE',
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
        title: article.titleEn,
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
    const article = await prisma.blogPost.findFirst({
      where: { id: articleId, contentType: 'TAROT_ARTICLE' },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.cardType !== cardType) {
      throw new Error(
        `Article cardType (${article.cardType}) does not match provided cardType (${cardType})`
      );
    }

    const articles = await prisma.blogPost.findMany({
      where: {
        contentType: 'TAROT_ARTICLE',
        cardType: cardType as Prisma.EnumCardTypeNullableFilter['equals'],
        deletedAt: null,
      },
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
        prisma.blogPost.update({
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
    // BlogPostCategory and BlogPostTag have onDelete: Cascade
    const result = await prisma.blogPost.deleteMany({
      where: { contentType: 'TAROT_ARTICLE', deletedAt: { not: null } },
    });

    return result.count;
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Transform Prisma BlogPost to TarotArticle service response format
   */
  private transformArticle(article: {
    id: string;
    titleEn: string;
    slug: string;
    excerptEn: string;
    contentEn: string;
    status: string;
    cardType: string | null;
    cardNumber: string | null;
    deletedAt: Date | null;
    categories?: Array<{
      category: { id: string; slug: string; nameEn: string; nameFr: string };
    }>;
    tags?: Array<{
      tag: { id: string; slug: string; nameEn: string; nameFr: string };
    }>;
    [key: string]: unknown;
  }): TarotArticle {
    return {
      ...article,
      title: article.titleEn,
      excerpt: article.excerptEn,
      content: article.contentEn,
      author: (article.authorName as string) || '',
      readTime: `${article.readTimeMinutes || 5} min read`,
      featuredImage: (article.coverImage as string) || '',
      featuredImageAlt: (article.coverImageAlt as string) || '',
      featuredImageAltFr: (article.coverImageAltFr as string) || '',
      seoFocusKeyword: (article.seoFocusKeyword as string) || '',
      seoMetaTitle: (article.metaTitleEn as string) || '',
      seoMetaDescription: (article.metaDescEn as string) || '',
      seoFocusKeywordFr: (article.seoFocusKeywordFr as string) || '',
      seoMetaTitleFr: (article.metaTitleFr as string) || '',
      seoMetaDescriptionFr: (article.metaDescFr as string) || '',
      status: article.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
      cardType: article.cardType || '',
      cardNumber: article.cardNumber || '',
      categories: [] as string[],
      tags: [] as string[],
      categoryObjects: article.categories?.map(ac => ({
        id: ac.category.id,
        slug: ac.category.slug,
        name: ac.category.nameEn,
        nameFr: ac.category.nameFr,
      })),
      tagObjects: article.tags?.map(at => ({
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
