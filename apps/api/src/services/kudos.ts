import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyUser } from './notifications';

export async function sendKudos(
  circleId: string,
  fromUserId: string,
  data: { toUserId: string; message: string; emoji?: string }
) {
  // Verify target user is in the circle
  const targetMember = await prisma.circleMember.findFirst({
    where: { circleId, userId: data.toUserId },
  });
  if (!targetMember) throw new AppError(400, 'invalid', 'That person is not in this care circle');

  if (fromUserId === data.toUserId) {
    throw new AppError(400, 'invalid', 'You cannot send kudos to yourself');
  }

  const kudos = await prisma.kudos.create({
    data: {
      circleId,
      fromUserId,
      toUserId: data.toUserId,
      message: data.message,
      emoji: data.emoji || '💛',
    },
    include: {
      fromUser: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      toUser: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  const sender = await prisma.user.findUnique({ where: { id: fromUserId }, select: { firstName: true } });
  await notifyUser(data.toUserId, `${kudos.emoji} Kudos from ${sender?.firstName}!`, data.message, {
    type: 'KUDOS_RECEIVED',
    circleId,
  });

  return kudos;
}

export async function getKudos(circleId: string, query: { userId?: string; page?: number; limit?: number }) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { circleId };
  if (query.userId) where.toUserId = query.userId;

  const [kudos, total] = await Promise.all([
    prisma.kudos.findMany({
      where,
      include: {
        fromUser: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        toUser: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.kudos.count({ where }),
  ]);

  return { kudos, total, page, limit };
}

export async function getKudosLeaderboard(circleId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const members = await prisma.circleMember.findMany({
    where: { circleId },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });

  const leaderboard = [];
  for (const member of members) {
    const [received, sent, tasksCompleted] = await Promise.all([
      prisma.kudos.count({ where: { toUserId: member.userId, circleId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.kudos.count({ where: { fromUserId: member.userId, circleId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.task.count({ where: { assignedToId: member.userId, circleId, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } } }),
    ]);

    leaderboard.push({
      user: member.user,
      kudosReceived: received,
      kudosSent: sent,
      tasksCompleted,
      contributionScore: received * 3 + tasksCompleted * 2 + sent,
    });
  }

  leaderboard.sort((a, b) => b.contributionScore - a.contributionScore);
  return leaderboard;
}
