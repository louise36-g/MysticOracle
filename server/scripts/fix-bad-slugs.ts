/**
 * Finds (and optionally fixes) tarot article slugs containing characters
 * not allowed by the slug regex: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
 *
 * The most common offender is slugs containing a forward slash (/), which
 * cause the prerender to create a nested URL like /tarot/foo/bar and then
 * appear in GSC as "alternate page with canonical tag" errors.
 *
 * Dry-run by default — shows what would be changed without touching the DB.
 * Pass --apply to write fixes.
 *
 *   npx tsx scripts/fix-bad-slugs.ts
 *   npx tsx scripts/fix-bad-slugs.ts --apply
 */

import pg from 'pg';

const DRY_RUN = !process.argv.includes('--apply');
const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function sanitize(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/\//g, '-') // forward slash → hyphen
    .replace(/[^a-z0-9-]/g, '') // remove everything else invalid
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // strip leading/trailing hyphens
}

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (pass --apply to save)' : 'APPLYING CHANGES'}\n`);

  const { rows } = await pool.query<{ id: string; slug: string; title: string }>(
    `SELECT id, slug, "titleEn" AS title FROM "BlogPost"
     WHERE "contentType" = 'TAROT_ARTICLE' AND "deletedAt" IS NULL
     ORDER BY slug`
  );

  const bad = rows.filter(r => !VALID_SLUG.test(r.slug));

  if (bad.length === 0) {
    console.log('✓ No bad slugs found — all article slugs are valid.');
    await pool.end();
    return;
  }

  console.log(`Found ${bad.length} article(s) with invalid slugs:\n`);

  for (const article of bad) {
    const fixed = sanitize(article.slug);

    const { rows: conflicts } = await pool.query<{ id: string }>(
      `SELECT id FROM "BlogPost" WHERE slug = $1 AND id != $2`,
      [fixed, article.id]
    );
    const conflict = conflicts[0];

    const status = conflict
      ? `⚠️  CONFLICT — "${fixed}" already exists (id: ${conflict.id})`
      : `→  would become "${fixed}"`;

    console.log(`  id:    ${article.id}`);
    console.log(`  title: ${article.title}`);
    console.log(`  slug:  "${article.slug}"  ${status}`);
    console.log();

    if (!DRY_RUN && !conflict) {
      await pool.query(`UPDATE "BlogPost" SET slug = $1 WHERE id = $2`, [fixed, article.id]);
      console.log(`  ✓ Updated to "${fixed}"`);
    }
  }

  if (DRY_RUN) {
    console.log('--- Dry run complete. Run with --apply to save changes. ---');
  } else {
    console.log('--- Done. ---');
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
