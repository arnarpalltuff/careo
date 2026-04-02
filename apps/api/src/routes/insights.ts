import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { circleAccess } from '../middleware/circleAccess';
import { prisma } from '../utils/prisma';

const router = Router({ mergeParams: true });

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

router.get(
  '/',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER', 'VIEWER']),
  asyncHandler(async (req, res) => {
    const circleId = req.params.circleId;
    const rawDays = Number(req.query.days);
    const days = Math.min(Math.max(isNaN(rawDays) ? 30 : rawDays, 1), 90);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Mood trend from journal entries
    const journalEntries = await prisma.journalEntry.findMany({
      where: { circleId, date: { gte: since } },
      select: { date: true, mood: true, energy: true, pain: true },
      orderBy: { date: 'asc' },
    });

    const moodMap: Record<string, number> = { GREAT: 5, GOOD: 4, OKAY: 3, LOW: 2, BAD: 1 };
    const moodTrend = journalEntries
      .filter((e) => e.mood)
      .map((e) => ({
        date: e.date.toISOString().split('T')[0],
        mood: e.mood!,
        moodScore: moodMap[e.mood!] || 3,
        energy: e.energy,
        pain: e.pain,
      }));

    // Medication adherence
    const medLogs = await prisma.medicationLog.findMany({
      where: {
        medication: { circleId },
        scheduledFor: { gte: since },
        status: { not: 'PENDING' },
      },
      select: { status: true, scheduledFor: true },
    });

    const totalDoses = medLogs.length;
    const takenDoses = medLogs.filter((l) => l.status === 'TAKEN').length;
    const missedDoses = medLogs.filter((l) => l.status === 'MISSED').length;
    const skippedDoses = medLogs.filter((l) => l.status === 'SKIPPED').length;
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : null;

    // Weekly adherence breakdown
    const weeklyAdherence: { week: string; rate: number; total: number }[] = [];
    const weekMap = new Map<string, { taken: number; total: number }>();
    for (const log of medLogs) {
      const d = new Date(log.scheduledFor);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      const entry = weekMap.get(key) || { taken: 0, total: 0 };
      entry.total++;
      if (log.status === 'TAKEN') entry.taken++;
      weekMap.set(key, entry);
    }
    for (const [week, data] of weekMap) {
      weeklyAdherence.push({
        week,
        rate: Math.round((data.taken / data.total) * 100),
        total: data.total,
      });
    }
    weeklyAdherence.sort((a, b) => a.week.localeCompare(b.week));

    // Task completion stats
    const tasks = await prisma.task.findMany({
      where: { circleId, createdAt: { gte: since } },
      select: { status: true },
    });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null;

    // Appointment stats
    const appointments = await prisma.appointment.findMany({
      where: { circleId, date: { gte: since } },
      select: { status: true },
    });
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED').length;

    // Active members count
    const memberCount = await prisma.circleMember.count({ where: { circleId } });

    res.json({
      period: { days, since: since.toISOString() },
      mood: {
        trend: moodTrend,
        entries: moodTrend.length,
        averageScore: moodTrend.length > 0
          ? Math.round((moodTrend.reduce((s, m) => s + m.moodScore, 0) / moodTrend.length) * 10) / 10
          : null,
      },
      medications: {
        adherenceRate,
        totalDoses,
        takenDoses,
        missedDoses,
        skippedDoses,
        weeklyAdherence,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate: taskCompletionRate,
      },
      appointments: {
        total: totalAppointments,
        completed: completedAppointments,
      },
      circle: { memberCount },
    });
  })
);

// Advanced predictive alerts — pattern detection
router.get(
  '/alerts',
  authenticate,
  circleAccess(['ADMIN', 'MEMBER']),
  asyncHandler(async (req, res) => {
    const circleId = req.params.circleId;
    const alerts: { type: string; severity: string; title: string; description: string }[] = [];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Mood decline detection
    const recentMoods = await prisma.journalEntry.findMany({
      where: { circleId, date: { gte: weekAgo }, mood: { not: null } },
      select: { mood: true, date: true },
      orderBy: { date: 'asc' },
    });
    const previousMoods = await prisma.journalEntry.findMany({
      where: { circleId, date: { gte: twoWeeksAgo, lt: weekAgo }, mood: { not: null } },
      select: { mood: true },
    });

    const moodMap: Record<string, number> = { GREAT: 5, GOOD: 4, OKAY: 3, LOW: 2, BAD: 1 };
    if (recentMoods.length >= 3 && previousMoods.length >= 3) {
      const recentAvg = recentMoods.reduce((s, m) => s + (moodMap[m.mood!] || 3), 0) / recentMoods.length;
      const prevAvg = previousMoods.reduce((s, m) => s + (moodMap[m.mood!] || 3), 0) / previousMoods.length;
      if (recentAvg < prevAvg - 0.8) {
        alerts.push({
          type: 'MOOD_DECLINE',
          severity: recentAvg < 2.5 ? 'HIGH' : 'MODERATE',
          title: 'Mood trending downward',
          description: `Average mood dropped from ${prevAvg.toFixed(1)} to ${recentAvg.toFixed(1)} this week. Consider a wellness check.`,
        });
      }
    }

    // Medication adherence drop
    const recentMedLogs = await prisma.medicationLog.findMany({
      where: { medication: { circleId }, scheduledFor: { gte: weekAgo }, status: { not: 'PENDING' } },
      select: { status: true },
    });
    const prevMedLogs = await prisma.medicationLog.findMany({
      where: { medication: { circleId }, scheduledFor: { gte: twoWeeksAgo, lt: weekAgo }, status: { not: 'PENDING' } },
      select: { status: true },
    });

    if (recentMedLogs.length >= 5 && prevMedLogs.length >= 5) {
      const recentRate = recentMedLogs.filter(l => l.status === 'TAKEN').length / recentMedLogs.length;
      const prevRate = prevMedLogs.filter(l => l.status === 'TAKEN').length / prevMedLogs.length;
      if (recentRate < prevRate - 0.15) {
        alerts.push({
          type: 'MED_ADHERENCE_DROP',
          severity: recentRate < 0.6 ? 'HIGH' : 'MODERATE',
          title: 'Medication adherence declining',
          description: `Adherence dropped from ${Math.round(prevRate * 100)}% to ${Math.round(recentRate * 100)}% this week.`,
        });
      }
    }

    // Task backlog growing
    const pendingTasks = await prisma.task.count({
      where: { circleId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    });
    const overdueTasks = await prisma.task.count({
      where: { circleId, status: 'PENDING', dueDate: { lt: new Date() } },
    });
    if (overdueTasks >= 3) {
      alerts.push({
        type: 'TASK_BACKLOG',
        severity: overdueTasks >= 5 ? 'HIGH' : 'MODERATE',
        title: `${overdueTasks} overdue tasks`,
        description: `There are ${pendingTasks} pending tasks, ${overdueTasks} past their due date. Consider redistributing workload.`,
      });
    }

    // Caregiver burnout risk across circle
    const members = await prisma.circleMember.findMany({
      where: { circleId, role: { in: ['ADMIN', 'MEMBER'] } },
      select: { userId: true, user: { select: { firstName: true } } },
    });
    for (const member of members) {
      const latest = await prisma.burnoutAssessment.findFirst({
        where: { userId: member.userId, circleId },
        orderBy: { createdAt: 'desc' },
      });
      if (latest && (latest.riskLevel === 'HIGH' || latest.riskLevel === 'CRITICAL')) {
        alerts.push({
          type: 'BURNOUT_RISK',
          severity: latest.riskLevel === 'CRITICAL' ? 'HIGH' : 'MODERATE',
          title: `${member.user.firstName} showing ${latest.riskLevel.toLowerCase()} burnout risk`,
          description: `Score: ${latest.overallScore}/10. Consider redistributing tasks or scheduling respite time.`,
        });
      }
    }

    // No journal entries recently
    const recentEntries = await prisma.journalEntry.count({
      where: { circleId, date: { gte: weekAgo } },
    });
    if (recentEntries === 0) {
      alerts.push({
        type: 'NO_JOURNAL',
        severity: 'LOW',
        title: 'No health journal updates this week',
        description: 'Regular mood and health tracking helps spot patterns. Consider logging an entry today.',
      });
    }

    alerts.sort((a, b) => {
      const sev: Record<string, number> = { HIGH: 3, MODERATE: 2, LOW: 1 };
      return (sev[b.severity] || 0) - (sev[a.severity] || 0);
    });

    res.json({ alerts });
  })
);

export default router;
