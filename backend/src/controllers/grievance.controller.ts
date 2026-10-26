import { Request, Response, NextFunction } from 'express';
import { grievanceService } from '../services/grievance.service';
import { visionModelAdapter } from '../services/ai/visionModelAdapter';
import {
  CreateGrievanceSchema,
  GrievanceFilterSchema,
  UpdateStatusSchema,
  AssignCaseSchema,
  ResolveCaseSchema,
  AddNoteSchema,
  VerifyMediaSchema,
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
      const grievance = await grievanceService.getGrievanceById(id, req.user);
      res.json({ success: true, data: grievance });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Parse body (supports multipart form data strings or JSON)
      const body = { ...req.body };
      if (typeof body.latitude === 'string') body.latitude = parseFloat(body.latitude);
      if (typeof body.longitude === 'string') body.longitude = parseFloat(body.longitude);
      if (typeof body.isAnonymous === 'string') body.isAnonymous = body.isAnonymous === 'true';

      const input = CreateGrievanceSchema.parse(body);

      // Multimodal processing if photo or video was uploaded
      if (req.file) {
        const visionResult = await visionModelAdapter.analyzeMedia(
          req.file.path,
          req.file.mimetype,
          req.file.originalname
        );
        input.mediaUrl = `/uploads/${req.file.filename}`;
        input.mediaType = req.file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
        input.mediaAnalysisJson = JSON.stringify(visionResult);
        if (!input.category && visionResult.recommendedCategory) {
          input.category = visionResult.recommendedCategory as any;
        }
      }

      const grievance = await grievanceService.createGrievance(input, req.user);
      res.status(201).json({ success: true, data: grievance });
    } catch (error) {
      next(error);
    }
  }

  async verifyMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { verified, note } = VerifyMediaSchema.parse(req.body);
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const updated = await grievanceService.verifyMedia(id, verified, note, req.user);
      res.json({ success: true, data: updated });
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

  async overridePriority(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { priority, reason } = req.body;
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const updated = await grievanceService.overridePriority(id, priority, reason, req.user);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async listDuplicates(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const candidates = await grievanceService.listDuplicateCandidates(status);
      res.json({ success: true, data: candidates });
    } catch (error) {
      next(error);
    }
  }

  async confirmDuplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { clusterTitle } = req.body;
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const confirmed = await grievanceService.confirmDuplicateCandidate(id, req.user, clusterTitle);
      res.json({ success: true, data: confirmed });
    } catch (error) {
      next(error);
    }
  }

  async rejectDuplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const rejected = await grievanceService.rejectDuplicateCandidate(id, notes, req.user);
      res.json({ success: true, data: rejected });
    } catch (error) {
      next(error);
    }
  }
}

export const grievanceController = new GrievanceController();
