/**
 * Pre-render Script for CelestiArcana
 *
 * SAFETY RULES:
 * 1. Never fail the entire build - log errors and continue
 * 2. Always log what's happening
 * 3. Verify each file was created
 * 4. Print summary at end
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE = process.env.API_URL || process.env.VITE_API_URL || 'https://api.celestiarcana.com';
const API_TIMEOUT = 30000; // 30 seconds
const DIST_DIR = path.resolve(__dirname, '../dist');
const SITE_URL = 'https://celestiarcana.com';

// Detect staging environment
const COOLIFY_FQDN = process.env.COOLIFY_FQDN || '';
const IS_STAGING = COOLIFY_FQDN.includes('staging');

// Track results
const results = [];

// Track sitemap data
const sitemapData = {
  pages: [],
  cards: [],
  blog: [],
};

// Static pages that don't need API data
const STATIC_PAGES = [
  { path: '/about', title: 'About CelestiArcana', description: 'Discover the story behind CelestiArcana and our mission to bring tarot wisdom to everyone.' },
  { path: '/faq', title: 'Frequently Asked Questions', description: 'Find answers to common questions about tarot readings and CelestiArcana.' },
  { path: '/privacy', title: 'Privacy Policy', description: 'Learn how CelestiArcana protects your privacy and handles your data.' },
  { path: '/terms', title: 'Terms of Service', description: 'Read the terms and conditions for using CelestiArcana.' },
  { path: '/cookies', title: 'Cookie Policy', description: 'Understand how CelestiArcana uses cookies.' },
  { path: '/reading', title: 'Personalized Tarot Readings – Love, Career & Spiritual Guidance', description: 'Choose from six tarot reading themes — love & relationships, career, spiritual growth, personal development & more. Personalized readings with classic tarot spreads. Start your reading now.' },
  { path: '/contact', title: 'Contact Us', description: 'Get in touch with CelestiArcana. Send us a message about tarot readings, billing, feedback, or general enquiries.' },
  { path: '/how-credits-work', title: 'How Credits Work – Pricing & Free Credits', description: 'Learn how CelestiArcana credits work. Reading costs, free daily bonuses, referral rewards, and payment options. No subscriptions.' },
  { path: '/daily-tarot', title: 'Daily Tarot Card Draw — Today\'s Tarot & Astrology Energy', description: 'Draw your daily tarot card from the 22 Major Arcana. Discover today\'s tarot and astrological energy with a free single card draw. Tarot card of the day.' },
  { path: '/horoscopes', title: 'Daily Horoscopes for Every Zodiac Sign', description: "Read today's free daily horoscope for your zodiac sign. Personalized astrology insights for Aries, Taurus, Gemini & all 12 signs. Updated daily." },
  { path: '/blog', title: 'Mystic Insights Blog', description: 'Explore articles about tarot reading, card meanings, and spiritual guidance.' },
  { path: '/tarot', title: 'Tarot Card Meanings', description: 'Explore the meanings of all 78 tarot cards in the Rider-Waite deck.' },
  { path: '/tarot/cards', title: 'All 78 Tarot Card Meanings – Complete Guide', description: 'Explore all 78 tarot card meanings: Major Arcana, Wands, Cups, Swords, and Pentacles. Complete guide with symbolism and reading guidance.' },
  { path: '/tarot/cards/major-arcana', title: 'Major Arcana Tarot Card Meanings – Complete Guide', description: 'Explore every Major Arcana tarot card meaning. Symbolism, keywords, and reading guidance for each card.' },
  { path: '/tarot/cards/wands', title: 'Suit of Wands Tarot Card Meanings – Complete Guide', description: 'Explore every Suit of Wands tarot card meaning. Symbolism, keywords, and reading guidance for each card.' },
  { path: '/tarot/cards/cups', title: 'Suit of Cups Tarot Card Meanings – Complete Guide', description: 'Explore every Suit of Cups tarot card meaning. Symbolism, keywords, and reading guidance for each card.' },
  { path: '/tarot/cards/swords', title: 'Suit of Swords Tarot Card Meanings – Complete Guide', description: 'Explore every Suit of Swords tarot card meaning. Symbolism, keywords, and reading guidance for each card.' },
  { path: '/tarot/cards/pentacles', title: 'Suit of Pentacles Tarot Card Meanings – Complete Guide', description: 'Explore every Suit of Pentacles tarot card meaning. Symbolism, keywords, and reading guidance for each card.' },
];

async function main() {
  console.log('');
  console.log('=== Pre-render Starting ===');
  console.log(`API: ${API_BASE}`);
  console.log(`Output: ${DIST_DIR}`);
  console.log('');

  // Verify dist exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('ERROR: dist directory does not exist. Run vite build first.');
    process.exit(1);
  }

  // Read the template index.html
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('ERROR: dist/index.html does not exist.');
    process.exit(1);
  }
  const template = fs.readFileSync(indexPath, 'utf-8');

  // Phase 1: Static pages (no API needed)
  console.log('[Phase 1] Static pages...');
  await prerenderStaticPages(template);

  // Phase 2: Tarot articles (requires API)
  console.log('');
  console.log('[Phase 2] Tarot articles...');
  await prerenderTarotArticles(template);

  // Phase 3: Blog posts (requires API)
  console.log('');
  console.log('[Phase 3] Blog posts...');
  await prerenderBlogPosts(template);

  // Phase 4: Generate sitemaps
  console.log('');
  console.log('[Phase 4] Generating sitemaps...');
  await generateSitemaps();

  // Summary
  printSummary();
}

async function prerenderStaticPages(template) {
  const today = new Date().toISOString().split('T')[0];

  // Add homepage to sitemap (highest priority)
  sitemapData.pages.push({
    loc: SITE_URL + '/',
    lastmod: today,
    changefreq: 'daily',
    priority: '1.0',
  });

  // Add horoscope page
  sitemapData.pages.push({
    loc: SITE_URL + '/horoscopes',
    lastmod: today,
    changefreq: 'daily',
    priority: '0.9',
  });

  for (const page of STATIC_PAGES) {
    try {
      process.stdout.write(`  Generating ${page.path}... `);

      const html = generateStaticHtml(template, {
        title: `${page.title} | CelestiArcana`,
        description: page.description,
        url: `https://celestiarcana.com${page.path}`,
        path: page.path,
      });

      const outputPath = getOutputPath(page.path);
      ensureDirectoryExists(path.dirname(outputPath));
      fs.writeFileSync(outputPath, html);

      // Add to sitemap data
      const priority = page.path.includes('privacy') || page.path.includes('terms') || page.path.includes('cookies')
        ? '0.3'
        : page.path === '/tarot' || page.path === '/blog'
          ? '0.9'
          : '0.7';
      const changefreq = page.path.includes('privacy') || page.path.includes('terms') || page.path.includes('cookies')
        ? 'monthly'
        : 'weekly';

      sitemapData.pages.push({
        loc: SITE_URL + page.path,
        lastmod: today,
        changefreq,
        priority,
      });

      results.push({ success: true, path: page.path });
      console.log('✓');
    } catch (error) {
      results.push({ success: false, path: page.path, error: error.message });
      console.log('✗');
    }
  }
}

async function prerenderTarotArticles(template) {
  try {
    process.stdout.write('  Fetching article list from API... ');

    const response = await fetchWithTimeout(`${API_BASE}/api/v1/tarot-articles?limit=100`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const articles = data.articles || data.data || [];
    console.log(`fetched ${articles.length} articles`);

    for (const article of articles) {
      try {
        process.stdout.write(`  Generating /tarot/${article.slug}... `);

        // SSR-lite: fetch full article data to embed in HTML (eliminates API round-trip)
        let articleData = null;
        try {
          const articleResponse = await fetchWithTimeout(`${API_BASE}/api/v1/tarot-articles/${article.slug}`);
          if (articleResponse.ok) {
            articleData = await articleResponse.json();
          }
        } catch (fetchErr) {
          // Non-fatal: page still works without embedded data (falls back to API fetch)
          process.stdout.write('(no embed) ');
        }

        const html = generateStaticHtml(template, {
          title: `${article.title} | CelestiArcana`,
          description: article.metaDescription || article.excerpt || `Discover the meaning of ${article.title} in tarot readings.`,
          url: `https://celestiarcana.com/tarot/${article.slug}`,
          path: `/tarot/${article.slug}`,
          image: article.featuredImage || article.imageUrl,
          type: 'article',
          structuredData: generateTarotArticleSchema(article),
          articleData,
          articleTitle: article.title,
          articleExcerpt: article.excerpt || article.metaDescription,
        });

        const outputPath = getOutputPath(`/tarot/${article.slug}`);
        ensureDirectoryExists(path.dirname(outputPath));
        fs.writeFileSync(outputPath, html);

        // Add to sitemap data
        const lastmod = article.updatedAt
          ? new Date(article.updatedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        sitemapData.cards.push({
          loc: `${SITE_URL}/tarot/${article.slug}`,
          lastmod,
          changefreq: 'weekly',
          priority: '0.8',
        });

        results.push({ success: true, path: `/tarot/${article.slug}` });
        console.log('✓');
      } catch (error) {
        results.push({ success: false, path: `/tarot/${article.slug}`, error: error.message });
        console.log('✗');
      }
    }
  } catch (error) {
    console.log('✗');
    console.log(`  ERROR fetching tarot articles: ${error.message}`);
    results.push({ success: false, path: '/tarot/* (fetch)', error: error.message });
  }
}

async function prerenderBlogPosts(template) {
  try {
    process.stdout.write('  Fetching blog list from API... ');

    // Blog API uses pagination, fetch all pages
    let allPosts = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetchWithTimeout(`${API_BASE}/api/blog/posts?page=${page}`);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const posts = data.posts || [];
      allPosts = allPosts.concat(posts);

      // Check if there are more pages
      const pagination = data.pagination || {};
      hasMore = page < (pagination.totalPages || 1);
      page++;
    }

    const posts = allPosts;
    console.log(`fetched ${posts.length} posts`);

    for (const post of posts) {
      try {
        process.stdout.write(`  Generating /blog/${post.slug}... `);

        // Blog API uses titleEn/excerptEn fields (multi-language support)
        const title = post.titleEn || post.title || 'Blog Post';
        const description = post.metaDescriptionEn || post.excerptEn || post.excerpt || title;
        const image = post.coverImage || post.featuredImage;

        const html = generateStaticHtml(template, {
          title: `${title} | CelestiArcana Blog`,
          description: description,
          url: `https://celestiarcana.com/blog/${post.slug}`,
          path: `/blog/${post.slug}`,
          image: image,
          type: 'article',
        });

        const outputPath = getOutputPath(`/blog/${post.slug}`);
        ensureDirectoryExists(path.dirname(outputPath));
        fs.writeFileSync(outputPath, html);

        // Add to sitemap data
        const lastmod = post.updatedAt
          ? new Date(post.updatedAt).toISOString().split('T')[0]
          : post.publishedAt
            ? new Date(post.publishedAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
        sitemapData.blog.push({
          loc: `${SITE_URL}/blog/${post.slug}`,
          lastmod,
          changefreq: 'weekly',
          priority: '0.7',
        });

        results.push({ success: true, path: `/blog/${post.slug}` });
        console.log('✓');
      } catch (error) {
        results.push({ success: false, path: `/blog/${post.slug}`, error: error.message });
        console.log('✗');
      }
    }
  } catch (error) {
    console.log('✗');
    console.log(`  ERROR fetching blog posts: ${error.message}`);
    results.push({ success: false, path: '/blog/* (fetch)', error: error.message });
  }
}

function generateStaticHtml(template, options) {
  let html = template;

  // Replace title (update existing)
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(options.title)}</title>`
  );

  // Replace meta description (update existing)
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeHtml(options.description)}"`
  );

  // Replace canonical URL (update existing)
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${options.url}"`
  );

  // Replace Open Graph tags (update existing)
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${escapeHtml(options.title)}"`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${escapeHtml(options.description)}"`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${options.url}"`
  );
  html = html.replace(
    /<meta property="og:type" content="[^"]*"/,
    `<meta property="og:type" content="${options.type || 'website'}"`
  );
  if (options.image) {
    html = html.replace(
      /<meta property="og:image" content="[^"]*"/,
      `<meta property="og:image" content="${options.image}"`
    );
  }

  // Replace Twitter Card tags (update existing)
  html = html.replace(
    /<meta property="twitter:title" content="[^"]*"/,
    `<meta property="twitter:title" content="${escapeHtml(options.title)}"`
  );
  html = html.replace(
    /<meta property="twitter:description" content="[^"]*"/,
    `<meta property="twitter:description" content="${escapeHtml(options.description)}"`
  );
  if (options.image) {
    html = html.replace(
      /<meta property="twitter:image" content="[^"]*"/,
      `<meta property="twitter:image" content="${options.image}"`
    );
  }

  // Preload the cover image on desktop only (mobile LCP should be title text, not image)
  if (options.image && options.type === 'article') {
    const preloadUrl = buildCloudinaryPreloadUrl(options.image);
    html = html.replace(
      '</head>',
      `  <link rel="preload" as="image" href="${preloadUrl}" fetchpriority="high" media="(min-width: 769px)" />\n  </head>`
    );
  }

  // Add structured data if provided (append, as this is new content)
  if (options.structuredData) {
    html = html.replace(
      '</head>',
      `  <script type="application/ld+json">${JSON.stringify(options.structuredData)}</script>\n  </head>`
    );
  }

  // SSR-lite: Embed full article data as JSON so React skips the API fetch
  if (options.articleData) {
    // Escape </ sequences to prevent premature script tag closing
    const safeJson = JSON.stringify(options.articleData).replace(/<\//g, '<\\/');
    html = html.replace(
      '</body>',
      `  <script type="application/json" id="__ARTICLE_DATA__">${safeJson}</script>\n  </body>`
    );
  }

  // SSR-lite: Replace generic shell with article content so it paints at FCP (before JS loads)
  if (options.articleTitle && options.type === 'article') {
    const excerptTag = options.articleExcerpt
      ? `<p style="font-size:1rem;color:#cbd5e1;max-width:32rem;margin:0 auto 2rem">${escapeHtml(options.articleExcerpt)}</p>`
      : '';

    // Include article body content so it paints immediately (becomes LCP instead of waiting for JS)
    let contentHtml = '';
    if (options.articleData?.content) {
      // Lazy-load all content images so they don't compete for bandwidth
      contentHtml = options.articleData.content.replace(/<img /g, '<img loading="lazy" ');
    }

    const articleShell = `<main style="position:relative;z-index:10;flex:1">
          <div style="padding:1.5rem 1rem 1rem;position:relative">
            <article style="max-width:56rem;margin:0 auto">
              <div style="text-align:center">
                <h1 style="position:relative;text-align:center;font-size:2.25rem;font-family:'Cinzel',serif;font-weight:700;margin:0 0 1rem;line-height:1.1">
                  <span style="background:linear-gradient(to bottom,#fde68a,#e9d5ff,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${escapeHtml(options.articleTitle)}</span>
                </h1>
                ${excerptTag}
              </div>
              <div class="prose prose-invert prose-purple max-w-none">${contentHtml}</div>
            </article>
          </div>
        </main>`;

    html = html.replace(
      /<main style="[^"]*">[\s\S]*?<\/main>/,
      articleShell
    );
  }

  return html;
}

function generateTarotArticleSchema(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription || article.excerpt,
    image: article.imageUrl,
    author: {
      '@type': 'Organization',
      name: 'CelestiArcana',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CelestiArcana',
      logo: {
        '@type': 'ImageObject',
        url: 'https://celestiarcana.com/logo.png',
      },
    },
    datePublished: article.createdAt,
    dateModified: article.updatedAt || article.createdAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://celestiarcana.com/tarot/${article.slug}`,
    },
  };
}

/**
 * Build an optimized Cloudinary URL for preloading the LCP image.
 * Matches the transform used by FeaturedImage.tsx (600px CSS → 1200px retina, auto format).
 */
function buildCloudinaryPreloadUrl(url) {
  if (!url) return url;
  const match = url.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)/);
  if (!match) return url;
  const [, base, rest] = match;
  return `${base}f_auto,q_auto:best,w_1200,c_limit/${rest}`;
}

function getOutputPath(urlPath) {
  // /about -> /dist/about/index.html
  // /tarot/the-fool -> /dist/tarot/the-fool/index.html
  const cleanPath = urlPath.replace(/^\//, '').replace(/\/$/, '');
  return path.join(DIST_DIR, cleanPath, 'index.html');
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function generateSitemaps() {
  const today = new Date().toISOString().split('T')[0];

  // Generate sitemap-pages.xml
  process.stdout.write('  Generating sitemap-pages.xml... ');
  const pagesXml = generateSitemapXml(sitemapData.pages);
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-pages.xml'), pagesXml);
  console.log(`✓ (${sitemapData.pages.length} URLs)`);

  // Generate sitemap-cards.xml
  process.stdout.write('  Generating sitemap-cards.xml... ');
  const cardsXml = generateSitemapXml(sitemapData.cards);
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-cards.xml'), cardsXml);
  console.log(`✓ (${sitemapData.cards.length} URLs)`);

  // Generate sitemap-blog.xml
  process.stdout.write('  Generating sitemap-blog.xml... ');
  const blogXml = generateSitemapXml(sitemapData.blog);
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-blog.xml'), blogXml);
  console.log(`✓ (${sitemapData.blog.length} URLs)`);

  // Generate sitemap.xml (sitemap index)
  process.stdout.write('  Generating sitemap.xml (index)... ');
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-cards.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-blog.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), indexXml);
  console.log('✓');

  // Track sitemap generation in results
  results.push({ success: true, path: '/sitemap.xml' });
  results.push({ success: true, path: '/sitemap-pages.xml' });
  results.push({ success: true, path: '/sitemap-cards.xml' });
  results.push({ success: true, path: '/sitemap-blog.xml' });

  // Generate robots.txt (different for staging vs production)
  if (IS_STAGING) {
    process.stdout.write('  Generating robots.txt (staging - blocking crawlers)... ');
    const stagingRobots = `# STAGING ENVIRONMENT - DO NOT INDEX
# This is a staging/preview site. Do not index.

User-agent: *
Disallow: /

# No sitemap for staging - this is not the production site
`;
    fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), stagingRobots);
    console.log('✓');
  } else {
    process.stdout.write('  Generating robots.txt (production)... ');
    const productionRobots = `# CelestiArcana Robots.txt
# https://www.robotstxt.org/

User-agent: *
Allow: /
Allow: /blog
Allow: /blog/*
Allow: /tarot
Allow: /tarot/*
Allow: /horoscopes
Allow: /reading

# Disallow admin and private areas
Disallow: /admin
Disallow: /admin/*
Disallow: /api/
Disallow: /payment/
Disallow: /profile
Disallow: /reading/

# Auth pages (Clerk) — no value in search results
Disallow: /sign-in
Disallow: /sign-up

# Static assets — don't waste crawl budget
Disallow: /fonts/
Disallow: /assets/
Disallow: /icons/
Disallow: /logos/
Disallow: /screenshots/
Disallow: /sw.js
Disallow: /workbox-*
Disallow: /manifest.json

# Crawl-delay for polite crawling
Crawl-delay: 1

# Sitemap
Sitemap: https://celestiarcana.com/sitemap.xml

# Block AI training bots
User-agent: Amazonbot
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: meta-externalagent
Disallow: /

# Content-Signal: search=yes,ai-train=no
# Express reservation of rights under Article 4, EU Directive 2019/790
`;
    fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), productionRobots);
    console.log('✓');
  }
  results.push({ success: true, path: '/robots.txt' });
}

function generateSitemapXml(urls) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const url of urls) {
    xml += `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>
`;
  }

  xml += `</urlset>`;
  return xml;
}

function printSummary() {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log('');
  console.log('=== Pre-render Summary ===');
  console.log(`Total attempted: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('');
    console.log('Failed pages:');
    failed.forEach((f) => console.log(`  - ${f.path}: ${f.error}`));
  }

  console.log('');

  // Exit with error code if ANY failures, but build script handles this gracefully
  if (failed.length > 0) {
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error('Pre-render failed:', error);
  process.exit(1);
});
