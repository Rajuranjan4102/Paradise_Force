import { Request, Response, NextFunction } from 'express';
import { benchmarkService, GOLD_STANDARD_BENCHMARK_SET } from '../services/evaluation/benchmarkService';

export class EvaluationController {
  async runBenchmark(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await benchmarkService.runEvaluation();
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async getDataset(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: {
          total: GOLD_STANDARD_BENCHMARK_SET.length,
          items: GOLD_STANDARD_BENCHMARK_SET,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const evaluationController = new EvaluationController();
