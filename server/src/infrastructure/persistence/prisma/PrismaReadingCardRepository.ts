/**
 * PrismaReadingCardRepository - Prisma implementation of IReadingCardRepository
 */

import { PrismaClient, ReadingCard } from '@prisma/client';
import type {
  IReadingCardRepository,
  CreateReadingCardDTO,
  ReadingCardQueryOptions,
  ReadingCardWithReading,
} from '../../../application/ports/repositories/IReadingCardRepository.js';

export class PrismaReadingCardRepository implements IReadingCardRepository {
  constructor(private prisma: PrismaClient) {}

  async findByReadingId(readingId: string): Promise<ReadingCard[]> {
    return this.prisma.readingCard.findMany({
      where: { readingId },
      orderBy: { position: 'asc' },
    });
  }

  async findReadingsWithCard(
    cardId: number,
    options?: ReadingCardQueryOptions
  ): Promise<ReadingCardWithReading[]> {
    const { isReversed, limit = 50, offset = 0 } = options || {};

    return this.prisma.readingCard.findMany({
      where: {
        cardId,
        ...(isReversed !== undefined && { isReversed }),
      },
      include: {
        reading: {
          select: {
            id: true,
            userId: true,
            spreadType: true,
            question: true,
            interpretation: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findReadingsWithCards(
    cardIds: number[],
    options?: ReadingCardQueryOptions
  ): Promise<ReadingCardWithReading[]> {
    const { isReversed, limit = 50, offset = 0 } = options || {};

    // Find readings that contain ALL specified cards
    // First, find reading IDs that have all the cards
    const readingsWithAllCards = await this.prisma.readingCard.groupBy({
      by: ['readingId'],
      where: {
        cardId: { in: cardIds },
        ...(isReversed !== undefined && { isReversed }),
      },
      having: {
        cardId: { _count: { equals: cardIds.length } },
      },
    });

    const readingIds = readingsWithAllCards.map(r => r.readingId);

    if (readingIds.length === 0) {
      return [];
    }

    // Get the actual cards with reading info
    return this.prisma.readingCard.findMany({
      where: {
        readingId: { in: readingIds },
        cardId: { in: cardIds },
      },
      include: {
        reading: {
          select: {
            id: true,
            userId: true,
            spreadType: true,
            question: true,
            interpretation: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async createMany(data: CreateReadingCardDTO[]): Promise<number> {
    const result = await this.prisma.readingCard.createMany({
      data: data.map(card => ({
        readingId: card.readingId,
        cardId: card.cardId,
        position: card.position,
        isReversed: card.isReversed ?? false,
      })),
      skipDuplicates: true,
    });
    return result.count;
  }

  async deleteByReadingId(readingId: string): Promise<number> {
    const result = await this.prisma.readingCard.deleteMany({
      where: { readingId },
    });
    return result.count;
  }

  async countReadingsWithCard(cardId: number): Promise<number> {
    const result = await this.prisma.readingCard.groupBy({
      by: ['readingId'],
      where: { cardId },
    });
    return result.length;
  }

  async getCardFrequencies(limit = 78): Promise<{ cardId: number; count: number }[]> {
    const result = await this.prisma.readingCard.groupBy({
      by: ['cardId'],
      _count: { cardId: true },
      orderBy: { _count: { cardId: 'desc' } },
      take: limit,
    });

    return result.map(r => ({
      cardId: r.cardId,
      count: r._count.cardId,
    }));
  }

  async findByUserId(
    userId: string,
    options?: ReadingCardQueryOptions
  ): Promise<ReadingCardWithReading[]> {
    const { cardId, isReversed, limit = 100, offset = 0 } = options || {};

    return this.prisma.readingCard.findMany({
      where: {
        reading: { userId },
        ...(cardId !== undefined && { cardId }),
        ...(isReversed !== undefined && { isReversed }),
      },
      include: {
        reading: {
          select: {
            id: true,
            userId: true,
            spreadType: true,
            question: true,
            interpretation: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}

export default PrismaReadingCardRepository;
