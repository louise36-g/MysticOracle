/**
 * Users Routes - Shared Utilities & Imports
 */

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../db/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { creditService, CREDIT_COSTS } from '../../services/CreditService.js';
import { AchievementService } from '../../services/AchievementService.js';
import { NotFoundError, ConflictError } from '../../shared/errors/ApplicationError.js';
import {
  parsePaginationParams,
  createPaginatedResponse,
} from '../../shared/pagination/pagination.js';
import { validateQuery, paginationQuerySchema } from '../../middleware/validateQuery.js';
import { debug, logger } from '../../lib/logger.js';
import { sendEmail } from '../../services/email.js';

// Create achievement service instance
export const achievementService = new AchievementService(prisma);

// Re-export commonly used imports
export {
  Router,
  z,
  prisma,
  requireAuth,
  creditService,
  CREDIT_COSTS,
  NotFoundError,
  ConflictError,
  parsePaginationParams,
  createPaginatedResponse,
  validateQuery,
  paginationQuerySchema,
  debug,
  logger,
  sendEmail,
};

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Withdrawal request validation schema
export const withdrawalRequestSchema = z.object({
  email: z.string().email(),
  orderReference: z.string().min(1, 'Order reference is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  reason: z.string().optional(),
});
