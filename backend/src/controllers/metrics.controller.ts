import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service';

export class MetricsController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const district = req.query.district as string | undefined;
      const metrics = await metricsService.getDashboardMetrics(district);
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }
}

export const metricsController = new MetricsController();
