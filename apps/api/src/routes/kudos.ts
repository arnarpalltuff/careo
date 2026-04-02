import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as kudosService from '../services/kudos';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const sendKudosSchema = z.object({
  toUserId: z.string(),
  message: z.string().min(1).max(500),
  emoji: z.string().optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(sendKudosSchema),
  asyncHandler(async (req, res) => {
    const kudos = await kudosService.sendKudos(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ kudos });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const result = await kudosService.getKudos(req.params.circleId, {
      userId: req.query.userId as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  })
);

router.get(
  '/leaderboard',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const leaderboard = await kudosService.getKudosLeaderboard(req.params.circleId);
    res.json({ leaderboard });
  })
);

export default router;
