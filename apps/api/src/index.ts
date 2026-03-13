import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cron from 'node-cron';
import pino from 'pino';
import { generalLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './utils/prisma';
import { sendPush } from './utils/push';

import authRoutes from './routes/auth';
import circleRoutes from './routes/circles';
import taskRoutes from './routes/tasks';
import medicationRoutes from './routes/medications';
import journalRoutes from './routes/journal';
import appointmentRoutes from './routes/appointments';
import documentRoutes from './routes/documents';
import emergencyRoutes from './routes/emergency';
import subscriptionRoutes from './routes/subscriptions';

const logger = pino({ name: 'elderlink-api' });
const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(helmet());
app.use(cors({ origin: true }));

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
          } as any,
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
    const missedLogs = await prisma.medicationLog.findMany({
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

    const updated = await prisma.medicationLog.updateMany({
      where: { scheduledFor: { lt: now }, status: 'PENDING' },
      data: { status: 'MISSED' },
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

    logger.info(`Cron: Marked ${updated.count} logs as missed`);
  } catch (error) {
    logger.error({ error }, 'Cron: Failed to check missed medications');
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`ElderLink API running on port ${PORT}`);
});

export default app;
