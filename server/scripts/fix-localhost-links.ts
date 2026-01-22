/**
 * Script to fix localhost URLs in internal links
 *
 * Converts raw HTML links like:
 *   <a href="http://localhost:3000/tarot/articles/slug">Text</a>
 * To shortcodes like:
 *   [[tarot:slug|Text]]
 *
 * Also handles relative URLs like /tarot/articles/slug
 */
import prisma from '../src/db/prisma.js';

interface FixedLink {
  originalUrl: string;
  text: string;
  shortcode: string;
}

async function fixLocalhostLinks() {
  console.log('🔄 Fixing localhost/relative URLs in internal links...\n');

  // Get all tarot articles
  const tarotArticles = await prisma.tarotArticle.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, content: true, title: true },
  });

  // Get all blog posts
  const blogPosts = await prisma.blogPost.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, contentEn: true, contentFr: true, titleEn: true },
  });

  // Build a lookup of slugs to types
  const tarotSlugs = new Set(tarotArticles.map(a => a.slug));
  const blogSlugs = new Set(blogPosts.map(p => p.slug));

  // Regex to match <a> tags with localhost or internal URLs
  const linkRegex = /<a[^>]*href="((?:https?:\/\/localhost[:\d]*)?\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;

  let tarotFixed = 0;
  let blogFixed = 0;

  // Fix tarot articles
  for (const article of tarotArticles) {
    if (!article.content) continue;

    const fixes: FixedLink[] = [];
    const newContent = article.content.replace(linkRegex, (match, url, text) => {
      const shortcode = urlToShortcode(url, text, tarotSlugs, blogSlugs);
      if (shortcode) {
        fixes.push({ originalUrl: url, text, shortcode });
        return shortcode;
      }
      return match; // Keep original if can't convert
    });

    if (fixes.length > 0) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: { content: newContent },
      });
      console.log(`✅ Fixed ${article.slug}:`);
      fixes.forEach(f => console.log(`   ${f.originalUrl} -> ${f.shortcode}`));
      tarotFixed++;
    }
  }

  // Fix blog posts (both EN and FR content)
  for (const post of blogPosts) {
    const fixes: { field: string; fixes: FixedLink[] }[] = [];

    // Fix English content
    if (post.contentEn) {
      const enFixes: FixedLink[] = [];
      const newContentEn = post.contentEn.replace(linkRegex, (match, url, text) => {
        const shortcode = urlToShortcode(url, text, tarotSlugs, blogSlugs);
        if (shortcode) {
          enFixes.push({ originalUrl: url, text, shortcode });
          return shortcode;
        }
        return match;
      });

      if (enFixes.length > 0) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { contentEn: newContentEn },
        });
        fixes.push({ field: 'contentEn', fixes: enFixes });
      }
    }

    // Fix French content
    if (post.contentFr) {
      const frFixes: FixedLink[] = [];
      const newContentFr = post.contentFr.replace(linkRegex, (match, url, text) => {
        const shortcode = urlToShortcode(url, text, tarotSlugs, blogSlugs);
        if (shortcode) {
          frFixes.push({ originalUrl: url, text, shortcode });
          return shortcode;
        }
        return match;
      });

      if (frFixes.length > 0) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { contentFr: newContentFr },
        });
        fixes.push({ field: 'contentFr', fixes: frFixes });
      }
    }

    if (fixes.length > 0) {
      console.log(`✅ Fixed ${post.slug}:`);
      fixes.forEach(f => {
        f.fixes.forEach(fix =>
          console.log(`   [${f.field}] ${fix.originalUrl} -> ${fix.shortcode}`)
        );
      });
      blogFixed++;
    }
  }

  console.log(`\n✨ Done! Fixed ${tarotFixed} tarot articles and ${blogFixed} blog posts.`);
  await prisma.$disconnect();
}

function urlToShortcode(
  url: string,
  text: string,
  tarotSlugs: Set<string>,
  blogSlugs: Set<string>
): string | null {
  // Remove localhost prefix if present
  const cleanUrl = url.replace(/^https?:\/\/localhost[:\d]*/, '');

  // Match /tarot/articles/slug pattern
  const tarotMatch = cleanUrl.match(/^\/tarot\/articles\/([a-z0-9-]+)\/?$/);
  if (tarotMatch) {
    const slug = tarotMatch[1];
    if (tarotSlugs.has(slug)) {
      return `[[tarot:${slug}|${text}]]`;
    }
  }

  // Match /blog/slug pattern
  const blogMatch = cleanUrl.match(/^\/blog\/([a-z0-9-]+)\/?$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    if (blogSlugs.has(slug)) {
      return `[[blog:${slug}|${text}]]`;
    }
  }

  // Match /tarot/spread-slug pattern (for spread pages)
  const spreadMatch = cleanUrl.match(/^\/tarot\/([a-z0-9-]+)\/?$/);
  if (spreadMatch) {
    const slug = spreadMatch[1];
    // Only convert known spread/category slugs
    const validSpreads = [
      'single-card-reading',
      'three-card-reading',
      'love-spread',
      'career-spread',
      'horseshoe-spread',
      'celtic-cross',
      'wands',
      'cups',
      'swords',
      'pentacles',
      'major-arcana',
      'minor-arcana',
    ];
    if (validSpreads.includes(slug)) {
      return `[[spread:${slug}|${text}]]`;
    }
  }

  return null; // Can't convert this URL
}

fixLocalhostLinks();
