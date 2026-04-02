import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as circleService from '../services/circles';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createCircleSchema = z.object({
  name: z.string().min(1).max(100),
  careRecipient: z.string().min(1).max(100),
  recipientDob: z.string().optional(),
});

const updateCircleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  careRecipient: z.string().min(1).max(100).optional(),
  recipientDob: z.string().optional(),
  recipientPhoto: z.string().url().optional(),
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).optional(),
});

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

router.post(
  '/',
  authenticate,
  validate(createCircleSchema),
  asyncHandler(async (req, res) => {
    const circle = await circleService.createCircle(req.user!.userId, req.body);
    res.status(201).json({ circle });
  })
);

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const circles = await circleService.getUserCircles(req.user!.userId);
    res.json({ circles });
  })
);

router.get(
  '/:circleId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const circle = await circleService.getCircleDetail(req.params.circleId);
    res.json({ circle });
  })
);

router.patch(
  '/:circleId',
  authenticate,
  circleAccess(['ADMIN']),
  validate(updateCircleSchema),
  asyncHandler(async (req, res) => {
    const circle = await circleService.updateCircle(req.params.circleId, req.body);
    res.json({ circle });
  })
);

router.delete(
  '/:circleId',
  authenticate,
  circleAccess(['ADMIN']),
  asyncHandler(async (req, res) => {
    await circleService.deleteCircle(req.params.circleId);
    res.json({ message: 'Circle deleted' });
  })
);

router.post(
  '/:circleId/invite',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(inviteSchema),
  asyncHandler(async (req, res) => {
    const invite = await circleService.inviteMember(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ invite });
  })
);

router.post(
  '/join/:token',
  authenticate,
  asyncHandler(async (req, res) => {
    const circle = await circleService.joinCircle(req.params.token, req.user!.userId);
    res.json({ circle });
  })
);

router.patch(
  '/:circleId/members/:memberId/role',
  authenticate,
  circleAccess(['ADMIN']),
  validate(roleSchema),
  asyncHandler(async (req, res) => {
    const member = await circleService.updateMemberRole(
      req.params.circleId,
      req.params.memberId,
      req.body.role
    );
    res.json({ member });
  })
);

router.delete(
  '/:circleId/members/:memberId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    await circleService.removeMember(
      req.params.circleId,
      req.params.memberId,
      req.user!.userId
    );
    res.json({ message: 'Member removed' });
  })
);

// ─── Health Card ───

const healthCardSchema = z.object({
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    relation: z.string(),
  })).optional(),
  primaryDoctor: z.string().optional(),
  doctorPhone: z.string().optional(),
  pharmacy: z.string().optional(),
  pharmacyPhone: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceId: z.string().optional(),
  notes: z.string().optional(),
});

router.get(
  '/:circleId/health-card',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const circle = await circleService.getCircleDetail(req.params.circleId);
    const healthCard = circle.healthCard ? JSON.parse(circle.healthCard) : {};
    res.json({ healthCard });
  })
);

router.put(
  '/:circleId/health-card',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(healthCardSchema),
  asyncHandler(async (req, res) => {
    const circle = await circleService.updateCircle(req.params.circleId, {
      healthCard: JSON.stringify(req.body),
    });
    res.json({ healthCard: JSON.parse(circle.healthCard || '{}') });
  })
);

export default router;
