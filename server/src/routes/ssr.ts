import { Router, Request, Response } from 'express';
import prisma from '../db/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

/**
 * Escape HTML to prevent XSS in meta tags
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Server-Side Rendering for Tarot Article Pages
 * Serves HTML with JSON-LD schema pre-injected for SEO
 */
router.get('/tarot/articles/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Fetch the article with schema
    const article = await prisma.tarotArticle.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
    });

    if (!article) {
      // Return 404 - let the SPA handle it
      return res.status(404).send('Article not found');
    }

    // Read the index.html template
    // Try multiple possible paths for the HTML file
    const possiblePaths = [
      path.join(process.cwd(), '..', 'dist', 'index.html'), // Production build
      path.join(process.cwd(), '..', 'index.html'), // Development
      path.join(process.cwd(), 'dist', 'index.html'), // Alternative prod path
      path.join(process.cwd(), '../../dist', 'index.html'), // Deployed structure
    ];

    let htmlTemplate: string | null = null;
    for (const htmlPath of possiblePaths) {
      if (fs.existsSync(htmlPath)) {
        htmlTemplate = fs.readFileSync(htmlPath, 'utf-8');
        break;
      }
    }

    if (!htmlTemplate) {
      console.error('Could not find index.html in any of the expected locations');
      return res.status(500).send('Template not found');
    }

    // Generate JSON-LD script tag
    const schemaScript = `<script type="application/ld+json">
${JSON.stringify(article.schemaJson, null, 2)}
</script>`;

    // Escape values for safe HTML insertion
    const safeTitle = escapeHtml(article.seoMetaTitle || article.title);
    const safeDescription = escapeHtml(article.seoMetaDescription || article.excerpt);
    const safeAuthor = escapeHtml(article.author);
    const safeSlug = escapeHtml(article.slug);
    const safeTags = article.tags.map(tag => escapeHtml(tag));

    // Generate Open Graph and Twitter meta tags
    const metaTags = `
    <title>${safeTitle} | MysticOracle</title>
    <meta name="description" content="${safeDescription}" />
    <meta name="keywords" content="${safeTags.join(', ')}" />
    <link rel="canonical" href="https://mysticoracle.com/tarot/articles/${safeSlug}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://mysticoracle.com/tarot/articles/${safeSlug}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${article.featuredImage}" />
    <meta property="article:published_time" content="${article.datePublished.toISOString()}" />
    <meta property="article:modified_time" content="${article.dateModified.toISOString()}" />
    <meta property="article:author" content="${safeAuthor}" />
    ${safeTags.map(tag => `<meta property="article:tag" content="${tag}" />`).join('\n    ')}

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://mysticoracle.com/tarot/articles/${safeSlug}" />
    <meta property="twitter:title" content="${safeTitle}" />
    <meta property="twitter:description" content="${safeDescription}" />
    <meta property="twitter:image" content="${article.featuredImage}" />
`;

    // Inject schema and meta tags into the HTML head
    const modifiedHtml = htmlTemplate.replace(
      '</head>',
      `${metaTags}\n    ${schemaScript}\n  </head>`
    );

    // Serve the modified HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(modifiedHtml);
  } catch (error) {
    console.error('Error rendering article page:', error);
    res.status(500).send('Internal server error');
  }
});

export default router;
