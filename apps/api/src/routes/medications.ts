import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as medService from '../services/medications';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createMedSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  instructions: z.string().optional(),
  prescriber: z.string().optional(),
  pharmacy: z.string().optional(),
  refillDate: z.string().optional(),
  schedules: z.array(z.object({ time: z.string(), label: z.string() })).min(1),
});

const updateMedSchema = z.object({
  name: z.string().min(1).optional(),
  dosage: z.string().min(1).optional(),
  frequency: z.string().min(1).optional(),
  instructions: z.string().optional(),
  prescriber: z.string().optional(),
  pharmacy: z.string().optional(),
  refillDate: z.string().optional(),
  schedules: z.array(z.object({ time: z.string(), label: z.string() })).optional(),
});

const logDoseSchema = z.object({
  scheduledFor: z.string(),
  status: z.enum(['TAKEN', 'SKIPPED']),
  skippedReason: z.string().optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createMedSchema),
  asyncHandler(async (req, res) => {
    const med = await medService.createMedication(req.params.circleId, req.body);
    res.status(201).json({ medication: med });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const active = req.query.active === 'false' ? false : true;
    const medications = await medService.getMedications(req.params.circleId, active);
    res.json({ medications });
  })
);

router.get(
  '/:medId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const medication = await medService.getMedication(req.params.medId, req.params.circleId);
    res.json({ medication });
  })
);

router.patch(
  '/:medId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(updateMedSchema),
  asyncHandler(async (req, res) => {
    const medication = await medService.updateMedication(req.params.medId, req.params.circleId, req.body);
    res.json({ medication });
  })
);

router.delete(
  '/:medId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    await medService.deleteMedication(req.params.medId, req.params.circleId);
    res.json({ message: 'Medication deactivated' });
  })
);

router.post(
  '/:medId/log',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(logDoseSchema),
  asyncHandler(async (req, res) => {
    const log = await medService.logDose(req.params.medId, req.params.circleId, req.user!.userId, req.body);
    res.json({ log });
  })
);

router.get(
  '/:medId/logs',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const logs = await medService.getLogs(
      req.params.medId,
      req.params.circleId,
      req.query.from as string,
      req.query.to as string
    );
    res.json({ logs });
  })
);

export default router;
