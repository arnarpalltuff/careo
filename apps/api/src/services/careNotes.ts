import { SubscriptionTier, TIER_LIMITS, CareNoteType } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyCircle } from './notifications';

export async function createCareNote(
  circleId: string,
  authorId: string,
  data: {
    type: CareNoteType;
    title: string;
    content: string;
    tags?: string;
    pinned?: boolean;
    voiceUrl?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: authorId } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  const limit = TIER_LIMITS[tier].careNotes;

  if (limit !== Infinity) {
    const count = await prisma.careNote.count({ where: { circleId } });
    if (count >= limit) {
      throw new AppError(403, 'upgrade_required', `You've reached your ${tier} plan limit of ${limit} care notes. Upgrade to add more.`);
    }
  }

  const note = await prisma.careNote.create({
    data: {
      circleId,
      authorId,
      type: data.type,
      title: data.title,
      content: data.content,
      tags: data.tags,
      pinned: data.pinned || false,
      voiceUrl: data.voiceUrl,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  const typeLabel: Record<string, string> = {
    SHIFT_HANDOFF: 'shift handoff',
    DOCTOR_VISIT: 'doctor visit notes',
    DAILY_UPDATE: 'daily update',
    INCIDENT: 'incident report',
    OBSERVATION: 'observation',
  };

  await notifyCircle(circleId, authorId, `New ${typeLabel[data.type] || 'care note'}`, `${user?.firstName}: ${data.title}`, {
    type: 'CARE_NOTE_ADDED',
    circleId,
  });

  return note;
}

export async function getCareNotes(
  circleId: string,
  query: { type?: string; pinned?: boolean; page?: number; limit?: number }
) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { circleId };
  if (query.type) where.type = query.type;
  if (query.pinned !== undefined) where.pinned = query.pinned;

  const [notes, total] = await Promise.all([
    prisma.careNote.findMany({
      where,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.careNote.count({ where }),
  ]);

  return { notes, total, page, limit };
}

export async function getCareNote(noteId: string, circleId: string) {
  const note = await prisma.careNote.findFirst({
    where: { id: noteId, circleId },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
  if (!note) throw new AppError(404, 'not_found', 'Care note not found');
  return note;
}

export async function updateCareNote(
  noteId: string,
  circleId: string,
  userId: string,
  userRole: string,
  data: Partial<{ title: string; content: string; tags: string; pinned: boolean }>
) {
  const note = await prisma.careNote.findFirst({ where: { id: noteId, circleId } });
  if (!note) throw new AppError(404, 'not_found', 'Care note not found');
  if (userRole !== 'ADMIN' && note.authorId !== userId) {
    throw new AppError(403, 'forbidden', 'Only admins or the author can edit care notes');
  }

  return prisma.careNote.update({
    where: { id: noteId },
    data,
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
}

export async function deleteCareNote(noteId: string, circleId: string, userId: string, userRole: string) {
  const note = await prisma.careNote.findFirst({ where: { id: noteId, circleId } });
  if (!note) throw new AppError(404, 'not_found', 'Care note not found');
  if (userRole !== 'ADMIN' && note.authorId !== userId) {
    throw new AppError(403, 'forbidden', 'Only admins or the author can delete care notes');
  }
  await prisma.careNote.delete({ where: { id: noteId } });
}
