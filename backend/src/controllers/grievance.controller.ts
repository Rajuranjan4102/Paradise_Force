import { Request, Response, NextFunction } from 'express';
import { grievanceService } from '../services/grievance.service';
import {
  CreateGrievanceSchema,
  GrievanceFilterSchema,
  UpdateStatusSchema,
  AssignCaseSchema,
  ResolveCaseSchema,
  AddNoteSchema,
} from '../schemas/grievance.schema';

export class GrievanceController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = GrievanceFilterSchema.parse(req.query);
      const result = await grievanceService.listGrievances(query, req.user);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const grievance = await grievanceService.getGrievanceById(id);
      res.json({ success: true, data: grievance });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = CreateGrievanceSchema.parse(req.body);
      const grievance = await grievanceService.createGrievance(input, req.user);
      res.status(201).json({ success: true, data: grievance });
    } catch (error) {
      next(error);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = AssignCaseSchema.parse(req.body);
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const updated = await grievanceService.assignGrievance(id, input, req.user);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = UpdateStatusSchema.parse(req.body);
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const updated = await grievanceService.updateStatus(id, input, req.user);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = ResolveCaseSchema.parse(req.body);
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const updated = await grievanceService.resolveGrievance(id, input, req.user);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = AddNoteSchema.parse(req.body);
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const note = await grievanceService.addCaseNote(id, input, req.user);
      res.status(201).json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  }
}

export const grievanceController = new GrievanceController();
