import { MoodLevel } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyCircle } from './notifications';

export async function createEntry(
  circleId: string,
  authorId: string,
  data: {
    date?: string;
    mood?: MoodLevel;
    energy?: number;
    pain?: number;
    sleep?: string;
    appetite?: string;
    notes: string;
  }
) {
  const entry = await prisma.journalEntry.create({
    data: {
      circleId,
      authorId,
      date: data.date ? new Date(data.date) : new Date(),
      mood: data.mood,
      energy: data.energy,
      pain: data.pain,
      sleep: data.sleep,
      appetite: data.appetite,
      notes: data.notes,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  const author = await prisma.user.findUnique({ where: { id: authorId }, select: { firstName: true } });
  await notifyCircle(circleId, authorId, 'New health update', `${author?.firstName} added a health update`, {
    type: 'JOURNAL_NEW',
    entryId: entry.id,
    circleId,
  });

  return entry;
}

export async function getEntries(
  circleId: string,
  query: { from?: string; to?: string; page?: number; limit?: number }
) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { circleId };
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(query.from);
    if (query.to) where.date.lte = new Date(query.to);
  }

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.journalEntry.count({ where }),
  ]);

  return { entries, total, page, limit };
}

export async function getEntry(entryId: string, circleId: string) {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, circleId },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
    },
  });
  if (!entry) throw new AppError(404, 'not_found', 'Journal entry not found');
  return entry;
}

export async function updateEntry(
  entryId: string,
  circleId: string,
  authorId: string,
  data: Partial<{
    date: string;
    mood: MoodLevel;
    energy: number;
    pain: number;
    sleep: string;
    appetite: string;
    notes: string;
  }>
) {
  const entry = await prisma.journalEntry.findFirst({ where: { id: entryId, circleId } });
  if (!entry) throw new AppError(404, 'not_found', 'Journal entry not found');
  if (entry.authorId !== authorId) throw new AppError(403, 'forbidden', 'You can only edit your own entries');

  const updateData: any = { ...data };
  if (data.date) updateData.date = new Date(data.date);

  return prisma.journalEntry.update({
    where: { id: entryId },
    data: updateData,
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
}

export async function deleteEntry(entryId: string, circleId: string, userId: string, userRole: string) {
  const entry = await prisma.journalEntry.findFirst({ where: { id: entryId, circleId } });
  if (!entry) throw new AppError(404, 'not_found', 'Journal entry not found');
  if (userRole !== 'ADMIN' && entry.authorId !== userId) {
    throw new AppError(403, 'forbidden', 'Only the author or an admin can delete this entry');
  }
  await prisma.journalEntry.delete({ where: { id: entryId } });
}
