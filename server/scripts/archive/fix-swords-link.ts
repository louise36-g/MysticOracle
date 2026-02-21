/**
 * Script to fix the Suit of Swords shortcode in 2 of Swords article
 * Changes [[spread:swords|...]] to [[blog:suit-of-swords-tarot-guide|...]]
 */
import prisma from '../src/db/prisma.js';

async function fixSwordsLink() {
  console.log('🔄 Fixing Suit of Swords link in 2 of Swords article...\n');

  // First verify the blog article exists
  const blogArticle = await prisma.blogPost.findFirst({
    where: { slug: 'suit-of-swords-tarot-guide' },
    select: { slug: true, titleEn: true },
  });

  if (!blogArticle) {
    console.log('❌ Blog article "suit-of-swords-tarot-guide" not found!');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ Found blog article:', blogArticle.slug, '-', blogArticle.titleEn);

  // Find and fix the 2 of Swords article
  const article = await prisma.tarotArticle.findFirst({
    where: { slug: { contains: '2-of-swords' } },
    select: { id: true, slug: true, content: true },
  });

  if (!article || !article.content) {
    console.log('❌ 2 of Swords article not found!');
    await prisma.$disconnect();
    return;
  }

  // Replace the shortcode
  const oldPattern = /\[\[spread:swords\|([^\]]+)\]\]/g;
  const newContent = article.content.replace(oldPattern, '[[blog:suit-of-swords-tarot-guide|$1]]');

  if (newContent === article.content) {
    console.log('⏭️  No changes needed - shortcode not found or already correct');
  } else {
    await prisma.tarotArticle.update({
      where: { id: article.id },
      data: { content: newContent },
    });
    console.log('✅ Fixed shortcode in:', article.slug);
    console.log('   Changed: [[spread:swords|...]] → [[blog:suit-of-swords-tarot-guide|...]]');
  }

  await prisma.$disconnect();
}

fixSwordsLink();
