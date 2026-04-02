import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as burnoutService from '../services/burnout';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const assessmentSchema = z.object({
  emotional: z.number().min(1).max(10),
  physical: z.number().min(1).max(10),
  social: z.number().min(1).max(10),
  workload: z.number().min(1).max(10),
  sleep: z.number().min(1).max(10),
  selfCare: z.number().min(1).max(10),
  notes: z.string().optional(),
});

router.post(
  '/assessment',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(assessmentSchema),
  asyncHandler(async (req, res) => {
    const assessment = await burnoutService.createAssessment(
      req.params.circleId,
      req.user!.userId,
      req.body
    );
    res.status(201).json({ assessment });
  })
);

router.get(
  '/assessments',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const assessments = await burnoutService.getAssessments(
      req.user!.userId,
      req.params.circleId,
      req.query.limit ? Number(req.query.limit) : undefined
    );
    res.json({ assessments });
  })
);

router.get(
  '/overview',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    const overview = await burnoutService.getCircleBurnoutOverview(req.params.circleId);
    res.json({ overview });
  })
);

router.get(
  '/respite',
  authenticate,
  asyncHandler(async (req, res) => {
    const reminders = await burnoutService.getRespiteReminders(req.user!.userId);
    res.json({ reminders });
  })
);

router.patch(
  '/respite/:reminderId/dismiss',
  authenticate,
  asyncHandler(async (req, res) => {
    await burnoutService.dismissReminder(req.params.reminderId, req.user!.userId);
    res.json({ message: 'Reminder dismissed' });
  })
);

export default router;
