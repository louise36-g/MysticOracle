/**
 * Script to fix Queen of Swords Key Takeaways (uses ul list instead of p tags)
 */
import prisma from '../src/db/prisma.js';

async function fixQueenSwords() {
  console.log('🔄 Fixing Queen of Swords Key Takeaways...\n');

  const article = await prisma.tarotArticle.findFirst({
    where: { slug: 'queen-of-swords-tarot-card-meaning' },
    select: { id: true, slug: true, content: true },
  });

  if (!article?.content) {
    console.log('Article not found');
    await prisma.$disconnect();
    return;
  }

  // Find Key Takeaways heading and the ul that follows
  const pattern =
    /<h3>Key Takeaways: Queen of Swords Tarot Card<\/h3><ul class="list-disc">(<li>.*?<\/li>)+<\/ul>/s;
  const match = article.content.match(pattern);

  if (!match) {
    console.log('Pattern not found');
    await prisma.$disconnect();
    return;
  }

  const originalContent = match[0];

  // Extract the list items and convert to paragraphs
  const listItems = originalContent.match(/<li><p>(.*?)<\/p><\/li>/g);
  if (!listItems) {
    console.log('No list items found');
    await prisma.$disconnect();
    return;
  }

  const paragraphs = listItems.map(item => {
    const content = item.replace(/<li><p>(.*?)<\/p><\/li>/, '$1');
    return `<p>${content}</p>`;
  });

  // Build the wrapped content
  const wrappedContent = `<div class="key-takeaways">\n<h2>Key Takeaways: Queen of Swords Tarot Card</h2>\n${paragraphs.join('\n')}\n</div>`;

  // Replace in the content
  const newContent = article.content.replace(originalContent, wrappedContent);

  if (newContent !== article.content) {
    await prisma.tarotArticle.update({
      where: { id: article.id },
      data: { content: newContent },
    });
    console.log(`✅ Fixed queen-of-swords-tarot-card-meaning`);
  } else {
    console.log(`⚠️  No changes made`);
  }

  await prisma.$disconnect();
}

fixQueenSwords();
