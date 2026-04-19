/**
 * Fix quote attributions in tarot article blockquotes.
 *
 * Two patterns exist in the DB:
 *
 * PATTERN A (inline — the common one):
 *   <blockquote><p>"Quote text.", Author Name</p></blockquote>
 *   → <blockquote><p>"Quote text."</p><p>- Author Name -</p></blockquote>
 *
 * PATTERN B (two-paragraph — from a prior pass, only ~2 articles):
 *   <blockquote><p>"Quote"</p><p>- Author -</p></blockquote>  ← already correct
 *   <blockquote><p>"Quote"</p><p>-Author -</p></blockquote>   ← needs space fix
 *
 * Run dry-run:  npx tsx scripts/fix-quote-attributions.ts
 * Apply fixes:  npx tsx scripts/fix-quote-attributions.ts --apply
 */

import prisma from '../src/db/prisma.js';

const APPLY = process.argv.includes('--apply');

// Matches a single-<p> blockquote whose content is:  "quote text", Author Name
// Group 1 = full quote including surrounding quotes
// Group 2 = author name (everything after the ", ")
const INLINE_ATTR_RE = /(<blockquote><p>)("[\s\S]*?"),\s*([^<]+?)(<\/p><\/blockquote>)/gi;

// Matches a two-<p> blockquote whose attribution paragraph needs space normalisation
// e.g. <p>-Author -</p> or <p> -Author-</p>
const TWO_P_BQ_RE = /<blockquote>([\s\S]*?)<\/blockquote>/gi;
const ATTR_P_RE = /<p>([\s\S]*?)<\/p>/gi;
const ALREADY_CORRECT = /^- .+ -$/;
const QUOTE_START = /^[""'"'«]/;

function normaliseAttribution(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^[-,—–•\s]+/, '').trim();
  text = text.replace(/[-,—–•\s]+$/, '').trim();
  if (!text) return raw;
  return `- ${text} -`;
}

function fixContent(html: string): { fixed: string; changes: string[] } {
  const changes: string[] = [];

  // Pass 1: fix inline attributions (Pattern A)
  let fixed = html.replace(INLINE_ATTR_RE, (_match, open, quoteText, author, close) => {
    const trimmedAuthor = author.trim();
    changes.push(`  INLINE: "${quoteText.trim().substring(0, 60)}..." → attr: "${trimmedAuthor}"`);
    return `${open}${quoteText}</p><p>- ${trimmedAuthor} -${close}`;
  });

  // Pass 2: fix two-<p> blockquotes where attribution paragraph needs normalisation (Pattern B)
  fixed = fixed.replace(new RegExp(TWO_P_BQ_RE.source, 'gi'), blockquote => {
    const pTags = [...blockquote.matchAll(new RegExp(ATTR_P_RE.source, 'gi'))];
    if (pTags.length < 2) return blockquote;

    return blockquote.replace(new RegExp(ATTR_P_RE.source, 'gi'), (pTag, inner) => {
      if (QUOTE_START.test(inner.trim())) return pTag; // it's the quote text
      const trimmed = inner.trim();
      if (ALREADY_CORRECT.test(trimmed)) return pTag; // already correct
      const normalised = normaliseAttribution(inner);
      if (normalised !== trimmed) {
        changes.push(`  TWO-P: "${trimmed}" → "${normalised}"`);
        return `<p>${normalised}</p>`;
      }
      return pTag;
    });
  });

  return { fixed, changes };
}

async function main() {
  const articles = await prisma.blogPost.findMany({
    where: { contentType: 'TAROT_ARTICLE', deletedAt: null },
    select: { id: true, slug: true, titleEn: true, contentEn: true, contentFr: true },
  });

  console.log(`Checking ${articles.length} tarot articles…\n`);

  let totalFixed = 0;

  for (const article of articles) {
    const enResult = article.contentEn
      ? fixContent(article.contentEn)
      : { fixed: article.contentEn, changes: [] };

    const frResult = article.contentFr
      ? fixContent(article.contentFr)
      : { fixed: article.contentFr, changes: [] };

    const hasChanges = enResult.changes.length > 0 || frResult.changes.length > 0;
    if (!hasChanges) continue;

    console.log(`📄 ${article.slug}`);
    if (enResult.changes.length > 0) {
      console.log('  EN:');
      enResult.changes.forEach(c => console.log(c));
    }
    if (frResult.changes.length > 0) {
      console.log('  FR:');
      frResult.changes.forEach(c => console.log(c));
    }
    console.log('');

    totalFixed++;

    if (APPLY) {
      await prisma.blogPost.update({
        where: { id: article.id },
        data: {
          ...(enResult.changes.length > 0 ? { contentEn: enResult.fixed ?? undefined } : {}),
          ...(frResult.changes.length > 0 ? { contentFr: frResult.fixed ?? undefined } : {}),
        },
      });
    }
  }

  if (totalFixed === 0) {
    console.log('✅ All attributions already correct — nothing to fix.');
    return;
  }

  if (APPLY) {
    console.log(`✅ Fixed ${totalFixed} article(s).`);
  } else {
    console.log(`⚠️  ${totalFixed} article(s) need fixing. Re-run with --apply to commit changes.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
