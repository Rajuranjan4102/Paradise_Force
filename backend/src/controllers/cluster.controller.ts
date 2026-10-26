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
}

export const clusterController = new ClusterController();
