/**
 * Fix localhost URLs in article/blog content
 *
 * The migration updated cover images but not URLs embedded in HTML content.
 * This script finds all localhost URLs in content and replaces them with
 * their corresponding Cloudinary URLs from the migration.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Fixing Content URLs ===\n');

  // Build URL mapping from MediaUpload records that have been migrated
  const mediaUploads = await prisma.mediaUpload.findMany({
    where: {
      provider: 'cloudinary',
      publicId: { not: null },
    },
    select: {
      url: true,
      originalName: true,
      filename: true,
    },
  });

  console.log(`Found ${mediaUploads.length} migrated media uploads\n`);

  // Create a map of possible old URL patterns to new Cloudinary URLs
  const urlMap = new Map<string, string>();

  for (const media of mediaUploads) {
    // The new URL is the Cloudinary URL
    const newUrl = media.url;

    // Add various patterns that might exist in content
    // Pattern: /uploads/folder/filename
    const uploadMatch = newUrl.match(/celestiarcana\/([^/]+)\/([^/]+)$/);
    if (uploadMatch) {
      const [, folder, cloudinaryFilename] = uploadMatch;

      // Try to match with original filename patterns
      urlMap.set(`/uploads/${folder}/${media.filename}`, newUrl);
      urlMap.set(`http://localhost:3001/uploads/${folder}/${media.filename}`, newUrl);
    }
  }

  // Also load the migration report for more accurate mapping
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const reportFiles = fs
    .readdirSync(scriptsDir)
    .filter(f => f.startsWith('cloudinary-migration-') && f.endsWith('.json'));

  if (reportFiles.length > 0) {
    // Use the most recent report
    const latestReport = reportFiles.sort().pop()!;
    const reportPath = path.join(scriptsDir, latestReport);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    console.log(`Loading URL mappings from ${latestReport}`);

    for (const record of report.records) {
      if (record.oldUrl && record.newUrl) {
        urlMap.set(record.oldUrl, record.newUrl);

        // Also add without http://localhost:3001 prefix
        const pathOnly = record.oldUrl.replace(/^https?:\/\/[^/]+/, '');
        if (pathOnly !== record.oldUrl) {
          urlMap.set(pathOnly, record.newUrl);
        }
      }
    }

    console.log(`Total URL mappings: ${urlMap.size}\n`);
  }

  // Function to replace URLs in content
  function replaceUrls(content: string): { newContent: string; count: number } {
    let newContent = content;
    let count = 0;

    // Replace all localhost URLs
    for (const [oldUrl, newUrl] of urlMap) {
      if (newContent.includes(oldUrl)) {
        newContent = newContent.split(oldUrl).join(newUrl);
        count++;
      }
    }

    // Also replace any remaining localhost upload URLs with a pattern match
    const localhostPattern = /http:\/\/localhost:\d+\/uploads\/([^"'\s)]+)/g;
    newContent = newContent.replace(localhostPattern, (match, path) => {
      // Try to find a matching Cloudinary URL
      for (const [oldUrl, newUrl] of urlMap) {
        if (oldUrl.includes(path) || match === oldUrl) {
          count++;
          return newUrl;
        }
      }
      console.log(`  Warning: No mapping found for ${match}`);
      return match;
    });

    return { newContent, count };
  }

  // Update TarotArticle content
  console.log('Updating TarotArticle content...');
  const tarotArticles = await prisma.tarotArticle.findMany({
    where: {
      OR: [{ content: { contains: 'localhost' } }, { contentFr: { contains: 'localhost' } }],
    },
    select: { id: true, title: true, content: true, contentFr: true },
  });

  console.log(`Found ${tarotArticles.length} tarot articles with localhost URLs`);

  let tarotUpdated = 0;
  for (const article of tarotArticles) {
    const updates: { content?: string; contentFr?: string } = {};

    if (article.content.includes('localhost')) {
      const result = replaceUrls(article.content);
      if (result.count > 0) {
        updates.content = result.newContent;
      }
    }

    if (article.contentFr && article.contentFr.includes('localhost')) {
      const result = replaceUrls(article.contentFr);
      if (result.count > 0) {
        updates.contentFr = result.newContent;
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.tarotArticle.update({
        where: { id: article.id },
        data: updates,
      });
      tarotUpdated++;
      console.log(`  Updated: ${article.title}`);
    }
  }

  // Update BlogPost content
  console.log('\nUpdating BlogPost content...');
  const blogPosts = await prisma.blogPost.findMany({
    where: {
      OR: [{ contentEn: { contains: 'localhost' } }, { contentFr: { contains: 'localhost' } }],
    },
    select: { id: true, slug: true, contentEn: true, contentFr: true },
  });

  console.log(`Found ${blogPosts.length} blog posts with localhost URLs`);

  let blogUpdated = 0;
  for (const post of blogPosts) {
    const updates: { contentEn?: string; contentFr?: string } = {};

    if (post.contentEn.includes('localhost')) {
      const result = replaceUrls(post.contentEn);
      if (result.count > 0) {
        updates.contentEn = result.newContent;
      }
    }

    if (post.contentFr && post.contentFr.includes('localhost')) {
      const result = replaceUrls(post.contentFr);
      if (result.count > 0) {
        updates.contentFr = result.newContent;
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: updates,
      });
      blogUpdated++;
      console.log(`  Updated: ${post.slug}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`TarotArticles updated: ${tarotUpdated}`);
  console.log(`BlogPosts updated: ${blogUpdated}`);
  console.log('\nDone!');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
