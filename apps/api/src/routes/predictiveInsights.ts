import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as insightService from '../services/predictiveInsights';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

router.post(
  '/generate',
  authenticate,
  circleAccess(['ADMIN']),
  asyncHandler(async (req, res) => {
    const insights = await insightService.generateInsights(req.params.circleId);
    res.status(201).json({ insights });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const acknowledged = req.query.acknowledged === 'true' ? true : req.query.acknowledged === 'false' ? false : undefined;
    const insights = await insightService.getInsights(req.params.circleId, acknowledged);
    res.json({ insights });
  })
);

router.patch(
  '/:insightId/acknowledge',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    const insight = await insightService.acknowledgeInsight(
      req.params.insightId,
      req.params.circleId
    );
    res.json({ insight });
  })
);

router.delete(
  '/:insightId',
  authenticate,
  circleAccess(['ADMIN']),
  asyncHandler(async (req, res) => {
    await insightService.deleteInsight(req.params.insightId, req.params.circleId);
    res.json({ message: 'Insight deleted' });
  })
);

export default router;
