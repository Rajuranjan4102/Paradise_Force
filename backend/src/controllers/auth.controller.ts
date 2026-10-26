import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export class AuthController {
  async getPersonas(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        include: { department: true },
        orderBy: { role: 'asc' },
      });
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: req.user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
