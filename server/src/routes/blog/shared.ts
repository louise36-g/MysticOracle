/**
 * Shared utilities for blog routes
 */

import { z } from 'zod';
import prisma from '../../db/prisma.js';
import cacheService, { CacheService } from '../../services/cache.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { ConflictError } from '../../shared/errors/ApplicationError.js';
import { processBlogContent } from '../../utils/urlReplacer.js';
import { debug } from '../../lib/logger.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Re-export for use by route modules
export {
  prisma,
  cacheService,
  CacheService,
  z,
  requireAuth,
  requireAdmin,
  ConflictError,
  processBlogContent,
  debug,
  multer,
  path,
  fs,
};

/**
 * Validate folder name to prevent path traversal attacks
 * - Rejects absolute paths
 * - Rejects path traversal attempts (..)
 * - Rejects path separators
 * - Only allows alphanumeric characters and hyphens
 */
export function validateFolder(folder: string): string {
  if (
    !folder ||
    path.isAbsolute(folder) ||
    folder.includes('..') ||
    folder.includes('/') ||
    folder.includes('\\')
  ) {
    return 'blog'; // Default to safe value
  }
  // Only allow alphanumeric and hyphens
  return folder.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'blog';
}

/**
 * Sanitize filename for safe storage
 * - Removes path separators and null bytes
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters except hyphens and dots
 * - Preserve extension
 */
export function sanitizeFilename(filename: string): string {
  // Security: Remove path separators and null bytes first
  if (filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
    filename = filename.replace(/[/\\\0]/g, '-');
  }

  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, path.extname(filename));

  const sanitized = base
    .toLowerCase()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/[^a-z0-9-]/g, '') // remove special chars
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // trim hyphens from ends

  return `${sanitized || 'image'}${ext}`;
}

/**
 * Get unique filename by appending number suffix if needed
 * - Has max iteration limit to prevent infinite loops
 */
export function getUniqueFilename(dir: string, filename: string): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);

  let finalName = filename;
  let counter = 1;
  const maxAttempts = 1000;

  while (fs.existsSync(path.join(dir, finalName)) && counter < maxAttempts) {
    finalName = `${base}-${counter}${ext}`;
    counter++;
  }

  // Fall back to timestamp-based uniqueness if max attempts reached
  if (counter >= maxAttempts) {
    finalName = `${base}-${Date.now()}${ext}`;
  }

  return finalName;
}

// Base uploads directory
export const baseUploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Configure multer for image uploads with folder support and original filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Get folder from request body, validate to prevent path traversal
      const folder = validateFolder((req.body?.folder as string) || 'blog');
      const folderPath = path.join(baseUploadDir, folder);

      // Create folder if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      cb(null, folderPath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    try {
      // Sanitize the original filename
      const sanitized = sanitizeFilename(file.originalname);

      // Get folder path for uniqueness check, validate to prevent path traversal
      const folder = validateFolder((req.body?.folder as string) || 'blog');
      const folderPath = path.join(baseUploadDir, folder);

      // Ensure folder exists before checking for unique filename
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Get unique filename (auto-rename if exists)
      const uniqueFilename = getUniqueFilename(folderPath, sanitized);

      cb(null, uniqueFilename);
    } catch (error) {
      cb(error as Error, '');
    }
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Memory-based storage for cloud uploads (Cloudinary, etc.)
const memoryStorage = multer.memoryStorage();

export const memoryUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Create post schema - use nullish() for optional fields to handle null from frontend
// Note: Only titleEn and authorName are required - all other language fields are optional
export const createPostSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  titleEn: z.string().min(1),
  titleFr: z
    .string()
    .nullish()
    .transform(v => v || ''),
  excerptEn: z
    .string()
    .nullish()
    .transform(v => v || ''),
  excerptFr: z
    .string()
    .nullish()
    .transform(v => v || ''),
  contentEn: z
    .string()
    .nullish()
    .transform(v => v || ''),
  contentFr: z
    .string()
    .nullish()
    .transform(v => v || ''),
  coverImage: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  coverImageAlt: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  metaTitleEn: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  metaTitleFr: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  metaDescEn: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  metaDescFr: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  ogImage: z
    .string()
    .nullish()
    .transform(v => v || undefined),
  authorName: z.string().min(1),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  readTimeMinutes: z.number().int().min(1).default(5),
  categoryIds: z
    .array(z.string())
    .nullish()
    .transform(v => v || []),
  tagIds: z
    .array(z.string())
    .nullish()
    .transform(v => v || []),
  faq: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .nullish()
    .transform(v => v || undefined),
  cta: z
    .object({
      heading: z.string(),
      text: z.string(),
      buttonText: z.string(),
      buttonUrl: z.string(),
    })
    .nullish()
    .transform(v => v || undefined),
});

// Schema for imported article
export const importArticleSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  author: z.string().optional(),
  read_time: z.union([z.string(), z.number()]).optional(),
  readTime: z.string().optional(), // Alternative field name
  image_alt_text: z.string().optional(),
  featuredImage: z.string().optional(),
  featuredImageAlt: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  seo_meta: z
    .object({
      focus_keyword: z.string().optional(),
      meta_title: z.string().optional(),
      meta_description: z.string().optional(),
      og_title: z.string().optional(),
      og_description: z.string().optional(),
    })
    .optional(),
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
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
  cta: z
    .object({
      heading: z.string(),
      text: z.string(),
      buttonText: z.string(),
      buttonUrl: z.string(),
    })
    .optional(),
});

// Default CTA for imported blog articles
export const DEFAULT_BLOG_CTA = {
  heading: 'Seeking Clarity?',
  text: 'Let the cards illuminate your path forward.',
  buttonText: 'Get a Tarot Reading',
  buttonUrl: '/reading',
};
