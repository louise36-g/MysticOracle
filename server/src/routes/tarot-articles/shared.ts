/**
 * Shared utilities for tarot article routes
 */

import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { cacheService, CacheService } from '../../services/cache.js';
import { sortByCardNumber } from '../../lib/tarot/sorting.js';

// Re-export for use by route modules
export { prisma, cacheService, CacheService, z, sortByCardNumber };

// Common select fields for article listings
export const articleListFields = {
  id: true,
  title: true,
  titleFr: true,
  slug: true,
  excerpt: true,
  excerptFr: true,
  featuredImage: true,
  featuredImageAlt: true,
  featuredImageAltFr: true,
  cardType: true,
  cardNumber: true,
  datePublished: true,
  readTime: true,
  tags: true,
  categories: true,
  status: true,
};

// Full article fields including relations
export const articleFullFields = {
  articleCategories: {
    include: { category: true },
  },
  articleTags: {
    include: { tag: true },
  },
};

// Transform article to include flattened category/tag objects
export function transformArticleResponse(article: {
  articleCategories: Array<{
    category: { id: string; slug: string; nameEn: string; nameFr: string };
  }>;
  articleTags: Array<{
    tag: { id: string; slug: string; nameEn: string; nameFr: string };
  }>;
  [key: string]: unknown;
}) {
  return {
    ...article,
    categoryObjects: article.articleCategories.map(ac => ({
      id: ac.category.id,
      slug: ac.category.slug,
      name: ac.category.nameEn,
      nameFr: ac.category.nameFr,
    })),
    tagObjects: article.articleTags.map(at => ({
      id: at.tag.id,
      slug: at.tag.slug,
      name: at.tag.nameEn,
      nameFr: at.tag.nameFr,
    })),
  };
}
