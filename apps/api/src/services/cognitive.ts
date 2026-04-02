import {
  SubscriptionTier,
  TIER_LIMITS,
  COGNITIVE_EXERCISES,
  CognitiveCategory,
  ExerciseDifficulty,
} from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';

export function getExercises(category?: CognitiveCategory, difficulty?: ExerciseDifficulty) {
  let exercises = COGNITIVE_EXERCISES;
  if (category) {
    exercises = exercises.filter((e) => e.category === category);
  }
  if (difficulty) {
    exercises = exercises.filter((e) => e.difficulty === difficulty);
  }
  return exercises;
}

export async function recordSession(
  circleId: string,
  userId: string,
  data: {
    exerciseType: string;
    exerciseTitle: string;
    difficulty: string;
    score: number;
    accuracy: number;
    durationSeconds: number;
  }
) {
  // Check subscription tier limit (sessions per day)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  const limit = TIER_LIMITS[tier].cognitiveExercises;
  if (limit !== Infinity) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await prisma.cognitiveSession.count({
      where: {
        userId,
        circleId,
        completedAt: { gte: today, lt: tomorrow },
      },
    });
    if (todayCount >= limit) {
      throw new AppError(
        403,
        'upgrade_required',
        `You've reached your ${tier} plan limit of ${limit} cognitive exercises per day. Upgrade to unlock more.`
      );
    }
  }

  return prisma.cognitiveSession.create({
    data: {
      circleId,
      userId,
      exerciseType: data.exerciseType,
      exerciseTitle: data.exerciseTitle,
      difficulty: data.difficulty,
      score: data.score,
      accuracy: data.accuracy,
      durationSeconds: data.durationSeconds,
    },
  });
}

export async function getSessions(
  circleId: string,
  userId?: string,
  days: number = 30
) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where: any = { circleId, completedAt: { gte: since } };
  if (userId) where.userId = userId;

  return prisma.cognitiveSession.findMany({
    where,
    orderBy: { completedAt: 'desc' },
  });
}

export async function getCognitiveReport(
  circleId: string,
  userId?: string,
  days: number = 30
) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where: any = { circleId, completedAt: { gte: since } };
  if (userId) where.userId = userId;

  const sessions = await prisma.cognitiveSession.findMany({
    where,
    orderBy: { completedAt: 'asc' },
  });

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      averagesByCategory: {},
      trend: [],
      streak: 0,
    };
  }

  // Average scores by category
  const categoryMap: Record<string, { totalScore: number; totalAccuracy: number; count: number }> = {};
  for (const s of sessions) {
    if (!categoryMap[s.exerciseType]) {
      categoryMap[s.exerciseType] = { totalScore: 0, totalAccuracy: 0, count: 0 };
    }
    categoryMap[s.exerciseType].totalScore += s.score;
    categoryMap[s.exerciseType].totalAccuracy += s.accuracy;
    categoryMap[s.exerciseType].count += 1;
  }

  const averagesByCategory: Record<string, { averageScore: number; averageAccuracy: number; sessionCount: number }> = {};
  for (const [cat, data] of Object.entries(categoryMap)) {
    averagesByCategory[cat] = {
      averageScore: Math.round((data.totalScore / data.count) * 10) / 10,
      averageAccuracy: Math.round((data.totalAccuracy / data.count) * 10) / 10,
      sessionCount: data.count,
    };
  }

  // Trend over time (daily averages)
  const dailyMap: Record<string, { totalScore: number; totalAccuracy: number; count: number }> = {};
  for (const s of sessions) {
    const day = s.completedAt.toISOString().slice(0, 10);
    if (!dailyMap[day]) {
      dailyMap[day] = { totalScore: 0, totalAccuracy: 0, count: 0 };
    }
    dailyMap[day].totalScore += s.score;
    dailyMap[day].totalAccuracy += s.accuracy;
    dailyMap[day].count += 1;
  }

  const trend = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      averageScore: Math.round((data.totalScore / data.count) * 10) / 10,
      averageAccuracy: Math.round((data.totalAccuracy / data.count) * 10) / 10,
      sessionCount: data.count,
    }));

  // Streak: consecutive days (ending today or yesterday) with at least one session
  const sessionDays = new Set(Object.keys(dailyMap));
  let streak = 0;
  const now = new Date();
  const checkDate = new Date(now);
  checkDate.setHours(0, 0, 0, 0);

  // Start from today; if no session today, try yesterday as starting point
  let dateStr = checkDate.toISOString().slice(0, 10);
  if (!sessionDays.has(dateStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    dateStr = checkDate.toISOString().slice(0, 10);
  }

  while (sessionDays.has(dateStr)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    dateStr = checkDate.toISOString().slice(0, 10);
  }

  return {
    totalSessions: sessions.length,
    averagesByCategory,
    trend,
    streak,
  };
}
