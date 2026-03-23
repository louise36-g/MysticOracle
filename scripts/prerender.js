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
  // /blog is handled separately in prerenderBlogListPage (SSR-lite with embedded data)
  // /tarot redirects to /tarot/cards via Caddyfile (avoids duplicate page in Google)
  // /tarot/cards is handled separately in prerenderTarotCardsPage (SSR-lite with embedded data)
  { path: '/tarot/cards/major-arcana', title: 'Major Arcana Tarot Card Meanings – Complete Guide', description: 'Explore every Major Arcana tarot card meaning. Symbolism, keywords, and reading guidance for each card.' },
  { path: '/tarot/cards/wands', title: 'Suit of Wands Tarot Card Meanings – Complete Guide', description: 'Explore every Suit of Wands tarot card meaning. Symbolism, keywords, and reading guidance for each card.' },
  { path: '/tarot/cards/cups', title: 'Suit of Cups Tarot Card Meanings – Complete Guide', description: 'Explore every Suit of Cups tarot card meaning. Symbolism, keywords, and reading guidance for each card.' },
  { path: '/tarot/cards/swords', title: 'Suit of Swords Tarot Card Meanings – Complete Guide', description: 'Explore every Suit of Swords tarot card meaning. Symbolism, keywords, and reading guidance for each card.' },
  { path: '/tarot/cards/pentacles', title: 'Suit of Pentacles Tarot Card Meanings – Complete Guide', description: 'Explore every Suit of Pentacles tarot card meaning. Symbolism, keywords, and reading guidance for each card.' },
];

const STATIC_PAGES_FR = {
  '/about': { title: 'À Propos de CelestiArcana', description: 'Découvrez l\'histoire de CelestiArcana et notre mission d\'apporter la sagesse du tarot à tous.' },
  '/faq': { title: 'Questions Fréquentes', description: 'Trouvez les réponses aux questions courantes sur les lectures de tarot et CelestiArcana.' },
  '/privacy': { title: 'Politique de Confidentialité', description: 'Découvrez comment CelestiArcana protège votre vie privée et gère vos données.' },
  '/terms': { title: 'Conditions d\'Utilisation', description: 'Lisez les conditions générales d\'utilisation de CelestiArcana.' },
  '/cookies': { title: 'Politique de Cookies', description: 'Comprenez comment CelestiArcana utilise les cookies.' },
  '/reading': { title: 'Lectures de Tarot Personnalisées – Amour, Carrière & Guidance Spirituelle', description: 'Choisissez parmi six thèmes de lecture de tarot. Lectures personnalisées avec des tirages classiques. Commencez votre lecture maintenant.' },
  '/contact': { title: 'Contactez-nous', description: 'Contactez CelestiArcana. Envoyez-nous un message sur les lectures de tarot, la facturation ou vos commentaires.' },
  '/how-credits-work': { title: 'Comment Fonctionnent les Crédits – Tarifs & Crédits Gratuits', description: 'Découvrez comment fonctionnent les crédits CelestiArcana. Coûts des lectures, bonus quotidiens, récompenses de parrainage.' },
  '/daily-tarot': { title: 'Tirage de Tarot du Jour — Énergie Tarot & Astrologie', description: 'Tirez votre carte de tarot quotidienne parmi les 22 Arcanes Majeurs. Découvrez l\'énergie tarot et astrologique du jour.' },
  '/horoscopes': { title: 'Horoscopes Quotidiens pour Chaque Signe du Zodiaque', description: 'Lisez votre horoscope quotidien gratuit. Prévisions astrologiques personnalisées pour les 12 signes. Mis à jour chaque jour.' },
  '/tarot/cards/major-arcana': { title: 'Significations des Arcanes Majeurs – Guide Complet', description: 'Explorez la signification de chaque carte des Arcanes Majeurs. Symbolisme, mots-clés et conseils de lecture.' },
  '/tarot/cards/wands': { title: 'Significations des Bâtons – Guide Complet', description: 'Explorez la signification de chaque carte des Bâtons. Symbolisme, mots-clés et conseils de lecture.' },
  '/tarot/cards/cups': { title: 'Significations des Coupes – Guide Complet', description: 'Explorez la signification de chaque carte des Coupes. Symbolisme, mots-clés et conseils de lecture.' },
  '/tarot/cards/swords': { title: 'Significations des Épées – Guide Complet', description: 'Explorez la signification de chaque carte des Épées. Symbolisme, mots-clés et conseils de lecture.' },
  '/tarot/cards/pentacles': { title: 'Significations des Pentacles – Guide Complet', description: 'Explorez la signification de chaque carte des Pentacles. Symbolisme, mots-clés et conseils de lecture.' },
};

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

  // Phase 1.5: Tarot cards overview page (SSR-lite with embedded card data)
  console.log('');
  console.log('[Phase 1.5] Tarot cards overview...');
  await prerenderTarotCardsPage(template);

  // Phase 2: Tarot articles (requires API)
  console.log('');
  console.log('[Phase 2] Tarot articles...');
  await prerenderTarotArticles(template);

  // Phase 2.5: Blog listing page (SSR-lite with embedded post data)
  console.log('');
  console.log('[Phase 2.5] Blog listing page...');
  await prerenderBlogListPage(template);

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

  // Generate French versions of static pages
  for (const page of STATIC_PAGES) {
    try {
      const frData = STATIC_PAGES_FR[page.path];
      if (!frData) continue; // Skip if no French translation

      const frPath = `/fr${page.path}`;
      process.stdout.write(`  Generating ${frPath}... `);

      const html = generateStaticHtml(template, {
        title: `${frData.title} | CelestiArcana`,
        description: frData.description,
        url: `${SITE_URL}${frPath}`,
        path: frPath,
        lang: 'fr',
      });

      const outputPath = getOutputPath(frPath);
      ensureDirectoryExists(path.dirname(outputPath));
      fs.writeFileSync(outputPath, html);

      results.push({ success: true, path: frPath });
      console.log('✓');
    } catch (error) {
      results.push({ success: false, path: `/fr${page.path}`, error: error.message });
      console.log('✗');
    }
  }
}

// Category config for static HTML rendering (mirrors CATEGORY_CONFIG from React)
const CATEGORY_STATIC = [
  { key: 'majorArcana', name: 'Major Arcana', color: '#a78bfa', slug: 'major-arcana' },
  { key: 'wands', name: 'Suit of Wands', color: '#f97316', slug: 'wands' },
  { key: 'cups', name: 'Suit of Cups', color: '#06b6d4', slug: 'cups' },
  { key: 'swords', name: 'Suit of Swords', color: '#94a3b8', slug: 'swords' },
  { key: 'pentacles', name: 'Suit of Pentacles', color: '#22c55e', slug: 'pentacles' },
];

const CATEGORY_STATIC_FR = {
  majorArcana: 'Arcanes Majeurs',
  wands: 'Bâtons',
  cups: 'Coupes',
  swords: 'Épées',
  pentacles: 'Pentacles',
};

function buildCloudinaryThumbnailUrl(url) {
  if (!url) return '';
  const match = url.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)/);
  if (!match) return url;
  const [, base, rest] = match;
  // 250px CSS * 2x retina = 500px, auto format, good quality, fill crop
  return `${base}f_auto,q_auto:good,w_500,c_fill/${rest}`;
}

function generateTarotCardsShell(overviewData, lang = 'en') {
  const isFr = lang === 'fr';
  const linkPrefix = isFr ? '/fr' : '';
  let sectionsHtml = '';

  for (const cat of CATEGORY_STATIC) {
    const cards = overviewData[cat.key] || [];
    if (cards.length === 0) continue;

    const catName = isFr ? (CATEGORY_STATIC_FR[cat.key] || cat.name) : cat.name;
    const viewAllText = isFr ? `Voir les ${cards.length}` : `View All ${cards.length}`;

    let cardsHtml = '';
    for (const card of cards) {
      const cardTitle = isFr ? (card.titleFr || card.title) : card.title;
      const cardExcerpt = isFr ? (card.excerptFr || card.excerpt) : card.excerpt;
      const imgSrc = card.featuredImage ? buildCloudinaryThumbnailUrl(card.featuredImage) : '';
      const imgAlt = escapeHtml(card.featuredImageAlt || cardTitle);
      const cardNum = card.cardNumber != null && card.cardNumber !== ''
        ? `<span style="font-weight:700;color:${cat.color}">${escapeHtml(String(card.cardNumber))}</span> - `
        : '';

      cardsHtml += `<a href="${linkPrefix}/tarot/${escapeHtml(card.slug)}" style="display:block;flex-shrink:0;width:220px;text-decoration:none">
          <div style="background:rgba(30,41,59,0.5);border-radius:0.5rem;overflow:hidden;border:1px solid rgba(168,85,247,0.2)">
            <div style="aspect-ratio:4/3;overflow:hidden;background:#0f172a">
              ${imgSrc ? `<img src="${imgSrc}" alt="${imgAlt}" width="250" height="188" loading="lazy" style="width:100%;height:100%;object-fit:cover" />` : ''}
            </div>
            <div style="padding:0.75rem">
              <h3 style="font-family:'Cinzel',serif;font-size:0.875rem;color:#e9d5ff;margin:0 0 0.375rem;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${cardNum}${escapeHtml(cardTitle)}</h3>
              <p style="font-size:0.75rem;color:#94a3b8;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(cardExcerpt || '')}</p>
            </div>
          </div>
        </a>`;
    }

    sectionsHtml += `<section style="margin-bottom:2.5rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;padding:0 1rem">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <div style="width:2.5rem;height:2.5rem;border-radius:0.5rem;display:flex;align-items:center;justify-content:center;background:${cat.color}20;color:${cat.color}"></div>
            <div>
              <h2 style="font-family:'Cinzel',serif;font-size:1.25rem;color:#fff;margin:0">${escapeHtml(catName)}</h2>
              <div style="height:2px;width:4rem;border-radius:9999px;margin-top:0.25rem;background:${cat.color}"></div>
            </div>
          </div>
          <a href="${linkPrefix}/tarot/cards/${cat.slug}" style="font-size:0.875rem;color:#94a3b8;text-decoration:none">${viewAllText} &#8250;</a>
        </div>
        <div style="display:flex;gap:1rem;overflow-x:auto;padding:0.5rem 1rem;scrollbar-width:none;-ms-overflow-style:none">
          ${cardsHtml}
        </div>
      </section>`;
  }

  const heroSubtitle = isFr ? 'Guide Complet' : 'Complete Guide';
  const heroTitle = isFr ? 'Les Arcanes du Tarot' : 'The Tarot Deck';
  const heroDesc = isFr
    ? 'Explorez la sagesse ancestrale des 78 cartes. Découvrez leurs significations, leur symbolisme et leurs conseils pour votre chemin.'
    : 'Explore the ancient wisdom of all 78 cards. Discover their meanings, symbolism, and guidance for your journey.';

  return `<main style="position:relative;z-index:10;flex:1">
      <div style="padding-bottom:5rem">
        <div style="position:relative;padding:4rem 1rem;text-align:center;overflow:hidden">
          <div style="display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-bottom:1rem">
            <span style="color:#a78bfa;font-size:0.875rem;font-weight:500;text-transform:uppercase;letter-spacing:0.05em">${heroSubtitle}</span>
          </div>
          <h1 style="font-size:2.25rem;font-family:'Cinzel',serif;font-weight:700;margin:0 0 1rem">
            <span style="background:linear-gradient(to bottom,#fff,#e9d5ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${heroTitle}</span>
          </h1>
          <p style="font-size:1.125rem;color:#cbd5e1;max-width:42rem;margin:0 auto 2rem">${heroDesc}</p>
        </div>
        <div style="max-width:80rem;margin:0 auto">
          ${sectionsHtml}
        </div>
      </div>
    </main>`;
}

async function prerenderTarotCardsPage(template) {
  const pagePath = '/tarot/cards';

  try {
    process.stdout.write('  Fetching tarot overview data... ');
    const response = await fetchWithTimeout(`${API_BASE}/api/v1/tarot-articles/overview`);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const overviewData = await response.json();
    console.log('✓');

    process.stdout.write(`  Generating ${pagePath}... `);

    let html = generateStaticHtml(template, {
      title: 'All 78 Tarot Card Meanings – Complete Guide | CelestiArcana',
      description: 'Explore all 78 tarot card meanings: Major Arcana, Wands, Cups, Swords, and Pentacles. Complete guide with symbolism and reading guidance.',
      url: `${SITE_URL}${pagePath}`,
      path: pagePath,
    });

    // Embed overview data so React skips the API fetch
    const safeJson = JSON.stringify(overviewData).replace(/<\//g, '<\\/');
    html = html.replace(
      '</body>',
      `  <script type="application/json" id="__TAROT_OVERVIEW__">${safeJson}</script>\n  </body>`
    );

    // Replace main content with pre-rendered card grid
    const cardGridHtml = generateTarotCardsShell(overviewData);
    html = html.replace(
      /<main style="[^"]*">[\s\S]*?<\/main>/,
      cardGridHtml
    );

    // Defer JS loading (same pattern as article pages)
    const scriptMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
    if (scriptMatch) {
      const mainSrc = scriptMatch[1];
      html = html.replace(
        scriptMatch[0],
        `<meta name="app-entry" content="${mainSrc}">\n    <script src="/deferred-loader.js"></script>`
      );
      html = html.replace(/<link rel="modulepreload"[^>]*>\n?/g, '');
    }

    const outputPath = getOutputPath(pagePath);
    ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, html);

    results.push({ success: true, path: pagePath });
    console.log('✓');

    // Add to sitemap
    sitemapData.pages.push({
      loc: `${SITE_URL}${pagePath}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.9',
    });
  } catch (error) {
    console.log('✗');
    console.log(`  ERROR: ${error.message}`);
    results.push({ success: false, path: pagePath, error: error.message });

    // Fallback: generate without overview data (basic static page)
    try {
      const html = generateStaticHtml(template, {
        title: 'All 78 Tarot Card Meanings – Complete Guide | CelestiArcana',
        description: 'Explore all 78 tarot card meanings.',
        url: `${SITE_URL}${pagePath}`,
        path: pagePath,
      });
      const outputPath = getOutputPath(pagePath);
      ensureDirectoryExists(path.dirname(outputPath));
      fs.writeFileSync(outputPath, html);
    } catch { /* ignore fallback error */ }
  }

  // Generate French version of tarot cards page
  const frPagePath = '/fr/tarot/cards';
  try {
    process.stdout.write(`  Generating ${frPagePath}... `);

    // Re-fetch overview data if not already available (use cached from English generation)
    let overviewData;
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/v1/tarot-articles/overview`);
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      overviewData = await response.json();
    } catch {
      // If we can't fetch, skip French version
      throw new Error('Could not fetch overview data for French version');
    }

    let html = generateStaticHtml(template, {
      title: 'Les 78 Cartes du Tarot – Guide Complet | CelestiArcana',
      description: 'Explorez la signification des 78 cartes du tarot : Arcanes Majeurs, Bâtons, Coupes, Épées et Pentacles. Guide complet avec symbolisme et conseils de lecture.',
      url: `${SITE_URL}${frPagePath}`,
      path: frPagePath,
      lang: 'fr',
    });

    // Embed overview data so React skips the API fetch
    const safeJson = JSON.stringify(overviewData).replace(/<\//g, '<\\/');
    html = html.replace(
      '</body>',
      `  <script type="application/json" id="__TAROT_OVERVIEW__">${safeJson}</script>\n  </body>`
    );

    // Replace main content with pre-rendered card grid (French)
    const cardGridHtml = generateTarotCardsShell(overviewData, 'fr');
    html = html.replace(
      /<main style="[^"]*">[\s\S]*?<\/main>/,
      cardGridHtml
    );

    // Defer JS loading
    const scriptMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
    if (scriptMatch) {
      const mainSrc = scriptMatch[1];
      html = html.replace(
        scriptMatch[0],
        `<meta name="app-entry" content="${mainSrc}">\n    <script src="/deferred-loader.js"></script>`
      );
      html = html.replace(/<link rel="modulepreload"[^>]*>\n?/g, '');
    }

    const outputPath = getOutputPath(frPagePath);
    ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, html);

    results.push({ success: true, path: frPagePath });
    console.log('✓');
  } catch (error) {
    console.log('✗');
    console.log(`  ERROR: ${error.message}`);
    results.push({ success: false, path: frPagePath, error: error.message });
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

        // Generate French version
        try {
          const frPath = `/fr/tarot/${article.slug}`;
          process.stdout.write(`  Generating ${frPath}... `);

          const frTitle = article.titleFr || article.title;
          const frExcerpt = article.excerptFr || article.excerpt;
          const frDescription = article.metaDescriptionFr || frExcerpt || `Découvrez la signification de ${frTitle} dans les lectures de tarot.`;

          const frHtml = generateStaticHtml(template, {
            title: `${frTitle} | CelestiArcana`,
            description: frDescription,
            url: `${SITE_URL}${frPath}`,
            path: frPath,
            image: article.featuredImage || article.imageUrl,
            type: 'article',
            articleData,
            articleTitle: frTitle,
            articleExcerpt: frExcerpt,
            lang: 'fr',
          });

          const frOutputPath = getOutputPath(frPath);
          ensureDirectoryExists(path.dirname(frOutputPath));
          fs.writeFileSync(frOutputPath, frHtml);

          results.push({ success: true, path: frPath });
          console.log('✓');
        } catch (frError) {
          results.push({ success: false, path: `/fr/tarot/${article.slug}`, error: frError.message });
          console.log('✗');
        }
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

async function prerenderBlogListPage(template) {
  const pagePath = '/blog';

  try {
    // Fetch posts (page 1), categories, and featured posts in parallel
    process.stdout.write('  Fetching blog list data... ');
    const [postsRes, catsRes, featuredRes] = await Promise.all([
      fetchWithTimeout(`${API_BASE}/api/blog/posts?page=1&limit=12`),
      fetchWithTimeout(`${API_BASE}/api/blog/categories`),
      fetchWithTimeout(`${API_BASE}/api/blog/posts?featured=true&limit=3`),
    ]);

    if (!postsRes.ok) throw new Error(`Posts API returned ${postsRes.status}`);
    const postsData = await postsRes.json();
    const catsData = catsRes.ok ? await catsRes.json() : { categories: [] };
    const featuredData = featuredRes.ok ? await featuredRes.json() : { posts: [] };
    console.log(`✓ (${postsData.posts?.length || 0} posts, ${catsData.categories?.length || 0} categories)`);

    process.stdout.write(`  Generating ${pagePath}... `);

    let html = generateStaticHtml(template, {
      title: 'Mystic Insights Blog | CelestiArcana',
      description: 'Explore the mystical world of tarot, astrology, and spiritual growth through curated articles on card meanings, spreads, and celestial guidance.',
      url: `${SITE_URL}${pagePath}`,
      path: pagePath,
    });

    // Embed all list data so React skips the three API fetches
    const listData = {
      posts: postsData,
      categories: catsData,
      featured: featuredData,
    };
    const safeJson = JSON.stringify(listData).replace(/<\//g, '<\\/');
    html = html.replace(
      '</body>',
      `  <script type="application/json" id="__BLOG_LIST_DATA__">${safeJson}</script>\n  </body>`
    );

    // Build static article grid HTML
    const posts = postsData.posts || [];
    let cardsHtml = '';
    for (const post of posts) {
      const postTitle = post.titleEn || post.title || '';
      const postExcerpt = post.excerptEn || post.excerpt || '';
      const imgSrc = post.coverImage ? buildCloudinaryThumbnailUrl(post.coverImage) : '';
      const imgAlt = escapeHtml(post.coverImageAlt || postTitle);
      const slug = post.contentType === 'TAROT_ARTICLE' ? `/tarot/${post.slug}` : `/blog/${post.slug}`;

      cardsHtml += `<a href="${slug}" style="display:block;width:250px;flex-shrink:0;text-decoration:none">
          <div style="background:rgba(15,23,42,0.6);border-radius:0.75rem;overflow:hidden;border:1px solid rgba(168,85,247,0.2)">
            ${imgSrc ? `<div style="aspect-ratio:16/9;overflow:hidden"><img src="${imgSrc}" alt="${imgAlt}" width="250" height="141" loading="lazy" style="width:100%;height:100%;object-fit:cover" /></div>` : ''}
            <div style="padding:1.25rem">
              <h3 style="font-family:'Cinzel',serif;font-size:1.125rem;color:#fff;margin:0 0 0.5rem;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(postTitle)}</h3>
              <p style="font-size:0.875rem;color:#94a3b8;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(postExcerpt)}</p>
            </div>
          </div>
        </a>`;
    }

    const total = postsData.pagination?.total || posts.length;
    const blogShell = `<main style="position:relative;z-index:10;flex:1">
      <div style="max-width:80rem;margin:0 auto;padding:3rem 1rem">
        <div style="text-align:center;margin-bottom:3rem">
          <h1 style="font-size:2.25rem;font-family:'Cinzel',serif;font-weight:700;margin:0 0 1rem">
            <span style="background:linear-gradient(to bottom,#fef3c7,#d8b4fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Mystic Insights</span>
          </h1>
          <p style="font-size:1.125rem;color:#94a3b8;max-width:42rem;margin:0 auto">Explore the mystical world of tarot, astrology, and spiritual growth through our curated articles.</p>
        </div>
        <div style="margin-bottom:1.5rem">
          <h2 style="font-family:'Cinzel',serif;font-size:1.5rem;color:#e9d5ff;margin:0 0 1.5rem">All Articles <span style="color:#64748b;font-size:1.125rem">(${total})</span></h2>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:1.5rem;justify-content:center">
          ${cardsHtml}
        </div>
      </div>
    </main>`;

    html = html.replace(
      /<main style="[^"]*">[\s\S]*?<\/main>/,
      blogShell
    );

    // Defer JS loading
    const scriptMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
    if (scriptMatch) {
      const mainSrc = scriptMatch[1];
      html = html.replace(
        scriptMatch[0],
        `<meta name="app-entry" content="${mainSrc}">\n    <script src="/deferred-loader.js"></script>`
      );
      html = html.replace(/<link rel="modulepreload"[^>]*>\n?/g, '');
    }

    const outputPath = getOutputPath(pagePath);
    ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, html);

    results.push({ success: true, path: pagePath });
    console.log('✓');

    sitemapData.pages.push({
      loc: `${SITE_URL}${pagePath}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: '0.9',
    });

    // Generate French version of blog list page
    const frPagePath = '/fr/blog';
    try {
      process.stdout.write(`  Generating ${frPagePath}... `);

      let frHtml = generateStaticHtml(template, {
        title: 'Blog Mystic Insights | CelestiArcana',
        description: 'Explorez le monde mystique du tarot, de l\'astrologie et de la croissance spirituelle à travers des articles sur les significations des cartes, les tirages et la guidance céleste.',
        url: `${SITE_URL}${frPagePath}`,
        path: frPagePath,
        lang: 'fr',
      });

      // Embed same list data (React reads correct language field)
      frHtml = frHtml.replace(
        '</body>',
        `  <script type="application/json" id="__BLOG_LIST_DATA__">${safeJson}</script>\n  </body>`
      );

      // Build French static article grid HTML
      let frCardsHtml = '';
      for (const post of posts) {
        const postTitle = post.titleFr || post.titleEn || post.title || '';
        const postExcerpt = post.excerptFr || post.excerptEn || post.excerpt || '';
        const imgSrc = post.coverImage ? buildCloudinaryThumbnailUrl(post.coverImage) : '';
        const imgAlt = escapeHtml(post.coverImageAlt || postTitle);
        const slug = post.contentType === 'TAROT_ARTICLE' ? `/fr/tarot/${post.slug}` : `/fr/blog/${post.slug}`;

        frCardsHtml += `<a href="${slug}" style="display:block;width:250px;flex-shrink:0;text-decoration:none">
          <div style="background:rgba(15,23,42,0.6);border-radius:0.75rem;overflow:hidden;border:1px solid rgba(168,85,247,0.2)">
            ${imgSrc ? `<div style="aspect-ratio:16/9;overflow:hidden"><img src="${imgSrc}" alt="${imgAlt}" width="250" height="141" loading="lazy" style="width:100%;height:100%;object-fit:cover" /></div>` : ''}
            <div style="padding:1.25rem">
              <h3 style="font-family:'Cinzel',serif;font-size:1.125rem;color:#fff;margin:0 0 0.5rem;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(postTitle)}</h3>
              <p style="font-size:0.875rem;color:#94a3b8;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(postExcerpt)}</p>
            </div>
          </div>
        </a>`;
      }

      const frBlogShell = `<main style="position:relative;z-index:10;flex:1">
      <div style="max-width:80rem;margin:0 auto;padding:3rem 1rem">
        <div style="text-align:center;margin-bottom:3rem">
          <h1 style="font-size:2.25rem;font-family:'Cinzel',serif;font-weight:700;margin:0 0 1rem">
            <span style="background:linear-gradient(to bottom,#fef3c7,#d8b4fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Mystic Insights</span>
          </h1>
          <p style="font-size:1.125rem;color:#94a3b8;max-width:42rem;margin:0 auto">Explorez le monde mystique du tarot, de l'astrologie et de la croissance spirituelle à travers nos articles.</p>
        </div>
        <div style="margin-bottom:1.5rem">
          <h2 style="font-family:'Cinzel',serif;font-size:1.5rem;color:#e9d5ff;margin:0 0 1.5rem">Tous les Articles <span style="color:#64748b;font-size:1.125rem">(${total})</span></h2>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:1.5rem;justify-content:center">
          ${frCardsHtml}
        </div>
      </div>
    </main>`;

      frHtml = frHtml.replace(
        /<main style="[^"]*">[\s\S]*?<\/main>/,
        frBlogShell
      );

      // Defer JS loading
      const frScriptMatch = frHtml.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
      if (frScriptMatch) {
        const mainSrc = frScriptMatch[1];
        frHtml = frHtml.replace(
          frScriptMatch[0],
          `<meta name="app-entry" content="${mainSrc}">\n    <script src="/deferred-loader.js"></script>`
        );
        frHtml = frHtml.replace(/<link rel="modulepreload"[^>]*>\n?/g, '');
      }

      const frOutputPath = getOutputPath(frPagePath);
      ensureDirectoryExists(path.dirname(frOutputPath));
      fs.writeFileSync(frOutputPath, frHtml);

      results.push({ success: true, path: frPagePath });
      console.log('✓');
    } catch (frError) {
      console.log('✗');
      console.log(`  ERROR (FR blog list): ${frError.message}`);
      results.push({ success: false, path: frPagePath, error: frError.message });
    }
  } catch (error) {
    console.log('✗');
    console.log(`  ERROR: ${error.message}`);
    results.push({ success: false, path: pagePath, error: error.message });

    // Fallback: basic static page
    try {
      const html = generateStaticHtml(template, {
        title: 'Mystic Insights Blog | CelestiArcana',
        description: 'Explore articles about tarot reading, card meanings, and spiritual guidance.',
        url: `${SITE_URL}${pagePath}`,
        path: pagePath,
      });
      const outputPath = getOutputPath(pagePath);
      ensureDirectoryExists(path.dirname(outputPath));
      fs.writeFileSync(outputPath, html);
    } catch { /* ignore fallback error */ }
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

    console.log(`fetched ${allPosts.length} posts`);

    for (const post of allPosts) {
      try {
        process.stdout.write(`  Generating /blog/${post.slug}... `);

        // Blog API uses titleEn/excerptEn fields (multi-language support)
        const title = post.titleEn || post.title || 'Blog Post';
        const description = post.metaDescriptionEn || post.excerptEn || post.excerpt || title;
        const image = post.coverImage || post.featuredImage;

        // SSR-lite: fetch full blog post data to embed in HTML (eliminates API round-trip)
        let blogData = null;
        try {
          const postResponse = await fetchWithTimeout(`${API_BASE}/api/blog/posts/${post.slug}`);
          if (postResponse.ok) {
            blogData = await postResponse.json();
          }
        } catch (fetchErr) {
          // Non-fatal: page still works without embedded data (falls back to API fetch)
          process.stdout.write('(no embed) ');
        }

        const html = generateStaticHtml(template, {
          title: `${title} | CelestiArcana Blog`,
          description: description,
          url: `https://celestiarcana.com/blog/${post.slug}`,
          path: `/blog/${post.slug}`,
          image: image,
          type: 'article',
          blogData,
          blogTitle: title,
          blogExcerpt: post.excerptEn || post.excerpt,
          blogContent: blogData?.post?.contentEn,
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

        // Generate French version
        try {
          const frPath = `/fr/blog/${post.slug}`;
          process.stdout.write(`  Generating ${frPath}... `);

          const frTitle = post.titleFr || post.titleEn || post.title || 'Article de Blog';
          const frDescription = post.metaDescriptionFr || post.excerptFr || post.excerptEn || post.excerpt || frTitle;
          const frExcerpt = post.excerptFr || post.excerptEn || post.excerpt;

          const frHtml = generateStaticHtml(template, {
            title: `${frTitle} | CelestiArcana Blog`,
            description: frDescription,
            url: `${SITE_URL}${frPath}`,
            path: frPath,
            image: image,
            type: 'article',
            blogData,
            blogTitle: frTitle,
            blogExcerpt: frExcerpt,
            blogContent: blogData?.post?.contentFr,
            lang: 'fr',
          });

          const frOutputPath = getOutputPath(frPath);
          ensureDirectoryExists(path.dirname(frOutputPath));
          fs.writeFileSync(frOutputPath, frHtml);

          results.push({ success: true, path: frPath });
          console.log('✓');
        } catch (frError) {
          results.push({ success: false, path: `/fr/blog/${post.slug}`, error: frError.message });
          console.log('✗');
        }
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

  // SSR-lite: Embed full blog post data as JSON so React skips the API fetch
  if (options.blogData) {
    const safeJson = JSON.stringify(options.blogData).replace(/<\//g, '<\\/');
    html = html.replace(
      '</body>',
      `  <script type="application/json" id="__BLOG_POST_DATA__">${safeJson}</script>\n  </body>`
    );
  }

  // SSR-lite: Replace generic shell with blog post content so it paints at FCP (before JS loads)
  if (options.blogTitle && options.blogData && (options.path?.startsWith('/blog/') || options.path?.startsWith('/fr/blog/'))) {
    const excerptTag = options.blogExcerpt
      ? `<p style="font-size:1rem;color:#cbd5e1;max-width:32rem;margin:0 auto 2rem">${escapeHtml(options.blogExcerpt)}</p>`
      : '';

    let contentHtml = '';
    if (options.blogContent) {
      contentHtml = options.blogContent.replace(/<img /g, '<img loading="lazy" ');
    }

    const blogShell = `<main style="position:relative;z-index:10;flex:1">
          <div style="padding:1.5rem 1rem 1rem;position:relative">
            <article style="max-width:56rem;margin:0 auto">
              <div style="text-align:center">
                <h1 style="position:relative;text-align:center;font-size:2.25rem;font-family:'Cinzel',serif;font-weight:700;margin:0 0 1rem;line-height:1.1">
                  <span style="background:linear-gradient(to bottom,#fde68a,#e9d5ff,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${escapeHtml(options.blogTitle)}</span>
                </h1>
                ${excerptTag}
              </div>
              <div class="prose prose-invert prose-purple max-w-none">${contentHtml}</div>
            </article>
          </div>
        </main>`;

    html = html.replace(
      /<main style="[^"]*">[\s\S]*?<\/main>/,
      blogShell
    );

    // Defer JS loading — same pattern as tarot articles
    const scriptMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
    if (scriptMatch) {
      const mainSrc = scriptMatch[1];
      html = html.replace(
        scriptMatch[0],
        `<meta name="app-entry" content="${mainSrc}">\n    <script src="/deferred-loader.js"></script>`
      );
      html = html.replace(/<link rel="modulepreload"[^>]*>\n?/g, '');
    }
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
    const articleContent = (options.lang === 'fr' && options.articleData?.contentFr)
      ? options.articleData.contentFr
      : options.articleData?.content;
    if (articleContent) {
      // Lazy-load all content images so they don't compete for bandwidth
      contentHtml = articleContent.replace(/<img /g, '<img loading="lazy" ');
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

    // Defer JS loading until user interaction — the static content is fully readable
    // without React. This prevents React's createRoot from triggering a new LCP paint.
    // Uses an external loader file (not inline) to comply with CSP script-src policy.
    const scriptMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
    if (scriptMatch) {
      const mainSrc = scriptMatch[1];
      // Store the entry point URL in a meta tag, load via external CSP-safe script
      html = html.replace(
        scriptMatch[0],
        `<meta name="app-entry" content="${mainSrc}">\n    <script src="/deferred-loader.js"></script>`
      );
      html = html.replace(/<link rel="modulepreload"[^>]*>\n?/g, '');
    }
  }

  // Language-specific overrides
  const lang = options.lang || 'en';
  if (lang === 'fr') {
    html = html.replace('<html lang="en">', '<html lang="fr">');
  }

  // Add correct hreflang tags (for both EN and FR pages)
  const basePath = (options.path || '').replace(/^\/fr/, '');
  const enUrl = `${SITE_URL}${basePath || '/'}`;
  const frUrl = `${SITE_URL}/fr${basePath || ''}`;
  // Remove any existing hreflang tags
  html = html.replace(/<link rel="alternate" hrefLang="[^"]*" href="[^"]*" \/>\n?/g, '');
  // Add correct hreflang tags
  html = html.replace(
    '</head>',
    `  <link rel="alternate" hrefLang="en" href="${enUrl}" />\n  <link rel="alternate" hrefLang="fr" href="${frUrl}" />\n  <link rel="alternate" hrefLang="x-default" href="${enUrl}" />\n  </head>`
  );

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

  // Auto-generate French URLs from English ones (mirror with /fr/ prefix)
  const toFr = (urls) => urls.map(u => ({
    ...u,
    loc: u.loc.replace(SITE_URL, `${SITE_URL}/fr`),
  }));

  const allPages = [...sitemapData.pages, ...toFr(sitemapData.pages)];
  const allCards = [...sitemapData.cards, ...toFr(sitemapData.cards)];
  const allBlog = [...sitemapData.blog, ...toFr(sitemapData.blog)];

  // Generate sitemap-pages.xml (EN + FR)
  process.stdout.write('  Generating sitemap-pages.xml... ');
  const pagesXml = generateSitemapXml(allPages);
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-pages.xml'), pagesXml);
  console.log(`✓ (${allPages.length} URLs)`);

  // Generate sitemap-cards.xml (EN + FR)
  process.stdout.write('  Generating sitemap-cards.xml... ');
  const cardsXml = generateSitemapXml(allCards);
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-cards.xml'), cardsXml);
  console.log(`✓ (${allCards.length} URLs)`);

  // Generate sitemap-blog.xml (EN + FR)
  process.stdout.write('  Generating sitemap-blog.xml... ');
  const blogXml = generateSitemapXml(allBlog);
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap-blog.xml'), blogXml);
  console.log(`✓ (${allBlog.length} URLs)`);

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
Allow: /fr/
Allow: /fr/blog
Allow: /fr/blog/*
Allow: /fr/tarot
Allow: /fr/tarot/*
Allow: /fr/horoscopes

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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  for (const url of urls) {
    // Determine the base path (without /fr/ prefix) for hreflang pairs
    const locPath = new URL(url.loc).pathname;
    const basePath = locPath.startsWith('/fr/') ? locPath.slice(3) : locPath === '/fr' ? '/' : locPath;
    const enUrl = `${SITE_URL}${basePath === '/' ? '' : basePath}`;
    const frUrl = `${SITE_URL}${basePath === '/' ? '/fr' : `/fr${basePath}`}`;

    xml += `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="fr" href="${frUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
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
