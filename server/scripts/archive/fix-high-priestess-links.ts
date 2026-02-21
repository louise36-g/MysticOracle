/**
 * Fix broken links in The High Priestess article
 * The links have incorrect URLs - convert them to proper shortcodes
 */
import prisma from '../src/db/prisma.js';

async function fixHighPriestessLinks() {
  console.log('🔄 Fixing links in The High Priestess article...\n');

  const article = await prisma.tarotArticle.findFirst({
    where: { slug: 'high-priestess-tarot-card-meaning' },
    select: { id: true, slug: true, content: true },
  });

  if (!article?.content) {
    console.log('Article not found');
    await prisma.$disconnect();
    return;
  }

  let content = article.content;
  let changes = 0;

  // Fix The Magician link
  const magicianOld =
    /<a target="_blank" rel="noopener noreferrer nofollow" class="text-purple-400 underline hover:text-purple-300" href="\/magician-tarot-card-meaning">The Magician<\/a>/g;
  if (magicianOld.test(content)) {
    content = content.replace(
      magicianOld,
      '[[tarot:the-magician-tarot-card-meaning|The Magician]]'
    );
    console.log('✅ Fixed The Magician link');
    changes++;
  }

  // Fix The Empress link
  const empressOld =
    /<a target="_blank" rel="noopener noreferrer nofollow" class="text-purple-400 underline hover:text-purple-300" href="\/empress-tarot-card-meaning">The Empress<\/a>/g;
  if (empressOld.test(content)) {
    content = content.replace(empressOld, '[[tarot:the-empress-tarot-card-meaning|The Empress]]');
    console.log('✅ Fixed The Empress link');
    changes++;
  }

  // Fix The Moon link
  const moonOld =
    /<a target="_blank" rel="noopener noreferrer nofollow" class="text-purple-400 underline hover:text-purple-300" href="\/moon-tarot-card-meaning">The Moon<\/a>/g;
  if (moonOld.test(content)) {
    content = content.replace(moonOld, '[[tarot:the-moon-tarot-card-meaning|The Moon]]');
    console.log('✅ Fixed The Moon link');
    changes++;
  }

  if (changes === 0) {
    console.log('No matching links found to fix');
    await prisma.$disconnect();
    return;
  }

  // Update the database
  await prisma.tarotArticle.update({
    where: { id: article.id },
    data: { content },
  });

  console.log(`\n✅ Fixed ${changes} links in high-priestess-tarot-card-meaning`);

  await prisma.$disconnect();
}

fixHighPriestessLinks();
