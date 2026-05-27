/**
 * Image Audit Script — Tarot Articles
 *
 * Checks every image URL across all published tarot articles:
 *   - coverImage (featured image)
 *   - ogImage (Open Graph override, if set)
 *   - All <img src="..."> embedded in contentEn
 *   - All <img src="..."> embedded in contentFr
 *
 * Flags:
 *   - Articles with NO coverImage set at all
 *   - Any URL that returns non-2xx (broken/deleted/wrong path)
 *   - Any URL that times out
 *
 * Usage (from server/ directory):
 *   npx tsx --env-file=.env scripts/audit-images.ts
 */

import pg from 'pg';
import * as https from 'https';
import * as http from 'http';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArticleRow {
  id: string;
  slug: string;
  titleEn: string;
  coverImage: string | null;
  ogImage: string | null;
  contentEn: string;
  contentFr: string;
}

interface ImageCheck {
  articleSlug: string;
  articleTitle: string;
  field: string;
  url: string;
}

interface BrokenImage extends ImageCheck {
  status: number | string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pull every src= value out of an HTML string */
function extractImgSrcs(html: string): string[] {
  if (!html) return [];
  const urls: string[] = [];
  const regex = /<img[^>]+src="([^"]+)"/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

/** HEAD request — resolves to HTTP status code, 'TIMEOUT', or 'ERROR: ...' */
function headRequest(url: string): Promise<number | string> {
  return new Promise(resolve => {
    try {
      const mod = url.startsWith('https') ? https : http;
      const req = mod.request(url, { method: 'HEAD', timeout: 12000 }, res => {
        // Drain the response so the socket is released
        res.resume();
        resolve(res.statusCode ?? 0);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve('TIMEOUT');
      });
      req.on('error', err => resolve(`ERROR: ${err.message}`));
      req.end();
    } catch (err) {
      resolve(`ERROR: ${String(err)}`);
    }
  });
}

/** Run an array of async tasks in batches */
async function inBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
  onBatchDone?: (done: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    onBatchDone?.(Math.min(i + batchSize, items.length), items.length);
    // Small pause between batches — be polite to Cloudinary
    if (i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, 150));
    }
  }
  return results;
}

function isOk(status: number | string): boolean {
  return status === 200 || status === 301 || status === 302 || status === 206;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log('\n🔍  Fetching all published tarot articles…\n');

  const { rows } = await pool.query<ArticleRow>(`
    SELECT
      id,
      slug,
      "titleEn",
      "coverImage",
      "ogImage",
      "contentEn",
      "contentFr"
    FROM "BlogPost"
    WHERE "contentType" = 'TAROT_ARTICLE'
      AND status       = 'PUBLISHED'
      AND "deletedAt"  IS NULL
    ORDER BY "titleEn"
  `);

  console.log(`Found ${rows.length} published tarot articles.\n`);

  // ── 1. Collect all checks ──────────────────────────────────────────────────

  const noCoverImage: string[] = [];
  const checks: ImageCheck[] = [];

  for (const article of rows) {
    const { slug, titleEn: title, coverImage, ogImage, contentEn, contentFr } = article;

    if (!coverImage) {
      noCoverImage.push(`${title}  (${slug})`);
    } else {
      checks.push({ articleSlug: slug, articleTitle: title, field: 'coverImage', url: coverImage });
    }

    if (ogImage) {
      checks.push({ articleSlug: slug, articleTitle: title, field: 'ogImage', url: ogImage });
    }

    for (const url of extractImgSrcs(contentEn)) {
      checks.push({ articleSlug: slug, articleTitle: title, field: 'contentEn <img>', url });
    }

    for (const url of extractImgSrcs(contentFr)) {
      checks.push({ articleSlug: slug, articleTitle: title, field: 'contentFr <img>', url });
    }
  }

  // ── 2. Deduplicate URLs (but retain all article associations) ───────────────

  const urlMap = new Map<string, ImageCheck[]>();
  for (const check of checks) {
    const list = urlMap.get(check.url) ?? [];
    list.push(check);
    urlMap.set(check.url, list);
  }

  const uniqueUrls = [...urlMap.keys()];
  console.log(`Total image references : ${checks.length}`);
  console.log(`Unique URLs to verify  : ${uniqueUrls.length}\n`);
  console.log('Checking…  (each dot = 1 OK, ✗ = broken)\n');

  // ── 3. Check every URL ──────────────────────────────────────────────────────

  let dotCount = 0;
  const statusMap = new Map<string, number | string>();

  await inBatches(uniqueUrls, 10, async url => {
    const status = await headRequest(url);
    statusMap.set(url, status);

    if (isOk(status)) {
      process.stdout.write('.');
      dotCount++;
      if (dotCount % 60 === 0) process.stdout.write('\n');
    } else {
      process.stdout.write('✗');
    }

    return status;
  });

  process.stdout.write('\n');

  // ── 4. Collate broken images ───────────────────────────────────────────────

  const broken: BrokenImage[] = [];
  for (const [url, articleChecks] of urlMap.entries()) {
    const status = statusMap.get(url)!;
    if (!isOk(status)) {
      for (const check of articleChecks) {
        broken.push({ ...check, status });
      }
    }
  }

  // ── 5. Report ──────────────────────────────────────────────────────────────

  const divider = '─'.repeat(60);
  console.log(`\n${divider}`);
  console.log('  IMAGE AUDIT RESULTS');
  console.log(divider);
  console.log(`  Articles checked   : ${rows.length}`);
  console.log(`  Unique URLs tested : ${uniqueUrls.length}`);
  console.log(`  Missing coverImage : ${noCoverImage.length}`);
  console.log(`  Broken URLs        : ${broken.length}`);
  console.log(divider);

  if (noCoverImage.length > 0) {
    console.log('\n⚠️   ARTICLES WITH NO COVER IMAGE SET:\n');
    for (const entry of noCoverImage) {
      console.log(`  • ${entry}`);
    }
  }

  if (broken.length > 0) {
    console.log('\n❌  BROKEN IMAGE URLs:\n');

    // Group by article for readability
    const byArticle = new Map<string, BrokenImage[]>();
    for (const b of broken) {
      const list = byArticle.get(b.articleSlug) ?? [];
      list.push(b);
      byArticle.set(b.articleSlug, list);
    }

    for (const [, images] of byArticle.entries()) {
      console.log(`\n  📄  ${images[0].articleTitle}`);
      console.log(`      slug: ${images[0].articleSlug}`);
      for (const img of images) {
        console.log(`\n      Field  : ${img.field}`);
        console.log(`      Status : ${img.status}`);
        console.log(`      URL    : ${img.url}`);
      }
    }
  }

  if (noCoverImage.length === 0 && broken.length === 0) {
    console.log('\n✅  All images are present and accessible — nothing broken!\n');
  } else {
    console.log(`\n${divider}\n`);
  }

  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
