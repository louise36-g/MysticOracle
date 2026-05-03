/**
 * insert-fold-markers.ts
 *
 * Inserts <!-- fold --> markers into all Major Arcana Deep Dives articles that are
 * missing the marker (regardless of status). The marker splits above-the-fold intro
 * text (rendered before the cover image) from the main article body.
 *
 * Placement logic:
 *   - Hub/overview articles (containing "soul level" or "deepest level"):
 *     Insert after the paragraph that contains those phrases.
 *   - All other articles:
 *     Insert after the first </p> tag.
 *
 * The same paragraph index is used for contentFr.
 *
 * Usage:
 *   DATABASE_URL="..." npx tsx scripts/insert-fold-markers.ts
 *   DATABASE_URL="..." npx tsx scripts/insert-fold-markers.ts --apply
 */

import pg from 'pg';

const APPLY = process.argv.includes('--apply');
const FOLD = '<!-- fold -->';

// Card names to target (slugs contain these)
const TARGET_SLUGS_CONTAINING = [
  'the-fool',
  'the-tower',
  'the-moon',
  'the-star',
  '-death-',
  'death-tarot',
];

function isHubArticle(contentEn: string): boolean {
  const lower = contentEn.toLowerCase();
  return lower.includes('soul level') || lower.includes('deepest level');
}

/**
 * Returns the index at which to insert FOLD in the HTML string.
 * For hub articles: after the closing </p> of the paragraph containing the marker phrase.
 * For regular articles: after the first </p>.
 */
function findInsertionPoint(html: string, hub: boolean): number {
  if (hub) {
    const lower = html.toLowerCase();
    const phrases = ['soul level', 'deepest level'];
    for (const phrase of phrases) {
      const phraseIdx = lower.indexOf(phrase);
      if (phraseIdx === -1) continue;
      const closingP = html.indexOf('</p>', phraseIdx);
      if (closingP !== -1) return closingP + '</p>'.length;
    }
    // Fall back to after first </p> if phrase not found
  }
  const firstClose = html.indexOf('</p>');
  return firstClose === -1 ? -1 : firstClose + '</p>'.length;
}

/**
 * Inserts FOLD at the same paragraph boundary in French content as in English.
 * Counts which </p> occurrence was used in English, finds the same in French.
 */
function insertFoldFr(contentEn: string, contentFr: string, enInsertionPoint: number): string {
  if (!contentFr || contentFr.includes(FOLD)) return contentFr;

  // Count how many </p> closings precede the insertion point in English
  const enBefore = contentEn.substring(0, enInsertionPoint);
  const pCount = (enBefore.match(/<\/p>/gi) || []).length;

  if (pCount === 0) return contentFr;

  // Find the same Nth </p> in French
  let count = 0;
  let pos = 0;
  while (count < pCount) {
    const next = contentFr.indexOf('</p>', pos);
    if (next === -1) break;
    count++;
    pos = next + '</p>'.length;
    if (count === pCount) {
      return contentFr.substring(0, pos) + '\n' + FOLD + '\n' + contentFr.substring(pos);
    }
  }

  // Fallback: insert after first </p>
  const first = contentFr.indexOf('</p>');
  if (first === -1) return contentFr;
  const p = first + '</p>'.length;
  return contentFr.substring(0, p) + '\n' + FOLD + '\n' + contentFr.substring(p);
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

  // Fetch all non-deleted articles in the major-arcana-deep-dives category
  // that are missing the fold marker (regardless of publication status)
  const { rows } = await pool.query<{
    id: string;
    slug: string;
    status: string;
    contentType: string;
    contentEn: string;
    contentFr: string;
  }>(`
    SELECT DISTINCT p.id, p.slug, p.status, p."contentType", p."contentEn", p."contentFr"
    FROM "BlogPost" p
    JOIN "BlogPostCategory" pc ON pc."postId" = p.id
    JOIN "BlogCategory" c ON c.id = pc."categoryId"
    WHERE p."deletedAt" IS NULL
      AND p."contentEn" NOT LIKE '%<!-- fold -->%'
      AND c.slug = 'major-arcana-deep-dives'
      AND (
        p.slug LIKE '%the-fool%'
        OR p.slug LIKE '%the-tower%'
        OR p.slug LIKE '%the-moon%'
        OR p.slug LIKE '%the-star%'
        OR p.slug LIKE '%death%'
      )
    ORDER BY p.slug
  `);

  console.log(`Found ${rows.length} articles missing <!-- fold --> marker\n`);

  if (!APPLY) {
    console.log('DRY RUN — pass --apply to write changes\n');
  }

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const hub = isHubArticle(row.contentEn);
    const insertAt = findInsertionPoint(row.contentEn, hub);

    if (insertAt === -1) {
      console.log(`⚠  SKIP (no </p> found): ${row.slug}`);
      skipped++;
      continue;
    }

    const newContentEn =
      row.contentEn.substring(0, insertAt) + '\n' + FOLD + '\n' + row.contentEn.substring(insertAt);

    const newContentFr = insertFoldFr(row.contentEn, row.contentFr, insertAt);

    const articleType = hub ? 'HUB' : 'SERIES';
    console.log(`${APPLY ? '✓' : '→'} [${articleType}] ${row.status} — ${row.slug}`);

    if (APPLY) {
      await pool.query(`UPDATE "BlogPost" SET "contentEn" = $1, "contentFr" = $2 WHERE id = $3`, [
        newContentEn,
        newContentFr,
        row.id,
      ]);
      updated++;
    }
  }

  console.log(
    `\n${APPLY ? 'Updated' : 'Would update'}: ${rows.length - skipped} | Skipped: ${skipped}`
  );
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
