/**
 * Tarot Article Schema Generation Utilities
 *
 * Wrapper around schema-builder.ts that provides consistent error handling
 * and a simpler interface for generating JSON-LD schema.
 */

import { processArticleSchema, type TarotArticleData } from '../schema-builder.js';

export interface SchemaResult {
  success: boolean;
  schema: object | null;
  schemaHtml: string;
  error?: string;
}

/**
 * Generate JSON-LD schema for a tarot article with safe error handling
 *
 * @param article - The tarot article data
 * @returns SchemaResult with schema and HTML, or error info
 */
export function generateTarotSchema(article: TarotArticleData): SchemaResult {
  try {
    const { schema, schemaHtml } = processArticleSchema(article);
    return {
      success: true,
      schema,
      schemaHtml,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Schema generation failed';
    console.warn(`[Schema] Failed to generate schema for article: ${errorMessage}`);
    return {
      success: false,
      schema: null,
      schemaHtml: '',
      error: errorMessage,
    };
  }
}

/**
 * Generate schema and merge with existing article data
 * Returns the schema fields to update, or empty object if generation fails
 *
 * @param article - The tarot article data
 * @param existingSchema - Existing schema to fall back to on error
 * @param existingHtml - Existing HTML to fall back to on error
 * @returns Object with schemaJson and schemaHtml fields
 */
export function generateSchemaForUpdate(
  article: TarotArticleData,
  existingSchema?: object | null,
  existingHtml?: string | null
): { schemaJson: object; schemaHtml: string } {
  const result = generateTarotSchema(article);

  if (result.success && result.schema) {
    return {
      schemaJson: result.schema,
      schemaHtml: result.schemaHtml,
    };
  }

  // Fall back to existing values on error
  return {
    schemaJson: existingSchema || {},
    schemaHtml: existingHtml || '',
  };
}

// Re-export types for convenience
export type { TarotArticleData } from '../schema-builder.js';
