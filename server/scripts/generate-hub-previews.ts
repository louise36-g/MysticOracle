/**
 * generate-hub-previews.ts
 *
 * Auto-generates article-preview blocks for all 22 Major Arcana hub articles
 * by pulling the first paragraph from each of the 12 category articles.
 *
 * Skips hubs that no longer have a <ul> in their Explore section (already done).
 * Reports any category articles it cannot find by slug.
 *
 * Run AFTER fix-fold-markers-all.ts so the first paragraphs are clean.
 *
 * Usage:
 *   cd server
 *   DATABASE_URL="..." npx tsx scripts/generate-hub-previews.ts           # dry run
 *   DATABASE_URL="..." npx tsx scripts/generate-hub-previews.ts --apply   # write
 */

import pg from 'pg';

const APPLY = process.argv.includes('--apply');

// ---------------------------------------------------------------------------
// The 22 hub slugs → card URL prefix (removes -complete-guide)
// ---------------------------------------------------------------------------
const HUB_SLUGS = [
  'death-complete-guide',
  'judgement-complete-guide',
  'justice-complete-guide',
  'strength-complete-guide',
  'temperance-complete-guide',
  'the-chariot-complete-guide',
  'the-devil-complete-guide',
  'the-emperor-complete-guide',
  'the-empress-complete-guide',
  'the-fool-complete-guide',
  'the-hanged-man-complete-guide',
  'the-hermit-complete-guide',
  'the-hierophant-complete-guide',
  'the-high-priestess-complete-guide',
  'the-lovers-complete-guide',
  'the-magician-complete-guide',
  'the-moon-complete-guide',
  'the-star-complete-guide',
  'the-sun-complete-guide',
  'the-tower-complete-guide',
  'the-world-complete-guide',
  'wheel-of-fortune-complete-guide',
];

// The 12 category suffixes in display order
const CATEGORY_SUFFIXES = [
  'as-yes-or-no',
  'love-advice',
  'love-outcome',
  'as-feelings',
  'how-someone-sees-you',
  'breakup',
  'reconciliation',
  'current-situation',
  'obstacle-challenge',
  'as-a-person',
  'career-advice',
  'spirituality',
];

// ---------------------------------------------------------------------------

/** Extracts the first <p>...</p> from HTML, stripping inner tags for clean text */
function firstParagraph(html: string): string | null {
  const start = html.indexOf('<p>');
  if (start === -1) return null;
  const end = html.indexOf('</p>', start);
  if (end === -1) return null;
  // Return with outer <p> tags intact so it renders as a paragraph
  return html.substring(start, end + '</p>'.length);
}

/** Strip HTML tags to plain text (for the <p> inside article-preview) */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

/** Finds [start, end] of the <ul>...</ul> inside the Explore section */
function findUlBlock(html: string): [number, number] | null {
  const lower = html.toLowerCase();
  const exploreIdx = lower.indexOf('explore');
  if (exploreIdx === -1) return null;
  const ulStart = html.indexOf('<ul', exploreIdx);
  if (ulStart === -1) return null;
  const ulEnd = html.indexOf('</ul>', ulStart);
  if (ulEnd === -1) return null;
  return [ulStart, ulEnd + '</ul>'.length];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Load all relevant articles into memory in one query
  const { rows: allArticles } = await pool.query<{
    id: string;
    slug: string;
    status: string;
    titleEn: string;
    contentEn: string;
  }>(`
    SELECT DISTINCT p.id, p.slug, p.status, p."titleEn", p."contentEn"
    FROM "BlogPost" p
    JOIN "BlogPostCategory" pc ON pc."postId" = p.id
    JOIN "BlogCategory" c ON c.id = pc."categoryId"
    WHERE p."deletedAt" IS NULL
      AND (
        c.slug = 'major-arcana-deep-dives'
        OR c."parentId" = (SELECT id FROM "BlogCategory" WHERE slug = 'major-arcana-deep-dives')
      )
  `);

  const bySlug = new Map(allArticles.map(a => [a.slug, a]));

  console.log(APPLY ? '=== APPLYING ===' : '=== DRY RUN (--apply to write) ===');
  console.log(`Loaded ${allArticles.length} articles from DB\n`);

  let hubsUpdated = 0,
    hubsSkipped = 0;

  for (const hubSlug of HUB_SLUGS) {
    const hub = bySlug.get(hubSlug);
    if (!hub) {
      console.log(`✗ Hub NOT FOUND: ${hubSlug}`);
      continue;
    }

    // Check if hub still needs updating
    const ulRange = findUlBlock(hub.contentEn);
    if (!ulRange) {
      console.log(`↷ SKIP (already updated): [${hub.status}] ${hubSlug}`);
      hubsSkipped++;
      continue;
    }

    const cardPrefix = hubSlug.replace('-complete-guide', '');
    const previewBlocks: string[] = [];
    const missing: string[] = [];

    for (const suffix of CATEGORY_SUFFIXES) {
      const articleSlug = `${cardPrefix}-${suffix}`;
      const article = bySlug.get(articleSlug);

      if (!article) {
        missing.push(articleSlug);
        continue;
      }

      const para = firstParagraph(article.contentEn);
      if (!para) {
        missing.push(`${articleSlug} (no <p> found)`);
        continue;
      }

      // Build clean paragraph — strip inner tags so the preview text is plain
      const plainText = stripTags(para);
      const url = `https://celestiarcana.com/blog/${articleSlug}`;

      previewBlocks.push(
        `<div class="article-preview">\n` +
          `  <h3 style="text-align: center;"><a href="${url}">${article.titleEn}</a></h3>\n` +
          `  <p>${plainText}</p>\n` +
          `</div>`
      );
    }

    if (missing.length > 0) {
      console.log(`⚠  [${hub.status}] ${hubSlug} — ${missing.length} category article(s) missing:`);
      missing.forEach(m => console.log(`     - ${m}`));
    }

    if (previewBlocks.length === 0) {
      console.log(`✗ SKIP (no preview blocks could be built): ${hubSlug}`);
      hubsSkipped++;
      continue;
    }

    const htmlBlock = previewBlocks.join('\n');
    const [ulStart, ulEnd] = ulRange;
    const newContentEn =
      hub.contentEn.substring(0, ulStart) + htmlBlock + hub.contentEn.substring(ulEnd);

    if (APPLY) {
      await pool.query(`UPDATE "BlogPost" SET "contentEn" = $1 WHERE id = $2`, [
        newContentEn,
        hub.id,
      ]);
      console.log(`✓ [${hub.status}] ${hubSlug} — ${previewBlocks.length}/12 previews inserted`);
    } else {
      console.log(
        `→ [${hub.status}] ${hubSlug} — would insert ${previewBlocks.length}/12 previews`
      );
      console.log(
        `  First preview:\n  ${previewBlocks[0].substring(0, 120).replace(/\n/g, ' ')}...`
      );
    }

    hubsUpdated++;
  }

  console.log(
    `\nSummary: ${hubsUpdated} hubs ${APPLY ? 'updated' : 'would be updated'} | ${hubsSkipped} skipped`
  );
  if (!APPLY && hubsUpdated > 0) console.log('Run with --apply to write.');

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
