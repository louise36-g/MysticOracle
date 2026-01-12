/**
 * PrismaReadingRepository - Prisma implementation of IReadingRepository
 */

import { PrismaClient, Prisma, Reading, FollowUpQuestion } from '@prisma/client';
import type {
  IReadingRepository,
  CreateReadingDTO,
  UpdateReadingDTO,
  CreateFollowUpDTO,
  ReadingWithFollowUps,
} from '../../../application/ports/repositories/IReadingRepository.js';
import type { PaginationOptions } from '../../../application/ports/repositories/IUserRepository.js';

export class PrismaReadingRepository implements IReadingRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Reading | null> {
    return this.prisma.reading.findUnique({ where: { id } });
  }

  async findByIdWithFollowUps(id: string): Promise<ReadingWithFollowUps | null> {
    return this.prisma.reading.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async create(data: CreateReadingDTO): Promise<Reading> {
    // Dual-write: save to both JSON field and normalized ReadingCard table
    return this.prisma.reading.create({
      data: {
        userId: data.userId,
        spreadType: data.spreadType,
        interpretationStyle: data.interpretationStyle,
        question: data.question,
        cards: data.cards as unknown as Prisma.InputJsonValue,
        interpretation: data.interpretation,
        creditCost: data.creditCost,
        // Create normalized cards for RAG queries
        normalizedCards: {
          create: data.cards.map((card, index) => ({
            cardId: typeof card.cardId === 'string' ? parseInt(card.cardId, 10) : card.cardId,
            position: card.position ?? index,
            isReversed: card.isReversed ?? false,
          })),
        },
      },
    });
  }

  async update(id: string, data: UpdateReadingDTO): Promise<Reading> {
    return this.prisma.reading.update({
      where: { id },
      data: {
        summary: data.summary,
        userReflection: data.userReflection,
        themes: data.themes,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.reading.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async findByUser(userId: string, options?: PaginationOptions): Promise<ReadingWithFollowUps[]> {
    const { limit = 20, offset = 0 } = options || {};

    return this.prisma.reading.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        followUps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.reading.count({ where: { userId } });
  }

  async findByIdAndUser(id: string, userId: string): Promise<Reading | null> {
    return this.prisma.reading.findFirst({
      where: { id, userId },
    });
  }

  async addFollowUp(data: CreateFollowUpDTO): Promise<FollowUpQuestion> {
    return this.prisma.followUpQuestion.create({
      data: {
        readingId: data.readingId,
        question: data.question,
        answer: data.answer,
        creditCost: data.creditCost,
      },
    });
  }

  async findFollowUpsByReading(readingId: string): Promise<FollowUpQuestion[]> {
    return this.prisma.followUpQuestion.findMany({
      where: { readingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async countAll(): Promise<number> {
    return this.prisma.reading.count();
  }

  async countToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.reading.count({
      where: {
        createdAt: { gte: today },
      },
    });
  }

  async getRecentReadings(limit = 10): Promise<(Reading & { user: { username: string } })[]> {
    return this.prisma.reading.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { username: true },
        },
      },
    });
  }
}

export default PrismaReadingRepository;
