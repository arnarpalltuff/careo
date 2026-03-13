import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as emergencyService from '../services/emergency';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const alertSchema = z.object({
  message: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  validate(alertSchema),
  asyncHandler(async (req, res) => {
    const alert = await emergencyService.triggerAlert(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ alert });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const alerts = await emergencyService.getAlerts(req.params.circleId);
    res.json({ alerts });
  })
);

export default router;
