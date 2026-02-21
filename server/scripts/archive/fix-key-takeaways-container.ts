/**
 * Script to wrap Key Takeaways sections in a container div
 * for articles that don't have it
 */
import prisma from '../src/db/prisma.js';

async function fixKeyTakeawaysContainer() {
  console.log('🔄 Fixing Key Takeaways containers in tarot articles...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, content: true },
    orderBy: { slug: 'asc' },
  });

  let fixed = 0;
  let skipped = 0;
  let noKeyTakeaways = 0;

  for (const article of articles) {
    if (!article.content) continue;

    // Skip if already has container
    if (article.content.includes('class="key-takeaways"')) {
      skipped++;
      continue;
    }

    // Find Key Takeaways heading
    const headingMatch = article.content.match(
      /<h([23])([^>]*)>([^<]*[Kk]ey [Tt]ake[- ]?[Aa]way[^<]*)<\/h\1>/i
    );

    if (!headingMatch) {
      noKeyTakeaways++;
      continue;
    }

    const headingText = headingMatch[3];
    const fullHeading = headingMatch[0];

    // Find where the heading starts
    const headingStartIndex = article.content.indexOf(fullHeading);

    // Find all the <p> elements that follow the heading (Key Takeaways content)
    // They typically contain <strong>Label:</strong> content
    // Stop when we hit another h2, an image, or content that doesn't match the pattern
    const contentAfterHeading = article.content.substring(headingStartIndex + fullHeading.length);

    // Extract consecutive <p> tags that contain the key takeaways format
    const keyTakeawaysParagraphs: string[] = [];
    const pRegex = /<p>(<strong>[^<]+:<\/strong>[^<]*)<\/p>/g;

    let match;
    let lastIndex = 0;

    // Check each element after the heading
    while ((match = pRegex.exec(contentAfterHeading)) !== null) {
      // Make sure we're not skipping content (check for h2/img between matches)
      const textBetween = contentAfterHeading.substring(lastIndex, match.index);
      if (/<h2|<img|<h3(?![^>]*[Kk]ey)/i.test(textBetween)) {
        break;
      }

      keyTakeawaysParagraphs.push(match[0]);
      lastIndex = match.index + match[0].length;

      // Stop after "Best Advice" which is typically the last item
      if (match[1].includes('Best Advice')) {
        break;
      }
    }

    if (keyTakeawaysParagraphs.length === 0) {
      console.log(`⚠️  ${article.slug} - no paragraphs found after heading`);
      continue;
    }

    // Build the wrapped content
    const wrappedContent = `<div class="key-takeaways">\n<h2>${headingText}</h2>\n${keyTakeawaysParagraphs.join('\n')}\n</div>`;

    // Calculate what to replace
    const originalContent = fullHeading + keyTakeawaysParagraphs.join('');

    // Replace in the content
    const newContent = article.content.replace(originalContent, wrappedContent);

    if (newContent !== article.content) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: { content: newContent },
      });
      console.log(`✅ ${article.slug} - wrapped ${keyTakeawaysParagraphs.length} paragraphs`);
      fixed++;
    } else {
      console.log(`⚠️  ${article.slug} - no changes made`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Fixed: ${fixed}`);
  console.log(`Already had container: ${skipped}`);
  console.log(`No Key Takeaways section: ${noKeyTakeaways}`);

  await prisma.$disconnect();
}

fixKeyTakeawaysContainer();
