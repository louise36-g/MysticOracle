/**
 * Shared Prisma query utilities for blog and tarot article routes.
 *
 * Centralises the repeated include configs and junction-table
 * flattening helpers so every consumer uses one source of truth.
 */

/**
 * Standard include config for categories and tags via junction tables.
 * Used by blog admin, blog public, and tarot article routes.
 */
export const includeCategoriesAndTags = {
  categories: {
    include: { category: true },
  },
  tags: {
    include: { tag: true },
  },
} as const;

/**
 * Flatten junction-table category relations to plain category objects.
 * Replaces: `post.categories.map(pc => pc.category)`
 */
export function flattenCategories<T>(categories: Array<{ category: T }>): T[] {
  return categories.map(pc => pc.category);
}

/**
 * Flatten junction-table tag relations to plain tag objects.
 * Replaces: `post.tags.map(pt => pt.tag)`
 */
export function flattenTags<T>(tags: Array<{ tag: T }>): T[] {
  return tags.map(pt => pt.tag);
}

/**
 * Extract category IDs from junction-table relations.
 * Replaces: `post.categories.map(c => c.categoryId)`
 */
export function extractCategoryIds(categories: Array<{ categoryId: string }>): string[] {
  return categories.map(c => c.categoryId);
}

/**
 * Extract tag IDs from junction-table relations.
 * Replaces: `post.tags.map(t => t.tagId)`
 */
export function extractTagIds(tags: Array<{ tagId: string }>): string[] {
  return tags.map(t => t.tagId);
}
