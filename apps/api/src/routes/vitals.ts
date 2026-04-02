import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import { VitalType } from '@careo/shared';
import * as vitalsService from '../services/vitals';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const vitalSchema = z.object({
  type: z.enum(['BLOOD_PRESSURE', 'HEART_RATE', 'TEMPERATURE', 'BLOOD_SUGAR', 'OXYGEN', 'WEIGHT', 'RESPIRATION']),
  value: z.number(),
  value2: z.number().optional(),
  unit: z.string(),
  notes: z.string().optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(vitalSchema),
  asyncHandler(async (req, res) => {
    const vital = await vitalsService.recordVital(
      req.params.circleId,
      req.user!.userId,
      req.body
    );
    res.status(201).json({ vital });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const vitals = await vitalsService.getVitals(
      req.params.circleId,
      req.query.type as VitalType | undefined,
      req.query.days ? Number(req.query.days) : undefined,
      req.query.limit ? Number(req.query.limit) : undefined
    );
    res.json({ vitals });
  })
);

router.get(
  '/trends',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const trends = await vitalsService.getVitalTrends(
      req.params.circleId,
      req.query.type as VitalType,
      req.query.days ? Number(req.query.days) : 30
    );
    res.json({ trends });
  })
);

router.delete(
  '/:vitalId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    await vitalsService.deleteVital(req.params.vitalId, req.user!.userId);
    res.json({ message: 'Vital deleted' });
  })
);

export default router;
