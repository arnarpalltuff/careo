import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as safeZoneService from '../services/safeZones';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createZoneSchema = z.object({
  name: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  radiusMeters: z.number().positive().optional(),
  notifyOnExit: z.boolean().optional(),
  notifyOnEntry: z.boolean().optional(),
});

const updateZoneSchema = z.object({
  name: z.string().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radiusMeters: z.number().positive().optional(),
  notifyOnExit: z.boolean().optional(),
  notifyOnEntry: z.boolean().optional(),
});

const updateLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  battery: z.number().optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createZoneSchema),
  asyncHandler(async (req, res) => {
    const zone = await safeZoneService.createSafeZone(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ zone });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const zones = await safeZoneService.getSafeZones(req.params.circleId);
    res.json({ zones });
  })
);

router.patch(
  '/:zoneId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(updateZoneSchema),
  asyncHandler(async (req, res) => {
    const zone = await safeZoneService.updateSafeZone(req.params.zoneId, req.user!.userId, req.body);
    res.json({ zone });
  })
);

router.delete(
  '/:zoneId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    await safeZoneService.deleteSafeZone(req.params.zoneId, req.user!.userId);
    res.json({ message: 'Safe zone deleted' });
  })
);

router.post(
  '/location',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(updateLocationSchema),
  asyncHandler(async (req, res) => {
    const location = await safeZoneService.updateLocation(req.params.circleId, req.user!.userId, req.body);
    res.json({ location });
  })
);

router.get(
  '/location/history',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const history = await safeZoneService.getLocationHistory(
      req.params.circleId,
      req.query.userId as string | undefined,
      req.query.hours ? parseInt(req.query.hours as string) : undefined
    );
    res.json({ history });
  })
);

router.get(
  '/location/latest',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const locations = await safeZoneService.getLatestLocations(req.params.circleId);
    res.json({ locations });
  })
);

export default router;
