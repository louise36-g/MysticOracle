/**
 * Cloudinary Migration Script
 *
 * Migrates existing local images to Cloudinary and updates database URLs.
 *
 * Features:
 * - Uploads local files to Cloudinary
 * - Updates MediaUpload, BlogPost, and TarotArticle URLs
 * - Generates JSON report for rollback capability
 * - Supports --dry-run mode for testing
 *
 * Run with: npx tsx scripts/migrate-to-cloudinary.ts
 * Dry run:  npx tsx scripts/migrate-to-cloudinary.ts --dry-run
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Migration report structure
interface MigrationRecord {
  type: 'MediaUpload' | 'BlogPost' | 'TarotArticle';
  id: string;
  field: string;
  oldUrl: string;
  newUrl: string;
  publicId: string | null;
}

interface MigrationReport {
  timestamp: string;
  isDryRun: boolean;
  records: MigrationRecord[];
  errors: string[];
  stats: {
    mediaUploadsProcessed: number;
    blogPostsUpdated: number;
    tarotArticlesUpdated: number;
    filesUploaded: number;
    bytesUploaded: number;
  };
}

// Initialize Cloudinary
function initCloudinary(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Error: Cloudinary credentials not configured.');
    console.error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return true;
}

// Upload file to Cloudinary
async function uploadToCloudinary(
  filePath: string,
  folder: string
): Promise<{ url: string; publicId: string; bytes: number } | null> {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const filename = path
    .basename(filePath, path.extname(filePath))
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .substring(0, 100);

  const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || 'celestiarcana';

  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
      folder: `${baseFolder}/${folder}`,
      public_id: filename,
      resource_type: 'image',
      overwrite: false,
      unique_filename: true,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error(`Failed to upload ${filePath}:`, error);
    return null;
  }
}

// Extract local path from URL
function getLocalPath(url: string): string | null {
  // Match patterns like /uploads/folder/filename or http://localhost:3001/uploads/...
  const match = url.match(/\/uploads\/([^/]+)\/(.+)$/);
  if (match) {
    const [, folder, filename] = match;
    return path.join(process.cwd(), 'public', 'uploads', folder, filename);
  }
  return null;
}

// Check if URL is a local upload URL
function isLocalUrl(url: string): boolean {
  return url.includes('/uploads/') && !url.includes('cloudinary');
}

async function migrateMediaUploads(report: MigrationReport): Promise<Map<string, string>> {
  console.log('\n=== Migrating MediaUpload records ===\n');

  const urlMap = new Map<string, string>();

  // Get all media uploads - we'll filter in code to handle null values properly
  const allMediaUploads = await prisma.mediaUpload.findMany();

  // Filter for local uploads (provider is 'local', null, or undefined, or no publicId)
  const mediaUploads = allMediaUploads.filter(
    m => m.provider === 'local' || !m.provider || !m.publicId
  );

  console.log(`Found ${mediaUploads.length} local media uploads to migrate\n`);

  for (const media of mediaUploads) {
    if (!isLocalUrl(media.url)) {
      console.log(`  Skipping ${media.originalName} (not a local URL)`);
      continue;
    }

    const localPath = getLocalPath(media.url);
    if (!localPath || !fs.existsSync(localPath)) {
      report.errors.push(`File not found: ${media.url} (${localPath})`);
      console.log(`  Warning: File not found for ${media.originalName}`);
      continue;
    }

    console.log(`  Uploading: ${media.originalName}`);

    if (isDryRun) {
      console.log(`    [DRY RUN] Would upload ${localPath}`);
      urlMap.set(media.url, `https://cloudinary.example.com/${media.folder}/${media.filename}`);
      report.stats.mediaUploadsProcessed++;
      continue;
    }

    const result = await uploadToCloudinary(localPath, media.folder);

    if (result) {
      // Update database record
      await prisma.mediaUpload.update({
        where: { id: media.id },
        data: {
          url: result.url,
          publicId: result.publicId,
          provider: 'cloudinary',
        },
      });

      urlMap.set(media.url, result.url);

      report.records.push({
        type: 'MediaUpload',
        id: media.id,
        field: 'url',
        oldUrl: media.url,
        newUrl: result.url,
        publicId: result.publicId,
      });

      report.stats.mediaUploadsProcessed++;
      report.stats.filesUploaded++;
      report.stats.bytesUploaded += result.bytes;

      console.log(`    Uploaded to: ${result.url}`);
    } else {
      report.errors.push(`Failed to upload: ${media.url}`);
    }
  }

  return urlMap;
}

async function migrateBlogPosts(
  report: MigrationReport,
  urlMap: Map<string, string>
): Promise<void> {
  console.log('\n=== Updating BlogPost image URLs ===\n');

  const blogPosts = await prisma.blogPost.findMany({
    where: {
      OR: [{ coverImage: { contains: '/uploads/' } }, { ogImage: { contains: '/uploads/' } }],
    },
    select: {
      id: true,
      slug: true,
      coverImage: true,
      ogImage: true,
    },
  });

  console.log(`Found ${blogPosts.length} blog posts with local images\n`);

  for (const post of blogPosts) {
    const updates: { coverImage?: string; ogImage?: string } = {};
    let updated = false;

    // Handle coverImage
    if (post.coverImage && isLocalUrl(post.coverImage)) {
      const newUrl = urlMap.get(post.coverImage);
      if (newUrl) {
        updates.coverImage = newUrl;
        report.records.push({
          type: 'BlogPost',
          id: post.id,
          field: 'coverImage',
          oldUrl: post.coverImage,
          newUrl,
          publicId: null,
        });
        updated = true;
      } else {
        // Try to upload directly
        const localPath = getLocalPath(post.coverImage);
        if (localPath && fs.existsSync(localPath)) {
          if (isDryRun) {
            console.log(`  [DRY RUN] Would upload coverImage for ${post.slug}`);
          } else {
            const result = await uploadToCloudinary(localPath, 'blog');
            if (result) {
              updates.coverImage = result.url;
              urlMap.set(post.coverImage, result.url);
              report.records.push({
                type: 'BlogPost',
                id: post.id,
                field: 'coverImage',
                oldUrl: post.coverImage,
                newUrl: result.url,
                publicId: result.publicId,
              });
              report.stats.filesUploaded++;
              report.stats.bytesUploaded += result.bytes;
              updated = true;
            }
          }
        }
      }
    }

    // Handle ogImage
    if (post.ogImage && isLocalUrl(post.ogImage)) {
      const newUrl = urlMap.get(post.ogImage);
      if (newUrl) {
        updates.ogImage = newUrl;
        report.records.push({
          type: 'BlogPost',
          id: post.id,
          field: 'ogImage',
          oldUrl: post.ogImage,
          newUrl,
          publicId: null,
        });
        updated = true;
      }
    }

    if (updated && Object.keys(updates).length > 0) {
      console.log(`  Updating: ${post.slug}`);

      if (!isDryRun) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: updates,
        });
      }

      report.stats.blogPostsUpdated++;
    }
  }
}

async function migrateTarotArticles(
  report: MigrationReport,
  urlMap: Map<string, string>
): Promise<void> {
  console.log('\n=== Updating TarotArticle image URLs ===\n');

  const articles = await prisma.tarotArticle.findMany({
    where: {
      featuredImage: { contains: '/uploads/' },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      featuredImage: true,
    },
  });

  console.log(`Found ${articles.length} tarot articles with local images\n`);

  for (const article of articles) {
    if (!isLocalUrl(article.featuredImage)) {
      continue;
    }

    let newUrl = urlMap.get(article.featuredImage);

    if (!newUrl) {
      // Try to upload directly
      const localPath = getLocalPath(article.featuredImage);
      if (localPath && fs.existsSync(localPath)) {
        if (isDryRun) {
          console.log(`  [DRY RUN] Would upload featuredImage for ${article.slug}`);
          newUrl = `https://cloudinary.example.com/tarot/${path.basename(localPath)}`;
        } else {
          const result = await uploadToCloudinary(localPath, 'tarot');
          if (result) {
            newUrl = result.url;
            urlMap.set(article.featuredImage, result.url);
            report.stats.filesUploaded++;
            report.stats.bytesUploaded += result.bytes;
          }
        }
      }
    }

    if (newUrl) {
      console.log(`  Updating: ${article.title}`);

      if (!isDryRun) {
        await prisma.tarotArticle.update({
          where: { id: article.id },
          data: { featuredImage: newUrl },
        });
      }

      report.records.push({
        type: 'TarotArticle',
        id: article.id,
        field: 'featuredImage',
        oldUrl: article.featuredImage,
        newUrl,
        publicId: null,
      });

      report.stats.tarotArticlesUpdated++;
    }
  }
}

function saveReport(report: MigrationReport): void {
  const filename = `cloudinary-migration-${report.timestamp.replace(/[:.]/g, '-')}.json`;
  const reportPath = path.join(process.cwd(), 'scripts', filename);

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

async function main(): Promise<void> {
  console.log('========================================');
  console.log('  Cloudinary Migration Script');
  console.log('========================================');

  if (isDryRun) {
    console.log('\n*** DRY RUN MODE - No changes will be made ***\n');
  }

  // Initialize report
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    isDryRun,
    records: [],
    errors: [],
    stats: {
      mediaUploadsProcessed: 0,
      blogPostsUpdated: 0,
      tarotArticlesUpdated: 0,
      filesUploaded: 0,
      bytesUploaded: 0,
    },
  };

  // Initialize Cloudinary
  if (!isDryRun && !initCloudinary()) {
    process.exit(1);
  }

  try {
    // Step 1: Migrate MediaUpload records
    const urlMap = await migrateMediaUploads(report);

    // Step 2: Update BlogPost URLs
    await migrateBlogPosts(report, urlMap);

    // Step 3: Update TarotArticle URLs
    await migrateTarotArticles(report, urlMap);

    // Print summary
    console.log('\n========================================');
    console.log('  Migration Summary');
    console.log('========================================');
    console.log(`MediaUploads processed: ${report.stats.mediaUploadsProcessed}`);
    console.log(`BlogPosts updated: ${report.stats.blogPostsUpdated}`);
    console.log(`TarotArticles updated: ${report.stats.tarotArticlesUpdated}`);
    console.log(`Files uploaded: ${report.stats.filesUploaded}`);
    console.log(`Bytes uploaded: ${(report.stats.bytesUploaded / 1024 / 1024).toFixed(2)} MB`);

    if (report.errors.length > 0) {
      console.log(`\nErrors: ${report.errors.length}`);
      report.errors.forEach(e => console.log(`  - ${e}`));
    }

    // Save report
    saveReport(report);

    if (isDryRun) {
      console.log('\n*** DRY RUN COMPLETE - No changes were made ***');
      console.log('Run without --dry-run to perform actual migration.');
    } else {
      console.log('\nMigration complete!');
      console.log('Use the generated report for rollback if needed.');
    }
  } catch (error) {
    console.error('\nMigration failed:', error);
    saveReport(report);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
