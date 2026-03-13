import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyCircle } from './notifications';

export async function triggerAlert(
  circleId: string,
  senderId: string,
  data: { message?: string; latitude?: number; longitude?: number }
) {
  // Rate limit: 3 per hour per user
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.emergencyAlert.count({
    where: { senderId, circleId, createdAt: { gte: oneHourAgo } },
  });
  if (recentCount >= 3) {
    throw new AppError(429, 'rate_limited', 'Emergency alert limit reached. Maximum 3 per hour.');
  }

  const alert = await prisma.emergencyAlert.create({
    data: {
      circleId,
      senderId,
      message: data.message || 'Emergency alert triggered',
      latitude: data.latitude,
      longitude: data.longitude,
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const circle = await prisma.careCircle.findUnique({
    where: { id: circleId },
    select: { careRecipient: true },
  });

  await notifyCircle(
    circleId,
    senderId,
    '🚨 EMERGENCY ALERT',
    `${alert.sender.firstName} needs help with ${circle?.careRecipient}`,
    { type: 'EMERGENCY', circleId, alertId: alert.id }
  );

  return alert;
}

export async function getAlerts(circleId: string) {
  return prisma.emergencyAlert.findMany({
    where: { circleId },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}
