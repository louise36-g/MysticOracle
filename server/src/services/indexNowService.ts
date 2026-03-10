/**
 * IndexNow Service
 *
 * Pings Bing, Yandex, and other search engines instantly when content
 * is published or updated. No waiting for sitemap crawls.
 *
 * https://www.indexnow.org/
 */

import { logger } from '../lib/logger.js';

const INDEXNOW_KEY = '0fff020c2107187e39912aefeea1f996';
const SITE_URL = process.env.FRONTEND_URL || 'https://celestiarcana.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * Submit a single URL to IndexNow
 */
async function submitUrl(urlPath: string): Promise<void> {
  const fullUrl = `${SITE_URL}${urlPath}`;

  try {
    const response = await fetch(
      `${INDEXNOW_ENDPOINT}?url=${encodeURIComponent(fullUrl)}&key=${INDEXNOW_KEY}`
    );

    if (response.ok || response.status === 202) {
      logger.info(`[IndexNow] Submitted: ${fullUrl}`);
    } else {
      logger.warn(`[IndexNow] Unexpected status ${response.status} for ${fullUrl}`);
    }
  } catch (error) {
    // Non-blocking — don't let IndexNow failures affect publishing
    logger.warn(
      `[IndexNow] Failed to submit ${fullUrl}:`,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Submit multiple URLs to IndexNow in a single batch request
 */
async function submitUrls(urlPaths: string[]): Promise<void> {
  if (urlPaths.length === 0) return;

  const fullUrls = urlPaths.map(p => `${SITE_URL}${p}`);

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: new URL(SITE_URL).hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: fullUrls,
      }),
    });

    if (response.ok || response.status === 202) {
      logger.info(`[IndexNow] Batch submitted ${fullUrls.length} URLs`);
    } else {
      logger.warn(`[IndexNow] Batch submit status ${response.status}`);
    }
  } catch (error) {
    logger.warn(
      `[IndexNow] Batch submit failed:`,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Notify IndexNow that a blog post was published or updated
 */
export function notifyBlogPost(slug: string): void {
  // Fire and forget — don't await
  submitUrl(`/blog/${slug}`).catch(() => {});
}

/**
 * Notify IndexNow that a tarot article was published or updated
 */
export function notifyTarotArticle(slug: string): void {
  submitUrl(`/tarot/${slug}`).catch(() => {});
}

/**
 * Notify IndexNow about multiple URLs (e.g., after bulk import)
 */
export function notifyBatch(urlPaths: string[]): void {
  submitUrls(urlPaths).catch(() => {});
}

export default {
  notifyBlogPost,
  notifyTarotArticle,
  notifyBatch,
};
