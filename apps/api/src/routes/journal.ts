import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as journalService from '../services/journal';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createEntrySchema = z.object({
  date: z.string().optional(),
  mood: z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD']).optional(),
  energy: z.number().min(1).max(5).optional(),
  pain: z.number().min(0).max(10).optional(),
  sleep: z.string().optional(),
  appetite: z.string().optional(),
  notes: z.string().min(10),
});

const updateEntrySchema = z.object({
  date: z.string().optional(),
  mood: z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD']).optional(),
  energy: z.number().min(1).max(5).optional(),
  pain: z.number().min(0).max(10).optional(),
  sleep: z.string().optional(),
  appetite: z.string().optional(),
  notes: z.string().min(10).optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createEntrySchema),
  asyncHandler(async (req, res) => {
    const entry = await journalService.createEntry(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ entry });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const result = await journalService.getEntries(req.params.circleId, {
      from: req.query.from as string,
      to: req.query.to as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  })
);

router.get(
  '/:entryId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const entry = await journalService.getEntry(req.params.entryId, req.params.circleId);
    res.json({ entry });
  })
);

router.patch(
  '/:entryId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(updateEntrySchema),
  asyncHandler(async (req, res) => {
    const entry = await journalService.updateEntry(
      req.params.entryId,
      req.params.circleId,
      req.user!.userId,
      req.body
    );
    res.json({ entry });
  })
);

router.delete(
  '/:entryId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    await journalService.deleteEntry(
      req.params.entryId,
      req.params.circleId,
      req.user!.userId,
      req.circleMember!.role
    );
    res.json({ message: 'Entry deleted' });
  })
);

export default router;
