import { SubscriptionTier, TIER_LIMITS } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyCircle } from './notifications';

export async function createCheckIn(circleId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  if (!TIER_LIMITS[tier].dailyCheckIns) {
    throw new AppError(403, 'upgrade_required', 'Daily check-ins require a Plus or Family subscription.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = await prisma.dailyCheckIn.create({
    data: {
      circleId,
      userId,
      status: 'PENDING',
      scheduledFor: today,
    },
  });

  return checkIn;
}

export async function respondToCheckIn(
  checkInId: string,
  userId: string,
  status: 'OK' | 'NEEDS_HELP',
  notes?: string
) {
  const checkIn = await prisma.dailyCheckIn.findFirst({
    where: { id: checkInId, userId },
  });
  if (!checkIn) throw new AppError(404, 'not_found', 'Check-in not found');
  if (checkIn.status !== 'PENDING') throw new AppError(400, 'already_responded', 'This check-in has already been responded to');

  const updated = await prisma.dailyCheckIn.update({
    where: { id: checkInId },
    data: {
      status,
      notes,
      respondedAt: new Date(),
    },
  });

  if (status === 'NEEDS_HELP') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } });
    await notifyCircle(
      checkIn.circleId,
      userId,
      'Check-in: Help needed',
      `${user?.firstName} has indicated they need help.`,
      { type: 'CHECKIN_NEEDS_HELP', checkInId, circleId: checkIn.circleId }
    );
  }

  return updated;
}

export async function getCheckIns(circleId: string, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  return prisma.dailyCheckIn.findMany({
    where: {
      circleId,
      scheduledFor: { gte: since },
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { scheduledFor: 'desc' },
  });
}

export async function getTodayCheckIns(circleId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.dailyCheckIn.findMany({
    where: {
      circleId,
      scheduledFor: { gte: today, lt: tomorrow },
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markMissedCheckIns() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const missed = await prisma.dailyCheckIn.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lt: today },
    },
    include: {
      user: { select: { id: true, firstName: true } },
    },
  });

  for (const checkIn of missed) {
    await prisma.dailyCheckIn.update({
      where: { id: checkIn.id },
      data: { status: 'MISSED' },
    });

    await notifyCircle(
      checkIn.circleId,
      checkIn.userId,
      'Missed check-in',
      `${checkIn.user.firstName} missed their daily check-in.`,
      { type: 'CHECKIN_MISSED', checkInId: checkIn.id, circleId: checkIn.circleId }
    );
  }

  return missed.length;
}
