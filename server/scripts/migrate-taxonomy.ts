/**
 * Taxonomy Migration Script
 *
 * Migrates TarotArticle JSON array categories/tags to proper relations
 * using the shared BlogCategory/BlogTag tables.
 *
 * Steps:
 * 1. For each TarotArticle with categories/tags arrays
 * 2. Find or create matching BlogCategory/BlogTag entries
 * 3. Create junction table entries
 *
 * Run with: npx tsx scripts/migrate-taxonomy.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function migrateTaxonomy() {
  console.log('Starting taxonomy migration...\n');

  // Get all tarot articles with their JSON arrays
  const articles = await prisma.tarotArticle.findMany({
    select: {
      id: true,
      title: true,
      categories: true,
      tags: true,
    },
  });

  console.log(`Found ${articles.length} tarot articles to process\n`);

  let categoriesCreated = 0;
  let tagsCreated = 0;
  let categoryRelationsCreated = 0;
  let tagRelationsCreated = 0;
  let errors: string[] = [];

  for (const article of articles) {
    console.log(`Processing: ${article.title}`);

    // Process categories
    const categoryNames = article.categories || [];
    for (const categoryName of categoryNames) {
      if (!categoryName || !categoryName.trim()) continue;

      const slug = slugify(categoryName);

      try {
        // Find or create BlogCategory
        let category = await prisma.blogCategory.findUnique({
          where: { slug },
        });

        if (!category) {
          // Also try to find by nameEn
          category = await prisma.blogCategory.findFirst({
            where: { nameEn: categoryName },
          });
        }

        if (!category) {
          // Create new category
          category = await prisma.blogCategory.create({
            data: {
              slug,
              nameEn: categoryName,
              nameFr: categoryName, // Use same name for now
            },
          });
          categoriesCreated++;
          console.log(`  Created category: ${categoryName}`);
        }

        // Check if relation already exists
        const existingRelation = await prisma.tarotArticleCategory.findUnique({
          where: {
            articleId_categoryId: {
              articleId: article.id,
              categoryId: category.id,
            },
          },
        });

        if (!existingRelation) {
          // Create junction table entry
          await prisma.tarotArticleCategory.create({
            data: {
              articleId: article.id,
              categoryId: category.id,
            },
          });
          categoryRelationsCreated++;
        }
      } catch (error) {
        const msg = `Error processing category "${categoryName}" for article "${article.title}": ${error}`;
        console.error(`  ${msg}`);
        errors.push(msg);
      }
    }

    // Process tags
    const tagNames = article.tags || [];
    for (const tagName of tagNames) {
      if (!tagName || !tagName.trim()) continue;

      const slug = slugify(tagName);

      try {
        // Find or create BlogTag
        let tag = await prisma.blogTag.findUnique({
          where: { slug },
        });

        if (!tag) {
          // Also try to find by nameEn
          tag = await prisma.blogTag.findFirst({
            where: { nameEn: tagName },
          });
        }

        if (!tag) {
          // Create new tag
          tag = await prisma.blogTag.create({
            data: {
              slug,
              nameEn: tagName,
              nameFr: tagName, // Use same name for now
            },
          });
          tagsCreated++;
          console.log(`  Created tag: ${tagName}`);
        }

        // Check if relation already exists
        const existingRelation = await prisma.tarotArticleTag.findUnique({
          where: {
            articleId_tagId: {
              articleId: article.id,
              tagId: tag.id,
            },
          },
        });

        if (!existingRelation) {
          // Create junction table entry
          await prisma.tarotArticleTag.create({
            data: {
              articleId: article.id,
              tagId: tag.id,
            },
          });
          tagRelationsCreated++;
        }
      } catch (error) {
        const msg = `Error processing tag "${tagName}" for article "${article.title}": ${error}`;
        console.error(`  ${msg}`);
        errors.push(msg);
      }
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Articles processed: ${articles.length}`);
  console.log(`Categories created: ${categoriesCreated}`);
  console.log(`Tags created: ${tagsCreated}`);
  console.log(`Category relations created: ${categoryRelationsCreated}`);
  console.log(`Tag relations created: ${tagRelationsCreated}`);

  if (errors.length > 0) {
    console.log(`\nErrors: ${errors.length}`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  console.log('\nMigration complete!');
}

// Verify migration results
async function verifyMigration() {
  console.log('\n=== Verification ===');

  const articlesWithRelations = await prisma.tarotArticle.findMany({
    include: {
      articleCategories: {
        include: { category: true },
      },
      articleTags: {
        include: { tag: true },
      },
    },
    take: 5,
  });

  console.log('\nSample of migrated articles:');
  for (const article of articlesWithRelations) {
    console.log(`\n${article.title}:`);
    console.log(
      `  Categories (JSON): ${article.categories?.join(', ') || 'none'}`
    );
    console.log(
      `  Categories (Relations): ${article.articleCategories.map((c) => c.category.nameEn).join(', ') || 'none'}`
    );
    console.log(`  Tags (JSON): ${article.tags?.join(', ') || 'none'}`);
    console.log(
      `  Tags (Relations): ${article.articleTags.map((t) => t.tag.nameEn).join(', ') || 'none'}`
    );
  }

  // Count totals
  const totalCategories = await prisma.blogCategory.count();
  const totalTags = await prisma.blogTag.count();
  const totalCategoryRelations = await prisma.tarotArticleCategory.count();
  const totalTagRelations = await prisma.tarotArticleTag.count();

  console.log('\n=== Database Totals ===');
  console.log(`Total BlogCategories: ${totalCategories}`);
  console.log(`Total BlogTags: ${totalTags}`);
  console.log(`Total TarotArticleCategory relations: ${totalCategoryRelations}`);
  console.log(`Total TarotArticleTag relations: ${totalTagRelations}`);
}

async function main() {
  try {
    await migrateTaxonomy();
    await verifyMigration();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
