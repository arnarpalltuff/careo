import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as checkInService from '../services/checkIns';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const respondSchema = z.object({
  status: z.enum(['OK', 'NEEDS_HELP']),
  notes: z.string().optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    const checkIn = await checkInService.createCheckIn(req.params.circleId, req.user!.userId);
    res.status(201).json({ checkIn });
  })
);

router.patch(
  '/:checkInId/respond',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(respondSchema),
  asyncHandler(async (req, res) => {
    const checkIn = await checkInService.respondToCheckIn(
      req.params.checkInId,
      req.user!.userId,
      req.body.status as 'OK' | 'NEEDS_HELP',
      req.body.notes
    );
    res.json({ checkIn });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const checkIns = await checkInService.getCheckIns(
      req.params.circleId,
      req.query.days ? Number(req.query.days) : undefined
    );
    res.json({ checkIns });
  })
);

router.get(
  '/today',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const checkIns = await checkInService.getTodayCheckIns(req.params.circleId);
    res.json({ checkIns });
  })
);

export default router;
