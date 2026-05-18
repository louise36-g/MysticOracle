/**
 * fix-fold-markers-all.ts
 *
 * Inserts <!-- fold --> after the first </p> in every Major Arcana category
 * article that is currently missing it. Fixes both contentEn and contentFr.
 *
 * 234 of 265 articles were missing the marker as of 2026-05-18.
 *
 * Usage:
 *   cd server
 *   DATABASE_URL="..." npx tsx scripts/fix-fold-markers-all.ts           # dry run
 *   DATABASE_URL="..." npx tsx scripts/fix-fold-markers-all.ts --apply   # write
 */

import pg from 'pg';

const APPLY = process.argv.includes('--apply');
const FOLD = '<!-- fold -->';

function insertFold(html: string): string | null {
  if (!html || html.includes(FOLD)) return null; // already has it or empty
  const firstClose = html.indexOf('</p>');
  if (firstClose === -1) return null;
  const pos = firstClose + '</p>'.length;
  return html.substring(0, pos) + '\n' + FOLD + '\n' + html.substring(pos);
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

  console.log(APPLY ? '=== APPLYING ===' : '=== DRY RUN (--apply to write) ===');

  // All Major Arcana category articles (excluding complete-guide hubs)
  const { rows } = await pool.query<{
    id: string;
    slug: string;
    status: string;
    contentEn: string;
    contentFr: string;
  }>(`
    SELECT DISTINCT p.id, p.slug, p.status, p."contentEn", p."contentFr"
    FROM "BlogPost" p
    JOIN "BlogPostCategory" pc ON pc."postId" = p.id
    JOIN "BlogCategory" c ON c.id = pc."categoryId"
    WHERE p."deletedAt" IS NULL
      AND p."contentEn" NOT LIKE '%<!-- fold -->%'
      AND p.slug NOT LIKE '%-complete-guide'
      AND (
        c.slug = 'major-arcana-deep-dives'
        OR c."parentId" = (SELECT id FROM "BlogCategory" WHERE slug = 'major-arcana-deep-dives')
      )
    ORDER BY p.slug
  `);

  console.log(`Found ${rows.length} articles missing fold marker\n`);

  let updated = 0,
    skipped = 0;

  for (const row of rows) {
    const newEn = insertFold(row.contentEn);
    const newFr = insertFold(row.contentFr);

    if (!newEn) {
      console.log(`⚠  SKIP (no </p> in EN): ${row.slug}`);
      skipped++;
      continue;
    }

    if (APPLY) {
      await pool.query(`UPDATE "BlogPost" SET "contentEn" = $1, "contentFr" = $2 WHERE id = $3`, [
        newEn,
        newFr ?? row.contentFr,
        row.id,
      ]);
      console.log(
        `✓ [${row.status}] ${row.slug}${!newFr ? ' (FR unchanged — already had fold or empty)' : ''}`
      );
    } else {
      const preview = row.contentEn.substring(0, row.contentEn.indexOf('</p>') + 4);
      console.log(`→ [${row.status}] ${row.slug}`);
      console.log(`  Insert after: ...${preview.slice(-60).trim()}`);
    }

    updated++;
  }

  console.log(
    `\nSummary: ${updated} ${APPLY ? 'updated' : 'would be updated'} | ${skipped} skipped`
  );
  if (!APPLY && updated > 0) console.log('Run with --apply to write.');

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
