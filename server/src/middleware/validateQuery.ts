import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../shared/errors/ApplicationError.js';

/**
 * Middleware factory for validating query parameters
 * @param schema - Zod schema to validate against
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as Record<string, unknown>; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(
          new ValidationError('Invalid query parameters', {
            issues: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          })
        );
      } else {
        next(error);
      }
    }
  };
}

/**
 * Common query validation schemas
 */

// Pagination query parameters
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

// Search query parameters
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
  search: z.string().min(1).max(200).optional(),
});

// Sort order
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc').optional();

// Language parameter
export const languageQuerySchema = z.object({
  language: z.enum(['en', 'fr']).default('en').optional(),
});

// Status filter
export const statusQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'pending', 'all']).default('all').optional(),
});

// Date range filter
export const dateRangeQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Boolean filter (for featured, published, etc.)
export const booleanQuerySchema = (fieldName: string) =>
  z.object({
    [fieldName]: z
      .union([z.literal('true'), z.literal('false'), z.boolean()])
      .transform(val => val === 'true' || val === true)
      .optional(),
  });

// ID validation
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// Slug validation
export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
});

/**
 * Combined common schemas for typical list endpoints
 */
export const listQuerySchema = paginationQuerySchema.merge(searchQuerySchema);

export const listWithSortQuerySchema = listQuerySchema.merge(
  z.object({
    sortBy: z.string().optional(),
    sortOrder: sortOrderSchema,
  })
);

export const listWithFiltersQuerySchema = listWithSortQuerySchema
  .merge(statusQuerySchema)
  .merge(dateRangeQuerySchema);
