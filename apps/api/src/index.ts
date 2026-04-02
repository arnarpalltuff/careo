import dotenv from 'dotenv';
dotenv.config();

import { validateEnv } from './utils/validateEnv';
validateEnv();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cron from 'node-cron';
import pino from 'pino';
import { generalLimiter } from './middleware/rateLimit';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './utils/prisma';
import { sendPush } from './utils/push';

const startedAt = new Date().toISOString();

import authRoutes from './routes/auth';
import circleRoutes from './routes/circles';
import taskRoutes from './routes/tasks';
import medicationRoutes from './routes/medications';
import journalRoutes from './routes/journal';
import appointmentRoutes from './routes/appointments';
import documentRoutes from './routes/documents';
import emergencyRoutes from './routes/emergency';
import subscriptionRoutes from './routes/subscriptions';
import activityRoutes from './routes/activity';
import aiRoutes from './routes/ai';
import insightsRoutes from './routes/insights';
import burnoutRoutes from './routes/burnout';
import expenseRoutes from './routes/expenses';
import careNoteRoutes from './routes/careNotes';
import transitionRoutes from './routes/transitions';
import kudosRoutes from './routes/kudos';
import meetingRoutes from './routes/meetings';
import resourceRoutes from './routes/resources';
import protocolRoutes from './routes/protocols';
import vitalRoutes from './routes/vitals';
import drugInteractionRoutes from './routes/drugInteractions';
import safeZoneRoutes from './routes/safeZones';
import cognitiveRoutes from './routes/cognitive';
import checkInRoutes from './routes/checkIns';
import predictiveInsightRoutes from './routes/predictiveInsights';

const logger = pino({ name: 'careo-api' });
const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(requestId);
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8081', 'http://localhost:19006'],
}));

// Raw body for Stripe webhooks
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/circles', circleRoutes);
app.use('/api/circles/:circleId/tasks', taskRoutes);
app.use('/api/circles/:circleId/medications', medicationRoutes);
app.use('/api/circles/:circleId/journal', journalRoutes);
app.use('/api/circles/:circleId/appointments', appointmentRoutes);
app.use('/api/circles/:circleId/documents', documentRoutes);
app.use('/api/circles/:circleId/emergency', emergencyRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/circles/:circleId/activity', activityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/circles/:circleId/insights', insightsRoutes);
app.use('/api/circles/:circleId/burnout', burnoutRoutes);
app.use('/api/circles/:circleId/expenses', expenseRoutes);
app.use('/api/circles/:circleId/care-notes', careNoteRoutes);
app.use('/api/circles/:circleId/transitions', transitionRoutes);
app.use('/api/circles/:circleId/kudos', kudosRoutes);
app.use('/api/circles/:circleId/meetings', meetingRoutes);
app.use('/api/circles/:circleId/resources', resourceRoutes);
app.use('/api/circles/:circleId/protocols', protocolRoutes);
app.use('/api/circles/:circleId/vitals', vitalRoutes);
app.use('/api/circles/:circleId/drug-interactions', drugInteractionRoutes);
app.use('/api/circles/:circleId/safe-zones', safeZoneRoutes);
app.use('/api/circles/:circleId/cognitive', cognitiveRoutes);
app.use('/api/circles/:circleId/check-ins', checkInRoutes);
app.use('/api/circles/:circleId/predictive-insights', predictiveInsightRoutes);

// Health check
app.get('/api/health', async (_req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}
  const uptime = process.uptime();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    startedAt,
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    database: dbOk ? 'connected' : 'unreachable',
  });
});

// Error handler
app.use(errorHandler);

// ════════════ CRON JOBS ════════════

// Daily at midnight: create tomorrow's medication log entries
cron.schedule('0 0 * * *', async () => {
  logger.info('Cron: Creating tomorrow medication logs');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const activeMeds = await prisma.medication.findMany({
      where: { isActive: true },
      include: { schedules: true },
    });

    for (const med of activeMeds) {
      for (const schedule of med.schedules) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const scheduledFor = new Date(tomorrow);
        scheduledFor.setHours(hours, minutes, 0, 0);

        await prisma.medicationLog.upsert({
          where: {
            medicationId_scheduledFor: {
              medicationId: med.id,
              scheduledFor,
            },
          },
          create: {
            medicationId: med.id,
            scheduledFor,
            status: 'PENDING',
          },
          update: {},
        });
      }
    }
    logger.info('Cron: Medication logs created');
  } catch (error) {
    logger.error({ error }, 'Cron: Failed to create medication logs');
  }
});

// Daily at 9am: remind about tasks due today
cron.schedule('0 9 * * *', async () => {
  logger.info('Cron: Checking tasks due today');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.task.findMany({
      where: {
        status: 'PENDING',
        dueDate: { gte: today, lt: tomorrow },
      },
      include: {
        assignedTo: { select: { pushToken: true } },
        circle: { select: { id: true, members: { include: { user: { select: { pushToken: true } } } } } },
      },
    });

    for (const task of tasks) {
      const tokens: string[] = [];
      if (task.assignedTo?.pushToken) {
        tokens.push(task.assignedTo.pushToken);
      } else {
        task.circle.members.forEach((m) => {
          if (m.user.pushToken) tokens.push(m.user.pushToken);
        });
      }
      if (tokens.length > 0) {
        await sendPush(tokens, 'Task due today', `Due today: ${task.title}`, {
          type: 'TASK_DUE_TODAY',
          taskId: task.id,
          circleId: task.circleId,
        });
      }
    }
    logger.info(`Cron: Sent reminders for ${tasks.length} tasks`);
  } catch (error) {
    logger.error({ error }, 'Cron: Failed to send task reminders');
  }
});

// Daily at 10pm: mark missed medications
cron.schedule('0 22 * * *', async () => {
  logger.info('Cron: Checking missed medications');
  try {
    const now = new Date();

    // Use a transaction to atomically find and update missed logs
    const missedLogs = await prisma.$transaction(async (tx) => {
      const logs = await tx.medicationLog.findMany({
        where: { scheduledFor: { lt: now }, status: 'PENDING' },
        include: {
          medication: {
            select: {
              name: true,
              circleId: true,
              circle: {
                select: {
                  careRecipient: true,
                  members: { include: { user: { select: { id: true, pushToken: true } } } },
                },
              },
            },
          },
        },
      });

      if (logs.length > 0) {
        await tx.medicationLog.updateMany({
          where: { id: { in: logs.map((l) => l.id) }, status: 'PENDING' },
          data: { status: 'MISSED' },
        });
      }

      return logs;
    });

    // Send notifications grouped by circle
    const circleNotifications = new Map<string, { tokens: string[]; medNames: Set<string>; recipient: string }>();
    for (const log of missedLogs) {
      const circleId = log.medication.circleId;
      if (!circleNotifications.has(circleId)) {
        const tokens = log.medication.circle.members
          .map((m) => m.user.pushToken)
          .filter(Boolean) as string[];
        circleNotifications.set(circleId, {
          tokens,
          medNames: new Set(),
          recipient: log.medication.circle.careRecipient,
        });
      }
      circleNotifications.get(circleId)!.medNames.add(log.medication.name);
    }

    for (const [circleId, data] of circleNotifications) {
      const names = Array.from(data.medNames).join(', ');
      await sendPush(data.tokens, 'Missed medication', `${data.recipient}'s ${names} was not logged`, {
        type: 'MED_MISSED',
        circleId,
      });
    }

    logger.info(`Cron: Marked ${missedLogs.length} logs as missed`);
  } catch (error) {
    logger.error({ error }, 'Cron: Failed to check missed medications');
  }
});

// Daily at 1am: create next instances of recurring tasks
cron.schedule('0 1 * * *', async () => {
  logger.info('Cron: Creating recurring task instances');
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Find completed recurring tasks with a due date
    const recurringTasks = await prisma.task.findMany({
      where: {
        status: 'COMPLETED',
        recurring: { not: null },
        dueDate: { not: null },
      },
    });

    let created = 0;
    for (const task of recurringTasks) {
      const dueDate = new Date(task.dueDate!);
      let nextDue: Date | null = null;

      switch (task.recurring) {
        case 'DAILY':
          nextDue = new Date(dueDate);
          nextDue.setDate(nextDue.getDate() + 1);
          break;
        case 'WEEKLY':
          nextDue = new Date(dueDate);
          nextDue.setDate(nextDue.getDate() + 7);
          break;
        case 'BIWEEKLY':
          nextDue = new Date(dueDate);
          nextDue.setDate(nextDue.getDate() + 14);
          break;
        case 'MONTHLY':
          nextDue = new Date(dueDate);
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
      }

      if (!nextDue || nextDue < now) continue;

      // Check if a pending task with the same title already exists for this date
      const existing = await prisma.task.findFirst({
        where: {
          circleId: task.circleId,
          title: task.title,
          dueDate: nextDue,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      });

      if (!existing) {
        await prisma.task.create({
          data: {
            circleId: task.circleId,
            createdById: task.createdById,
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: nextDue,
            dueTime: task.dueTime,
            recurring: task.recurring,
            assignedToId: task.assignedToId,
            status: 'PENDING',
          },
        });
        created++;
      }
    }
    logger.info(`Cron: Created ${created} recurring task instances`);
  } catch (error) {
    logger.error({ error }, 'Cron: Failed to create recurring tasks');
  }
});

// Every 15 minutes: send appointment reminders
cron.schedule('*/15 * * * *', async () => {
  try {
    const now = new Date();
    // Look ahead 90 minutes to catch reminders at 15/30/60/90 min windows
    const windowEnd = new Date(now.getTime() + 90 * 60 * 1000);

    const upcomingAppts = await prisma.appointment.findMany({
      where: {
        status: 'UPCOMING',
        date: {
          gte: new Date(now.toISOString().split('T')[0]),
          lte: new Date(windowEnd.toISOString().split('T')[0] + 'T23:59:59'),
        },
      },
      include: {
        circle: {
          select: {
            careRecipient: true,
            members: { include: { user: { select: { pushToken: true } } } },
          },
        },
      },
    });

    let sent = 0;
    for (const appt of upcomingAppts) {
      // Parse appointment datetime
      const [hours, minutes] = appt.time.split(':').map(Number);
      const apptDate = new Date(appt.date);
      apptDate.setHours(hours, minutes, 0, 0);

      // Calculate how many minutes until the appointment
      const minutesUntil = Math.round((apptDate.getTime() - now.getTime()) / 60000);
      const reminderMinutes = appt.reminder || 60;

      // Send if we're within the reminder window (allow 15 min tolerance for cron interval)
      if (minutesUntil > 0 && minutesUntil <= reminderMinutes && minutesUntil > reminderMinutes - 15) {
        const tokens = appt.circle.members
          .map((m) => m.user.pushToken)
          .filter(Boolean) as string[];

        if (tokens.length > 0) {
          await sendPush(
            tokens,
            'Appointment reminder',
            `${appt.title} in ${minutesUntil} minutes${appt.location ? ` at ${appt.location}` : ''}`,
            { type: 'APPT_REMINDER', circleId: appt.circleId }
          );
          sent++;
        }
      }
    }
    if (sent > 0) {
      logger.info(`Cron: Sent ${sent} appointment reminders`);
    }
  } catch (error) {
    logger.error({ error }, 'Cron: Failed to send appointment reminders');
  }
});

// Every hour: send due respite reminders
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const dueReminders = await prisma.respiteReminder.findMany({
      where: {
        scheduledFor: { lte: now },
        dismissed: false,
      },
      include: {
        user: { select: { pushToken: true, firstName: true } },
      },
    });

    for (const reminder of dueReminders) {
      if (reminder.user.pushToken) {
        await sendPush([reminder.user.pushToken], 'Self-care reminder', reminder.message, {
          type: 'RESPITE_REMINDER',
          circleId: reminder.circleId,
        });
      }
      // Mark as dismissed after sending
      await prisma.respiteReminder.update({
        where: { id: reminder.id },
        data: { dismissed: true },
      });
    }

    if (dueReminders.length > 0) {
      logger.info(`Cron: Sent ${dueReminders.length} respite reminders`);
    }
  } catch (error) {
    logger.error({ error }, 'Cron: Failed to send respite reminders');
  }
});

// Weekly on Sunday at 9am: prompt burnout check-in for active caregivers
cron.schedule('0 9 * * 0', async () => {
  logger.info('Cron: Sending weekly burnout check-in prompts');
  try {
    const members = await prisma.circleMember.findMany({
      where: { role: { in: ['ADMIN', 'MEMBER'] } },
      include: { user: { select: { id: true, pushToken: true, firstName: true, subscriptionTier: true } } },
    });

    const sent = new Set<string>();
    for (const member of members) {
      if (sent.has(member.userId)) continue;
      if (member.user.subscriptionTier === 'FREE') continue;
      if (member.user.pushToken) {
        await sendPush([member.user.pushToken], 'Weekly check-in', 'How are you doing this week? Take a moment to assess your wellbeing.', {
          type: 'BURNOUT_CHECKIN',
          circleId: member.circleId,
        });
        sent.add(member.userId);
      }
    }
    logger.info(`Cron: Sent burnout check-in to ${sent.size} caregivers`);
  } catch (error) {
    logger.error({ error }, 'Cron: Failed to send burnout check-in prompts');
  }
});

// Daily at 8am: create daily safety check-ins for all paid circles
cron.schedule('0 8 * * *', async () => {
  logger.info('Cron: Creating daily safety check-ins');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const members = await prisma.circleMember.findMany({
      where: { role: { in: ['ADMIN', 'MEMBER'] } },
      include: {
        user: { select: { id: true, subscriptionTier: true, pushToken: true } },
      },
    });

    let created = 0;
    for (const member of members) {
      if (member.user.subscriptionTier === 'FREE') continue;
      try {
        await prisma.dailyCheckIn.create({
          data: {
            circleId: member.circleId,
            userId: member.userId,
            scheduledFor: today,
            status: 'PENDING',
          },
        });
        created++;
        if (member.user.pushToken) {
          await sendPush([member.user.pushToken], 'Daily check-in', 'How are you today? Tap to check in.', {
            type: 'DAILY_CHECKIN',
            circleId: member.circleId,
          });
        }
      } catch {
        // Unique constraint violation = already created
      }
    }
    logger.info(`Cron: Created ${created} daily check-ins`);
  } catch (error) {
    logger.error({ error }, 'Cron: Failed to create daily check-ins');
  }
});

// Daily at 11am: mark missed check-ins from yesterday
cron.schedule('0 11 * * *', async () => {
  logger.info('Cron: Marking missed check-ins');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const missed = await prisma.dailyCheckIn.updateMany({
      where: {
        scheduledFor: { lt: today },
        status: 'PENDING',
      },
      data: { status: 'MISSED' },
    });

    if (missed.count > 0) {
      logger.info(`Cron: Marked ${missed.count} check-ins as missed`);
    }
  } catch (error) {
    logger.error({ error }, 'Cron: Failed to mark missed check-ins');
  }
});

// Weekly on Monday at 3am: generate predictive health insights
cron.schedule('0 3 * * 1', async () => {
  logger.info('Cron: Generating predictive health insights');
  try {
    const { generateInsights } = await import('./services/predictiveInsights');
    const circles = await prisma.careCircle.findMany({
      include: {
        members: {
          where: { role: 'ADMIN' },
          include: { user: { select: { subscriptionTier: true } } },
        },
      },
    });

    let generated = 0;
    for (const circle of circles) {
      const hasAccess = circle.members.some(m => m.user.subscriptionTier !== 'FREE');
      if (!hasAccess) continue;
      try {
        await generateInsights(circle.id);
        generated++;
      } catch (err) {
        logger.error({ error: err, circleId: circle.id }, 'Failed to generate insights for circle');
      }
    }
    logger.info(`Cron: Generated insights for ${generated} circles`);
  } catch (error) {
    logger.error({ error }, 'Cron: Failed to generate predictive insights');
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Careo API running on port ${PORT}`);
});

export default app;
