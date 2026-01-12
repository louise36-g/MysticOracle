/**
 * DeleteTemplate Use Case
 * Deletes an email template
 */

import type { IEmailTemplateRepository } from '../../../ports/repositories/IEmailTemplateRepository.js';

export interface DeleteTemplateInput {
  id: string;
}

export interface DeleteTemplateResult {
  success: boolean;
  error?: string;
}

export class DeleteTemplateUseCase {
  constructor(private templateRepository: IEmailTemplateRepository) {}

  async execute(input: DeleteTemplateInput): Promise<DeleteTemplateResult> {
    try {
      // Verify template exists
      const existing = await this.templateRepository.findById(input.id);
      if (!existing) {
        return { success: false, error: 'Template not found' };
      }

      await this.templateRepository.delete(input.id);

      return { success: true };
    } catch (error) {
      console.error('[DeleteTemplate] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete template',
      };
    }
  }
}

export default DeleteTemplateUseCase;
