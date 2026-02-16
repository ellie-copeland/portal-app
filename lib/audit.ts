/**
 * Audit logging system
 * Immutable logging for auth, admin, billing, and integration events
 */

import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export enum AuditAction {
  // Auth events
  AUTH_SIGNIN = 'auth:signin',
  AUTH_SIGNUP = 'auth:signup',
  AUTH_SIGNOUT = 'auth:signout',
  AUTH_FAILED = 'auth:failed',
  PASSWORD_RESET = 'auth:password_reset',

  // User events
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Team events
  TEAM_CREATE = 'team:create',
  TEAM_UPDATE = 'team:update',
  TEAM_DELETE = 'team:delete',

  // Member events
  MEMBER_INVITE = 'team:member_invite',
  MEMBER_ADD = 'team:member_add',
  MEMBER_REMOVE = 'team:member_remove',
  MEMBER_ROLE_CHANGE = 'team:member_role_change',

  // Integration events
  INTEGRATION_CONNECT = 'integration:connect',
  INTEGRATION_DISCONNECT = 'integration:disconnect',
  INTEGRATION_EXECUTE = 'integration:execute',

  // Agent events
  AGENT_CREATE = 'agent:create',
  AGENT_UPDATE = 'agent:update',
  AGENT_DELETE = 'agent:delete',
  AGENT_DEPLOY = 'agent:deploy',

  // Billing events
  BILLING_SUBSCRIPTION_CREATED = 'billing:subscription_created',
  BILLING_SUBSCRIPTION_UPDATED = 'billing:subscription_updated',
  BILLING_SUBSCRIPTION_DELETED = 'billing:subscription_deleted',
  BILLING_PAYMENT_SUCCEEDED = 'billing:payment_succeeded',
  BILLING_PAYMENT_FAILED = 'billing:payment_failed',

  // Admin events
  ADMIN_SETTING_UPDATE = 'admin:setting_update',
  ADMIN_AUDIT_ACCESS = 'admin:audit_access',
  ADMIN_USER_IMPERSONATE = 'admin:user_impersonate',

  // Security events
  SECURITY_ALERT = 'security:alert',
  SECURITY_BRUTE_FORCE = 'security:brute_force',
}

export interface AuditLogEntry {
  userId?: string
  teamId?: string
  action: AuditAction | string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ip?: string
  userAgent?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Log an audit event
 * This creates an immutable record in the database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        teamId: entry.teamId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details,
        ip: entry.ip,
        createdAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - logging shouldn't fail the operation
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  userId: string | undefined,
  action: AuditAction,
  success: boolean,
  ip?: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    userId,
    action,
    resource: 'auth',
    ip,
    severity: success ? 'low' : 'high',
    details: {
      success,
      ...details,
    },
  })
}

/**
 * Log billing event
 */
export async function logBillingEvent(
  teamId: string,
  action: AuditAction,
  details: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    teamId,
    action,
    resource: 'billing',
    severity: action.includes('failed') ? 'high' : 'low',
    details,
  })
}

/**
 * Log integration execution
 */
export async function logIntegrationEvent(
  teamId: string,
  userId: string | undefined,
  provider: string,
  action: string,
  success: boolean,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    teamId,
    userId,
    action: AuditAction.INTEGRATION_EXECUTE,
    resource: 'integration',
    resourceId: `${provider}/${action}`,
    severity: success ? 'low' : 'medium',
    details: {
      provider,
      action,
      success,
      ...details,
    },
  })
}

/**
 * Log security alert
 */
export async function logSecurityAlert(
  teamId: string | undefined,
  userId: string | undefined,
  alertType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>,
  ip?: string
): Promise<void> {
  await logAuditEvent({
    teamId,
    userId,
    action: AuditAction.SECURITY_ALERT,
    resource: 'security',
    severity,
    details: {
      alertType,
      ...details,
    },
    ip,
  })
}

/**
 * Fetch audit logs with filtering
 */
export async function fetchAuditLogs(
  teamId: string,
  filters?: {
    action?: string
    resource?: string
    userId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
): Promise<any[]> {
  const where: Prisma.AuditLogWhereInput = {
    teamId,
  }

  if (filters?.action) {
    where.action = filters.action
  }

  if (filters?.resource) {
    where.resource = filters.resource
  }

  if (filters?.userId) {
    where.userId = filters.userId
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {
      ...(filters?.startDate && { gte: filters.startDate }),
      ...(filters?.endDate && { lte: filters.endDate }),
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(filters?.limit || 50, 500),
    skip: filters?.offset || 0,
  })

  return logs
}

/**
 * Archive old audit logs (optional - for compliance)
 */
export async function archiveOldAuditLogs(beforeDate: Date): Promise<number> {
  // This would typically export to a secure archive before deletion
  // For now, we'll keep all logs for immutability
  const count = await prisma.auditLog.count({
    where: {
      createdAt: { lt: beforeDate },
    },
  })
  return count
}
