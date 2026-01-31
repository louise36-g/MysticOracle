/**
 * Translations Routes - Shared utilities and types
 */

import prisma from '../../db/prisma.js';
import cacheService from '../../services/cache.js';

// Types for cached translation data
export interface CachedLanguage {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
}

export interface TranslationsResponse {
  translations: Record<string, string>;
  version: number;
}

// Helper to invalidate translation caches and bump version
export async function invalidateTranslationCache(): Promise<void> {
  await Promise.all([
    cacheService.flushPattern('translations:'),
    prisma.cacheVersion.upsert({
      where: { entity: 'translations' },
      create: { entity: 'translations', version: 1 },
      update: { version: { increment: 1 } },
    }),
  ]);
}
