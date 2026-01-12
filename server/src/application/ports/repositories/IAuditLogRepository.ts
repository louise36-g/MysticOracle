/**
 * IAuditLogRepository - Audit log data access interface
 * GDPR & SOC2 compliance audit trail
 */

export interface CreateAuditLogDTO {
  userId?: string;
  adminUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateConsentAuditLogDTO {
  userId: string;
  consentType: string;
  consented: boolean;
  consentVersion?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  adminUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface IAuditLogRepository {
  create(data: CreateAuditLogDTO): Promise<{ id: string }>;
  createConsentLog(data: CreateConsentAuditLogDTO): Promise<{ id: string }>;
  findByUser(userId: string, limit?: number): Promise<AuditLogEntry[]>;
  findByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]>;
}

export default IAuditLogRepository;
