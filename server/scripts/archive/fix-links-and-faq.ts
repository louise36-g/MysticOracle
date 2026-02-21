/**
 * Fix wrong /tarot/xxx links and duplicate FAQ headers
 */
import prisma from '../src/db/prisma.js';

// Map short names to full slugs
const SLUG_MAP: Record<string, string> = {
  // Major Arcana - various formats found
  'the-lovers-card-meaning': 'the-lovers-tarot-card-meaning',
  'the-magician-meaning': 'the-magician-tarot-card-meaning',
  'the-hermit-meaning': 'the-hermit-tarot-card-meaning',
  'the-emperor-meaning': 'the-emperor-tarot-card-meaning',
  'the-high-priestess-meaning': 'high-priestess-tarot-card-meaning',
  'judgement-meaning': 'judgement-tarot-card-meaning',
  strength: 'strength-tarot-card-meaning',
  'the-high-priestess': 'high-priestess-tarot-card-meaning',
  'wheel-of-fortune': 'wheel-of-fortune-tarot-card-meaning',
  // Minor Arcana
  '5-of-swords-meaning': '5-of-swords-tarot-card-meaning',
  // Suit guides (these should go to blog)
  'suit-of-cups-guide': 'BLOG:suit-of-cups-tarot-guide',
  'suit-of-cups': 'BLOG:suit-of-cups-tarot-guide',
};

async function fixLinksAndFaq() {
  console.log('🔄 Fixing links and duplicate FAQ headers...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, content: true },
    orderBy: { slug: 'asc' },
  });

  // Pattern for /tarot/xxx links
  const wrongLinkPattern = /<a[^>]*href="\/tarot\/([^"/]+)"[^>]*>([^<]+)<\/a>/gi;

  let linksFixed = 0;
  let faqFixed = 0;
  let articlesModified = 0;

  for (const article of articles) {
    if (!article.content) continue;

    let content = article.content;
    let modified = false;

    // Fix wrong links
    const linkMatches = [...content.matchAll(wrongLinkPattern)];
    for (const match of linkMatches) {
      const fullMatch = match[0];
      const shortSlug = match[1];
      let linkText = match[2];

      // Clean up link text
      linkText = linkText.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1');

      const mappedSlug = SLUG_MAP[shortSlug];
      if (mappedSlug) {
        let shortcode: string;
        if (mappedSlug.startsWith('BLOG:')) {
          shortcode = `[[blog:${mappedSlug.replace('BLOG:', '')}|${linkText}]]`;
        } else {
          shortcode = `[[tarot:${mappedSlug}|${linkText}]]`;
        }
        content = content.replace(fullMatch, shortcode);
        console.log(`  ✅ Fixed link: /tarot/${shortSlug} → ${shortcode.substring(0, 50)}...`);
        linksFixed++;
        modified = true;
      } else {
        console.log(`  ⚠️  Unknown slug: /tarot/${shortSlug} in ${article.slug}`);
      }
    }

    // Fix duplicate FAQ headers - keep only the styled one, remove the plain one
    // Pattern: keep <h2 style="...">Frequently Asked Questions...</h2>
    // Remove: <h2>Frequently Asked Questions about the XXX Card</h2>
    const duplicateFaqPattern = /<h2>Frequently Asked Questions about (?:the )?[^<]+Card<\/h2>/gi;
    const faqMatches = content.match(duplicateFaqPattern);
    if (faqMatches && faqMatches.length > 0) {
      for (const faqMatch of faqMatches) {
        content = content.replace(faqMatch, '');
        console.log(`  ✅ Removed duplicate FAQ: ${faqMatch.substring(0, 60)}...`);
        faqFixed++;
        modified = true;
      }
    }

    if (modified) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: { content },
      });
      console.log(`✅ ${article.slug} - updated\n`);
      articlesModified++;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Articles modified: ${articlesModified}`);
  console.log(`Links fixed: ${linksFixed}`);
  console.log(`Duplicate FAQ headers removed: ${faqFixed}`);

  await prisma.$disconnect();
}

fixLinksAndFaq();
