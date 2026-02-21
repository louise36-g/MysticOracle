/**
 * Bulk fix script for blog post URLs
 *
 * This script:
 * 1. Fetches all blog posts from the database
 * 2. Processes content through URL replacer
 * 3. Updates posts that have changes
 * 4. Shows summary of what was fixed
 *
 * Usage: npx tsx scripts/fix-blog-urls.ts
 */

import prisma from '../src/db/prisma.js';
import { replaceArticleUrls } from '../src/utils/urlReplacer.js';

interface FixResult {
  id: string;
  slug: string;
  titleEn: string;
  changesEn: number;
  changesFr: number;
  totalChanges: number;
}

async function fixBlogUrls() {
  console.log('🔧 Starting bulk URL fix for blog posts...\n');

  try {
    // Fetch all blog posts
    const posts = await prisma.blogPost.findMany({
      where: {
        deletedAt: null, // Skip deleted posts
      },
      select: {
        id: true,
        slug: true,
        titleEn: true,
        titleFr: true,
        contentEn: true,
        contentFr: true,
      },
    });

    console.log(`📊 Found ${posts.length} blog posts to check\n`);

    const results: FixResult[] = [];
    let totalPostsUpdated = 0;
    let totalUrlsFixed = 0;

    // Process each post
    for (const post of posts) {
      // Count changes by comparing before/after
      const originalContentEn = post.contentEn || '';
      const originalContentFr = post.contentFr || '';

      const processedContentEn = replaceArticleUrls(originalContentEn);
      const processedContentFr = post.contentFr ? replaceArticleUrls(originalContentFr) : '';

      const changedEn = originalContentEn !== processedContentEn;
      const changedFr = post.contentFr && originalContentFr !== processedContentFr;

      // Count number of URLs fixed by counting pattern matches
      // Pattern 1: [INSERT CARD_NAME CARD URL]
      const pattern1En = (originalContentEn.match(/\[INSERT\s+[A-Z\s]+?\s+CARD\s+URL\]/gi) || [])
        .length;
      const pattern1Fr = post.contentFr
        ? (originalContentFr.match(/\[INSERT\s+[A-Z\s]+?\s+CARD\s+URL\]/gi) || []).length
        : 0;

      // Pattern 2: [INSERT URL FOR CARD_NAME CARD]
      const pattern2En = (
        originalContentEn.match(/\[INSERT\s+URL\s+FOR\s+[A-Z\s]+?\s+CARD\]/gi) || []
      ).length;
      const pattern2Fr = post.contentFr
        ? (originalContentFr.match(/\[INSERT\s+URL\s+FOR\s+[A-Z\s]+?\s+CARD\]/gi) || []).length
        : 0;

      // Pattern 3: [INSERT CARD_NAME URL] (excluding guides/readings)
      const pattern3MatchesEn: string[] =
        originalContentEn.match(/\[INSERT\s+([A-Z\s]+)\s+URL\]/gi) || [];
      const pattern3En = pattern3MatchesEn.filter(
        (match: string) =>
          !match.includes('MAJOR ARCANA') &&
          !match.includes('GUIDE') &&
          !match.includes('READING') &&
          !match.includes('IMAGE')
      ).length;
      const pattern3MatchesFr: string[] = post.contentFr
        ? originalContentFr.match(/\[INSERT\s+([A-Z\s]+)\s+URL\]/gi) || []
        : [];
      const pattern3Fr = pattern3MatchesFr.filter(
        (match: string) =>
          !match.includes('MAJOR ARCANA') &&
          !match.includes('GUIDE') &&
          !match.includes('READING') &&
          !match.includes('IMAGE')
      ).length;

      const placeholderPatternEn = pattern1En + pattern2En + pattern3En;
      const placeholderPatternFr = pattern1Fr + pattern2Fr + pattern3Fr;

      const incorrectUrlPatternEn = (
        originalContentEn.match(/href=["'](\/?[a-z0-9-]+-tarot-card-meaning)["']/gi) || []
      ).filter((match: string) => !match.includes('/tarot/articles/')).length;
      const incorrectUrlPatternFr = post.contentFr
        ? (
            originalContentFr.match(/href=["'](\/?[a-z0-9-]+-tarot-card-meaning)["']/gi) || []
          ).filter((match: string) => !match.includes('/tarot/articles/')).length
        : 0;

      const changesEnCount = incorrectUrlPatternEn + placeholderPatternEn;
      const changesFrCount = incorrectUrlPatternFr + placeholderPatternFr;
      const totalChanges = changesEnCount + changesFrCount;

      if (changedEn || changedFr) {
        console.log(`\n📝 Updating: ${post.titleEn}`);
        console.log(`   Slug: ${post.slug}`);

        if (changesEnCount > 0) {
          console.log(`   ✅ Fixed ${changesEnCount} URL(s) in English content`);
        }
        if (changesFrCount > 0) {
          console.log(`   ✅ Fixed ${changesFrCount} URL(s) in French content`);
        }

        // Update the post - only include contentFr if it exists
        const updateData: { contentEn: string; contentFr?: string } = {
          contentEn: processedContentEn,
        };

        if (post.contentFr) {
          updateData.contentFr = processedContentFr;
        }

        await prisma.blogPost.update({
          where: { id: post.id },
          data: updateData,
        });

        results.push({
          id: post.id,
          slug: post.slug,
          titleEn: post.titleEn,
          changesEn: changesEnCount,
          changesFr: changesFrCount,
          totalChanges,
        });

        totalPostsUpdated++;
        totalUrlsFixed += totalChanges;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total posts checked: ${posts.length}`);
    console.log(`Posts updated: ${totalPostsUpdated}`);
    console.log(`Total URLs fixed: ${totalUrlsFixed}`);
    console.log('='.repeat(60));

    if (results.length > 0) {
      console.log('\n📋 Updated Posts:');
      results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.titleEn}`);
        console.log(`   Slug: ${result.slug}`);
        console.log(`   English: ${result.changesEn} fix(es)`);
        console.log(`   French: ${result.changesFr} fix(es)`);
      });
    } else {
      console.log('\n✅ All posts already have correct URLs! No updates needed.');
    }

    console.log('\n✅ Bulk fix complete!\n');

    // Invalidate cache
    console.log('🧹 Clearing blog cache...');
    await prisma.$executeRaw`DELETE FROM "CacheVersion" WHERE entity LIKE 'blog:%'`;
    console.log('✅ Cache cleared!\n');
  } catch (error) {
    console.error('\n❌ Error during bulk fix:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixBlogUrls();
