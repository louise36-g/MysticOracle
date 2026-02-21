/**
 * Fix all remaining issues:
 * 1. Wrong link formats (/tarot/major-arcana/xxx, /tarot-readings/xxx, /tarot/suit-of-xxx)
 * 2. Missing FAQ headers
 */
import prisma from '../src/db/prisma.js';

// Map for major arcana card names to slugs
const MAJOR_ARCANA_MAP: Record<string, string> = {
  'the-fool': 'the-fool-tarot-card-meaning',
  'the-magician': 'the-magician-tarot-card-meaning',
  'the-high-priestess': 'high-priestess-tarot-card-meaning',
  'the-empress': 'the-empress-tarot-card-meaning',
  'the-emperor': 'the-emperor-tarot-card-meaning',
  'the-hierophant': 'the-hierophant-tarot-card-meaning',
  'the-lovers': 'the-lovers-tarot-card-meaning',
  'the-chariot': 'the-chariot-tarot-card-meaning',
  strength: 'strength-tarot-card-meaning',
  'the-hermit': 'the-hermit-tarot-card-meaning',
  'wheel-of-fortune': 'wheel-of-fortune-tarot-card-meaning',
  justice: 'justice-tarot-card-meaning',
  'the-hanged-man': 'the-hanged-man-tarot-card-meaning',
  death: 'death-tarot-card-meaning',
  temperance: 'temperance-tarot-card-meaning',
  'the-devil': 'the-devil-tarot-card-meaning',
  'the-tower': 'the-tower-tarot-card-meaning',
  'the-star': 'the-star-tarot-card-meaning',
  'the-moon': 'the-moon-tarot-card-meaning',
  'the-sun': 'the-sun-tarot-card-meaning',
  judgement: 'judgement-tarot-card-meaning',
  'the-world': 'the-world-tarot-card-meaning',
};

// Suit guide mappings
const SUIT_GUIDE_MAP: Record<string, string> = {
  cups: 'suit-of-cups-tarot-guide',
  'cups-meaning': 'suit-of-cups-tarot-guide',
  'cups-guide': 'suit-of-cups-tarot-guide',
  wands: 'suit-of-wands-tarot-guide',
  'wands-meaning': 'suit-of-wands-tarot-guide',
  'wands-guide': 'suit-of-wands-tarot-guide',
  swords: 'suit-of-swords-tarot-guide',
  'swords-meaning': 'suit-of-swords-tarot-guide',
  'swords-guide': 'suit-of-swords-tarot-guide',
  pentacles: 'suit-of-pentacles-tarot-guide',
  'pentacles-meaning': 'suit-of-pentacles-tarot-guide',
  'pentacles-guide': 'suit-of-pentacles-tarot-guide',
};

async function fixAllRemainingIssues() {
  console.log('🔄 Fixing all remaining issues...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, content: true, title: true },
    orderBy: { slug: 'asc' },
  });

  let linksFixed = 0;
  let faqHeadersAdded = 0;
  let articlesModified = 0;

  for (const article of articles) {
    if (!article.content) continue;

    let content = article.content;
    let modified = false;

    // 1. Fix /tarot/major-arcana/xxx links
    const majorArcanaPattern = /<a[^>]*href="\/tarot\/major-arcana\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    const majorMatches = [...content.matchAll(majorArcanaPattern)];
    for (const match of majorMatches) {
      const fullMatch = match[0];
      const cardSlug = match[1];
      const linkText = match[2];
      const correctSlug = MAJOR_ARCANA_MAP[cardSlug];
      if (correctSlug) {
        const shortcode = `[[tarot:${correctSlug}|${linkText}]]`;
        content = content.replace(fullMatch, shortcode);
        console.log(`  ✅ Fixed major-arcana link: ${cardSlug}`);
        linksFixed++;
        modified = true;
      }
    }

    // 2. Fix /tarot/readings/single-card links
    const readingsPattern1 = /<a[^>]*href="\/tarot\/readings\/single-card"[^>]*>[^<]+<\/a>/gi;
    const readingsMatches1 = content.match(readingsPattern1);
    if (readingsMatches1) {
      for (const m of readingsMatches1) {
        const shortcode = '[[spread:single-card-reading|Get a Single Card Reading]]';
        content = content.replace(m, shortcode);
        console.log(`  ✅ Fixed /tarot/readings/single-card link`);
        linksFixed++;
        modified = true;
      }
    }

    // 3. Fix /tarot-readings/single-card links
    const readingsPattern2 = /<a[^>]*href="\/tarot-readings\/single-card\/?"[^>]*>[^<]+<\/a>/gi;
    const readingsMatches2 = content.match(readingsPattern2);
    if (readingsMatches2) {
      for (const m of readingsMatches2) {
        const shortcode = '[[spread:single-card-reading|Get a Single Card Reading]]';
        content = content.replace(m, shortcode);
        console.log(`  ✅ Fixed /tarot-readings/single-card link`);
        linksFixed++;
        modified = true;
      }
    }

    // 4. Fix /tarot/suit-of-xxx links
    const suitPattern = /<a[^>]*href="\/tarot\/suit-of-([^"/]+)\/?"[^>]*>([^<]+)<\/a>/gi;
    const suitMatches = [...content.matchAll(suitPattern)];
    for (const m of suitMatches) {
      const suitSlug = m[1];
      let linkText = m[2];
      // Clean nested shortcodes from link text
      linkText = linkText.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1');
      const correctSlug = SUIT_GUIDE_MAP[suitSlug];
      if (correctSlug) {
        const shortcode = `[[blog:${correctSlug}|${linkText}]]`;
        content = content.replace(m[0], shortcode);
        console.log(`  ✅ Fixed suit link: suit-of-${suitSlug}`);
        linksFixed++;
        modified = true;
      } else {
        console.log(`  ⚠️  Unknown suit: ${suitSlug}`);
      }
    }

    // 5. Add FAQ header if missing
    const hasFaqQuestions = /<h3>(?:What does|Is .+ a yes|What zodiac)/i.test(content);
    const hasFaqHeader = content.toLowerCase().includes('frequently asked');

    if (hasFaqQuestions && !hasFaqHeader) {
      // Find the first FAQ question
      const firstQuestionMatch = content.match(
        /<h3>(What does|Is .+ a yes|What zodiac)[^<]*<\/h3>/i
      );
      if (firstQuestionMatch && firstQuestionMatch.index !== undefined) {
        // Get card name from article title
        const cardName = article.title.replace(/:.+$/, '').trim();
        const faqHeader = `<h2 style="text-align: center;">Frequently Asked Questions About ${cardName}</h2>`;
        content =
          content.slice(0, firstQuestionMatch.index) +
          faqHeader +
          content.slice(firstQuestionMatch.index);
        console.log(`  ✅ Added FAQ header for ${cardName}`);
        faqHeadersAdded++;
        modified = true;
      }
    }

    if (modified) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: { content },
      });
      console.log(`✅ ${article.slug} - updated\n`);
      articlesModified++;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Articles modified: ${articlesModified}`);
  console.log(`Links fixed: ${linksFixed}`);
  console.log(`FAQ headers added: ${faqHeadersAdded}`);

  await prisma.$disconnect();
}

fixAllRemainingIssues();
