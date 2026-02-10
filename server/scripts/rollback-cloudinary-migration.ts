/**
 * Cloudinary Migration Rollback Script
 *
 * Restores original local URLs from migration report.
 *
 * Usage:
 *   npx tsx scripts/rollback-cloudinary-migration.ts <report-file>
 *   npx tsx scripts/rollback-cloudinary-migration.ts cloudinary-migration-2024-01-15T10-30-00-000Z.json
 *
 * Note: This only restores database URLs. Local files must still exist.
 * Cloudinary files are NOT deleted by this script (manual cleanup if needed).
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

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

async function rollback(reportPath: string): Promise<void> {
  console.log('========================================');
  console.log('  Cloudinary Migration Rollback');
  console.log('========================================\n');

  // Load report
  if (!fs.existsSync(reportPath)) {
    console.error(`Error: Report file not found: ${reportPath}`);
    process.exit(1);
  }

  const report: MigrationReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  if (report.isDryRun) {
    console.log('Warning: This report was from a dry run. No actual changes were made.');
    console.log('There is nothing to rollback.');
    process.exit(0);
  }

  console.log(`Report timestamp: ${report.timestamp}`);
  console.log(`Records to restore: ${report.records.length}\n`);

  let restored = 0;
  let errors = 0;

  for (const record of report.records) {
    try {
      console.log(`Restoring ${record.type} ${record.id} (${record.field})`);
      console.log(`  ${record.newUrl} -> ${record.oldUrl}`);

      switch (record.type) {
        case 'MediaUpload':
          await prisma.mediaUpload.update({
            where: { id: record.id },
            data: {
              url: record.oldUrl,
              publicId: null,
              provider: 'local',
            },
          });
          break;

        case 'BlogPost':
          if (record.field === 'coverImage') {
            await prisma.blogPost.update({
              where: { id: record.id },
              data: { coverImage: record.oldUrl },
            });
          } else if (record.field === 'ogImage') {
            await prisma.blogPost.update({
              where: { id: record.id },
              data: { ogImage: record.oldUrl },
            });
          }
          break;

        case 'TarotArticle':
          if (record.field === 'featuredImage') {
            await prisma.tarotArticle.update({
              where: { id: record.id },
              data: { featuredImage: record.oldUrl },
            });
          }
          break;
      }

      restored++;
    } catch (error) {
      console.error(`  Error: ${error}`);
      errors++;
    }
  }

  console.log('\n========================================');
  console.log('  Rollback Summary');
  console.log('========================================');
  console.log(`Records restored: ${restored}`);
  console.log(`Errors: ${errors}`);

  if (errors === 0) {
    console.log('\nRollback complete!');
    console.log('\nNote: Cloudinary files were NOT deleted.');
    console.log('If you want to clean up Cloudinary, delete files manually from the dashboard.');
  } else {
    console.log('\nRollback completed with errors. Please review the output above.');
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // List available reports
    const scriptsDir = path.join(process.cwd(), 'scripts');
    const files = fs
      .readdirSync(scriptsDir)
      .filter(f => f.startsWith('cloudinary-migration-') && f.endsWith('.json'));

    if (files.length === 0) {
      console.log('No migration reports found.');
      console.log('Run the migration script first to generate a report.');
    } else {
      console.log('Available migration reports:');
      files.forEach(f => console.log(`  ${f}`));
      console.log('\nUsage: npx tsx scripts/rollback-cloudinary-migration.ts <report-file>');
    }
    process.exit(0);
  }

  let reportPath = args[0];

  // If just filename provided, look in scripts directory
  if (!path.isAbsolute(reportPath) && !reportPath.startsWith('./')) {
    reportPath = path.join(process.cwd(), 'scripts', reportPath);
  }

  try {
    await rollback(reportPath);
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
