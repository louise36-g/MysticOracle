/**
 * Tarot Article Validation
 *
 * Unified validation interface for tarot articles.
 * Wraps the core validation functions and provides a simpler API.
 *
 * Note: Does NOT handle Prisma conversion - routes should use
 * convertToPrismaFormat/convertToPrismaFormatLenient directly.
 */

import {
  validateTarotArticle as coreValidate,
  validateArticleWithWarnings as lenientValidate,
  type TarotArticleValidationResult,
  type WarningsOnlyValidationResult,
  type TarotArticleCoreInput,
  type TarotArticleLenientInput,
} from '../validation.js';

/**
 * Unified validation result that can represent both strict and lenient validation
 */
export interface ValidationResult {
  /** Whether validation passed (strict mode) or data was parsed (lenient mode) */
  valid: boolean;
  /** Blocking errors that prevent saving (empty in lenient mode) */
  errors: string[];
  /** Non-blocking warnings about quality issues */
  warnings: string[];
  /** Parsed and normalized data (not converted to Prisma format) */
  data: TarotArticleCoreInput | TarotArticleLenientInput | null;
  /** Content statistics */
  stats: {
    wordCount: number;
    faqCount: number;
    tagsCount: number;
    categoriesCount: number;
    contentLength: number;
  };
}

/**
 * Validate a tarot article
 *
 * @param input - Raw article data from request body
 * @param options - Validation options
 * @returns Unified validation result (data NOT converted to Prisma format)
 */
export function validateTarotArticle(
  input: unknown,
  options: {
    /** If true, convert validation errors to warnings and always return valid=true */
    lenient?: boolean;
    /** Card name for answer-first pattern check (lenient mode only) */
    cardName?: string;
  } = {}
): ValidationResult {
  const { lenient = false, cardName } = options;

  if (lenient) {
    // Lenient mode: always valid, errors become warnings
    const result = lenientValidate(input, cardName);

    return {
      valid: true,
      errors: [],
      warnings: result.warnings,
      data: result.data,
      stats: {
        wordCount: result.stats.wordCount,
        faqCount: result.stats.faqCount,
        tagsCount: (result.data.tags || []).length,
        categoriesCount: (result.data.categories || []).length,
        contentLength: (result.data.content || '').length,
      },
    };
  }

  // Strict mode: errors are blocking
  const result = coreValidate(input);

  if (!result.success) {
    return {
      valid: false,
      errors: result.errors || [],
      warnings: result.warnings.map(w => `[${w.severity}] ${w.field}: ${w.message}`),
      data: null,
      stats: result.stats,
    };
  }

  // TypeScript doesn't narrow result.data after success check, so use explicit check
  const validatedData = result.data ?? null;

  return {
    valid: true,
    errors: [],
    warnings: result.warnings.map(w => `[${w.severity}] ${w.field}: ${w.message}`),
    data: validatedData,
    stats: result.stats,
  };
}

/**
 * Quick check if article has required fields for saving
 * Does not run full validation, just checks presence of critical fields
 */
export function hasRequiredFields(input: unknown): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  const data = input as Record<string, unknown> | null;

  if (!data) {
    return { valid: false, missing: ['data'] };
  }

  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    missing.push('title');
  }

  if (!data.slug || typeof data.slug !== 'string' || !data.slug.trim()) {
    missing.push('slug');
  }

  if (!data.content || typeof data.content !== 'string' || !data.content.trim()) {
    missing.push('content');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Re-export types for convenience
export type {
  TarotArticleValidationResult,
  WarningsOnlyValidationResult,
  TarotArticleCoreInput,
  TarotArticleLenientInput,
};

// Re-export conversion functions (routes should use these after validation)
export { convertToPrismaFormat, convertToPrismaFormatLenient } from '../validation.js';
