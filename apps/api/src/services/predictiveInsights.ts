import Anthropic from '@anthropic-ai/sdk';
import { SubscriptionTier, TIER_LIMITS } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';

const anthropic = new Anthropic();

export async function generateInsights(circleId: string) {
  // Check subscription tier
  const circle = await prisma.careCircle.findUnique({
    where: { id: circleId },
    include: { members: { include: { user: { select: { subscriptionTier: true } } } } },
  });
  if (!circle) throw new AppError(404, 'not_found', 'Circle not found');

  const ownerMember = circle.members.find((m) => m.role === 'ADMIN');
  const tier = (ownerMember?.user.subscriptionTier || 'FREE') as SubscriptionTier;
  if (!TIER_LIMITS[tier].predictiveInsights) {
    throw new AppError(403, 'upgrade_required', 'Predictive insights require a Plus or Family subscription.');
  }

  // Gather last 30 days of data
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [journalEntries, vitalReadings, medicationLogs, tasks, burnoutAssessments] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { circleId, date: { gte: since } },
      select: { date: true, mood: true, energy: true, pain: true, notes: true },
      orderBy: { date: 'desc' },
    }),
    prisma.vitalReading.findMany({
      where: { circleId, recordedAt: { gte: since } },
      select: { type: true, value: true, unit: true, recordedAt: true },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.medicationLog.findMany({
      where: { medication: { circleId }, scheduledFor: { gte: since } },
      select: { status: true, scheduledFor: true },
      orderBy: { scheduledFor: 'desc' },
    }),
    prisma.task.findMany({
      where: { circleId, createdAt: { gte: since } },
      select: { status: true, completedAt: true, createdAt: true },
    }),
    prisma.burnoutAssessment.findMany({
      where: { circleId, createdAt: { gte: since } },
      select: { overallScore: true, riskLevel: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Calculate medication adherence
  const totalMedLogs = medicationLogs.length;
  const takenLogs = medicationLogs.filter((l) => l.status === 'TAKEN').length;
  const medAdherence = totalMedLogs > 0 ? Math.round((takenLogs / totalMedLogs) * 100) : null;

  // Calculate task completion rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null;

  const dataPayload = {
    journalEntries: journalEntries.map((e) => ({
      date: e.date,
      mood: e.mood,
      energy: e.energy,
      pain: e.pain,
    })),
    vitalReadings: vitalReadings.map((v) => ({
      type: v.type,
      value: v.value,
      unit: v.unit,
      recordedAt: v.recordedAt,
    })),
    medicationAdherencePercent: medAdherence,
    taskCompletionPercent: taskCompletionRate,
    burnoutAssessments: burnoutAssessments.map((b) => ({
      overallScore: b.overallScore,
      riskLevel: b.riskLevel,
      date: b.createdAt,
    })),
  };

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are a health analytics AI for a caregiving application. Analyze the following 30-day care data for a care circle and identify trends, anomalies, and predictions.

Return a JSON array of insight objects. Each object must have:
- type: one of "TREND_ALERT", "ANOMALY", "RISK_PREDICTION", "RECOMMENDATION"
- priority: one of "INFO", "WARNING", "URGENT"
- title: short descriptive title (max 80 chars)
- description: detailed explanation (1-3 sentences)
- dataPoints: JSON string of key evidence data points
- recommendation: actionable advice (1-2 sentences)

Return ONLY the JSON array, no other text.

Data:
${JSON.stringify(dataPayload, null, 2)}`,
      },
    ],
  });

  // Parse the AI response
  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new AppError(500, 'ai_error', 'Failed to generate insights from AI');
  }

  let insights: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    dataPoints?: string;
    recommendation: string;
  }>;

  try {
    insights = JSON.parse(textBlock.text);
  } catch {
    throw new AppError(500, 'ai_parse_error', 'Failed to parse AI response into insights');
  }

  // Save insights to the database
  const saved = [];
  for (const insight of insights) {
    const record = await prisma.predictiveInsight.create({
      data: {
        circleId,
        type: insight.type,
        priority: insight.priority,
        title: insight.title,
        description: insight.description,
        dataPoints: insight.dataPoints || null,
        recommendation: insight.recommendation,
      },
    });
    saved.push(record);
  }

  return saved;
}

export async function getInsights(circleId: string, acknowledged?: boolean) {
  const where: any = { circleId };
  if (acknowledged !== undefined) {
    where.acknowledged = acknowledged;
  }

  return prisma.predictiveInsight.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function acknowledgeInsight(insightId: string, circleId: string) {
  const insight = await prisma.predictiveInsight.findFirst({
    where: { id: insightId, circleId },
  });
  if (!insight) throw new AppError(404, 'not_found', 'Insight not found');

  return prisma.predictiveInsight.update({
    where: { id: insightId },
    data: { acknowledged: true },
  });
}

export async function deleteInsight(insightId: string, circleId: string) {
  const insight = await prisma.predictiveInsight.findFirst({
    where: { id: insightId, circleId },
  });
  if (!insight) throw new AppError(404, 'not_found', 'Insight not found');

  await prisma.predictiveInsight.delete({ where: { id: insightId } });
}
