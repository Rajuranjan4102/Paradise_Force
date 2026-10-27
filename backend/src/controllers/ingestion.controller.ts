import { Request, Response, NextFunction } from 'express';
import { socialIngestionService } from '../services/ingestion/socialIngestionService';
import { prisma } from '../lib/prisma';
import fs from 'fs';

export class IngestionController {
  async getConnectors(req: Request, res: Response, next: NextFunction) {
    try {
      const connectors = await socialIngestionService.getConnectorStates();
      res.json({ success: true, data: connectors });
    } catch (error) {
      next(error);
    }
  }

  async importBatch(req: Request, res: Response, next: NextFunction) {
    try {
      let records: any[] = [];
      let filename = 'manual_submission';
      let source = req.body.source || 'CSV_IMPORT';

      if (req.file) {
        filename = req.file.originalname;
        const content = fs.readFileSync(req.file.path, 'utf-8');

        if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
          records = JSON.parse(content);
          source = 'JSON_IMPORT';
        } else {
          // Assume CSV
          records = socialIngestionService.parseCSV(content);
          source = 'CSV_IMPORT';
        }
      } else if (Array.isArray(req.body.records)) {
        records = req.body.records;
      } else if (typeof req.body.csvText === 'string') {
        records = socialIngestionService.parseCSV(req.body.csvText);
        filename = 'pasted_csv.csv';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Please upload a CSV or JSON file, or provide records array in JSON body.',
        });
      }

      if (records.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid rows found to import.',
        });
      }

      const result = await socialIngestionService.ingestBatch(records, source, filename);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const records = await prisma.ingestionRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }
}

export const ingestionController = new IngestionController();
