/**
 * Cloudflare Cache Purge Service
 *
 * Purges specific page URLs from the Cloudflare CDN cache when content is
 * updated via the admin. This removes the CDN-cached HTML layer of staleness
 * so the next visitor gets a fresh response from the origin.
 *
 * Requires env vars:
 *   CLOUDFLARE_ZONE_ID  — found in Cloudflare dashboard → zone overview
 *   CLOUDFLARE_API_TOKEN — scoped to "Cache Purge" permission only
 *
 * No-op if env vars are absent (safe for local dev / staging without CF).
 * Errors are always swallowed — a purge failure must never block a save.
 */

import { logger } from '../lib/logger.js';

const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4';
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const SITE_URL = (process.env.SITE_URL || 'https://celestiarcana.com').replace(/\/$/, '');

async function purgeUrls(urls: string[]): Promise<void> {
  if (!ZONE_ID || !API_TOKEN || urls.length === 0) return;

  try {
    const res = await fetch(`${CLOUDFLARE_API}/zones/${ZONE_ID}/purge_cache`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: urls }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.warn(`[Cloudflare] purge failed (${res.status}):`, body);
    }
  } catch (err) {
    logger.warn('[Cloudflare] purge error:', err);
  }
}

/**
 * Purge EN + FR tarot article pages for the given slug(s).
 * Pass both oldSlug and newSlug when a slug rename occurs.
 */
export function purgeTarotArticle(oldSlug: string, newSlug?: string): void {
  const slugs = new Set([oldSlug]);
  if (newSlug && newSlug !== oldSlug) slugs.add(newSlug);

  const urls: string[] = [];
  for (const slug of slugs) {
    urls.push(`${SITE_URL}/tarot/${slug}`, `${SITE_URL}/fr/tarot/${slug}`);
  }

  void purgeUrls(urls);
}

/**
 * Purge EN + FR blog post pages for the given slug(s).
 * Pass both oldSlug and newSlug when a slug rename occurs.
 */
export function purgeBlogPost(oldSlug: string, newSlug?: string): void {
  const slugs = new Set([oldSlug]);
  if (newSlug && newSlug !== oldSlug) slugs.add(newSlug);

  const urls: string[] = [];
  for (const slug of slugs) {
    urls.push(`${SITE_URL}/blog/${slug}`, `${SITE_URL}/fr/blog/${slug}`);
  }

  void purgeUrls(urls);
}
