/**
 * ListPackages Use Case
 * Lists all credit packages
 */

import { CreditPackage } from '@prisma/client';
import type { ICreditPackageRepository } from '../../../ports/repositories/ICreditPackageRepository.js';

export interface ListPackagesResult {
  packages: CreditPackage[];
}

export class ListPackagesUseCase {
  constructor(private packageRepository: ICreditPackageRepository) {}

  async execute(): Promise<ListPackagesResult> {
    const packages = await this.packageRepository.findAll();
    return { packages };
  }
}

export default ListPackagesUseCase;
