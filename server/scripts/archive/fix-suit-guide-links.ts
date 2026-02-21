/**
 * Script to fix Suit Guide links in all tarot articles
 * Changes [[spread:swords|...]] to [[blog:suit-of-swords-tarot-guide|...]]
 * And similar for other suits
 */
import prisma from '../src/db/prisma.js';

const SUIT_MAPPINGS: Record<string, string> = {
  swords: 'suit-of-swords-tarot-guide',
  wands: 'suit-of-wands-tarot-guide',
  cups: 'suit-of-cups-tarot-guide',
  pentacles: 'suit-of-pentacles-tarot-guide',
};

async function fixSuitGuideLinks() {
  console.log('🔄 Fixing Suit Guide links in tarot articles...\n');

  // Verify blog articles exist
  for (const [, blogSlug] of Object.entries(SUIT_MAPPINGS)) {
    const blog = await prisma.blogPost.findFirst({
      where: { slug: blogSlug },
      select: { slug: true, titleEn: true },
    });
    if (blog) {
      console.log(`✅ Found: ${blogSlug}`);
    } else {
      console.log(`⚠️  Missing: ${blogSlug}`);
    }
  }

  console.log('\n--- Processing Tarot Articles ---\n');

  // Get all tarot articles
  const articles = await prisma.tarotArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, content: true },
  });

  let totalFixed = 0;

  for (const article of articles) {
    if (!article.content) continue;

    let newContent = article.content;
    const fixes: string[] = [];

    // Replace each suit shortcode
    for (const [suit, blogSlug] of Object.entries(SUIT_MAPPINGS)) {
      const pattern = new RegExp(`\\[\\[spread:${suit}\\|([^\\]]+)\\]\\]`, 'g');
      const matches = newContent.match(pattern);

      if (matches) {
        newContent = newContent.replace(pattern, `[[blog:${blogSlug}|$1]]`);
        fixes.push(`[[spread:${suit}|...]] → [[blog:${blogSlug}|...]]`);
      }
    }

    if (fixes.length > 0) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: { content: newContent },
      });
      console.log(`✅ Fixed ${article.slug}:`);
      fixes.forEach(f => console.log(`   ${f}`));
      totalFixed++;
    }
  }

  console.log(`\n✨ Done! Fixed ${totalFixed} tarot articles.`);
  await prisma.$disconnect();
}

fixSuitGuideLinks();
