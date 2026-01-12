/**
 * SeedPackages Use Case
 * Seeds default credit packages
 */

import { CreditPackage } from '@prisma/client';
import type { ICreditPackageRepository } from '../../../ports/repositories/ICreditPackageRepository.js';
import { DEFAULT_PACKAGES } from '../../../../shared/constants/admin.js';

export interface SeedPackagesResult {
  success: boolean;
  packages?: CreditPackage[];
  count?: number;
  error?: string;
}

export class SeedPackagesUseCase {
  constructor(private packageRepository: ICreditPackageRepository) {}

  async execute(): Promise<SeedPackagesResult> {
    try {
      // Check if packages already exist
      const existing = await this.packageRepository.count();
      if (existing > 0) {
        return {
          success: false,
          error: 'Packages already exist. Delete them first if you want to reseed.',
        };
      }

      // Create default packages
      await this.packageRepository.createMany(
        DEFAULT_PACKAGES.map(pkg => ({ ...pkg, isActive: true }))
      );

      // Fetch created packages
      const packages = await this.packageRepository.findAll();

      return {
        success: true,
        packages,
        count: packages.length,
      };
    } catch (error) {
      console.error('[SeedPackages] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed packages',
      };
    }
  }
}

export default SeedPackagesUseCase;
