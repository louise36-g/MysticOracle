/**
 * UpdatePackage Use Case
 * Updates an existing credit package
 */

import { CreditPackage } from '@prisma/client';
import type {
  ICreditPackageRepository,
  UpdatePackageDTO,
} from '../../../ports/repositories/ICreditPackageRepository.js';

export interface UpdatePackageInput {
  id: string;
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

export interface UpdatePackageResult {
  success: boolean;
  package?: CreditPackage;
  error?: string;
}

export class UpdatePackageUseCase {
  constructor(private packageRepository: ICreditPackageRepository) {}

  async execute(input: UpdatePackageInput): Promise<UpdatePackageResult> {
    try {
      // Verify package exists
      const existing = await this.packageRepository.findById(input.id);
      if (!existing) {
        return { success: false, error: 'Package not found' };
      }

      // Validate input
      if (input.credits !== undefined && input.credits <= 0) {
        return { success: false, error: 'Credits must be positive' };
      }
      if (input.priceEur !== undefined && input.priceEur <= 0) {
        return { success: false, error: 'Price must be positive' };
      }
      if (input.discount !== undefined && (input.discount < 0 || input.discount > 100)) {
        return { success: false, error: 'Discount must be between 0 and 100' };
      }

      const { id, ...data } = input;
      const pkg = await this.packageRepository.update(id, data);

      return { success: true, package: pkg };
    } catch (error) {
      console.error('[UpdatePackage] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update package',
      };
    }
  }
}

export default UpdatePackageUseCase;
