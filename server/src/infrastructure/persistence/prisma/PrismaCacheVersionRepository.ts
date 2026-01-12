/**
 * PrismaCacheVersionRepository - Prisma implementation of ICacheVersionRepository
 */

import { PrismaClient, CacheVersion } from '@prisma/client';
import type { ICacheVersionRepository } from '../../../application/ports/repositories/ICacheVersionRepository.js';

export class PrismaCacheVersionRepository implements ICacheVersionRepository {
  constructor(private prisma: PrismaClient) {}

  async getVersion(entity: string): Promise<number> {
    const record = await this.prisma.cacheVersion.findUnique({
      where: { entity },
    });
    return record?.version ?? 0;
  }

  async incrementVersion(entity: string): Promise<number> {
    const result = await this.prisma.cacheVersion.upsert({
      where: { entity },
      create: { entity, version: 1 },
      update: { version: { increment: 1 } },
    });
    return result.version;
  }

  async findAll(): Promise<CacheVersion[]> {
    return this.prisma.cacheVersion.findMany({
      orderBy: { entity: 'asc' },
    });
  }

  async findByEntity(entity: string): Promise<CacheVersion | null> {
    return this.prisma.cacheVersion.findUnique({
      where: { entity },
    });
  }
}

export default PrismaCacheVersionRepository;
