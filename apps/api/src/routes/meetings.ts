import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as meetingService from '../services/meetings';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  scheduledFor: z.string(),
  duration: z.number().min(5).max(480).optional(),
  agendaJson: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  scheduledFor: z.string().optional(),
  duration: z.number().min(5).max(480).optional(),
  agendaJson: z.string().optional(),
  notesJson: z.string().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const meeting = await meetingService.createMeeting(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ meeting });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const meetings = await meetingService.getMeetings(req.params.circleId, req.query.status as any);
    res.json({ meetings });
  })
);

router.get(
  '/:meetingId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const meeting = await meetingService.getMeeting(req.params.meetingId, req.params.circleId);
    res.json({ meeting });
  })
);

router.patch(
  '/:meetingId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const meeting = await meetingService.updateMeeting(req.params.meetingId, req.params.circleId, req.body);
    res.json({ meeting });
  })
);

router.delete(
  '/:meetingId',
  authenticate,
  circleAccess(['ADMIN']),
  asyncHandler(async (req, res) => {
    await meetingService.deleteMeeting(req.params.meetingId, req.params.circleId);
    res.json({ message: 'Meeting deleted' });
  })
);

export default router;
