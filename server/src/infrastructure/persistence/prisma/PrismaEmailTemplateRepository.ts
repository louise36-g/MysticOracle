/**
 * PrismaEmailTemplateRepository - Prisma implementation of IEmailTemplateRepository
 */

import { PrismaClient, EmailTemplate } from '@prisma/client';
import type {
  IEmailTemplateRepository,
  CreateTemplateDTO,
  UpdateTemplateDTO,
} from '../../../application/ports/repositories/IEmailTemplateRepository.js';

export class PrismaEmailTemplateRepository implements IEmailTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<EmailTemplate | null> {
    return this.prisma.emailTemplate.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<EmailTemplate | null> {
    return this.prisma.emailTemplate.findFirst({ where: { slug } });
  }

  async findAll(): Promise<EmailTemplate[]> {
    return this.prisma.emailTemplate.findMany({
      orderBy: { slug: 'asc' },
    });
  }

  async findActive(): Promise<EmailTemplate[]> {
    return this.prisma.emailTemplate.findMany({
      where: { isActive: true },
      orderBy: { slug: 'asc' },
    });
  }

  async create(data: CreateTemplateDTO): Promise<EmailTemplate> {
    return this.prisma.emailTemplate.create({
      data: {
        slug: data.slug,
        subjectEn: data.subjectEn,
        subjectFr: data.subjectFr,
        bodyEn: data.bodyEn,
        bodyFr: data.bodyFr,
        isActive: data.isActive ?? true,
      },
    });
  }

  async createMany(data: CreateTemplateDTO[]): Promise<void> {
    await this.prisma.emailTemplate.createMany({
      data: data.map((template) => ({
        slug: template.slug,
        subjectEn: template.subjectEn,
        subjectFr: template.subjectFr,
        bodyEn: template.bodyEn,
        bodyFr: template.bodyFr,
        isActive: template.isActive ?? true,
      })),
    });
  }

  async update(id: string, data: UpdateTemplateDTO): Promise<EmailTemplate> {
    return this.prisma.emailTemplate.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.emailTemplate.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return this.prisma.emailTemplate.count();
  }
}

export default PrismaEmailTemplateRepository;
