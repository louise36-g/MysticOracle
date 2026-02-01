/**
 * Admin Routes - Shared utilities and imports
 */

import { z } from 'zod';

// Re-export commonly used imports
export { Router } from 'express';
export { z } from 'zod';
export { Prisma } from '@prisma/client';
export { default as prisma } from '../../db/prisma.js';
export { requireAuth, requireAdmin } from '../../middleware/auth.js';
export { default as cacheService } from '../../services/cache.js';
export { clearAISettingsCache } from '../../services/aiSettings.js';
export { creditService } from '../../services/CreditService.js';

// ============================================
// SHARED SCHEMAS
// ============================================

export const listUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'FLAGGED', 'SUSPENDED']).optional(),
  sortBy: z.enum(['createdAt', 'credits', 'totalReadings', 'username']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'FLAGGED', 'SUSPENDED']),
});

export const adjustCreditsSchema = z.object({
  amount: z.number().int(),
  reason: z.string().min(1),
});

export const createPackageSchema = z.object({
  credits: z.number().int().min(1),
  priceEur: z.number().min(0.01),
  nameEn: z.string().min(1),
  nameFr: z.string().min(1),
  labelEn: z.string().default(''),
  labelFr: z.string().default(''),
  discount: z.number().int().min(0).max(100).default(0),
  badge: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updatePackageSchema = z.object({
  credits: z.number().int().min(1).optional(),
  priceEur: z.number().min(0.01).optional(),
  nameEn: z.string().min(1).optional(),
  nameFr: z.string().min(1).optional(),
  labelEn: z.string().optional(),
  labelFr: z.string().optional(),
  discount: z.number().int().min(0).max(100).optional(),
  badge: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const createTemplateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z_]+$/, 'Slug must be lowercase with underscores only'),
  subjectEn: z.string().min(1),
  bodyEn: z.string().min(1),
  subjectFr: z.string().min(1),
  bodyFr: z.string().min(1),
  isActive: z.boolean().default(true),
});

export const updateTemplateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z_]+$/, 'Slug must be lowercase with underscores only')
    .optional(),
  subjectEn: z.string().min(1).optional(),
  bodyEn: z.string().min(1).optional(),
  subjectFr: z.string().min(1).optional(),
  bodyFr: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});
