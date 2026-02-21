/**
 * Fix all placeholder links in tarot articles
 * Converts [INSERT ...] placeholders to proper shortcodes
 */
import prisma from '../src/db/prisma.js';

// Map of card names to their slugs
const CARD_SLUG_MAP: Record<string, string> = {
  // Major Arcana
  'the fool': 'the-fool-tarot-card-meaning',
  'the magician': 'the-magician-tarot-card-meaning',
  'the high priestess': 'high-priestess-tarot-card-meaning',
  'the empress': 'the-empress-tarot-card-meaning',
  'the emperor': 'the-emperor-tarot-card-meaning',
  'the hierophant': 'the-hierophant-tarot-card-meaning',
  'the lovers': 'the-lovers-tarot-card-meaning',
  'the chariot': 'the-chariot-tarot-card-meaning',
  strength: 'strength-tarot-card-meaning',
  'the hermit': 'the-hermit-tarot-card-meaning',
  'wheel of fortune': 'wheel-of-fortune-tarot-card-meaning',
  'the wheel of fortune': 'wheel-of-fortune-tarot-card-meaning',
  justice: 'justice-tarot-card-meaning',
  'the hanged man': 'the-hanged-man-tarot-card-meaning',
  death: 'death-tarot-card-meaning',
  temperance: 'temperance-tarot-card-meaning',
  'the devil': 'the-devil-tarot-card-meaning',
  'the tower': 'the-tower-tarot-card-meaning',
  tower: 'the-tower-tarot-card-meaning',
  'the star': 'the-star-tarot-card-meaning',
  'the moon': 'the-moon-tarot-card-meaning',
  'the sun': 'the-sun-tarot-card-meaning',
  judgement: 'judgement-tarot-card-meaning',
  'the world': 'the-world-tarot-card-meaning',
  'major arcana': 'major-arcana',
};

function getSlugForCardName(
  name: string
): { type: 'tarot' | 'blog' | 'spread'; slug: string } | null {
  const lowerName = name.toLowerCase().trim();

  // Check direct mapping first
  if (CARD_SLUG_MAP[lowerName]) {
    if (lowerName === 'major arcana') {
      return { type: 'spread', slug: 'major-arcana' };
    }
    return { type: 'tarot', slug: CARD_SLUG_MAP[lowerName] };
  }

  // Handle minor arcana cards (e.g., "3 of Wands", "Knight of Cups")
  const minorMatch = lowerName.match(
    /^(ace|2|3|4|5|6|7|8|9|10|page|knight|queen|king)\s+of\s+(wands|cups|swords|pentacles)$/
  );
  if (minorMatch) {
    const rank = minorMatch[1];
    const suit = minorMatch[2];
    return { type: 'tarot', slug: `${rank}-of-${suit}-tarot-card-meaning` };
  }

  // Handle suit guides
  if (lowerName.includes('suit of wands') || lowerName === 'suit of wands guide') {
    return { type: 'blog', slug: 'suit-of-wands-tarot-guide' };
  }
  if (lowerName.includes('suit of cups') || lowerName === 'suit of cups guide') {
    return { type: 'blog', slug: 'suit-of-cups-tarot-guide' };
  }
  if (lowerName.includes('suit of swords') || lowerName === 'suit of swords guide') {
    return { type: 'blog', slug: 'suit-of-swords-tarot-guide' };
  }
  if (lowerName.includes('suit of pentacles') || lowerName === 'suit of pentacles guide') {
    return { type: 'blog', slug: 'suit-of-pentacles-tarot-guide' };
  }

  // Handle Major Arcana Guide
  if (lowerName.includes('major arcana guide')) {
    return { type: 'spread', slug: 'major-arcana' };
  }

  return null;
}

async function fixPlaceholderLinks() {
  console.log('🔄 Fixing all placeholder links in tarot articles...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, content: true },
    orderBy: { slug: 'asc' },
  });

  // Pattern to match placeholder links
  const placeholderPattern = /<a[^>]*href="\[INSERT[^\]]*\]"[^>]*>([^<]+)<\/a>/gi;

  let totalFixed = 0;
  let totalFailed = 0;
  let articlesFixed = 0;

  for (const article of articles) {
    if (!article.content) continue;

    let content = article.content;
    let linksFixed = 0;
    let linksFailed = 0;

    // Find all placeholder links
    const matches = [...article.content.matchAll(placeholderPattern)];

    if (matches.length === 0) continue;

    for (const match of matches) {
      const fullMatch = match[0];
      let linkText = match[1];

      // Clean up link text (remove nested shortcodes if present)
      linkText = linkText.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1');

      // Special case: "Get a Single Card Reading" -> spread link
      if (linkText.toLowerCase().includes('single card reading')) {
        const shortcode = '[[spread:single-card-reading|Get a Single Card Reading]]';
        content = content.replace(fullMatch, shortcode);
        linksFixed++;
        continue;
      }

      // Try to find the slug for this card name
      const result = getSlugForCardName(linkText);

      if (result) {
        const shortcode = `[[${result.type}:${result.slug}|${linkText}]]`;
        content = content.replace(fullMatch, shortcode);
        linksFixed++;
      } else {
        console.log(`  ⚠️  Could not resolve: "${linkText}" in ${article.slug}`);
        linksFailed++;
      }
    }

    if (linksFixed > 0) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: { content },
      });
      console.log(
        `✅ ${article.slug} - Fixed ${linksFixed} links${linksFailed > 0 ? `, ${linksFailed} failed` : ''}`
      );
      totalFixed += linksFixed;
      totalFailed += linksFailed;
      articlesFixed++;
    } else if (linksFailed > 0) {
      console.log(`❌ ${article.slug} - ${linksFailed} links failed`);
      totalFailed += linksFailed;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Articles fixed: ${articlesFixed}`);
  console.log(`Total links fixed: ${totalFixed}`);
  console.log(`Total links failed: ${totalFailed}`);

  await prisma.$disconnect();
}

fixPlaceholderLinks();
