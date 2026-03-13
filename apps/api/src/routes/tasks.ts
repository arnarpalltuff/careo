import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as taskService from '../services/tasks';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  recurring: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  assignedToId: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  recurring: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  assignedToId: z.string().optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await taskService.createTask(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ task });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const result = await taskService.getTasks(req.params.circleId, {
      status: req.query.status as any,
      assignedTo: req.query.assignedTo as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sort: req.query.sort as string,
    });
    res.json(result);
  })
);

router.get(
  '/:taskId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const task = await taskService.getTask(req.params.taskId, req.params.circleId);
    res.json({ task });
  })
);

router.patch(
  '/:taskId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(updateTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await taskService.updateTask(
      req.params.taskId,
      req.params.circleId,
      req.user!.userId,
      req.body
    );
    res.json({ task });
  })
);

router.delete(
  '/:taskId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    await taskService.deleteTask(
      req.params.taskId,
      req.params.circleId,
      req.user!.userId,
      req.circleMember!.role
    );
    res.json({ message: 'Task deleted' });
  })
);

export default router;
