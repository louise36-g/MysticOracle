/**
 * Shared utilities for tarot article routes
 *
 * After consolidation, tarot articles live in the BlogPost table
 * with contentType = 'TAROT_ARTICLE'. These helpers transform
 * BlogPost records into the TarotArticle API response shape.
 */

import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { cacheService, CacheService } from '../../services/cache.js';
import { sortByCardNumber } from '../../lib/tarot/sorting.js';
import { includeCategoriesAndTags } from '../shared/queryUtils.js';

// Re-export for use by route modules
export { prisma, cacheService, CacheService, z, sortByCardNumber };

// Canonical tarot card order (Major Arcana first, then suits)
const CARD_TYPE_ORDER: Record<string, number> = {
  MAJOR_ARCANA: 0,
  SUIT_OF_WANDS: 1,
  SUIT_OF_CUPS: 2,
  SUIT_OF_SWORDS: 3,
  SUIT_OF_PENTACLES: 4,
};

export interface AdjacentCard {
  slug: string;
  title: string;
  titleFr: string;
  featuredImage: string;
  cardType: string;
}

/**
 * Get prev/next tarot cards relative to the given slug.
 * Uses cached ordered list of all published tarot articles.
 */
export async function getAdjacentTarotCards(
  currentSlug: string
): Promise<{ prevCard: AdjacentCard | null; nextCard: AdjacentCard | null }> {
  const cacheKey = 'tarot:card-order';
  let cards = await cacheService.get<AdjacentCard[]>(cacheKey);

  if (!cards) {
    const rows = await prisma.blogPost.findMany({
      where: { contentType: 'TAROT_ARTICLE', status: 'PUBLISHED', deletedAt: null },
      select: {
        slug: true,
        titleEn: true,
        titleFr: true,
        coverImage: true,
        cardType: true,
        cardNumber: true,
        sortOrder: true,
        createdAt: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // Sort by canonical tarot order (enum sorts alphabetically, we need traditional order)
    rows.sort((a, b) => {
      const typeA = CARD_TYPE_ORDER[a.cardType || ''] ?? 99;
      const typeB = CARD_TYPE_ORDER[b.cardType || ''] ?? 99;
      if (typeA !== typeB) return typeA - typeB;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

    cards = rows.map(r => ({
      slug: r.slug,
      title: r.titleEn,
      titleFr: r.titleFr,
      featuredImage: r.coverImage || '',
      cardType: r.cardType || '',
    }));

    await cacheService.set(cacheKey, cards, 300); // 5 min cache
  }

  const idx = cards.findIndex(c => c.slug === currentSlug);
  if (idx === -1) return { prevCard: null, nextCard: null };

  return {
    prevCard: idx > 0 ? cards[idx - 1] : null,
    nextCard: idx < cards.length - 1 ? cards[idx + 1] : null,
  };
}

// Re-export shared include config under legacy name for backwards compatibility
export { includeCategoriesAndTags as articleFullInclude };

// Common select fields for article listings (maps BlogPost fields to TarotArticle response)
export const articleListSelect = {
  id: true,
  slug: true,
  titleEn: true,
  titleFr: true,
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

/**
 * Transform a BlogPost list item into the TarotArticle API response shape
 */
export function transformListItem(post: {
  id: string;
  slug: string;
  titleEn: string;
  titleFr: string;
  excerptEn: string;
  excerptFr: string;
  coverImage: string | null;
  coverImageAlt: string | null;
  coverImageAltFr: string | null;
  cardType: string | null;
  cardNumber: string | null;
  datePublished: Date | null;
  readTimeMinutes: number;
  status: string;
}) {
  return {
    id: post.id,
    title: post.titleEn,
    titleFr: post.titleFr,
    slug: post.slug,
    excerpt: post.excerptEn,
    excerptFr: post.excerptFr,
    featuredImage: post.coverImage || '',
    featuredImageAlt: post.coverImageAlt || '',
    featuredImageAltFr: post.coverImageAltFr || '',
    cardType: post.cardType || '',
    cardNumber: post.cardNumber || '',
    datePublished: post.datePublished,
    readTime: `${post.readTimeMinutes} min read`,
    status: post.status,
    // Legacy fields for API compatibility
    tags: [] as string[],
    categories: [] as string[],
  };
}

/**
 * Transform a full BlogPost (with relations) into the TarotArticle API response shape
 */
export function transformArticleResponse(post: {
  categories: Array<{
    category: { id: string; slug: string; nameEn: string; nameFr: string };
  }>;
  tags: Array<{
    tag: { id: string; slug: string; nameEn: string; nameFr: string };
  }>;
  [key: string]: unknown;
}) {
  const blogPost = post as Record<string, unknown>;

  return {
    ...mapBlogPostToTarotFields(blogPost),
    // Override the empty arrays from mapBlogPostToTarotFields with actual data
    categories: post.categories.map(c => c.category.nameEn),
    tags: post.tags.map(t => t.tag.nameEn),
    // Flatten junction table relations
    articleCategories: post.categories,
    articleTags: post.tags,
    categoryObjects: post.categories.map(ac => ({
      id: ac.category.id,
      slug: ac.category.slug,
      name: ac.category.nameEn,
      nameFr: ac.category.nameFr,
    })),
    tagObjects: post.tags.map(at => ({
      id: at.tag.id,
      slug: at.tag.slug,
      name: at.tag.nameEn,
      nameFr: at.tag.nameFr,
    })),
  };
}

/**
 * Map BlogPost field names back to the TarotArticle API field names.
 * Used by transformArticleResponse and inline response transforms in admin.ts.
 */
export function mapBlogPostToTarotFields(post: Record<string, unknown>) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.titleEn,
    titleFr: post.titleFr,
    excerpt: post.excerptEn,
    excerptFr: post.excerptFr,
    content: post.contentEn,
    contentFr: post.contentFr,
    author: post.authorName,
    readTime: `${post.readTimeMinutes || 5} min read`,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    featuredImage: post.coverImage || '',
    featuredImageAlt: post.coverImageAlt || '',
    featuredImageAltFr: post.coverImageAltFr || '',
    cardType: post.cardType,
    cardNumber: post.cardNumber,
    astrologicalCorrespondence: post.astrologicalCorrespondence,
    element: post.element,
    categories: [] as string[], // Legacy string arrays
    tags: [] as string[],
    seoFocusKeyword: post.seoFocusKeyword || '',
    seoMetaTitle: post.metaTitleEn || '',
    seoMetaDescription: post.metaDescEn || '',
    seoFocusKeywordFr: post.seoFocusKeywordFr || '',
    seoMetaTitleFr: post.metaTitleFr || '',
    seoMetaDescriptionFr: post.metaDescFr || '',
    faq: post.faq,
    breadcrumbCategory: post.breadcrumbCategory || '',
    breadcrumbCategoryUrl: post.breadcrumbCategoryUrl,
    relatedCards: post.relatedCards || [],
    isCourtCard: post.isCourtCard || false,
    isChallengeCard: post.isChallengeCard || false,
    schemaJson: post.schemaJson || {},
    schemaHtml: post.schemaHtml || '',
    status: post.status,
    publishedAt: post.publishedAt,
    deletedAt: post.deletedAt,
    originalSlug: post.originalSlug,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    sortOrder: post.sortOrder,
  };
}
