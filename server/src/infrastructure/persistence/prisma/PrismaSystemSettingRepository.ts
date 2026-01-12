/**
 * PrismaSystemSettingRepository - Prisma implementation of ISystemSettingRepository
 */

import { PrismaClient, SystemSetting } from '@prisma/client';
import type { ISystemSettingRepository } from '../../../application/ports/repositories/ISystemSettingRepository.js';

export class PrismaSystemSettingRepository implements ISystemSettingRepository {
  constructor(private prisma: PrismaClient) {}

  async findByKey(key: string): Promise<SystemSetting | null> {
    return this.prisma.systemSetting.findUnique({ where: { key } });
  }

  async findAll(): Promise<SystemSetting[]> {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async findByKeys(keys: string[]): Promise<SystemSetting[]> {
    return this.prisma.systemSetting.findMany({
      where: { key: { in: keys } },
    });
  }

  async upsert(key: string, value: string): Promise<SystemSetting> {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async delete(key: string): Promise<void> {
    await this.prisma.systemSetting.delete({ where: { key } });
  }

  async deleteByKey(key: string): Promise<boolean> {
    try {
      await this.prisma.systemSetting.delete({ where: { key } });
      return true;
    } catch {
      return false;
    }
  }
}

export default PrismaSystemSettingRepository;
