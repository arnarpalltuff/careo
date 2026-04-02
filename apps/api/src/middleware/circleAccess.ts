import { Request, Response, NextFunction } from 'express';
import { CircleRole } from '@careo/shared';
import { prisma } from '../utils/prisma';

export function circleAccess(requiredRoles: CircleRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { circleId } = req.params;
    const userId = req.user?.userId;

    if (!userId || !circleId) {
      res.status(400).json({ error: 'Missing circle or user context' });
      return;
    }

    const member = await prisma.circleMember.findUnique({
      where: { userId_circleId: { userId, circleId } },
    });

    if (!member) {
      res.status(403).json({ error: 'You are not a member of this circle' });
      return;
    }

    if (!requiredRoles.includes(member.role as CircleRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    req.circleMember = {
      id: member.id,
      role: member.role as CircleRole,
      userId: member.userId,
      circleId: member.circleId,
    };

    next();
  };
}
