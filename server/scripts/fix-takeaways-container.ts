/**
 * Fix Key Takeaways containers - wrap the section in a container div
 */
import prisma from '../src/db/prisma.js';

async function fixTakeawaysContainer() {
  console.log('🔄 Fixing Key Takeaways containers...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, content: true },
    orderBy: { slug: 'asc' },
  });

  let fixed = 0;
  let alreadyHas = 0;
  let noTakeaways = 0;

  for (const article of articles) {
    if (!article.content) continue;

    let content = article.content;

    // Check if already has container
    if (content.includes('key-takeaways-container')) {
      alreadyHas++;
      continue;
    }

    // Find Key Takeaways header
    const headerMatch = content.match(/<h2[^>]*>Key Takeaways[^<]*<\/h2>/i);
    if (!headerMatch) {
      noTakeaways++;
      continue;
    }

    const headerIndex = content.indexOf(headerMatch[0]);
    const afterHeader = content.slice(headerIndex + headerMatch[0].length);

    // Find where the Key Takeaways section ends
    // It typically ends at the first <img> with centered alignment or next <h2>
    // The pattern is: h2 header -> bullet points (p tags) -> empty p -> intro paragraph

    // Look for:
    // 1. An empty <p></p> followed by paragraph starting with "A " or "The "
    // 2. A centered image tag
    // 3. Next h2 heading
    const endMatch = afterHeader.match(
      /<p><\/p>\s*<p>(?:A |The |In |When |This )|<img[^>]*class="[^"]*align-center|<h2[^>]*>(?!Key Takeaways)/i
    );

    let endIndex: number;
    if (endMatch && endMatch.index !== undefined) {
      endIndex = endMatch.index;
    } else {
      // Fallback: find after all the bullet point paragraphs
      // Count consecutive <p><strong>xxx:</strong> items
      const bulletPattern = /<p><strong>[^<]+:<\/strong>[^<]*<\/p>/g;
      let lastBulletEnd = 0;
      let match;
      while ((match = bulletPattern.exec(afterHeader)) !== null) {
        lastBulletEnd = match.index + match[0].length;
      }
      endIndex = lastBulletEnd > 0 ? lastBulletEnd : 200;
    }

    const takeawaysContent = afterHeader.slice(0, endIndex);
    const afterTakeaways = afterHeader.slice(endIndex);

    // Wrap in container
    const wrappedContent = `<div class="key-takeaways-container">
${headerMatch[0]}${takeawaysContent}</div>`;

    content = content.slice(0, headerIndex) + wrappedContent + afterTakeaways;

    await prisma.tarotArticle.update({
      where: { id: article.id },
      data: { content },
    });

    console.log(`✅ Fixed: ${article.slug}`);
    fixed++;
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Fixed: ${fixed}`);
  console.log(`Already had container: ${alreadyHas}`);
  console.log(`No Key Takeaways section: ${noTakeaways}`);

  await prisma.$disconnect();
}

fixTakeawaysContainer();
