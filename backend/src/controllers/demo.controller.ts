import { Request, Response, NextFunction } from 'express';
import { guidedDemoService } from '../services/demo/guidedDemoService';

export class DemoController {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await guidedDemoService.getDemoOverview();
      res.json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  }

  async runStep(req: Request, res: Response, next: NextFunction) {
    try {
      const step = parseInt(req.body.step || req.params.step, 10);
      if (isNaN(step) || step < 1 || step > 8) {
        return res.status(400).json({ success: false, message: 'Step must be an integer between 1 and 8' });
      }
      const result = await guidedDemoService.executeStep(step);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async reset(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await guidedDemoService.resetDemoData();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const demoController = new DemoController();
