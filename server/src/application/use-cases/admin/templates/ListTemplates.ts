/**
 * ListTemplates Use Case
 * Lists all email templates
 */

import { EmailTemplate } from '@prisma/client';
import type { IEmailTemplateRepository } from '../../../ports/repositories/IEmailTemplateRepository.js';

export interface ListTemplatesResult {
  templates: EmailTemplate[];
}

export class ListTemplatesUseCase {
  constructor(private templateRepository: IEmailTemplateRepository) {}

  async execute(): Promise<ListTemplatesResult> {
    const templates = await this.templateRepository.findAll();
    return { templates };
  }
}

export default ListTemplatesUseCase;
