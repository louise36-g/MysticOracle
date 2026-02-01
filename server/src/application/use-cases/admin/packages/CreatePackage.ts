/**
 * CreatePackage Use Case
 * Creates a new credit package
 */

import { CreditPackage } from '@prisma/client';
import type { ICreditPackageRepository } from '../../../ports/repositories/ICreditPackageRepository.js';

export interface CreatePackageInput {
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

export interface CreatePackageResult {
  success: boolean;
  package?: CreditPackage;
  error?: string;
}

export class CreatePackageUseCase {
  constructor(private packageRepository: ICreditPackageRepository) {}

  async execute(input: CreatePackageInput): Promise<CreatePackageResult> {
    try {
      // Validate input
      if (input.credits <= 0) {
        return { success: false, error: 'Credits must be positive' };
      }
      if (input.priceEur <= 0) {
        return { success: false, error: 'Price must be positive' };
      }
      if (input.discount < 0 || input.discount > 100) {
        return { success: false, error: 'Discount must be between 0 and 100' };
      }

      const pkg = await this.packageRepository.create({
        credits: input.credits,
        priceEur: input.priceEur,
        nameEn: input.nameEn,
        nameFr: input.nameFr,
        labelEn: input.labelEn,
        labelFr: input.labelFr,
        discount: input.discount,
        badge: input.badge,
        sortOrder: input.sortOrder,
        isActive: input.isActive ?? true,
      });

      return { success: true, package: pkg };
    } catch (error) {
      console.error('[CreatePackage] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create package',
      };
    }
  }
}

export default CreatePackageUseCase;
