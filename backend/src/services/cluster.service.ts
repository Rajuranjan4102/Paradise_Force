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
}

export const clusterService = new ClusterService();
