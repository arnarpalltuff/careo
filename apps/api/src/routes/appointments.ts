import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as apptService from '../services/appointments';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createApptSchema = z.object({
  title: z.string().min(1),
  location: z.string().optional(),
  date: z.string(),
  time: z.string(),
  duration: z.number().positive().optional(),
  doctor: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  reminder: z.number().positive().optional(),
});

const updateApptSchema = z.object({
  title: z.string().min(1).optional(),
  location: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  duration: z.number().positive().optional(),
  doctor: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  reminder: z.number().positive().optional(),
  status: z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED']).optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createApptSchema),
  asyncHandler(async (req, res) => {
    const appointment = await apptService.createAppointment(req.params.circleId, req.body);
    res.status(201).json({ appointment });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const appointments = await apptService.getAppointments(req.params.circleId, {
      from: req.query.from as string,
      to: req.query.to as string,
      status: req.query.status as any,
    });
    res.json({ appointments });
  })
);

router.get(
  '/:apptId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const appointment = await apptService.getAppointment(req.params.apptId, req.params.circleId);
    res.json({ appointment });
  })
);

router.patch(
  '/:apptId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(updateApptSchema),
  asyncHandler(async (req, res) => {
    const appointment = await apptService.updateAppointment(req.params.apptId, req.params.circleId, req.body);
    res.json({ appointment });
  })
);

router.delete(
  '/:apptId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    await apptService.deleteAppointment(req.params.apptId, req.params.circleId);
    res.json({ message: 'Appointment deleted' });
  })
);

export default router;
