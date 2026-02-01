/**
 * Dynamic sitemap generation for blog
 */

import { Router } from 'express';
import { prisma } from './shared.js';

const router = Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://mysticoracle.com';

    // Get all published posts
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { not: null },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    // Get all categories
    const categories = await prisma.blogCategory.findMany({
      select: { slug: true, updatedAt: true },
    });

    // Get all tags
    const tags = await prisma.blogTag.findMany({
      select: { slug: true, updatedAt: true },
    });

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/tarot</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/horoscope</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/cookies</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
`;

    // Add blog posts
    for (const post of posts) {
      const lastmod = post.updatedAt.toISOString().split('T')[0];
      xml += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    // Add category pages
    for (const cat of categories) {
      xml += `  <url>
    <loc>${baseUrl}/blog?category=${cat.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
    }

    // Add tag pages
    for (const tag of tags) {
      xml += `  <url>
    <loc>${baseUrl}/blog?tag=${tag.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error(
      'Error generating sitemap:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
