import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export class DepartmentController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await prisma.department.findMany({
        include: {
          officers: {
            select: { id: true, name: true, role: true, email: true, badgeNumber: true, phone: true },
          },
          _count: {
            select: { grievances: true },
          },
        },
      });
      res.json({ success: true, data: departments });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          officers: true,
          grievances: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { location: true },
          },
        },
      });
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      res.json({ success: true, data: department });
    } catch (error) {
      next(error);
    }
  }
}

export const departmentController = new DepartmentController();
