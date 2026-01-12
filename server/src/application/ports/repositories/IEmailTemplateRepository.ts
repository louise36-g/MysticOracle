/**
 * IEmailTemplateRepository - Email Template data access interface
 * Abstracts database operations for EmailTemplate entity
 */

import type { EmailTemplate } from '@prisma/client';

// DTOs for creating/updating templates
export interface CreateTemplateDTO {
  slug: string;
  subjectEn: string;
  subjectFr: string;
  bodyEn: string;
  bodyFr: string;
  isActive?: boolean;
}

export interface UpdateTemplateDTO {
  slug?: string;
  subjectEn?: string;
  subjectFr?: string;
  bodyEn?: string;
  bodyFr?: string;
  isActive?: boolean;
}

/**
 * Email Template Repository Interface
 * Defines all email template-related database operations
 */
export interface IEmailTemplateRepository {
  // Basic CRUD
  findById(id: string): Promise<EmailTemplate | null>;
  findBySlug(slug: string): Promise<EmailTemplate | null>;
  findAll(): Promise<EmailTemplate[]>;
  findActive(): Promise<EmailTemplate[]>;
  create(data: CreateTemplateDTO): Promise<EmailTemplate>;
  createMany(data: CreateTemplateDTO[]): Promise<void>;
  update(id: string, data: UpdateTemplateDTO): Promise<EmailTemplate>;
  delete(id: string): Promise<void>;

  // Counting
  count(): Promise<number>;
}

export default IEmailTemplateRepository;
