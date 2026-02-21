/**
 * Update Four of Pentacles article to new format with Key Takeaways
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const keyTakeawaysHTML = `<div class="key-takeaways">
<h2>Key Takeaways: Four of Pentacles Tarot Card</h2>
<p><strong>Core Meaning:</strong> Security, control, stability, and possessiveness</p>
<p><strong>Upright:</strong> Security, control, stability, conservation, saving, boundaries</p>
<p><strong>Reversed:</strong> Greed, materialism, self-protection, financial insecurity, letting go</p>
<p><strong>Element:</strong> Earth (holding firm, material security)</p>
<p><strong>Zodiac:</strong> Capricorn (conservation, control)</p>
<p><strong>Yes/No:</strong> YES for stability, but beware of holding too tightly</p>
<p><strong>Best Advice:</strong> Protect what matters, but know when to loosen your grip and allow flow</p>
</div>

`;

async function main() {
  console.log('Updating Four of Pentacles article...\n');

  const article = await prisma.tarotArticle.findFirst({
    where: {
      slug: 'four-of-pentacles-tarot-card-meaning',
      status: 'PUBLISHED',
      deletedAt: null,
    },
    select: { id: true, title: true, content: true },
  });

  if (!article) {
    console.log('Article not found');
    await prisma.$disconnect();
    return;
  }

  console.log('Found:', article.title);

  // Check if already has proper Key Takeaways
  if (
    article.content.includes('class="key-takeaways"') &&
    article.content.includes('Key Takeaways: Four of Pentacles')
  ) {
    console.log('✓ Article already has proper Key Takeaways format');
    await prisma.$disconnect();
    return;
  }

  // Remove old Key Takeaways if exists
  let cleanContent = article.content;
  const keyTakeawaysRegex = /<div class="key-takeaways">[\s\S]*?<\/div>\s*/gi;
  cleanContent = cleanContent.replace(keyTakeawaysRegex, '');
  const oldFormatRegex = /<h3>Key Takeaways:[\s\S]*?<\/ul>\s*/gi;
  cleanContent = cleanContent.replace(oldFormatRegex, '');

  // Prepend new Key Takeaways
  const updatedContent = keyTakeawaysHTML + cleanContent.trim();

  await prisma.tarotArticle.update({
    where: { id: article.id },
    data: { content: updatedContent },
  });

  console.log('✓ UPDATED: Four of Pentacles article with Key Takeaways');

  await prisma.$disconnect();
}

main().catch(console.error);
