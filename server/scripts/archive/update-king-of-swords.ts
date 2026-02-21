/**
 * Update King of Swords article to new format with Key Takeaways
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const keyTakeawaysHTML = `<div class="key-takeaways">
<h2>Key Takeaways: King of Swords Tarot Card</h2>
<p><strong>Core Meaning:</strong> Intellectual power, authority, truth, and ethical leadership</p>
<p><strong>Upright:</strong> Mental clarity, intellectual power, authority, truth, ethics</p>
<p><strong>Reversed:</strong> Manipulation, cruelty, abuse of power, coldness, irrational</p>
<p><strong>Element:</strong> Air (supreme intellect, mastery of mind)</p>
<p><strong>Zodiac:</strong> Libra, Aquarius, Gemini (Air signs - authority)</p>
<p><strong>Yes/No:</strong> YES, truth and fair judgment will prevail</p>
<p><strong>Best Advice:</strong> Lead with integrity, use intellect wisely, uphold truth and justice</p>
</div>

`;

async function main() {
  console.log('Checking King of Swords article...\n');

  const article = await prisma.tarotArticle.findFirst({
    where: {
      slug: 'king-of-swords-tarot-card-meaning',
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
  console.log('Has key-takeaways class:', article.content.includes('class="key-takeaways"'));
  console.log('Has Key Takeaways text:', article.content.includes('Key Takeaways:'));
  console.log('\nFirst 300 chars:');
  console.log(article.content.substring(0, 300));

  // Check if already has proper Key Takeaways
  if (
    article.content.includes('class="key-takeaways"') &&
    article.content.includes('Key Takeaways: King of Swords')
  ) {
    console.log('\n✓ Article already has proper Key Takeaways format');
    await prisma.$disconnect();
    return;
  }

  // Remove old Key Takeaways if exists (in case it's malformed)
  let cleanContent = article.content;

  // Remove any existing key-takeaways div
  const keyTakeawaysRegex = /<div class="key-takeaways">[\s\S]*?<\/div>\s*/gi;
  cleanContent = cleanContent.replace(keyTakeawaysRegex, '');

  // Also remove any standalone "Key Takeaways:" text at the start
  cleanContent = cleanContent.replace(/^Key Takeaways:[\s\S]*?(?=<[a-z])/i, '');

  // Prepend new Key Takeaways
  const updatedContent = keyTakeawaysHTML + cleanContent.trim();

  await prisma.tarotArticle.update({
    where: { id: article.id },
    data: { content: updatedContent },
  });

  console.log('\n✓ UPDATED: King of Swords article with Key Takeaways');

  await prisma.$disconnect();
}

main().catch(console.error);
