// lib/validation.ts
// Zod Validation Schemas for Tarot Article Import

import { z } from 'zod';

// ============================================
// ENUMS (matching Prisma schema)
// ============================================

// CardType enum values match Prisma @map values
export const CardTypeEnum = z.enum([
  'Major Arcana',
  'Suit of Wands',
  'Suit of Cups',
  'Suit of Swords',
  'Suit of Pentacles',
]);

// Element enum values match Prisma (uppercase)
export const ElementEnum = z.enum(['FIRE', 'WATER', 'AIR', 'EARTH']);

// ArticleStatus enum (for status field)
export const ArticleStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

// ============================================
// SUB-SCHEMAS
// ============================================

const FAQItemSchema = z.object({
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters')
    .max(200, 'Question must be under 200 characters'),
  answer: z
    .string()
    .min(20, 'Answer must be at least 20 characters')
    .max(1000, 'Answer must be under 1000 characters'),
});

const SEOSchema = z.object({
  focusKeyword: z
    .string()
    .min(5, 'Focus keyword required')
    .max(100),
  metaTitle: z
    .string()
    .min(20, 'Meta title too short')
    .max(60, 'Meta title must be 60 characters or less'),
  metaDescription: z
    .string()
    .min(50, 'Meta description too short')
    .max(155, 'Meta description must be 155 characters or less'),
});

// ============================================
// MAIN ARTICLE SCHEMA
// ============================================

export const TarotArticleSchema = z.object({
  // Content fields
  title: z
    .string()
    .min(10, 'Title too short')
    .max(100, 'Title too long'),
  excerpt: z
    .string()
    .min(50, 'Excerpt too short')
    .max(300, 'Excerpt too long'),
  content: z
    .string()
    .min(5000, 'Content too short (minimum ~2500 words)'),
  slug: z
    .string()
    .min(5)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase with hyphens only'
    ),
  author: z.string().min(2).max(100),
  readTime: z.string().regex(/^\d+\s*min\s*read$/i, 'Format: "X min read"'),

  // Dates (will be converted to Date objects for Prisma)
  datePublished: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  dateModified: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),

  // Images
  featuredImage: z.string().min(1, 'Featured image URL required'),
  featuredImageAlt: z
    .string()
    .min(20, 'Alt text too short')
    .max(200, 'Alt text too long')
    .refine(
      (alt) => !alt.toLowerCase().startsWith('image of'),
      'Alt text should not start with "image of"'
    ),

  // Card metadata
  cardType: CardTypeEnum,
  cardNumber: z.string().min(1).max(20),
  astrologicalCorrespondence: z.string().min(2).max(50),
  element: ElementEnum,

  // Taxonomy (stored as string arrays in Prisma)
  categories: z.array(z.string()).min(1).max(5),
  tags: z.array(z.string()).min(3).max(10),

  // SEO
  seo: SEOSchema,

  // FAQ (critical for GEO) - stored as JSON in Prisma
  faq: z
    .array(FAQItemSchema)
    .min(5, 'Must have at least 5 FAQ items')
    .max(10, 'Maximum 10 FAQ items'),

  // Breadcrumbs
  breadcrumbCategory: z.string().min(2).max(50),
  breadcrumbCategoryUrl: z.string().optional(),

  // Related content (stored as string array in Prisma)
  relatedCards: z.array(z.string()).max(10).optional(),

  // Flags
  isCourtCard: z.boolean().default(false),
  isChallengeCard: z.boolean().default(false),

  // Status (optional, defaults to DRAFT in Prisma)
  status: ArticleStatusEnum.optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type TarotArticleInput = z.infer<typeof TarotArticleSchema>;
export type FAQItem = z.infer<typeof FAQItemSchema>;
export type SEOInput = z.infer<typeof SEOSchema>;
export type CardType = z.infer<typeof CardTypeEnum>;
export type Element = z.infer<typeof ElementEnum>;
export type ArticleStatus = z.infer<typeof ArticleStatusEnum>;

// ============================================
// VALIDATION FUNCTION
// ============================================

export interface ValidationResult {
  success: boolean;
  data?: TarotArticleInput;
  errors?: z.ZodError['errors'];
  errorMessages?: string[];
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively convert object keys from snake_case to camelCase
 */
function normalizeKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(normalizeKeys);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = toCamelCase(key);
      acc[camelKey] = normalizeKeys(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}

export function validateArticle(input: unknown): ValidationResult {
  // Normalize keys from snake_case to camelCase
  const normalized = normalizeKeys(input);

  const result = TarotArticleSchema.safeParse(normalized);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: result.error.errors,
    errorMessages: result.error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    ),
  };
}

// ============================================
// CONTENT VALIDATION HELPERS
// ============================================

/**
 * Check if content has answer-first opening
 */
export function validateAnswerFirstOpening(
  content: string,
  cardName: string
): boolean {
  // Get first ~80 words
  const firstParagraph = content.split('</p>')[0] || '';
  const textOnly = firstParagraph.replace(/<[^>]*>/g, '').trim();
  const words = textOnly.split(/\s+/).slice(0, 80);
  const opening = words.join(' ').toLowerCase();

  // Check for direct meaning patterns
  const patterns = [
    `${cardName.toLowerCase()} represents`,
    `${cardName.toLowerCase()} stands for`,
    `${cardName.toLowerCase()} signifies`,
    `${cardName.toLowerCase()} means`,
    `${cardName.toLowerCase()} symbolizes`,
  ];

  return patterns.some((pattern) => opening.includes(pattern));
}

/**
 * Estimate word count from HTML content
 */
export function getWordCount(content: string): number {
  const textOnly = content.replace(/<[^>]*>/g, ' ');
  const words = textOnly.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

/**
 * Check for forbidden words in content
 * These are AI-generated clichés to avoid
 */
export function checkForbiddenWords(content: string): string[] {
  const forbidden = [
    'transmute',
    'ethereal',
    'precipice',
    'myriad',
    'delve',
    'realm',
    'embark',
    'unveil',
    'unravel',
    'resonate',
    'harness',
    'catalyst',
    'conduit',
  ];

  const textOnly = content.toLowerCase().replace(/<[^>]*>/g, ' ');
  return forbidden.filter((word) => textOnly.includes(word));
}

/**
 * Extended validation with content quality checks
 */
export interface ExtendedValidationResult extends ValidationResult {
  warnings?: string[];
  stats?: {
    wordCount: number;
    faqCount: number;
    hasAnswerFirstOpening: boolean;
  };
}

export function validateArticleExtended(
  input: unknown,
  cardName?: string
): ExtendedValidationResult {
  const baseResult = validateArticle(input);

  if (!baseResult.success || !baseResult.data) {
    return baseResult;
  }

  const data = baseResult.data;
  const warnings: string[] = [];

  // Word count check
  const wordCount = getWordCount(data.content);
  if (wordCount < 2500) {
    warnings.push(`Word count is ${wordCount}, target is 2500-3000`);
  }
  if (wordCount > 3500) {
    warnings.push(`Word count is ${wordCount}, may be too long`);
  }

  // Forbidden words check
  const forbiddenFound = checkForbiddenWords(data.content);
  if (forbiddenFound.length > 0) {
    warnings.push(`Forbidden words found: ${forbiddenFound.join(', ')}`);
  }

  // Em dash check (warning only)
  if (data.content.includes('—')) {
    warnings.push('Content contains em dashes (—) which may affect readability');
  }

  // Image URL check (warning only)
  try {
    new URL(data.featuredImage);
  } catch {
    warnings.push('Featured image URL may not be valid - ensure it is a proper URL before publishing');
  }

  // Answer-first check
  const name = cardName || data.title.split(':')[0].trim();
  const hasAnswerFirst = validateAnswerFirstOpening(data.content, name);
  if (!hasAnswerFirst) {
    warnings.push('Opening may not follow answer-first pattern');
  }

  // FAQ answer quality check
  data.faq.forEach((item, index) => {
    const firstWord = item.answer.split(' ')[0].toLowerCase();
    const delayedStarts = ['when', 'if', 'as', 'in', 'for'];
    if (delayedStarts.includes(firstWord)) {
      warnings.push(`FAQ ${index + 1} may not start with direct answer`);
    }
  });

  return {
    ...baseResult,
    warnings: warnings.length > 0 ? warnings : undefined,
    stats: {
      wordCount,
      faqCount: data.faq.length,
      hasAnswerFirstOpening: hasAnswerFirst,
    },
  };
}

// ============================================
// HELPER: Convert validated data to Prisma format
// ============================================

/**
 * Map display names to Prisma enum keys
 * Prisma uses @map which stores display names in DB but uses enum keys in TypeScript
 */
function mapCardTypeToPrisma(cardType: CardType): string {
  const mapping: Record<string, string> = {
    'Major Arcana': 'MAJOR_ARCANA',
    'Suit of Wands': 'SUIT_OF_WANDS',
    'Suit of Cups': 'SUIT_OF_CUPS',
    'Suit of Swords': 'SUIT_OF_SWORDS',
    'Suit of Pentacles': 'SUIT_OF_PENTACLES',
  };
  return mapping[cardType] || cardType;
}

/**
 * Convert validated article data to Prisma-compatible format
 */
export function convertToPrismaFormat(data: TarotArticleInput) {
  return {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    author: data.author,
    readTime: data.readTime,

    // Convert date strings to Date objects
    datePublished: new Date(data.datePublished),
    dateModified: new Date(data.dateModified),

    // Images
    featuredImage: data.featuredImage,
    featuredImageAlt: data.featuredImageAlt,

    // Card metadata - convert to Prisma enum keys
    cardType: mapCardTypeToPrisma(data.cardType) as any,
    cardNumber: data.cardNumber,
    astrologicalCorrespondence: data.astrologicalCorrespondence,
    element: data.element, // Element enum doesn't use @map, so no conversion needed

    // Taxonomy (arrays)
    categories: data.categories,
    tags: data.tags,

    // SEO (flatten the nested object)
    seoFocusKeyword: data.seo.focusKeyword,
    seoMetaTitle: data.seo.metaTitle,
    seoMetaDescription: data.seo.metaDescription,

    // FAQ (stored as JSON)
    faq: data.faq as any,

    // Breadcrumbs
    breadcrumbCategory: data.breadcrumbCategory,
    breadcrumbCategoryUrl: data.breadcrumbCategoryUrl,

    // Related content
    relatedCards: data.relatedCards || [],

    // Flags
    isCourtCard: data.isCourtCard,
    isChallengeCard: data.isChallengeCard,

    // Status (also needs mapping if provided)
    status: (data.status || 'DRAFT') as any,
  };
}
