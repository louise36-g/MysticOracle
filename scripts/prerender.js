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
const API_BASE = process.env.VITE_API_URL || process.env.API_URL || 'https://api.celestiarcana.com';
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
  { path: '/blog', title: 'Tarot Blog', description: 'Explore articles about tarot reading, card meanings, and spiritual guidance.' },
  { path: '/tarot', title: 'Tarot Card Meanings', description: 'Explore the meanings of all 78 tarot cards in the Rider-Waite deck.' },
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
    loc: SITE_URL + '/horoscope',
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

        const html = generateStaticHtml(template, {
          title: `${article.title} | CelestiArcana`,
          description: article.metaDescription || article.excerpt || `Discover the meaning of ${article.title} in tarot readings.`,
          url: `https://celestiarcana.com/tarot/${article.slug}`,
          path: `/tarot/${article.slug}`,
          image: article.imageUrl,
          type: 'article',
          structuredData: generateTarotArticleSchema(article),
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

  // Add structured data if provided (append, as this is new content)
  if (options.structuredData) {
    html = html.replace(
      '</head>',
      `  <script type="application/ld+json">${JSON.stringify(options.structuredData)}</script>\n  </head>`
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

  // For staging: overwrite robots.txt to block all crawlers
  if (IS_STAGING) {
    process.stdout.write('  Generating staging robots.txt (blocking crawlers)... ');
    const stagingRobots = `# STAGING ENVIRONMENT - DO NOT INDEX
# This is a staging/preview site. Do not index.

User-agent: *
Disallow: /

# No sitemap for staging - this is not the production site
`;
    fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), stagingRobots);
    console.log('✓');
    results.push({ success: true, path: '/robots.txt (staging)' });
  }
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
