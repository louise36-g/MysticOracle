/**
 * AuditService - Centralized audit logging service
 * GDPR & SOC2 compliance audit trail
 */

import { PrismaClient } from '@prisma/client';

export type AuditAction =
  | 'USER_DATA_EXPORT'
  | 'ACCOUNT_DELETION_REQUESTED'
  | 'ACCOUNT_DELETED'
  | 'CREDIT_ADJUSTMENT'
  | 'ADMIN_LOGIN'
  | 'CONSENT_UPDATED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'READING_CREATED'
  | 'PAYMENT_COMPLETED';

export interface AuditContext {
  userId?: string;
  adminUserId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Log an audit event
   */
  async log(
    action: AuditAction,
    entityType: string,
    entityId: string | undefined,
    context: AuditContext,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          userId: context.userId,
          adminUserId: context.adminUserId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          details: details as object | undefined,
        },
      });
      console.log(`[AuditService] Logged: ${action} on ${entityType}${entityId ? `:${entityId}` : ''}`);
    } catch (error) {
      // Log but don't fail the main operation - audit logging should not block business logic
      console.error('[AuditService] Failed to create audit log:', error);
    }
  }

  /**
   * Log a consent change event (GDPR compliance)
   */
  async logConsent(
    userId: string,
    consentType: string,
    consented: boolean,
    context: Omit<AuditContext, 'userId' | 'adminUserId'>,
    consentVersion?: string
  ): Promise<void> {
    try {
      await this.prisma.consentAuditLog.create({
        data: {
          userId,
          consentType,
          consented,
          consentVersion,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      });
      console.log(`[AuditService] Consent logged: ${consentType}=${consented} for user ${userId}`);
    } catch (error) {
      console.error('[AuditService] Failed to create consent log:', error);
    }
  }

  /**
   * Helper to extract context from Express request
   */
  static contextFromRequest(req: {
    ip?: string;
    headers?: { 'user-agent'?: string };
    auth?: { userId?: string };
  }): AuditContext {
    return {
      userId: req.auth?.userId,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    };
  }
}

export default AuditService;
