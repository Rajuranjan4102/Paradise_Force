import { prisma } from '../lib/prisma';

export interface RecordAuditParams {
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}

export class AuditService {
  async record(params: RecordAuditParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          action: params.action,
          actorId: params.actorId,
          actorName: params.actorName,
          actorRole: params.actorRole,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
          newValues: params.newValues ? JSON.stringify(params.newValues) : null,
          ipAddress: params.ipAddress || '127.0.0.1',
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Non-blocking in catastrophic edge-cases, but logged
      return null;
    }
  }

  async getRecentLogs(limit = 50, entityType?: string, entityId?: string) {
    return prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}

export const auditService = new AuditService();
