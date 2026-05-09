/**
 * Strips site-name suffixes baked into blog post title fields in the database.
 *
 * Some articles were imported with suffixes already in the title, e.g.:
 *   "Le Fou & Uranus - CelestiArcana"
 *   "The Fool Tarot | CelestiArcana Blog"
 *   "Queen of Cups — CelestiArcana"
 *
 * The prerender script adds its own suffix, so these produced doubled branding
 * that Google then rewrote inconsistently.
 *
 * This script removes any trailing suffix matching the patterns below from
 * both titleEn and titleFr fields on BlogPost records.
 *
 * Dry-run by default:
 *   npx ts-node scripts/strip-title-suffixes.ts
 *   npx ts-node scripts/strip-title-suffixes.ts --apply
 */

import prisma from '../src/db/prisma.js';

const DRY_RUN = !process.argv.includes('--apply');

// Matches any trailing separator + site name variant, case-insensitive.
// Handles: | - – — followed by CelestiArcana (with or without Blog/Tarot/etc.)
const SUFFIX_RE = /\s*[\|\-\–\—]\s*CelestiArcana.*$/i;

function strip(title: string | null): string | null {
  if (!title) return title;
  return title.replace(SUFFIX_RE, '').trim();
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (pass --apply to save)' : 'APPLY'}`);
  console.log('');

  const posts = await prisma.blogPost.findMany({
    select: { id: true, slug: true, titleEn: true, titleFr: true },
  });

  const toUpdate: Array<{
    id: string;
    slug: string;
    titleEn: string | null;
    titleFr: string | null;
    newEn: string | null;
    newFr: string | null;
  }> = [];

  for (const post of posts) {
    const newEn = strip(post.titleEn);
    const newFr = strip(post.titleFr);
    if (newEn !== post.titleEn || newFr !== post.titleFr) {
      toUpdate.push({ ...post, newEn, newFr });
    }
  }

  if (toUpdate.length === 0) {
    console.log('No titles need cleaning — all clear.');
    return;
  }

  console.log(`Found ${toUpdate.length} post(s) with suffix to strip:\n`);
  for (const p of toUpdate) {
    if (p.newEn !== p.titleEn) {
      console.log(`  [EN] "${p.titleEn}"`);
      console.log(`    → "${p.newEn}"`);
    }
    if (p.newFr !== p.titleFr) {
      console.log(`  [FR] "${p.titleFr}"`);
      console.log(`    → "${p.newFr}"`);
    }
    console.log('');
  }

  if (DRY_RUN) {
    console.log('Dry run complete. Run with --apply to save changes.');
    return;
  }

  let updated = 0;
  for (const p of toUpdate) {
    await prisma.blogPost.update({
      where: { id: p.id },
      data: {
        ...(p.newEn !== p.titleEn ? { titleEn: p.newEn ?? undefined } : {}),
        ...(p.newFr !== p.titleFr ? { titleFr: p.newFr ?? undefined } : {}),
      },
    });
    updated++;
  }

  console.log(`Done — updated ${updated} post(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
