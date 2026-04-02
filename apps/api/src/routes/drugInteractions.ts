import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as drugInteractionService from '../services/drugInteractions';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const checkNewSchema = z.object({
  medicationName: z.string(),
});

router.get(
  '/check',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const interactions = await drugInteractionService.checkInteractions(req.params.circleId, req.user!.userId);
    res.json({ interactions });
  })
);

router.post(
  '/check-new',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(checkNewSchema),
  asyncHandler(async (req, res) => {
    const interactions = await drugInteractionService.checkNewMedication(
      req.params.circleId,
      req.user!.userId,
      req.body.medicationName
    );
    res.json({ interactions });
  })
);

export default router;
