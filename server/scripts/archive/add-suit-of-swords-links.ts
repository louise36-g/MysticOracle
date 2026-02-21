/**
 * Script to add "Suit of Swords" links to sword card articles
 * Links the first occurrence of "Suit of Swords" to the blog guide
 */
import prisma from '../src/db/prisma.js';

async function addSuitOfSwordsLinks() {
  console.log('🔄 Adding Suit of Swords links to sword card articles...\n');

  // Verify the blog article exists
  const blogArticle = await prisma.blogPost.findFirst({
    where: { slug: 'suit-of-swords-tarot-guide' },
    select: { slug: true, titleEn: true },
  });

  if (!blogArticle) {
    console.log('❌ Blog article "suit-of-swords-tarot-guide" not found!');
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Target: ${blogArticle.titleEn}\n`);

  // Get all sword card articles
  const articles = await prisma.tarotArticle.findMany({
    where: {
      deletedAt: null,
      slug: { contains: 'swords' },
    },
    select: { id: true, slug: true, content: true },
    orderBy: { slug: 'asc' },
  });

  let updated = 0;

  for (const article of articles) {
    if (!article.content) continue;

    // Skip if already has a link to the suit guide
    if (article.content.includes('[[blog:suit-of-swords-tarot-guide')) {
      console.log(`⏭️  ${article.slug} - already has link`);
      continue;
    }

    // Find "Suit of Swords" not inside a shortcode or HTML tag
    // We'll replace only the first occurrence
    const pattern = /(?<!\[\[[^\]]*)(Suit of Swords)(?![^[]*\]\])/i;
    const match = article.content.match(pattern);

    if (!match) {
      console.log(`⏭️  ${article.slug} - no linkable mention found`);
      continue;
    }

    // Replace only the first occurrence
    const newContent = article.content.replace(
      pattern,
      '[[blog:suit-of-swords-tarot-guide|Suit of Swords]]'
    );

    if (newContent !== article.content) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: { content: newContent },
      });
      console.log(`✅ ${article.slug} - added link`);
      updated++;
    }
  }

  console.log(`\n✨ Done! Added links to ${updated} articles.`);
  await prisma.$disconnect();
}

addSuitOfSwordsLinks();
