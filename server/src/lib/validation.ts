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
// CORE SCHEMA (blocking errors only)
// ============================================

/**
 * Core validation schema - only validates required fields.
 * These are blocking errors that must be fixed before saving.
 */
export const TarotArticleCoreSchema = z.object({
  // Required fields with minimal validation
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  content: z
    .string({ required_error: 'Content is required' })
    .min(100, 'Content must be at least 100 characters'),
  cardType: CardTypeEnum,
  cardNumber: z
    .string({ required_error: 'Card number is required' })
    .min(1, 'Card number is required'),
  element: ElementEnum,
  author: z.string({ required_error: 'Author is required' }).min(1, 'Author is required'),

  // Optional slug (will be auto-generated if not provided)
  slug: z.string().optional(),

  // All other fields are optional in core schema
  excerpt: z.string().optional(),
  readTime: z.string().optional(),
  datePublished: z.string().optional(),
  dateModified: z.string().optional(),
  featuredImage: z.string().optional(),
  featuredImageAlt: z.string().optional(),
  astrologicalCorrespondence: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  seo: z
    .object({
      focusKeyword: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
  faq: z
    .array(
      z.object({
        question: z.string().optional(),
        answer: z.string().optional(),
      })
    )
    .optional(),
  breadcrumbCategory: z.string().optional(),
  breadcrumbCategoryUrl: z.string().optional(),
  relatedCards: z.array(z.string()).optional(),
  isCourtCard: z.boolean().optional(),
  isChallengeCard: z.boolean().optional(),
  status: ArticleStatusEnum.optional(),
});

export type TarotArticleCoreInput = z.infer<typeof TarotArticleCoreSchema>;

// ============================================
// QUALITY WARNINGS SYSTEM
// ============================================

/**
 * Quality warning - non-blocking issue that should be reviewed
 */
export interface QualityWarning {
  field: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  currentValue?: string | number;
  recommendedRange?: { min?: number; max?: number };
}

/**
 * Check article quality and return warnings (non-blocking).
 * These are recommendations for SEO and content quality.
 */
export function checkArticleQuality(data: TarotArticleCoreInput): QualityWarning[] {
  const warnings: QualityWarning[] = [];

  // SEO Meta Title checks
  const metaTitle = data.seo?.metaTitle;
  if (metaTitle) {
    if (metaTitle.length > 60) {
      warnings.push({
        field: 'seo.metaTitle',
        message: 'Meta title exceeds 60 characters and may be truncated in search results',
        severity: 'warning',
        currentValue: metaTitle.length,
        recommendedRange: { min: 20, max: 60 },
      });
    } else if (metaTitle.length < 20) {
      warnings.push({
        field: 'seo.metaTitle',
        message: 'Meta title is shorter than recommended for SEO',
        severity: 'info',
        currentValue: metaTitle.length,
        recommendedRange: { min: 20, max: 60 },
      });
    }
  }

  // SEO Meta Description checks
  const metaDescription = data.seo?.metaDescription;
  if (metaDescription) {
    if (metaDescription.length > 155) {
      warnings.push({
        field: 'seo.metaDescription',
        message: 'Meta description exceeds 155 characters and may be truncated',
        severity: 'warning',
        currentValue: metaDescription.length,
        recommendedRange: { min: 50, max: 155 },
      });
    } else if (metaDescription.length < 50) {
      warnings.push({
        field: 'seo.metaDescription',
        message: 'Meta description is shorter than recommended for SEO',
        severity: 'info',
        currentValue: metaDescription.length,
        recommendedRange: { min: 50, max: 155 },
      });
    }
  }

  // Focus keyword checks
  const focusKeyword = data.seo?.focusKeyword;
  if (!focusKeyword || focusKeyword.length < 3) {
    warnings.push({
      field: 'seo.focusKeyword',
      message: focusKeyword ? 'Focus keyword is too short' : 'Focus keyword is missing',
      severity: 'warning',
      currentValue: focusKeyword?.length || 0,
      recommendedRange: { min: 3 },
    });
  }

  // Excerpt checks
  const excerpt = data.excerpt;
  if (!excerpt) {
    warnings.push({
      field: 'excerpt',
      message: 'Excerpt is missing - recommended for article previews',
      severity: 'warning',
    });
  } else if (excerpt.length < 50) {
    warnings.push({
      field: 'excerpt',
      message: 'Excerpt is shorter than recommended',
      severity: 'info',
      currentValue: excerpt.length,
      recommendedRange: { min: 50, max: 300 },
    });
  } else if (excerpt.length > 300) {
    warnings.push({
      field: 'excerpt',
      message: 'Excerpt exceeds recommended length',
      severity: 'info',
      currentValue: excerpt.length,
      recommendedRange: { min: 50, max: 300 },
    });
  }

  // Content length check for SEO
  const content = data.content || '';
  const contentLength = content.length;
  if (contentLength < 5000) {
    warnings.push({
      field: 'content',
      message: 'Content length may be insufficient for optimal SEO performance',
      severity: 'info',
      currentValue: contentLength,
      recommendedRange: { min: 5000 },
    });
  }

  // FAQ count checks
  const faqCount = data.faq?.length || 0;
  if (faqCount < 5) {
    warnings.push({
      field: 'faq',
      message: 'Fewer than 5 FAQ items - more FAQs improve search visibility',
      severity: 'warning',
      currentValue: faqCount,
      recommendedRange: { min: 5, max: 10 },
    });
  } else if (faqCount > 10) {
    warnings.push({
      field: 'faq',
      message: 'More than 10 FAQ items may dilute focus',
      severity: 'info',
      currentValue: faqCount,
      recommendedRange: { min: 5, max: 10 },
    });
  }

  // Tags count checks
  const tagsCount = data.tags?.length || 0;
  if (tagsCount < 3) {
    warnings.push({
      field: 'tags',
      message: 'Fewer than 3 tags - more tags improve discoverability',
      severity: 'warning',
      currentValue: tagsCount,
      recommendedRange: { min: 3, max: 10 },
    });
  } else if (tagsCount > 10) {
    warnings.push({
      field: 'tags',
      message: 'More than 10 tags may appear spammy',
      severity: 'info',
      currentValue: tagsCount,
      recommendedRange: { min: 3, max: 10 },
    });
  }

  // Categories count checks
  const categoriesCount = data.categories?.length || 0;
  if (categoriesCount < 1) {
    warnings.push({
      field: 'categories',
      message: 'No categories assigned - at least one category is recommended',
      severity: 'warning',
      currentValue: categoriesCount,
      recommendedRange: { min: 1, max: 5 },
    });
  } else if (categoriesCount > 5) {
    warnings.push({
      field: 'categories',
      message: 'More than 5 categories may dilute focus',
      severity: 'info',
      currentValue: categoriesCount,
      recommendedRange: { min: 1, max: 5 },
    });
  }

  // Featured image alt text checks
  const altText = data.featuredImageAlt;
  if (altText) {
    if (altText.length < 20) {
      warnings.push({
        field: 'featuredImageAlt',
        message: 'Alt text is too short for accessibility',
        severity: 'warning',
        currentValue: altText.length,
        recommendedRange: { min: 20 },
      });
    }
    if (altText.toLowerCase().startsWith('image of')) {
      warnings.push({
        field: 'featuredImageAlt',
        message: 'Alt text should not start with "image of" - describe the content directly',
        severity: 'info',
        currentValue: altText,
      });
    }
  }

  return warnings;
}

// ============================================
// COMBINED VALIDATION RESULT
// ============================================

/**
 * Combined validation result with errors, warnings, and stats
 */
export interface TarotArticleValidationResult {
  success: boolean;
  data?: TarotArticleCoreInput;
  errors?: string[];
  warnings: QualityWarning[];
  stats: {
    wordCount: number;
    faqCount: number;
    tagsCount: number;
    categoriesCount: number;
    contentLength: number;
  };
}

/**
 * Validate a tarot article with both core validation (blocking) and quality checks (warnings).
 *
 * @param input - Raw article data
 * @returns Validation result with errors (blocking) and warnings (non-blocking)
 */
export function validateTarotArticle(input: unknown): TarotArticleValidationResult {
  // Normalize keys from snake_case to camelCase
  const normalized = normalizeKeys(input);

  // Run core validation
  const coreResult = TarotArticleCoreSchema.safeParse(normalized);

  // Prepare stats
  const content = (normalized as any)?.content || '';
  const faq = (normalized as any)?.faq || [];
  const tags = (normalized as any)?.tags || [];
  const categories = (normalized as any)?.categories || [];

  const stats = {
    wordCount: getWordCount(content),
    faqCount: faq.length,
    tagsCount: tags.length,
    categoriesCount: categories.length,
    contentLength: content.length,
  };

  if (!coreResult.success) {
    // Extract error messages
    const errors = coreResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);

    return {
      success: false,
      errors,
      warnings: [],
      stats,
    };
  }

  // Run quality checks on validated data
  const warnings = checkArticleQuality(coreResult.data);

  return {
    success: true,
    data: coreResult.data,
    warnings,
    stats,
  };
}

// ============================================
// SUB-SCHEMAS (for strict validation)
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
  focusKeyword: z.string().min(5, 'Focus keyword required').max(100),
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
  title: z.string().min(10, 'Title too short').max(100, 'Title too long'),
  excerpt: z.string().min(50, 'Excerpt too short').max(300, 'Excerpt too long'),
  content: z.string().min(5000, 'Content too short (minimum ~2500 words)'),
  slug: z
    .string()
    .min(5)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
  author: z.string().min(2).max(100),
  readTime: z.string().regex(/^\d+\s*min\s*read$/i, 'Format: "X min read"'),

  // Dates (will be converted to Date objects for Prisma)
  datePublished: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  dateModified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),

  // Images
  featuredImage: z.string().min(1, 'Featured image URL required'),
  featuredImageAlt: z
    .string()
    .min(20, 'Alt text too short')
    .max(200, 'Alt text too long')
    .refine(
      alt => !alt.toLowerCase().startsWith('image of'),
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
// LENIENT SCHEMA (for force-save mode)
// ============================================

// Lenient sub-schemas with all fields optional
const FAQItemLenientSchema = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
});

const SEOLenientSchema = z.object({
  focusKeyword: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

// Lenient article schema - makes all fields optional for force-save
export const TarotArticleLenientSchema = z.object({
  // Content fields
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  slug: z.string().optional(),
  author: z.string().optional(),
  readTime: z.string().optional(),

  // Dates
  datePublished: z.string().optional(),
  dateModified: z.string().optional(),

  // Images
  featuredImage: z.string().optional(),
  featuredImageAlt: z.string().optional(),

  // Card metadata
  cardType: CardTypeEnum.optional(),
  cardNumber: z.string().optional(),
  astrologicalCorrespondence: z.string().optional(),
  element: ElementEnum.optional(),

  // Taxonomy
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),

  // SEO
  seo: SEOLenientSchema.optional(),

  // FAQ
  faq: z.array(FAQItemLenientSchema).optional(),

  // Breadcrumbs
  breadcrumbCategory: z.string().optional(),
  breadcrumbCategoryUrl: z.string().optional(),

  // Related content
  relatedCards: z.array(z.string()).optional(),

  // Flags
  isCourtCard: z.boolean().optional(),
  isChallengeCard: z.boolean().optional(),

  // Status
  status: ArticleStatusEnum.optional(),
});

export type TarotArticleLenientInput = z.infer<typeof TarotArticleLenientSchema>;

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
    errorMessages: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
  };
}

// ============================================
// CONTENT VALIDATION HELPERS
// ============================================

/**
 * Check if content has answer-first opening
 */
export function validateAnswerFirstOpening(content: string, cardName: string): boolean {
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

  return patterns.some(pattern => opening.includes(pattern));
}

/**
 * Estimate word count from HTML content
 */
export function getWordCount(content: string): number {
  const textOnly = content.replace(/<[^>]*>/g, ' ');
  const words = textOnly.split(/\s+/).filter(word => word.length > 0);
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
  return forbidden.filter(word => textOnly.includes(word));
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

  // Em dash check (warning only) - exclude blockquotes
  if (data.content.includes('—')) {
    // Remove blockquote content before checking for em dashes
    const contentWithoutBlockquotes = data.content.replace(
      /<blockquote[\s\S]*?<\/blockquote>/gi,
      ''
    );
    if (contentWithoutBlockquotes.includes('—')) {
      warnings.push('Content contains em dashes (—) which may affect readability');
    }
  }

  // Image URL check (warning only)
  try {
    new URL(data.featuredImage);
  } catch {
    warnings.push(
      'Featured image URL may not be valid - ensure it is a proper URL before publishing'
    );
  }

  // Answer-first check
  const name = cardName || data.title.split(':')[0].trim();
  const hasAnswerFirst = validateAnswerFirstOpening(data.content, name);
  if (!hasAnswerFirst) {
    warnings.push('Opening may not follow answer-first pattern');
  }

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
// WARNINGS-ONLY VALIDATION (for force-save mode)
// ============================================

export interface WarningsOnlyValidationResult {
  success: true; // Always succeeds in force-save mode
  data: TarotArticleLenientInput;
  warnings: string[];
  stats: {
    wordCount: number;
    faqCount: number;
    hasAnswerFirstOpening: boolean;
  };
}

/**
 * Validate article with all issues reported as warnings (non-blocking).
 * Used for force-save mode where we want to save despite validation issues.
 *
 * @param input - Raw article data
 * @param cardName - Optional card name for answer-first pattern check
 * @returns Always succeeds with warnings array and parsed data
 */
export function validateArticleWithWarnings(
  input: unknown,
  cardName?: string
): WarningsOnlyValidationResult {
  const warnings: string[] = [];

  // Normalize keys from snake_case to camelCase
  const normalized = normalizeKeys(input);

  // Run strict validation to collect all issues as warnings
  const strictResult = TarotArticleSchema.safeParse(normalized);
  if (!strictResult.success) {
    // Convert all validation errors to warnings
    for (const error of strictResult.error.errors) {
      const path = error.path.join('.');
      warnings.push(`[Schema] ${path}: ${error.message}`);
    }
  }

  // Run lenient validation to get parseable data
  const lenientResult = TarotArticleLenientSchema.safeParse(normalized);
  const data = lenientResult.success
    ? lenientResult.data
    : (normalized as TarotArticleLenientInput);

  // Content quality warnings
  const content = data.content || '';
  const wordCount = getWordCount(content);

  if (wordCount < 2500) {
    warnings.push(`[Content] Word count is ${wordCount}, target is 2500-3000`);
  }
  if (wordCount > 3500) {
    warnings.push(`[Content] Word count is ${wordCount}, may be too long`);
  }

  // Forbidden words check
  const forbiddenFound = checkForbiddenWords(content);
  if (forbiddenFound.length > 0) {
    warnings.push(`[Content] Forbidden words found: ${forbiddenFound.join(', ')}`);
  }

  // Em dash check (exclude blockquotes)
  if (content.includes('—')) {
    const contentWithoutBlockquotes = content.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '');
    if (contentWithoutBlockquotes.includes('—')) {
      warnings.push('[Content] Content contains em dashes (-) which may affect readability');
    }
  }

  // Answer-first pattern check
  const title = data.title || '';
  const name = cardName || title.split(':')[0].trim();
  const hasAnswerFirst = name && content ? validateAnswerFirstOpening(content, name) : false;
  if (content && !hasAnswerFirst) {
    warnings.push('[Content] Opening may not follow answer-first pattern');
  }

  // SEO warnings
  const seo = data.seo;
  if (seo) {
    if (seo.metaTitle && seo.metaTitle.length > 60) {
      warnings.push(`[SEO] Meta title is ${seo.metaTitle.length} characters, should be 60 or less`);
    }
    if (seo.metaDescription && seo.metaDescription.length > 155) {
      warnings.push(
        `[SEO] Meta description is ${seo.metaDescription.length} characters, should be 155 or less`
      );
    }
  }

  // FAQ count warning
  const faq = data.faq || [];
  const faqCount = faq.length;
  if (faqCount < 5) {
    warnings.push(`[FAQ] Only ${faqCount} FAQ items, minimum recommended is 5`);
  }

  // Tag count warning
  const tags = data.tags || [];
  if (tags.length < 3) {
    warnings.push(`[Tags] Only ${tags.length} tags, minimum recommended is 3`);
  }

  // Image URL check
  if (data.featuredImage) {
    try {
      new URL(data.featuredImage);
    } catch {
      warnings.push('[Image] Featured image URL may not be valid');
    }
  }

  return {
    success: true,
    data,
    warnings,
    stats: {
      wordCount,
      faqCount,
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

/**
 * Convert lenient article data to Prisma-compatible format.
 * Used for force-save mode where fields may be missing.
 * Provides defaults for required database fields.
 */
export function convertToPrismaFormatLenient(data: TarotArticleLenientInput) {
  const now = new Date();

  return {
    title: data.title || 'Untitled Article',
    slug: data.slug || `untitled-${Date.now()}`,
    excerpt: data.excerpt || '',
    content: data.content || '',
    author: data.author || 'Unknown',
    readTime: data.readTime || '5 min read',

    // Convert date strings to Date objects (with fallbacks)
    datePublished: data.datePublished ? new Date(data.datePublished) : now,
    dateModified: data.dateModified ? new Date(data.dateModified) : now,

    // Images
    featuredImage: data.featuredImage || '',
    featuredImageAlt: data.featuredImageAlt || '',

    // Card metadata - convert to Prisma enum keys
    cardType: data.cardType ? (mapCardTypeToPrisma(data.cardType) as any) : 'MAJOR_ARCANA',
    cardNumber: data.cardNumber || '0',
    astrologicalCorrespondence: data.astrologicalCorrespondence || '',
    element: data.element || 'FIRE',

    // Taxonomy (arrays)
    categories: data.categories || [],
    tags: data.tags || [],

    // SEO (flatten the nested object)
    seoFocusKeyword: data.seo?.focusKeyword || '',
    seoMetaTitle: data.seo?.metaTitle || '',
    seoMetaDescription: data.seo?.metaDescription || '',

    // FAQ (stored as JSON)
    faq: (data.faq || []) as any,

    // Breadcrumbs
    breadcrumbCategory: data.breadcrumbCategory || '',
    breadcrumbCategoryUrl: data.breadcrumbCategoryUrl,

    // Related content
    relatedCards: data.relatedCards || [],

    // Flags
    isCourtCard: data.isCourtCard || false,
    isChallengeCard: data.isChallengeCard || false,

    // Status (also needs mapping if provided)
    status: (data.status || 'DRAFT') as any,
  };
}
