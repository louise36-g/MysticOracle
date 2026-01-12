/**
 * PrismaCreditPackageRepository - Prisma implementation of ICreditPackageRepository
 */

import { PrismaClient, CreditPackage } from '@prisma/client';
import type {
  ICreditPackageRepository,
  CreatePackageDTO,
  UpdatePackageDTO,
} from '../../../application/ports/repositories/ICreditPackageRepository.js';

export class PrismaCreditPackageRepository implements ICreditPackageRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<CreditPackage | null> {
    return this.prisma.creditPackage.findUnique({ where: { id } });
  }

  async findAll(): Promise<CreditPackage[]> {
    return this.prisma.creditPackage.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findActive(): Promise<CreditPackage[]> {
    return this.prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: CreatePackageDTO): Promise<CreditPackage> {
    return this.prisma.creditPackage.create({
      data: {
        credits: data.credits,
        priceEur: data.priceEur,
        nameEn: data.nameEn,
        nameFr: data.nameFr,
        labelEn: data.labelEn,
        labelFr: data.labelFr,
        discount: data.discount,
        badge: data.badge,
        sortOrder: data.sortOrder,
        isActive: data.isActive ?? true,
      },
    });
  }

  async createMany(data: CreatePackageDTO[]): Promise<void> {
    await this.prisma.creditPackage.createMany({
      data: data.map((pkg) => ({
        credits: pkg.credits,
        priceEur: pkg.priceEur,
        nameEn: pkg.nameEn,
        nameFr: pkg.nameFr,
        labelEn: pkg.labelEn,
        labelFr: pkg.labelFr,
        discount: pkg.discount,
        badge: pkg.badge,
        sortOrder: pkg.sortOrder,
        isActive: pkg.isActive ?? true,
      })),
    });
  }

  async update(id: string, data: UpdatePackageDTO): Promise<CreditPackage> {
    return this.prisma.creditPackage.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.creditPackage.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return this.prisma.creditPackage.count();
  }
}

export default PrismaCreditPackageRepository;
