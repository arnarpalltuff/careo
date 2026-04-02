import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import { CognitiveCategory, ExerciseDifficulty } from '@careo/shared';
import * as cognitiveService from '../services/cognitive';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createSessionSchema = z.object({
  exerciseType: z.string().min(1),
  exerciseTitle: z.string().min(1),
  difficulty: z.string().min(1),
  score: z.number().int(),
  accuracy: z.number().min(0).max(100),
  durationSeconds: z.number().int().positive(),
});

router.get(
  '/exercises',
  authenticate,
  asyncHandler(async (req, res) => {
    const exercises = cognitiveService.getExercises(
      req.query.category as CognitiveCategory | undefined,
      req.query.difficulty as ExerciseDifficulty | undefined
    );
    res.json({ exercises });
  })
);

router.post(
  '/sessions',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createSessionSchema),
  asyncHandler(async (req, res) => {
    const session = await cognitiveService.recordSession(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ session });
  })
);

router.get(
  '/sessions',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const sessions = await cognitiveService.getSessions(
      req.params.circleId,
      req.query.userId as string | undefined,
      req.query.days ? parseInt(req.query.days as string) : undefined
    );
    res.json({ sessions });
  })
);

router.get(
  '/report',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const report = await cognitiveService.getCognitiveReport(
      req.params.circleId,
      req.query.userId as string | undefined,
      req.query.days ? parseInt(req.query.days as string) : undefined
    );
    res.json({ report });
  })
);

export default router;
