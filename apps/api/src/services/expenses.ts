import { SubscriptionTier, TIER_LIMITS, ExpenseCategory } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyCircle } from './notifications';

export async function createExpense(
  circleId: string,
  createdById: string,
  data: {
    amount: number;
    currency?: string;
    category: ExpenseCategory;
    description: string;
    date: string;
    receipt?: string;
    paidById?: string;
    taxDeductible?: boolean;
    recurring?: boolean;
    splitAmong?: string[]; // user IDs to split evenly
  }
) {
  const user = await prisma.user.findUnique({ where: { id: createdById } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  const limit = TIER_LIMITS[tier].expenses;

  if (limit !== Infinity) {
    const count = await prisma.expense.count({ where: { circleId } });
    if (count >= limit) {
      throw new AppError(403, 'upgrade_required', `You've reached your ${tier} plan limit of ${limit} expenses. Upgrade to track more.`);
    }
  }

  const expense = await prisma.expense.create({
    data: {
      circleId,
      createdById,
      amount: data.amount,
      currency: data.currency || 'USD',
      category: data.category,
      description: data.description,
      date: new Date(data.date),
      receipt: data.receipt,
      paidById: data.paidById || createdById,
      taxDeductible: data.taxDeductible || false,
      recurring: data.recurring || false,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      paidBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Create splits if requested
  if (data.splitAmong && data.splitAmong.length > 0) {
    const splitAmount = Math.round((data.amount / data.splitAmong.length) * 100) / 100;
    for (const userId of data.splitAmong) {
      await prisma.expenseSplit.create({
        data: {
          expenseId: expense.id,
          userId,
          amount: splitAmount,
          settled: userId === (data.paidById || createdById),
        },
      });
    }
  }

  await notifyCircle(circleId, createdById, 'New expense logged', `${user?.firstName} added: $${data.amount.toFixed(2)} for ${data.description}`, {
    type: 'EXPENSE_ADDED',
    circleId,
  });

  return expense;
}

export async function getExpenses(
  circleId: string,
  query: { category?: string; startDate?: string; endDate?: string; page?: number; limit?: number }
) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { circleId };
  if (query.category) where.category = query.category;
  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        paidBy: { select: { id: true, firstName: true, lastName: true } },
        splits: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total, page, limit };
}

export async function getExpenseSummary(circleId: string, months: number = 3) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const expenses = await prisma.expense.findMany({
    where: { circleId, date: { gte: since } },
    include: { paidBy: { select: { id: true, firstName: true, lastName: true } } },
  });

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const taxDeductible = expenses.filter((e) => e.taxDeductible).reduce((s, e) => s + e.amount, 0);

  // By category
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  // By month
  const byMonth: Record<string, number> = {};
  for (const e of expenses) {
    const key = e.date.toISOString().slice(0, 7);
    byMonth[key] = (byMonth[key] || 0) + e.amount;
  }

  // By payer
  const byPayer: Record<string, { name: string; amount: number }> = {};
  for (const e of expenses) {
    if (e.paidBy) {
      const key = e.paidBy.id;
      if (!byPayer[key]) byPayer[key] = { name: `${e.paidBy.firstName} ${e.paidBy.lastName}`, amount: 0 };
      byPayer[key].amount += e.amount;
    }
  }

  // Unsettled splits
  const unsettledSplits = await prisma.expenseSplit.findMany({
    where: { settled: false, expense: { circleId } },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      expense: { select: { description: true, paidById: true, paidBy: { select: { firstName: true } } } },
    },
  });

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    taxDeductible: Math.round(taxDeductible * 100) / 100,
    byCategory,
    byMonth,
    byPayer: Object.values(byPayer),
    unsettledSplits,
    months,
  };
}

export async function settleExpenseSplit(splitId: string, userId: string) {
  const split = await prisma.expenseSplit.findFirst({
    where: { id: splitId, userId },
  });
  if (!split) throw new AppError(404, 'not_found', 'Split not found');
  return prisma.expenseSplit.update({
    where: { id: splitId },
    data: { settled: true },
  });
}

export async function deleteExpense(expenseId: string, circleId: string, userId: string, userRole: string) {
  const expense = await prisma.expense.findFirst({ where: { id: expenseId, circleId } });
  if (!expense) throw new AppError(404, 'not_found', 'Expense not found');
  if (userRole !== 'ADMIN' && expense.createdById !== userId) {
    throw new AppError(403, 'forbidden', 'Only admins or the expense creator can delete expenses');
  }
  await prisma.expense.delete({ where: { id: expenseId } });
}
