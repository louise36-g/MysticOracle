import { Router, Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { NotFoundError } from '../shared/errors/ApplicationError.js';
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
router.get(
  '/tarot/articles/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    // Fetch the article with schema (now from BlogPost table)
    const article = await prisma.blogPost.findFirst({
      where: {
        slug,
        contentType: 'TAROT_ARTICLE',
        status: 'PUBLISHED',
      },
    });

    if (!article) {
      throw new NotFoundError('Article');
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
      return res.status(500).send('Template not found');
    }

    // Generate JSON-LD script tag
    const schemaScript = `<script type="application/ld+json">
${JSON.stringify(article.schemaJson, null, 2)}
</script>`;

    // Escape values for safe HTML insertion
    const safeTitle = escapeHtml((article.metaTitleEn || article.titleEn) as string);
    const safeDescription = escapeHtml((article.metaDescEn || article.excerptEn) as string);
    const safeAuthor = escapeHtml(article.authorName);
    const safeSlug = escapeHtml(article.slug);

    // Generate Open Graph and Twitter meta tags
    const metaTags = `
    <title>${safeTitle} | CelestiArcana</title>
    <meta name="description" content="${safeDescription}" />
    <link rel="canonical" href="https://celestiarcana.com/tarot/${safeSlug}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://celestiarcana.com/tarot/${safeSlug}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${article.coverImage || ''}" />
    ${article.datePublished ? `<meta property="article:published_time" content="${article.datePublished.toISOString()}" />` : ''}
    ${article.dateModified ? `<meta property="article:modified_time" content="${article.dateModified.toISOString()}" />` : ''}
    <meta property="article:author" content="${safeAuthor}" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://celestiarcana.com/tarot/${safeSlug}" />
    <meta property="twitter:title" content="${safeTitle}" />
    <meta property="twitter:description" content="${safeDescription}" />
    <meta property="twitter:image" content="${article.coverImage || ''}" />
`;

    // Inject schema and meta tags into the HTML head
    const modifiedHtml = htmlTemplate.replace(
      '</head>',
      `${metaTags}\n    ${schemaScript}\n  </head>`
    );

    // Serve the modified HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(modifiedHtml);
  })
);

export default router;
