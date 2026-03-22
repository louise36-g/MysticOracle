/**
 * Update Tarot Article Headings for SEO
 *
 * Converts generic sub-headings like:
 *   <p><strong>Life Decisions:</strong> When The Empress appears...
 *
 * To keyword-rich H3 headings:
 *   <h3>The Empress Tarot Meaning in Life Decisions</h3><p>When The Empress appears...
 *
 * Handles both upright and reversed sections (78 articles × 8 headings each).
 *
 * Usage:
 *   cd server && npx tsx scripts/update-tarot-headings.ts          # dry run
 *   cd server && npx tsx scripts/update-tarot-headings.ts --apply  # apply changes
 */

import 'dotenv/config';
import prisma from '../src/db/prisma.js';
const DRY_RUN = !process.argv.includes('--apply');

// Heading mappings: original → preposition
const HEADING_MAP: Record<string, string> = {
  'Life Decisions': 'in',
  'Love &amp; Relationships': 'in',
  'Love & Relationships': 'in',
  'Career &amp; Finances': 'in',
  'Career & Finances': 'in',
  'Spiritual Growth': 'for',
};

function extractCardName(title: string): string {
  // "The Empress: Goddess of Abundance" → "The Empress"
  // "The Tower: The Lightning Bolt of Truth" → "The Tower"
  const colonIndex = title.indexOf(':');
  if (colonIndex > 0) {
    return title.substring(0, colonIndex).trim();
  }
  // Fallback: use the full title
  return title.trim();
}

function updateHeadings(content: string, cardName: string): { updated: string; changes: string[] } {
  const changes: string[] = [];
  let updated = content;

  // Find where the reversed section starts
  const reversedIndex = updated.search(/<h[23][^>]*>[^<]*Reversed/i);

  for (const [heading, preposition] of Object.entries(HEADING_MAP)) {
    // Build the regex to match <p><strong>Heading:</strong>
    // The heading might appear in both upright and reversed sections
    const escapedHeading = heading.replace(/&/g, '&(?:amp;)?');
    const regex = new RegExp(`<p>\\s*<strong>\\s*${escapedHeading}\\s*:?\\s*<\\/strong>\\s*`, 'g');

    // Normalize heading display text (use & not &amp; in the rendered heading)
    const displayHeading = heading.replace(/&amp;/g, '&');

    let match: RegExpExecArray | null;
    const matches: { index: number; fullMatch: string }[] = [];

    // Collect all matches with their positions
    const tempRegex = new RegExp(regex.source, 'g');
    while ((match = tempRegex.exec(updated)) !== null) {
      matches.push({ index: match.index, fullMatch: match[0] });
    }

    // Process matches in reverse order (so indices don't shift)
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      const isReversed = reversedIndex > 0 && m.index > reversedIndex;
      const prefix = isReversed
        ? `${cardName} Reversed Tarot Meaning`
        : `${cardName} Tarot Meaning`;
      const newHeading = `<h3>${prefix} ${preposition} ${displayHeading}</h3><p>`;

      updated =
        updated.substring(0, m.index) +
        newHeading +
        updated.substring(m.index + m.fullMatch.length);
      changes.push(
        `  ${isReversed ? '[Reversed]' : '[Upright] '} "${heading}" → "${prefix} ${preposition} ${displayHeading}"`
      );
    }
  }

  return { updated, changes };
}

async function main() {
  console.log(
    DRY_RUN ? '=== DRY RUN (use --apply to save changes) ===' : '=== APPLYING CHANGES ==='
  );
  console.log('');

  const articles = await prisma.blogPost.findMany({
    where: { contentType: 'TAROT_ARTICLE', deletedAt: null },
    select: { id: true, titleEn: true, contentEn: true, slug: true },
    orderBy: { sortOrder: 'asc' },
  });

  console.log(`Found ${articles.length} tarot articles\n`);

  let totalChanges = 0;
  let articlesChanged = 0;

  for (const article of articles) {
    const cardName = extractCardName(article.titleEn);
    const { updated, changes } = updateHeadings(article.contentEn, cardName);

    if (changes.length > 0) {
      articlesChanged++;
      totalChanges += changes.length;
      console.log(`${cardName} (${article.slug}):`);
      changes.forEach(c => console.log(c));
      console.log('');

      if (!DRY_RUN) {
        await prisma.blogPost.update({
          where: { id: article.id },
          data: { contentEn: updated },
        });
      }
    }
  }

  console.log('---');
  console.log(`Articles changed: ${articlesChanged}/${articles.length}`);
  console.log(`Total heading replacements: ${totalChanges}`);

  if (DRY_RUN) {
    console.log('\nThis was a dry run. Run with --apply to save changes.');
  } else {
    console.log('\nChanges saved to database.');
    console.log('Remember to redeploy to regenerate pre-rendered HTML.');
  }

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
