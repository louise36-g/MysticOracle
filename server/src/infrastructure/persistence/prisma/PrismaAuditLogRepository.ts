/**
 * PrismaAuditLogRepository - Prisma implementation of IAuditLogRepository
 * GDPR & SOC2 compliance audit trail persistence
 */

import { PrismaClient } from '@prisma/client';
import type {
  IAuditLogRepository,
  CreateAuditLogDTO,
  CreateConsentAuditLogDTO,
  AuditLogEntry,
} from '../../../application/ports/repositories/IAuditLogRepository.js';

export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateAuditLogDTO): Promise<{ id: string }> {
    const log = await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        adminUserId: data.adminUserId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details as object | undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
      select: { id: true },
    });
    return log;
  }

  async createConsentLog(data: CreateConsentAuditLogDTO): Promise<{ id: string }> {
    const log = await this.prisma.consentAuditLog.create({
      data: {
        userId: data.userId,
        consentType: data.consentType,
        consented: data.consented,
        consentVersion: data.consentVersion,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
      select: { id: true },
    });
    return log;
  }

  async findByUser(userId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return logs as AuditLogEntry[];
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
    return logs as AuditLogEntry[];
  }
}

export default PrismaAuditLogRepository;
