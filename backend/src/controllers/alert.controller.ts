import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export class AlertController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await prisma.alert.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      res.json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const alert = await prisma.alert.update({
        where: { id },
        data: { isRead: true },
      });
      res.json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();
