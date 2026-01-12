/**
 * SeedTemplates Use Case
 * Seeds default email templates
 */

import { EmailTemplate } from '@prisma/client';
import type { IEmailTemplateRepository } from '../../../ports/repositories/IEmailTemplateRepository.js';
import { DEFAULT_EMAIL_TEMPLATES } from '../../../../shared/constants/admin.js';

export interface SeedTemplatesResult {
  success: boolean;
  templates?: EmailTemplate[];
  count?: number;
  error?: string;
}

export class SeedTemplatesUseCase {
  constructor(private templateRepository: IEmailTemplateRepository) {}

  async execute(): Promise<SeedTemplatesResult> {
    try {
      // Check if templates already exist
      const existing = await this.templateRepository.count();
      if (existing > 0) {
        return {
          success: false,
          error: 'Email templates already exist. Delete them first if you want to reseed.',
        };
      }

      // Create default templates
      await this.templateRepository.createMany(
        DEFAULT_EMAIL_TEMPLATES.map((t) => ({ ...t, isActive: true }))
      );

      // Fetch created templates
      const templates = await this.templateRepository.findAll();

      return {
        success: true,
        templates,
        count: templates.length,
      };
    } catch (error) {
      console.error('[SeedTemplates] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed templates',
      };
    }
  }
}

export default SeedTemplatesUseCase;
