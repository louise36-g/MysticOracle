/**
 * ICreditPackageRepository - Credit Package data access interface
 * Abstracts database operations for CreditPackage entity
 */

import type { CreditPackage } from '@prisma/client';

// DTOs for creating/updating packages
export interface CreatePackageDTO {
  credits: number;
  priceEur: number;
  nameEn: string;
  nameFr: string;
  labelEn: string;
  labelFr: string;
  discount: number;
  badge?: string | null;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdatePackageDTO {
  credits?: number;
  priceEur?: number;
  nameEn?: string;
  nameFr?: string;
  labelEn?: string;
  labelFr?: string;
  discount?: number;
  badge?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Credit Package Repository Interface
 * Defines all credit package-related database operations
 */
export interface ICreditPackageRepository {
  // Basic CRUD
  findById(id: string): Promise<CreditPackage | null>;
  findAll(): Promise<CreditPackage[]>;
  findActive(): Promise<CreditPackage[]>;
  create(data: CreatePackageDTO): Promise<CreditPackage>;
  createMany(data: CreatePackageDTO[]): Promise<void>;
  update(id: string, data: UpdatePackageDTO): Promise<CreditPackage>;
  delete(id: string): Promise<void>;

  // Counting
  count(): Promise<number>;
}

export default ICreditPackageRepository;
