import { SubscriptionTier, TIER_LIMITS, MeetingStatus } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyCircle } from './notifications';

export async function createMeeting(
  circleId: string,
  scheduledBy: string,
  data: {
    title: string;
    scheduledFor: string;
    duration?: number;
    agendaJson?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: scheduledBy } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  const limit = TIER_LIMITS[tier].meetings;

  if (limit !== Infinity) {
    const activeCount = await prisma.familyMeeting.count({
      where: { circleId, status: 'SCHEDULED' },
    });
    if (activeCount >= limit) {
      throw new AppError(403, 'upgrade_required', `You've reached your ${tier} plan limit of ${limit} scheduled meeting(s). Upgrade for unlimited meetings.`);
    }
  }

  const meeting = await prisma.familyMeeting.create({
    data: {
      circleId,
      scheduledBy,
      title: data.title,
      scheduledFor: new Date(data.scheduledFor),
      duration: data.duration || 30,
      agendaJson: data.agendaJson,
    },
    include: {
      organizer: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  await notifyCircle(circleId, scheduledBy, 'Family meeting scheduled', `${user?.firstName} scheduled: ${data.title}`, {
    type: 'MEETING_SCHEDULED',
    circleId,
  });

  return meeting;
}

export async function getMeetings(circleId: string, status?: MeetingStatus) {
  const where: any = { circleId };
  if (status) where.status = status;

  return prisma.familyMeeting.findMany({
    where,
    include: {
      organizer: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { scheduledFor: 'asc' },
  });
}

export async function getMeeting(meetingId: string, circleId: string) {
  const meeting = await prisma.familyMeeting.findFirst({
    where: { id: meetingId, circleId },
    include: {
      organizer: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!meeting) throw new AppError(404, 'not_found', 'Meeting not found');
  return meeting;
}

export async function updateMeeting(
  meetingId: string,
  circleId: string,
  data: Partial<{
    title: string;
    scheduledFor: string;
    duration: number;
    agendaJson: string;
    notesJson: string;
    status: MeetingStatus;
  }>
) {
  const meeting = await prisma.familyMeeting.findFirst({ where: { id: meetingId, circleId } });
  if (!meeting) throw new AppError(404, 'not_found', 'Meeting not found');

  const updateData: any = { ...data };
  if (data.scheduledFor) updateData.scheduledFor = new Date(data.scheduledFor);

  return prisma.familyMeeting.update({
    where: { id: meetingId },
    data: updateData,
    include: {
      organizer: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function deleteMeeting(meetingId: string, circleId: string) {
  const meeting = await prisma.familyMeeting.findFirst({ where: { id: meetingId, circleId } });
  if (!meeting) throw new AppError(404, 'not_found', 'Meeting not found');
  await prisma.familyMeeting.delete({ where: { id: meetingId } });
}
