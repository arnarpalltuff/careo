import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as careNoteService from '../services/careNotes';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createNoteSchema = z.object({
  type: z.enum(['SHIFT_HANDOFF', 'DOCTOR_VISIT', 'DAILY_UPDATE', 'INCIDENT', 'OBSERVATION']),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.string().optional(),
  pinned: z.boolean().optional(),
  voiceUrl: z.string().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  tags: z.string().optional(),
  pinned: z.boolean().optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createNoteSchema),
  asyncHandler(async (req, res) => {
    const note = await careNoteService.createCareNote(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ note });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const result = await careNoteService.getCareNotes(req.params.circleId, {
      type: req.query.type as string,
      pinned: req.query.pinned === 'true' ? true : req.query.pinned === 'false' ? false : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  })
);

router.get(
  '/:noteId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const note = await careNoteService.getCareNote(req.params.noteId, req.params.circleId);
    res.json({ note });
  })
);

router.patch(
  '/:noteId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(updateNoteSchema),
  asyncHandler(async (req, res) => {
    const note = await careNoteService.updateCareNote(
      req.params.noteId,
      req.params.circleId,
      req.user!.userId,
      req.circleMember!.role,
      req.body
    );
    res.json({ note });
  })
);

router.delete(
  '/:noteId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    await careNoteService.deleteCareNote(
      req.params.noteId,
      req.params.circleId,
      req.user!.userId,
      req.circleMember!.role
    );
    res.json({ message: 'Care note deleted' });
  })
);

export default router;
