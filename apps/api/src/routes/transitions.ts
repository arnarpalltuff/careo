import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as transitionService from '../services/transitions';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createSchema = z.object({
  type: z.enum(['HOSPITAL_TO_HOME', 'HOME_TO_FACILITY', 'FACILITY_TO_HOME', 'HOSPICE', 'REHAB']),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  targetDate: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  targetDate: z.string().optional(),
  notes: z.string().optional(),
  checklistJson: z.string().optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const transition = await transitionService.createTransition(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ transition });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const transitions = await transitionService.getTransitions(req.params.circleId, req.query.status as any);
    res.json({ transitions });
  })
);

router.get(
  '/:transitionId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const transition = await transitionService.getTransition(req.params.transitionId, req.params.circleId);
    res.json({ transition });
  })
);

router.patch(
  '/:transitionId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const transition = await transitionService.updateTransition(
      req.params.transitionId,
      req.params.circleId,
      req.body
    );
    res.json({ transition });
  })
);

router.delete(
  '/:transitionId',
  authenticate,
  circleAccess(['ADMIN']),
  asyncHandler(async (req, res) => {
    await transitionService.deleteTransition(req.params.transitionId, req.params.circleId);
    res.json({ message: 'Transition deleted' });
  })
);

export default router;
