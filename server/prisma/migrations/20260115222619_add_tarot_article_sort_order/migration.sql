-- AlterTable
ALTER TABLE "tarot_articles" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "tarot_articles_cardType_sortOrder_idx" ON "tarot_articles"("cardType", "sortOrder");
