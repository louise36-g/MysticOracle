/**
 * Finds (and optionally fixes) tarot article slugs that contain characters
 * not allowed by the slug validation regex: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
 *
 * The most common offenders are slugs containing a forward slash (/), which
 * cause the prerender to create a nested URL like /tarot/foo/bar instead of
 * the expected /tarot/foo-bar, and then appear in GSC as "alternate page with
 * canonical tag" errors.
 *
 * Dry-run by default — shows what would be changed without touching the DB.
 * Pass --apply to write fixes.
 *
 *   npx ts-node scripts/fix-bad-slugs.ts
 *   npx ts-node scripts/fix-bad-slugs.ts --apply
 */

import prisma from '../src/db/prisma.js';

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
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (pass --apply to save)' : 'APPLYING CHANGES'}\n`);

  const articles = await prisma.tarotArticle.findMany({
    select: { id: true, slug: true, title: true },
    orderBy: { slug: 'asc' },
  });

  const bad = articles.filter(a => !VALID_SLUG.test(a.slug));

  if (bad.length === 0) {
    console.log('✓ No bad slugs found — all article slugs are valid.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${bad.length} article(s) with invalid slugs:\n`);

  for (const article of bad) {
    const fixed = sanitize(article.slug);
    const conflict =
      fixed !== article.slug
        ? await prisma.tarotArticle.findUnique({ where: { slug: fixed } })
        : null;

    const status = conflict
      ? `⚠️  CONFLICT — "${fixed}" already exists (id: ${conflict.id})`
      : `→  would become "${fixed}"`;

    console.log(`  id: ${article.id}`);
    console.log(`  title: ${article.title}`);
    console.log(`  slug: "${article.slug}"  ${status}`);
    console.log();

    if (!DRY_RUN && !conflict && fixed !== article.slug) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: { slug: fixed },
      });
      console.log(`  ✓ Updated to "${fixed}"`);
    }
  }

  if (DRY_RUN) {
    console.log('--- Dry run complete. Run with --apply to save changes. ---');
  } else {
    console.log('--- Done. ---');
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
