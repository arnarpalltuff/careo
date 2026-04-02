import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as resourceService from '../services/resources';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.enum(['SUPPORT_GROUP', 'HOME_CARE', 'LEGAL', 'FINANCIAL', 'MEDICAL', 'RESPITE', 'TRANSPORT', 'MEAL_DELIVERY', 'EQUIPMENT', 'OTHER']),
  url: z.string().url().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(['SUPPORT_GROUP', 'HOME_CARE', 'LEGAL', 'FINANCIAL', 'MEDICAL', 'RESPITE', 'TRANSPORT', 'MEAL_DELIVERY', 'EQUIPMENT', 'OTHER']).optional(),
  url: z.string().url().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const resource = await resourceService.createResource(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ resource });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const result = await resourceService.getResources(req.params.circleId, {
      category: req.query.category as string,
      search: req.query.search as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  })
);

router.patch(
  '/:resourceId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const resource = await resourceService.updateResource(
      req.params.resourceId,
      req.params.circleId,
      req.user!.userId,
      req.circleMember!.role,
      req.body
    );
    res.json({ resource });
  })
);

router.delete(
  '/:resourceId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    await resourceService.deleteResource(
      req.params.resourceId,
      req.params.circleId,
      req.user!.userId,
      req.circleMember!.role
    );
    res.json({ message: 'Resource deleted' });
  })
);

export default router;
