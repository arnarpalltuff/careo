import { prisma } from '../utils/prisma';

interface ActivityItem {
  id: string;
  type: 'task_completed' | 'med_taken' | 'med_missed' | 'journal_added' | 'emergency' | 'member_joined';
  title: string;
  subtitle: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export async function getCircleActivity(circleId: string, limit = 20): Promise<ActivityItem[]> {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [completedTasks, medLogs, journalEntries, alerts, recentMembers] = await Promise.all([
    prisma.task.findMany({
      where: { circleId, status: 'COMPLETED', completedAt: { gte: since } },
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { completedAt: 'desc' },
      take: limit,
    }),
    prisma.medicationLog.findMany({
      where: {
        medication: { circleId },
        status: { in: ['TAKEN', 'MISSED'] },
        createdAt: { gte: since },
        loggedById: { not: null },
      },
      include: {
        medication: { select: { name: true, circleId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.journalEntry.findMany({
      where: { circleId, createdAt: { gte: since } },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.emergencyAlert.findMany({
      where: { circleId, createdAt: { gte: since } },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.circleMember.findMany({
      where: { circleId, joinedAt: { gte: since } },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { joinedAt: 'desc' },
      take: 5,
    }),
  ]);

  // Resolve user names for med logs
  const logUserIds = [...new Set(medLogs.map((l) => l.loggedById!))];
  const logUsers = logUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: logUserIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const userMap = new Map(logUsers.map((u) => [u.id, u]));

  const items: ActivityItem[] = [];

  for (const task of completedTasks) {
    const who = task.assignedTo;
    items.push({
      id: `task-${task.id}`,
      type: 'task_completed',
      title: `completed: ${task.title}`,
      subtitle: task.title,
      userId: who?.id || task.createdById,
      userName: who ? `${who.firstName} ${who.lastName}` : 'Someone',
      timestamp: (task.completedAt || task.updatedAt).toISOString(),
    });
  }

  for (const log of medLogs) {
    const who = userMap.get(log.loggedById!);
    items.push({
      id: `med-${log.id}`,
      type: log.status === 'TAKEN' ? 'med_taken' : 'med_missed',
      title: log.status === 'TAKEN'
        ? `marked ${log.medication.name} as taken`
        : `missed ${log.medication.name}`,
      subtitle: log.medication.name,
      userId: log.loggedById!,
      userName: who ? `${who.firstName} ${who.lastName}` : 'System',
      timestamp: log.createdAt.toISOString(),
    });
  }

  for (const entry of journalEntries) {
    items.push({
      id: `journal-${entry.id}`,
      type: 'journal_added',
      title: `added a health update${entry.mood ? ` (${entry.mood.toLowerCase()})` : ''}`,
      subtitle: entry.notes.slice(0, 60),
      userId: entry.authorId,
      userName: `${entry.author.firstName} ${entry.author.lastName}`,
      timestamp: entry.createdAt.toISOString(),
    });
  }

  for (const alert of alerts) {
    items.push({
      id: `alert-${alert.id}`,
      type: 'emergency',
      title: `triggered an emergency alert`,
      subtitle: alert.message,
      userId: alert.senderId,
      userName: `${alert.sender.firstName} ${alert.sender.lastName}`,
      timestamp: alert.createdAt.toISOString(),
    });
  }

  for (const member of recentMembers) {
    items.push({
      id: `member-${member.id}`,
      type: 'member_joined',
      title: `joined the circle`,
      subtitle: '',
      userId: member.userId,
      userName: `${member.user.firstName} ${member.user.lastName}`,
      timestamp: member.joinedAt.toISOString(),
    });
  }

  // Sort by timestamp descending, take limit
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items.slice(0, limit);
}
