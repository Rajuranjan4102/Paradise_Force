import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { DEPARTMENT_RULES } from '../pipeline/stages/route';

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

  async recommend(req: Request, res: Response, next: NextFunction) {
    try {
      const category = (req.query.category as string) || 'ROAD_DAMAGE';
      const district = (req.query.district as string) || 'Patna Central';

      const rule = DEPARTMENT_RULES[category] || DEPARTMENT_RULES['OTHER_CIVIC'];
      const dept = await prisma.department.findUnique({
        where: { code: rule.code },
        include: { officers: true },
      });

      res.json({
        success: true,
        data: {
          recommendedDepartmentCode: rule.code,
          recommendedDepartmentName: rule.name,
          departmentId: dept?.id,
          slaHours: rule.defaultSlaHours,
          routingReason: `Category '${category}' maps to ${rule.name} based on civic mandate for ${district}.`,
          requiresHumanConfirmation: true,
          officers: dept?.officers || [],
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const departmentController = new DepartmentController();
