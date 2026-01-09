-- Migration: Add Tarot Articles and Cards
-- Applied: 2026-01-09
-- Method: prisma db push

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('Major Arcana', 'Suit of Wands', 'Suit of Cups', 'Suit of Swords', 'Suit of Pentacles');

-- CreateEnum
CREATE TYPE "Element" AS ENUM ('FIRE', 'WATER', 'AIR', 'EARTH');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "tarot_articles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "readTime" TEXT NOT NULL,
    "datePublished" TIMESTAMP(3) NOT NULL,
    "dateModified" TIMESTAMP(3) NOT NULL,
    "featuredImage" TEXT NOT NULL,
    "featuredImageAlt" TEXT NOT NULL,
    "cardType" "CardType" NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "astrologicalCorrespondence" TEXT NOT NULL,
    "element" "Element" NOT NULL,
    "categories" TEXT[],
    "tags" TEXT[],
    "seoFocusKeyword" TEXT NOT NULL,
    "seoMetaTitle" TEXT NOT NULL,
    "seoMetaDescription" TEXT NOT NULL,
    "faq" JSONB NOT NULL,
    "breadcrumbCategory" TEXT NOT NULL,
    "breadcrumbCategoryUrl" TEXT,
    "relatedCards" TEXT[],
    "isCourtCard" BOOLEAN NOT NULL DEFAULT false,
    "isChallengeCard" BOOLEAN NOT NULL DEFAULT false,
    "schemaJson" JSONB NOT NULL,
    "schemaHtml" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "tarot_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarot_cards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cardType" "CardType" NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "element" "Element" NOT NULL,
    "astrologicalSign" TEXT,
    "astrologicalPlanet" TEXT,
    "hebrewLetter" TEXT,
    "uprightKeywords" TEXT[],
    "reversedKeywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarot_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tarot_articles_slug_key" ON "tarot_articles"("slug");

-- CreateIndex
CREATE INDEX "tarot_articles_cardType_idx" ON "tarot_articles"("cardType");

-- CreateIndex
CREATE INDEX "tarot_articles_status_idx" ON "tarot_articles"("status");

-- CreateIndex
CREATE INDEX "tarot_articles_slug_idx" ON "tarot_articles"("slug");

-- CreateIndex
CREATE INDEX "tarot_articles_datePublished_idx" ON "tarot_articles"("datePublished");

-- CreateIndex
CREATE UNIQUE INDEX "tarot_cards_name_key" ON "tarot_cards"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tarot_cards_slug_key" ON "tarot_cards"("slug");
