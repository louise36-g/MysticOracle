/**
 * JSON import and seed routes
 */

import { Router } from 'express';
import { prisma, importArticleSchema, DEFAULT_BLOG_CTA } from './shared.js';

const router = Router();

// Import one or more articles from JSON
router.post('/import', async (req, res) => {
  try {
    const { articles, options } = req.body;

    // Allow single article or array
    const articlesToImport = Array.isArray(articles) ? articles : [articles];
    const skipDuplicates = options?.skipDuplicates ?? true;
    const createMissingTaxonomies = options?.createMissingTaxonomies ?? true;

    const results = {
      imported: 0,
      skipped: 0,
      skippedSlugs: [] as string[],
      errors: [] as { slug: string; error: string }[],
      createdCategories: [] as string[],
      createdTags: [] as string[],
    };

    for (const articleData of articlesToImport) {
      try {
        // Validate article structure
        const validation = importArticleSchema.safeParse(articleData);
        if (!validation.success) {
          results.errors.push({
            slug: articleData.slug || 'unknown',
            error: validation.error.errors.map(e => e.message).join(', '),
          });
          continue;
        }

        const article = validation.data;

        // Check if slug exists
        const existing = await prisma.blogPost.findUnique({ where: { slug: article.slug } });
        if (existing) {
          if (skipDuplicates) {
            results.skipped++;
            results.skippedSlugs.push(article.slug);
            continue;
          } else {
            results.errors.push({ slug: article.slug, error: 'Slug already exists' });
            continue;
          }
        }

        // Process categories - find or create
        const categoryIds: string[] = [];
        if (article.categories && article.categories.length > 0) {
          for (const catName of article.categories) {
            const catSlug = catName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-');

            let category = await prisma.blogCategory.findUnique({ where: { slug: catSlug } });

            if (!category && createMissingTaxonomies) {
              category = await prisma.blogCategory.create({
                data: {
                  slug: catSlug,
                  nameEn: catName,
                  nameFr: catName, // Default same, can edit later
                },
              });
              results.createdCategories.push(catName);
            }

            if (category) {
              categoryIds.push(category.id);
            }
          }
        }

        // Process tags - find or create
        const tagIds: string[] = [];
        if (article.tags && article.tags.length > 0) {
          for (const tagName of article.tags) {
            const tagSlug = tagName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-');

            let tag = await prisma.blogTag.findUnique({ where: { slug: tagSlug } });

            if (!tag && createMissingTaxonomies) {
              tag = await prisma.blogTag.create({
                data: {
                  slug: tagSlug,
                  nameEn: tagName,
                  nameFr: tagName, // Default same, can edit later
                },
              });
              results.createdTags.push(tagName);
            }

            if (tag) {
              tagIds.push(tag.id);
            }
          }
        }

        // Parse read time (support both read_time and readTime field names)
        let readTimeMinutes = 5;
        const readTimeValue = article.read_time || article.readTime;
        if (readTimeValue) {
          if (typeof readTimeValue === 'number') {
            readTimeMinutes = readTimeValue;
          } else {
            const match = readTimeValue.match(/(\d+)/);
            if (match) readTimeMinutes = parseInt(match[1]);
          }
        }

        // Get SEO fields (support both seo_meta and seo field names)
        const seoMetaOld = article.seo_meta;
        const seoNew = article.seo;
        const metaTitle = seoMetaOld?.meta_title || seoMetaOld?.og_title || seoNew?.metaTitle;
        const metaDesc =
          seoMetaOld?.meta_description || seoMetaOld?.og_description || seoNew?.metaDescription;

        // Get cover image (support multiple field names)
        const coverImage = article.featuredImage;
        const coverImageAlt = article.featuredImageAlt || article.image_alt_text;

        // Use FAQ from JSON if provided
        const faq = article.faq && article.faq.length > 0 ? article.faq : undefined;

        // Use CTA from JSON if provided, otherwise use default
        const cta = article.cta || DEFAULT_BLOG_CTA;

        // Create the post
        await prisma.blogPost.create({
          data: {
            slug: article.slug,
            titleEn: article.title,
            titleFr: '', // English only for imports
            excerptEn: article.excerpt || '',
            excerptFr: '',
            contentEn: article.content || '',
            contentFr: '',
            coverImage,
            coverImageAlt,
            authorName: article.author || 'MysticOracle',
            authorId: req.auth.userId,
            status: 'DRAFT', // Import as draft for review
            readTimeMinutes,
            metaTitleEn: metaTitle,
            metaDescEn: metaDesc,
            faq,
            cta,
            categories: {
              create: categoryIds.map(categoryId => ({ categoryId })),
            },
            tags: {
              create: tagIds.map(tagId => ({ tagId })),
            },
          },
        });

        results.imported++;
      } catch (err) {
        results.errors.push({
          slug: articleData.slug || 'unknown',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(
      'Error importing articles:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to import articles' });
  }
});

// Seed default data
router.post('/seed', async (req, res) => {
  try {
    // Create default categories
    const categories = await Promise.all([
      prisma.blogCategory.upsert({
        where: { slug: 'tarot-guides' },
        create: {
          slug: 'tarot-guides',
          nameEn: 'Tarot Guides',
          nameFr: 'Guides Tarot',
          descEn: 'Learn about tarot cards and spreads',
          descFr: 'Apprenez sur les cartes et tirages',
          color: '#8b5cf6',
          sortOrder: 0,
        },
        update: {},
      }),
      prisma.blogCategory.upsert({
        where: { slug: 'astrology' },
        create: {
          slug: 'astrology',
          nameEn: 'Astrology',
          nameFr: 'Astrologie',
          descEn: 'Zodiac signs and horoscopes',
          descFr: 'Signes du zodiaque et horoscopes',
          color: '#f59e0b',
          sortOrder: 1,
        },
        update: {},
      }),
      prisma.blogCategory.upsert({
        where: { slug: 'spirituality' },
        create: {
          slug: 'spirituality',
          nameEn: 'Spirituality',
          nameFr: 'Spiritualité',
          descEn: 'Mindfulness and spiritual growth',
          descFr: 'Pleine conscience et croissance spirituelle',
          color: '#10b981',
          sortOrder: 2,
        },
        update: {},
      }),
      prisma.blogCategory.upsert({
        where: { slug: 'news' },
        create: {
          slug: 'news',
          nameEn: 'News & Updates',
          nameFr: 'Actualités',
          descEn: 'Platform news and updates',
          descFr: 'Nouvelles et mises à jour',
          color: '#3b82f6',
          sortOrder: 3,
        },
        update: {},
      }),
    ]);

    // Create default tags
    const tags = await Promise.all([
      prisma.blogTag.upsert({
        where: { slug: 'beginners' },
        create: { slug: 'beginners', nameEn: 'Beginners', nameFr: 'Débutants' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'advanced' },
        create: { slug: 'advanced', nameEn: 'Advanced', nameFr: 'Avancé' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'major-arcana' },
        create: { slug: 'major-arcana', nameEn: 'Major Arcana', nameFr: 'Arcanes Majeurs' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'minor-arcana' },
        create: { slug: 'minor-arcana', nameEn: 'Minor Arcana', nameFr: 'Arcanes Mineurs' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'love' },
        create: { slug: 'love', nameEn: 'Love', nameFr: 'Amour' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'career' },
        create: { slug: 'career', nameEn: 'Career', nameFr: 'Carrière' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'meditation' },
        create: { slug: 'meditation', nameEn: 'Meditation', nameFr: 'Méditation' },
        update: {},
      }),
      prisma.blogTag.upsert({
        where: { slug: 'zodiac' },
        create: { slug: 'zodiac', nameEn: 'Zodiac', nameFr: 'Zodiaque' },
        update: {},
      }),
    ]);

    res.json({
      success: true,
      categories: categories.length,
      tags: tags.length,
    });
  } catch (error) {
    console.error(
      'Error seeding blog data:',
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: 'Failed to seed blog data' });
  }
});

export default router;
