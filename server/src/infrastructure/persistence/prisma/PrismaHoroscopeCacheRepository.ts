/**
 * PrismaHoroscopeCacheRepository - Prisma implementation of IHoroscopeCacheRepository
 */

import { PrismaClient, HoroscopeCache } from '@prisma/client';
import type {
  IHoroscopeCacheRepository,
  CreateHoroscopeCacheDTO,
} from '../../../application/ports/repositories/IHoroscopeCacheRepository.js';

export class PrismaHoroscopeCacheRepository implements IHoroscopeCacheRepository {
  constructor(private prisma: PrismaClient) {}

  async findBySignAndDate(
    sign: string,
    language: string,
    date: Date
  ): Promise<HoroscopeCache | null> {
    return this.prisma.horoscopeCache.findFirst({
      where: {
        sign,
        language,
        date,
      },
    });
  }

  async create(data: CreateHoroscopeCacheDTO): Promise<HoroscopeCache> {
    return this.prisma.horoscopeCache.create({
      data: {
        sign: data.sign,
        language: data.language,
        date: data.date,
        horoscope: data.horoscope,
        userId: data.userId,
      },
    });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.prisma.horoscopeCache.deleteMany({
      where: {
        date: { lt: date },
      },
    });
    return result.count;
  }

  async count(): Promise<number> {
    return this.prisma.horoscopeCache.count();
  }

  async countByDate(date: Date): Promise<number> {
    return this.prisma.horoscopeCache.count({
      where: { date },
    });
  }
}

export default PrismaHoroscopeCacheRepository;
