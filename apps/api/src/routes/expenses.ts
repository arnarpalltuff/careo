import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import * as expenseService from '../services/expenses';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional(),
  category: z.enum(['MEDICAL', 'PHARMACY', 'TRANSPORT', 'SUPPLIES', 'HOME_CARE', 'INSURANCE', 'FOOD', 'OTHER']),
  description: z.string().min(1).max(500),
  date: z.string(),
  receipt: z.string().optional(),
  paidById: z.string().optional(),
  taxDeductible: z.boolean().optional(),
  recurring: z.boolean().optional(),
  splitAmong: z.array(z.string()).optional(),
});

router.post(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  validate(createExpenseSchema),
  asyncHandler(async (req, res) => {
    const expense = await expenseService.createExpense(req.params.circleId, req.user!.userId, req.body);
    res.status(201).json({ expense });
  })
);

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const result = await expenseService.getExpenses(req.params.circleId, {
      category: req.query.category as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  })
);

router.get(
  '/summary',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const months = req.query.months ? Number(req.query.months) : undefined;
    const summary = await expenseService.getExpenseSummary(req.params.circleId, months);
    res.json({ summary });
  })
);

router.patch(
  '/splits/:splitId/settle',
  authenticate,
  asyncHandler(async (req, res) => {
    await expenseService.settleExpenseSplit(req.params.splitId, req.user!.userId);
    res.json({ message: 'Split settled' });
  })
);

router.delete(
  '/:expenseId',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    await expenseService.deleteExpense(
      req.params.expenseId,
      req.params.circleId,
      req.user!.userId,
      req.circleMember!.role
    );
    res.json({ message: 'Expense deleted' });
  })
);

export default router;
