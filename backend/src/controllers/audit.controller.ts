import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';

export class AuditController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string || '50', 10);
      const entityType = req.query.entityType as string | undefined;
      const entityId = req.query.entityId as string | undefined;

      const logs = await auditService.getRecentLogs(limit, entityType, entityId);
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
