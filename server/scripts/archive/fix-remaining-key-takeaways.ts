/**
 * Fix remaining Key Takeaways sections that weren't caught by the first script
 * These articles have h2 headings with paragraphs directly adjacent (no whitespace)
 */
import prisma from '../src/db/prisma.js';

const ARTICLES_TO_FIX = [
  'wheel-of-fortune-tarot-card-meaning',
  'justice-tarot-card-meaning',
  'the-hanged-man-tarot-card-meaning',
  'death-tarot-card-meaning',
  'temperance-tarot-card-meaning',
  'the-devil-tarot-card-meaning',
  'the-tower-tarot-card-meaning',
  'the-star-tarot-card-meaning',
  'the-moon-tarot-card-meaning',
  'the-sun-tarot-card-meaning',
  'judgement-tarot-card-meaning',
  'the-world-tarot-card-meaning',
  'the-chariot-tarot-card-meaning',
  'strength-tarot-card-meaning',
  'the-hermit-tarot-card-meaning',
];

async function fixRemainingKeyTakeaways() {
  console.log('🔄 Fixing remaining Key Takeaways containers...\n');

  let fixed = 0;
  let failed = 0;

  for (const slug of ARTICLES_TO_FIX) {
    const article = await prisma.tarotArticle.findFirst({
      where: { slug },
      select: { id: true, slug: true, content: true },
    });

    if (!article?.content) {
      console.log(`❌ ${slug} - Not found`);
      failed++;
      continue;
    }

    // Already has container?
    if (article.content.includes('class="key-takeaways"')) {
      console.log(`⏭️  ${slug} - Already has container`);
      continue;
    }

    // Find the Key Takeaways heading (h2 or h3)
    const headingRegex = /<h([23])([^>]*)>([^<]*Key Takeaways[^<]*)<\/h\1>/i;
    const headingMatch = article.content.match(headingRegex);

    if (!headingMatch) {
      console.log(`❌ ${slug} - No Key Takeaways heading found`);
      failed++;
      continue;
    }

    const fullHeading = headingMatch[0];
    const headingText = headingMatch[3];
    const headingIndex = article.content.indexOf(fullHeading);

    // Get content after the heading
    const afterHeading = article.content.substring(headingIndex + fullHeading.length);

    // Extract consecutive <p><strong>Label:</strong>...</p> paragraphs
    // Stop when we hit "Best Advice" or when we encounter a non-matching element
    const paragraphs: string[] = [];
    let pos = 0;

    while (pos < afterHeading.length) {
      // Skip whitespace
      while (pos < afterHeading.length && /\s/.test(afterHeading[pos])) {
        pos++;
      }

      // Check if next element is a <p><strong>...:</strong>...</p>
      const remaining = afterHeading.substring(pos);

      // Match <p><strong>Label:</strong> content</p> where content can include commas, dashes, etc.
      const pMatch = remaining.match(
        /^<p><strong>([^<]+):<\/strong>([^<]*(?:<[^>]+>[^<]*)*?)<\/p>/
      );

      if (!pMatch) {
        // Not a matching paragraph, stop
        break;
      }

      paragraphs.push(pMatch[0]);
      pos += pMatch[0].length;

      // If this was "Best Advice", we're done
      if (pMatch[1].includes('Best Advice')) {
        break;
      }
    }

    if (paragraphs.length === 0) {
      console.log(`❌ ${slug} - No Key Takeaways paragraphs found after heading`);
      failed++;
      continue;
    }

    // Build the original content to replace
    const originalContent = fullHeading + paragraphs.join('');

    // Build the wrapped content
    const wrappedContent = `<div class="key-takeaways">\n<h2>${headingText}</h2>\n${paragraphs.join('\n')}\n</div>`;

    // Replace in content
    const newContent = article.content.replace(originalContent, wrappedContent);

    if (newContent === article.content) {
      console.log(`❌ ${slug} - Replacement failed (content unchanged)`);
      failed++;
      continue;
    }

    // Update the database
    await prisma.tarotArticle.update({
      where: { id: article.id },
      data: { content: newContent },
    });

    console.log(`✅ ${slug} - Wrapped ${paragraphs.length} paragraphs`);
    fixed++;
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Fixed: ${fixed}`);
  console.log(`Failed: ${failed}`);

  await prisma.$disconnect();
}

fixRemainingKeyTakeaways();
