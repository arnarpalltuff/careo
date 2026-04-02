import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as protocolService from '../services/protocols';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createSchema = z.object({
  type: z.enum(['FALL', 'CHEST_PAIN', 'BREATHING', 'SEIZURE', 'CONFUSION', 'WANDERING', 'MEDICATION_ERROR', 'CUSTOM']),
  title: z.string().optional(),
  stepsJson: z.string().optional(),
  contactsJson: z.string().optional(),
  goBagJson: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  stepsJson: z.string().optional(),
  contactsJson: z.string().optional(),
  goBagJson: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.get(
  '/templates',
  authenticate,
  asyncHandler(async (_req, res) => {
    const templates = await protocolService.getAvailableTemplates();
    res.json({ templates });
  })
);

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const protocol = await protocolService.createProtocol(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ protocol });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const protocols = await protocolService.getProtocols(req.params.circleId, req.query.type as any);
    res.json({ protocols });
  })
);

router.get(
  '/:protocolId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const protocol = await protocolService.getProtocol(req.params.protocolId, req.params.circleId);
    res.json({ protocol });
  })
);

router.patch(
  '/:protocolId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const protocol = await protocolService.updateProtocol(req.params.protocolId, req.params.circleId, req.body);
    res.json({ protocol });
  })
);

router.delete(
  '/:protocolId',
  authenticate,
  circleAccess(['ADMIN']),
  asyncHandler(async (req, res) => {
    await protocolService.deleteProtocol(req.params.protocolId, req.params.circleId);
    res.json({ message: 'Protocol deleted' });
  })
);

export default router;
