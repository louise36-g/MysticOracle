/**
 * Fix CTA links in all tarot articles
 * Changes:
 * - "Get a Single Card Reading" -> "Try out a reading"
 * - URL: /reading/single -> /reading
 *
 * Handles both shortcode format and HTML link format
 */
import prisma from '../src/db/prisma.js';

async function fixCTALinks() {
  console.log('🔄 Fixing CTA links in all tarot articles...\n');

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

    // Pattern 1: Shortcode format [[spread:single-card-reading|Get a Single Card Reading]]
    const shortcodePattern = /\[\[spread:single-card-reading\|[^\]]+\]\]/gi;

    // Pattern 2: Already converted HTML link with /reading/single
    const htmlPattern = /<a[^>]*href="\/reading\/single"[^>]*>[^<]*<\/a>/gi;

    // Pattern 3: CTA banner div (if any still exist)
    const ctaBannerPattern = /<div class="cta-banner"[^>]*>[\s\S]*?<\/div>/gi;

    // New CTA as a styled div with link to /reading
    const newCTAHtml = `<div class="cta-banner">
<h3>Ready to Discover Your Path?</h3>
<p>Let the tarot illuminate your journey with personalized guidance.</p>
<a href="/reading" class="btn">Try out a reading</a>
</div>`;

    const newCTAHtmlFr = `<div class="cta-banner">
<h3>Prêt à Découvrir Votre Chemin?</h3>
<p>Laissez le tarot éclairer votre voyage avec des conseils personnalisés.</p>
<a href="/reading" class="btn">Essayer une lecture</a>
</div>`;

    // Replace shortcodes in English content
    if (shortcodePattern.test(newContent)) {
      newContent = newContent.replace(shortcodePattern, newCTAHtml);
      contentUpdated = true;
    }

    // Replace HTML links in English content
    if (htmlPattern.test(newContent)) {
      newContent = newContent.replace(
        htmlPattern,
        '<a href="/reading" class="btn">Try out a reading</a>'
      );
      contentUpdated = true;
    }

    // Replace CTA banners that might have old links
    if (ctaBannerPattern.test(newContent)) {
      const oldContent = newContent;
      newContent = newContent.replace(ctaBannerPattern, match => {
        // Check if this CTA has a broken link
        if (
          match.includes('/reading/single') ||
          match.includes('Single Card Reading') ||
          match.includes('single-card')
        ) {
          return newCTAHtml;
        }
        return match; // Keep other CTAs as-is
      });
      if (oldContent !== newContent) {
        contentUpdated = true;
      }
    }

    // Also fix French content if it exists
    if (newContentFr) {
      if (shortcodePattern.test(newContentFr)) {
        newContentFr = newContentFr.replace(shortcodePattern, newCTAHtmlFr);
        contentUpdated = true;
      }
      if (htmlPattern.test(newContentFr)) {
        newContentFr = newContentFr.replace(
          htmlPattern,
          '<a href="/reading" class="btn">Essayer une lecture</a>'
        );
        contentUpdated = true;
      }
    }

    if (contentUpdated) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: {
          content: newContent,
          contentFr: newContentFr || undefined,
        },
      });
      console.log(`✅ Fixed: ${article.slug}`);
      articlesFixed++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total articles checked: ${articles.length}`);
  console.log(`Articles fixed: ${articlesFixed}`);

  await prisma.$disconnect();
}

fixCTALinks().catch(console.error);
