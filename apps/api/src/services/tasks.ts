import { TaskStatus, TaskPriority, RecurringType, SubscriptionTier, TIER_LIMITS } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyCircle, notifyUser } from './notifications';

export async function createTask(
  circleId: string,
  createdById: string,
  data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    dueTime?: string;
    recurring?: RecurringType;
    assignedToId?: string;
  }
) {
  // Check active task limit
  const user = await prisma.user.findUnique({ where: { id: createdById } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  const taskLimit = TIER_LIMITS[tier].activeTasks;
  if (taskLimit !== Infinity) {
    const activeCount = await prisma.task.count({
      where: { circleId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    });
    if (activeCount >= taskLimit) {
      throw new AppError(403, 'upgrade_required', `You've reached your ${tier} plan limit of ${taskLimit} active tasks. Complete or upgrade to add more.`);
    }
  }

  const task = await prisma.task.create({
    data: {
      circleId,
      createdById,
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      dueTime: data.dueTime,
      recurring: data.recurring,
      assignedToId: data.assignedToId,
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (data.assignedToId) {
    const creator = await prisma.user.findUnique({ where: { id: createdById }, select: { firstName: true } });
    await notifyUser(data.assignedToId, 'New task assigned', `${creator?.firstName} assigned you: ${data.title}`, {
      type: 'TASK_ASSIGNED',
      taskId: task.id,
      circleId,
    });
  }

  return task;
}

export async function getTasks(
  circleId: string,
  query: { status?: TaskStatus; assignedTo?: string; page?: number; limit?: number; sort?: string }
) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { circleId };
  if (query.status) where.status = query.status;
  if (query.assignedTo) where.assignedToId = query.assignedTo;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: query.sort === 'dueDate' ? { dueDate: 'asc' } : { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, page, limit };
}

export async function getTask(taskId: string, circleId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, circleId },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!task) throw new AppError(404, 'not_found', 'Task not found');
  return task;
}

export async function updateTask(
  taskId: string,
  circleId: string,
  userId: string,
  data: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    dueTime: string;
    recurring: RecurringType;
    assignedToId: string;
  }>
) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, circleId } });
  if (!existing) throw new AppError(404, 'not_found', 'Task not found');

  const updateData: any = { ...data };
  if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

  if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
    updateData.completedAt = new Date();
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } });
    await notifyCircle(circleId, userId, 'Task completed', `${user?.firstName} completed: ${task.title}`, {
      type: 'TASK_COMPLETED',
      taskId: task.id,
      circleId,
    });
  }

  if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } });
    await notifyUser(data.assignedToId, 'New task assigned', `${user?.firstName} assigned you: ${task.title}`, {
      type: 'TASK_ASSIGNED',
      taskId: task.id,
      circleId,
    });
  }

  return task;
}

export async function deleteTask(taskId: string, circleId: string, userId: string, userRole: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, circleId } });
  if (!task) throw new AppError(404, 'not_found', 'Task not found');

  if (userRole !== 'ADMIN' && task.createdById !== userId) {
    throw new AppError(403, 'forbidden', 'Only admins or the task creator can delete tasks');
  }

  await prisma.task.delete({ where: { id: taskId } });
}
