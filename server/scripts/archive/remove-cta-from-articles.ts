/**
 * Remove CTA banners from all tarot articles
 * Since we now render the CTA dynamically in the React component,
 * we need to remove the static CTA HTML from article content
 */
import prisma from '../src/db/prisma.js';

async function removeCTAFromArticles() {
  console.log('🔄 Removing CTA banners from all tarot articles...\n');

  const articles = await prisma.tarotArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, content: true, contentFr: true },
    orderBy: { slug: 'asc' },
  });

  let articlesFixed = 0;

  for (const article of articles) {
    let contentUpdated = false;
    let newContent = article.content || '';
    let newContentFr = article.contentFr || '';

    // Pattern to match CTA banner divs (handles multiline)
    const ctaBannerPattern = /<div\s+class="cta-banner"[^>]*>[\s\S]*?<\/div>/gi;

    // Also match any remaining "Ready to Discover" sections that might not be in a div
    const readyToDiscoverPattern =
      /<h3[^>]*>\s*Ready to Discover[^<]*<\/h3>\s*<p[^>]*>[^<]*<\/p>\s*<a[^>]*>[^<]*<\/a>/gi;
    const readyToDiscoverPatternFr =
      /<h3[^>]*>\s*Prêt à Découvrir[^<]*<\/h3>\s*<p[^>]*>[^<]*<\/p>\s*<a[^>]*>[^<]*<\/a>/gi;

    // Remove CTA banners from English content
    if (ctaBannerPattern.test(newContent)) {
      newContent = newContent.replace(ctaBannerPattern, '');
      contentUpdated = true;
    }

    // Remove loose "Ready to Discover" sections
    if (readyToDiscoverPattern.test(newContent)) {
      newContent = newContent.replace(readyToDiscoverPattern, '');
      contentUpdated = true;
    }

    // Remove CTA banners from French content
    if (newContentFr) {
      if (ctaBannerPattern.test(newContentFr)) {
        newContentFr = newContentFr.replace(ctaBannerPattern, '');
        contentUpdated = true;
      }

      if (readyToDiscoverPatternFr.test(newContentFr)) {
        newContentFr = newContentFr.replace(readyToDiscoverPatternFr, '');
        contentUpdated = true;
      }
    }

    // Clean up any double newlines left behind
    newContent = newContent.replace(/\n{3,}/g, '\n\n').trim();
    if (newContentFr) {
      newContentFr = newContentFr.replace(/\n{3,}/g, '\n\n').trim();
    }

    if (contentUpdated) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: {
          content: newContent,
          contentFr: newContentFr || undefined,
        },
      });
      console.log(`✅ Cleaned: ${article.slug}`);
      articlesFixed++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total articles checked: ${articles.length}`);
  console.log(`Articles cleaned: ${articlesFixed}`);

  await prisma.$disconnect();
}

removeCTAFromArticles().catch(console.error);
