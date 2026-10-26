import { Request, Response, NextFunction } from 'express';
import { clusterService } from '../services/cluster.service';

export class ClusterController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const district = req.query.district as string | undefined;
      const clusters = await clusterService.listClusters(district);
      res.json({ success: true, data: clusters });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cluster = await clusterService.getClusterById(id);
      res.json({ success: true, data: cluster });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const updated = await clusterService.updateClusterStatus(id, status, req.user);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async mergeCases(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { grievanceIds } = req.body;
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      if (!Array.isArray(grievanceIds) || grievanceIds.length === 0) {
        return res.status(400).json({ success: false, message: 'grievanceIds must be a non-empty array' });
      }
      const updated = await clusterService.mergeCasesIntoCluster(id, grievanceIds, req.user);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async removeCase(req: Request, res: Response, next: NextFunction) {
    try {
      const { grievanceId } = req.params;
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const result = await clusterService.removeCaseFromCluster(grievanceId, req.user);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const clusterController = new ClusterController();
