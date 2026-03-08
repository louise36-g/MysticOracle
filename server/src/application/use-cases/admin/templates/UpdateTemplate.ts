/**
 * UpdateTemplate Use Case
 * Updates an existing email template
 */

import { EmailTemplate } from '../../../../generated/prisma/client.js';
import type { IEmailTemplateRepository } from '../../../ports/repositories/IEmailTemplateRepository.js';
import { logger } from '../../../../lib/logger.js';

export interface UpdateTemplateInput {
  id: string;
  slug?: string;
  subjectEn?: string;
  subjectFr?: string;
  bodyEn?: string;
  bodyFr?: string;
  isActive?: boolean;
}

export interface UpdateTemplateResult {
  success: boolean;
  template?: EmailTemplate;
  error?: string;
}

export class UpdateTemplateUseCase {
  constructor(private templateRepository: IEmailTemplateRepository) {}

  async execute(input: UpdateTemplateInput): Promise<UpdateTemplateResult> {
    try {
      // Verify template exists
      const existing = await this.templateRepository.findById(input.id);
      if (!existing) {
        return { success: false, error: 'Template not found' };
      }

      // Check for duplicate slug if changing
      if (input.slug && input.slug !== existing.slug) {
        const slugExists = await this.templateRepository.findBySlug(input.slug);
        if (slugExists) {
          return { success: false, error: 'A template with this slug already exists' };
        }
      }

      const { id, ...data } = input;
      if (data.slug) {
        data.slug = data.slug.toLowerCase().trim();
      }

      const template = await this.templateRepository.update(id, data);

      return { success: true, template };
    } catch (error) {
      logger.error('[UpdateTemplate] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update template',
      };
    }
  }
}

export default UpdateTemplateUseCase;
