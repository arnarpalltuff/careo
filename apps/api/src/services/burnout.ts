import { SubscriptionTier, TIER_LIMITS, computeBurnoutScore, BurnoutRiskLevel } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyUser, notifyCircle } from './notifications';

export async function createAssessment(
  circleId: string,
  userId: string,
  data: {
    emotional: number;
    physical: number;
    social: number;
    workload: number;
    sleep: number;
    selfCare: number;
    notes?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  if (!TIER_LIMITS[tier].burnoutTracking) {
    throw new AppError(403, 'upgrade_required', 'Burnout tracking requires a Plus or Family subscription.');
  }

  const { overallScore, riskLevel } = computeBurnoutScore(data);

  const assessment = await prisma.burnoutAssessment.create({
    data: {
      userId,
      circleId,
      emotional: data.emotional,
      physical: data.physical,
      social: data.social,
      workload: data.workload,
      sleep: data.sleep,
      selfCare: data.selfCare,
      overallScore,
      riskLevel,
      notes: data.notes,
    },
  });

  // If risk is HIGH or CRITICAL, notify circle admins
  if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
    const admins = await prisma.circleMember.findMany({
      where: { circleId, role: 'ADMIN' },
      include: { user: { select: { id: true, pushToken: true, firstName: true } } },
    });

    for (const admin of admins) {
      if (admin.userId !== userId) {
        await notifyUser(
          admin.userId,
          `${riskLevel} burnout risk detected`,
          `${user?.firstName} may need support — their burnout risk is ${riskLevel.toLowerCase()}.`,
          { type: 'BURNOUT_ALERT', circleId }
        );
      }
    }

    // Schedule respite reminders for the user
    await scheduleRespiteReminders(userId, circleId, riskLevel);
  }

  return assessment;
}

export async function getAssessments(userId: string, circleId: string, limit: number = 10) {
  return prisma.burnoutAssessment.findMany({
    where: { userId, circleId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getCircleBurnoutOverview(circleId: string) {
  const members = await prisma.circleMember.findMany({
    where: { circleId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  const overview = [];
  for (const member of members) {
    const latest = await prisma.burnoutAssessment.findFirst({
      where: { userId: member.userId, circleId },
      orderBy: { createdAt: 'desc' },
    });
    overview.push({
      user: member.user,
      role: member.role,
      latestAssessment: latest
        ? {
            overallScore: latest.overallScore,
            riskLevel: latest.riskLevel,
            date: latest.createdAt,
          }
        : null,
    });
  }
  return overview;
}

async function scheduleRespiteReminders(userId: string, circleId: string, riskLevel: BurnoutRiskLevel) {
  const now = new Date();
  const reminders = [
    { type: 'BREAK', message: 'Time for a 15-minute break. Step outside, breathe deeply, and reset.', hoursAhead: 4 },
    { type: 'EXERCISE', message: 'Even a short walk can help. Try 10 minutes of movement today.', hoursAhead: 8 },
    { type: 'SOCIAL', message: 'Reach out to a friend or family member today. Connection matters.', hoursAhead: 24 },
    { type: 'SLEEP', message: 'Prioritize rest tonight. Your wellbeing matters to everyone.', hoursAhead: 12 },
  ];

  if (riskLevel === 'CRITICAL') {
    reminders.push({ type: 'HOBBY', message: 'Spend 20 minutes doing something you enjoy. You deserve it.', hoursAhead: 6 });
  }

  for (const r of reminders) {
    const scheduledFor = new Date(now.getTime() + r.hoursAhead * 60 * 60 * 1000);
    await prisma.respiteReminder.create({
      data: {
        userId,
        circleId,
        type: r.type,
        message: r.message,
        scheduledFor,
      },
    });
  }
}

export async function getRespiteReminders(userId: string) {
  const now = new Date();
  return prisma.respiteReminder.findMany({
    where: {
      userId,
      scheduledFor: { lte: now },
      dismissed: false,
    },
    orderBy: { scheduledFor: 'desc' },
    take: 5,
  });
}

export async function dismissReminder(reminderId: string, userId: string) {
  const reminder = await prisma.respiteReminder.findFirst({
    where: { id: reminderId, userId },
  });
  if (!reminder) throw new AppError(404, 'not_found', 'Reminder not found');
  return prisma.respiteReminder.update({
    where: { id: reminderId },
    data: { dismissed: true },
  });
}
