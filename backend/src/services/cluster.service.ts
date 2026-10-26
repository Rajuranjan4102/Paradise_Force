import { prisma } from '../lib/prisma';
import { auditService } from './audit.service';
import { AuthUser } from '../middleware/auth';

export class ClusterService {
  async listClusters(district?: string) {
    const where: any = {};
    if (district && district !== 'ALL') {
      where.district = district;
    }

    return prisma.incidentCluster.findMany({
      where,
      include: {
        grievances: {
          select: {
            id: true,
            trackingId: true,
            title: true,
            severity: true,
            status: true,
            createdAt: true,
            complainantName: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getClusterById(id: string) {
    const cluster = await prisma.incidentCluster.findUnique({
      where: { id },
      include: {
        grievances: {
          include: {
            location: true,
            department: true,
            assignedOfficer: true,
          },
        },
      },
    });

    if (!cluster) {
      throw new Error(`Cluster with ID ${id} not found`);
    }

    return cluster;
  }

  async updateClusterStatus(id: string, status: string, user: AuthUser) {
    const existing = await prisma.incidentCluster.findUnique({ where: { id } });
    if (!existing) throw new Error(`Cluster ${id} not found`);

    const updated = await prisma.incidentCluster.update({
      where: { id },
      data: { status },
    });

    await auditService.record({
      action: 'CLUSTER_STATUS_UPDATED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      entityType: 'CLUSTER',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status },
    });

    return updated;
  }

  async mergeCasesIntoCluster(clusterId: string, grievanceIds: string[], user: AuthUser) {
    const cluster = await prisma.incidentCluster.findUnique({ where: { id: clusterId } });
    if (!cluster) throw new Error(`Cluster ${clusterId} not found`);

    await prisma.grievance.updateMany({
      where: { id: { in: grievanceIds } },
      data: { incidentClusterId: clusterId },
    });

    await auditService.record({
      action: 'CASES_MERGED_INTO_CLUSTER',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      entityType: 'CLUSTER',
      entityId: clusterId,
      newValues: { grievanceIds, clusterCode: cluster.clusterCode },
    });

    return this.getClusterById(clusterId);
  }

  async removeCaseFromCluster(grievanceId: string, user: AuthUser) {
    const grievance = await prisma.grievance.findUnique({ where: { id: grievanceId } });
    if (!grievance) throw new Error(`Grievance ${grievanceId} not found`);

    const previousClusterId = grievance.incidentClusterId;

    await prisma.grievance.update({
      where: { id: grievanceId },
      data: { incidentClusterId: null },
    });

    await auditService.record({
      action: 'CASE_REMOVED_FROM_CLUSTER',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      entityType: 'GRIEVANCE',
      entityId: grievanceId,
      oldValues: { incidentClusterId: previousClusterId },
      newValues: { incidentClusterId: null },
    });

    return { success: true, grievanceId, previousClusterId };
  }
}

export const clusterService = new ClusterService();
