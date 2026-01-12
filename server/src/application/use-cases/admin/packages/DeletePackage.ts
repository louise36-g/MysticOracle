/**
 * DeletePackage Use Case
 * Deletes a credit package
 */

import type { ICreditPackageRepository } from '../../../ports/repositories/ICreditPackageRepository.js';

export interface DeletePackageInput {
  id: string;
}

export interface DeletePackageResult {
  success: boolean;
  error?: string;
}

export class DeletePackageUseCase {
  constructor(private packageRepository: ICreditPackageRepository) {}

  async execute(input: DeletePackageInput): Promise<DeletePackageResult> {
    try {
      // Verify package exists
      const existing = await this.packageRepository.findById(input.id);
      if (!existing) {
        return { success: false, error: 'Package not found' };
      }

      await this.packageRepository.delete(input.id);

      return { success: true };
    } catch (error) {
      console.error('[DeletePackage] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete package',
      };
    }
  }
}

export default DeletePackageUseCase;
