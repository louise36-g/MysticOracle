import prisma from '../db/prisma.js';

interface CardFromJson {
  cardId: string | number;
  position?: number;
  isReversed?: boolean;
}

/**
 * Backfill job to normalize existing Reading.cards JSON into ReadingCard table
 * Processes readings in batches to avoid memory issues
 */
export async function normalizeExistingReadings(batchSize = 100): Promise<{
  processed: number;
  skipped: number;
  errors: number;
}> {
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  console.log('[Normalize Readings] Starting backfill job...');

  while (true) {
    // Find readings that don't have normalized cards yet
    const readings = await prisma.reading.findMany({
      where: {
        normalizedCards: { none: {} },
      },
      take: batchSize,
      select: { id: true, cards: true },
    });

    if (readings.length === 0) {
      console.log('[Normalize Readings] No more readings to process');
      break;
    }

    for (const reading of readings) {
      try {
        const cards = reading.cards as unknown as CardFromJson[] | null;

        if (!cards || !Array.isArray(cards) || cards.length === 0) {
          skipped++;
          continue;
        }

        await prisma.readingCard.createMany({
          data: cards.map((card, index) => ({
            readingId: reading.id,
            cardId: typeof card.cardId === 'string' ? parseInt(card.cardId, 10) : card.cardId,
            position: card.position ?? index,
            isReversed: card.isReversed ?? false,
          })),
          skipDuplicates: true,
        });

        processed++;
      } catch (error) {
        console.error(`[Normalize Readings] Error processing reading ${reading.id}:`, error);
        errors++;
      }
    }

    console.log(
      `[Normalize Readings] Progress: ${processed} processed, ${skipped} skipped, ${errors} errors`
    );
  }

  console.log(
    `[Normalize Readings] Complete: ${processed} processed, ${skipped} skipped, ${errors} errors`
  );

  return { processed, skipped, errors };
}
