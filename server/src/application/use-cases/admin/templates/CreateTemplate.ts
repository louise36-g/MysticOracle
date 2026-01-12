/**
 * CreateTemplate Use Case
 * Creates a new email template
 */

import { EmailTemplate } from '@prisma/client';
import type {
  IEmailTemplateRepository,
  CreateTemplateDTO,
} from '../../../ports/repositories/IEmailTemplateRepository.js';

export interface CreateTemplateInput {
  slug: string;
  subjectEn: string;
  subjectFr: string;
  bodyEn: string;
  bodyFr: string;
  isActive?: boolean;
}

export interface CreateTemplateResult {
  success: boolean;
  template?: EmailTemplate;
  error?: string;
}

export class CreateTemplateUseCase {
  constructor(private templateRepository: IEmailTemplateRepository) {}

  async execute(input: CreateTemplateInput): Promise<CreateTemplateResult> {
    try {
      // Validate input
      if (!input.slug || input.slug.trim().length === 0) {
        return { success: false, error: 'Slug is required' };
      }
      if (!input.subjectEn || !input.subjectFr) {
        return { success: false, error: 'Subject is required in both languages' };
      }
      if (!input.bodyEn || !input.bodyFr) {
        return { success: false, error: 'Body is required in both languages' };
      }

      // Check for duplicate slug
      const existing = await this.templateRepository.findBySlug(input.slug);
      if (existing) {
        return { success: false, error: 'A template with this slug already exists' };
      }

      const template = await this.templateRepository.create({
        slug: input.slug.toLowerCase().trim(),
        subjectEn: input.subjectEn,
        subjectFr: input.subjectFr,
        bodyEn: input.bodyEn,
        bodyFr: input.bodyFr,
        isActive: input.isActive ?? true,
      });

      return { success: true, template };
    } catch (error) {
      console.error('[CreateTemplate] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create template',
      };
    }
  }
}

export default CreateTemplateUseCase;
