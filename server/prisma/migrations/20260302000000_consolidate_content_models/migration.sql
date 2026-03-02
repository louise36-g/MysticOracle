-- Consolidate BlogPost and TarotArticle into a single table
-- TarotArticle records are migrated into BlogPost with contentType = 'TAROT_ARTICLE'

-- Step 1: Create ContentType enum
CREATE TYPE "ContentType" AS ENUM ('BLOG_POST', 'TAROT_ARTICLE');

-- Step 2: Add new columns to BlogPost
ALTER TABLE "BlogPost" ADD COLUMN "contentType" "ContentType" NOT NULL DEFAULT 'BLOG_POST';
ALTER TABLE "BlogPost" ADD COLUMN "cardType" "CardType";
ALTER TABLE "BlogPost" ADD COLUMN "cardNumber" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "element" "Element";
ALTER TABLE "BlogPost" ADD COLUMN "astrologicalCorrespondence" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "isCourtCard" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BlogPost" ADD COLUMN "isChallengeCard" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BlogPost" ADD COLUMN "relatedCards" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "BlogPost" ADD COLUMN "schemaJson" JSONB;
ALTER TABLE "BlogPost" ADD COLUMN "schemaHtml" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "breadcrumbCategory" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "breadcrumbCategoryUrl" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "seoFocusKeyword" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "seoFocusKeywordFr" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "coverImageAltFr" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "datePublished" TIMESTAMP(3);
ALTER TABLE "BlogPost" ADD COLUMN "dateModified" TIMESTAMP(3);

-- Step 3: Add indexes
CREATE INDEX "BlogPost_contentType_idx" ON "BlogPost"("contentType");
CREATE INDEX "BlogPost_contentType_cardType_idx" ON "BlogPost"("contentType", "cardType");
CREATE INDEX "BlogPost_contentType_status_idx" ON "BlogPost"("contentType", "status");

-- Step 4: Verify no slug collisions between tarot_articles and BlogPost
-- This will raise an error if any collision is found
DO $$
DECLARE
  collision_count INTEGER;
BEGIN
  SELECT count(*) INTO collision_count
  FROM "tarot_articles" ta
  JOIN "BlogPost" bp ON ta.slug = bp.slug
  WHERE ta."deletedAt" IS NULL AND bp."deletedAt" IS NULL;

  IF collision_count > 0 THEN
    RAISE EXCEPTION 'Found % slug collisions between tarot_articles and BlogPost. Resolve before migrating.', collision_count;
  END IF;
END $$;

-- Step 5: Migrate tarot articles into BlogPost
INSERT INTO "BlogPost" (
  "id", "slug", "titleEn", "excerptEn", "contentEn",
  "titleFr", "excerptFr", "contentFr",
  "coverImage", "coverImageAlt", "coverImageAltFr",
  "metaTitleEn", "metaDescEn", "metaTitleFr", "metaDescFr",
  "authorName", "status", "readTimeMinutes",
  "publishedAt", "createdAt", "updatedAt",
  "deletedAt", "originalSlug", "sortOrder", "faq",
  "contentType", "cardType", "cardNumber", "element",
  "astrologicalCorrespondence", "isCourtCard", "isChallengeCard",
  "relatedCards", "schemaJson", "schemaHtml",
  "breadcrumbCategory", "breadcrumbCategoryUrl",
  "seoFocusKeyword", "seoFocusKeywordFr",
  "datePublished", "dateModified"
)
SELECT
  ta."id",
  ta."slug",
  ta."title",        -- title -> titleEn
  ta."excerpt",      -- excerpt -> excerptEn
  ta."content",      -- content -> contentEn
  ta."titleFr",
  ta."excerptFr",
  ta."contentFr",
  ta."featuredImage",      -- featuredImage -> coverImage
  ta."featuredImageAlt",   -- featuredImageAlt -> coverImageAlt
  ta."featuredImageAltFr", -- featuredImageAltFr -> coverImageAltFr
  ta."seoMetaTitle",       -- seoMetaTitle -> metaTitleEn
  ta."seoMetaDescription", -- seoMetaDescription -> metaDescEn
  ta."seoMetaTitleFr",     -- seoMetaTitleFr -> metaTitleFr
  ta."seoMetaDescriptionFr", -- seoMetaDescriptionFr -> metaDescFr
  ta."author",             -- author -> authorName
  ta."status"::text::"BlogPostStatus", -- Cast ArticleStatus -> BlogPostStatus
  COALESCE(NULLIF(regexp_replace(ta."readTime", '[^0-9]', '', 'g'), ''), '5')::int, -- readTime string -> readTimeMinutes int
  ta."publishedAt",
  ta."createdAt",
  ta."updatedAt",
  ta."deletedAt",
  ta."originalSlug",
  ta."sortOrder",
  ta."faq",
  'TAROT_ARTICLE'::"ContentType",
  ta."cardType",
  ta."cardNumber",
  ta."element",
  ta."astrologicalCorrespondence",
  ta."isCourtCard",
  ta."isChallengeCard",
  ta."relatedCards",
  ta."schemaJson",
  ta."schemaHtml",
  ta."breadcrumbCategory",
  ta."breadcrumbCategoryUrl",
  ta."seoFocusKeyword",
  ta."seoFocusKeywordFr",
  ta."datePublished",
  ta."dateModified"
FROM "tarot_articles" ta;

-- Step 6: Migrate junction table records (categories)
INSERT INTO "BlogPostCategory" ("id", "postId", "categoryId")
SELECT gen_random_uuid(), tac."articleId", tac."categoryId"
FROM "tarot_article_categories" tac;

-- Step 7: Migrate junction table records (tags)
INSERT INTO "BlogPostTag" ("id", "postId", "tagId")
SELECT gen_random_uuid(), tat."articleId", tat."tagId"
FROM "tarot_article_tags" tat;

-- Step 8: Drop old junction tables
DROP TABLE IF EXISTS "tarot_article_categories";
DROP TABLE IF EXISTS "tarot_article_tags";

-- Step 9: Drop old TarotArticle table and ArticleStatus enum
DROP TABLE IF EXISTS "tarot_articles";
DROP TYPE IF EXISTS "ArticleStatus";

-- Step 10: Remove tarotArticles relation from BlogCategory and BlogTag
-- (These are handled by Prisma schema changes, no SQL needed)
