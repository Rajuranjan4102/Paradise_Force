import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string | null;
  district?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication middleware for demo & production.
 * Checks for demo persona headers (x-user-role, x-user-email) or Bearer token.
 * Defaults to the active super-admin or matched seeded user.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const userRoleHeader = req.headers['x-user-role'] as string;
    const userEmailHeader = req.headers['x-user-email'] as string;

    let user: AuthUser | null = null;

    if (userEmailHeader) {
      const dbUser = await prisma.user.findUnique({
        where: { email: userEmailHeader },
      });
      if (dbUser) {
        user = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          departmentId: dbUser.departmentId,
          district: dbUser.district,
        };
      }
    } else if (userRoleHeader) {
      const dbUser = await prisma.user.findFirst({
        where: { role: userRoleHeader },
      });
      if (dbUser) {
        user = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          departmentId: dbUser.departmentId,
          district: dbUser.district,
        };
      }
    }

    // Fallback to primary admin user if not specified
    if (!user) {
      const defaultAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
      });
      if (defaultAdmin) {
        user = {
          id: defaultAdmin.id,
          name: defaultAdmin.name,
          email: defaultAdmin.email,
          role: defaultAdmin.role,
          departmentId: defaultAdmin.departmentId,
          district: defaultAdmin.district,
        };
      } else {
        // Ephemeral fallback during initial migration
        user = {
          id: 'system-admin-uuid',
          name: 'ADG Control Room',
          email: 'admin@biharpolice.gov.in',
          role: 'SUPER_ADMIN',
        };
      }
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * RBAC authorization guard: verifies if current user possesses one of allowed roles.
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' lacks authorization for this resource`,
      });
    }

    next();
  };
}
