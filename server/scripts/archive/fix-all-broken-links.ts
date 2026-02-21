/**
 * Fix all broken internal links in tarot articles
 * Converts raw HTML links with incorrect URLs to proper shortcodes
 */
import prisma from '../src/db/prisma.js';

async function fixAllBrokenLinks() {
  console.log('🔄 Fixing all broken internal links in tarot articles...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, content: true },
    orderBy: { slug: 'asc' },
  });

  // Pattern to find links that look like tarot article links but have wrong URLs
  // Captures the href slug and link text
  const brokenLinkPattern = /<a[^>]*href="\/([a-z0-9-]+-tarot-card-meaning)"[^>]*>([^<]+)<\/a>/gi;

  let totalFixed = 0;
  let articlesFixed = 0;

  for (const article of articles) {
    if (!article.content) continue;

    let content = article.content;
    let linksFixed = 0;

    // Find all broken links
    const matches = [...content.matchAll(brokenLinkPattern)];

    if (matches.length === 0) continue;

    for (const match of matches) {
      const fullMatch = match[0];
      const hrefSlug = match[1];
      const linkText = match[2];

      // Determine the correct slug
      // Some slugs need "the-" prefix (major arcana)
      // Some don't (minor arcana like ace-of-cups)
      let correctSlug = hrefSlug;

      // Check if this slug exists in the database
      const existingArticle = await prisma.tarotArticle.findFirst({
        where: { slug: hrefSlug, deletedAt: null },
        select: { slug: true },
      });

      if (!existingArticle) {
        // Try with "the-" prefix for major arcana
        const withThe = `the-${hrefSlug}`;
        const withTheArticle = await prisma.tarotArticle.findFirst({
          where: { slug: withThe, deletedAt: null },
          select: { slug: true },
        });

        if (withTheArticle) {
          correctSlug = withThe;
        } else {
          console.log(`  ⚠️  Could not find article for slug: ${hrefSlug}`);
          continue;
        }
      }

      // Create the shortcode
      const shortcode = `[[tarot:${correctSlug}|${linkText}]]`;

      // Replace in content
      content = content.replace(fullMatch, shortcode);
      linksFixed++;
    }

    if (linksFixed > 0) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: { content },
      });
      console.log(`✅ ${article.slug} - Fixed ${linksFixed} links`);
      totalFixed += linksFixed;
      articlesFixed++;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Articles fixed: ${articlesFixed}`);
  console.log(`Total links fixed: ${totalFixed}`);

  await prisma.$disconnect();
}

fixAllBrokenLinks();
