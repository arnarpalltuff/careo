import { SubscriptionTier, TIER_LIMITS, VitalType, VITAL_NORMAL_RANGES } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyCircle } from './notifications';

export async function recordVital(
  circleId: string,
  userId: string,
  data: {
    type: VitalType;
    value: number;
    value2?: number;
    unit: string;
    notes?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  if (!TIER_LIMITS[tier].vitalTracking) {
    throw new AppError(403, 'upgrade_required', 'Vital tracking requires a Plus or Family subscription.');
  }

  const vital = await prisma.vitalReading.create({
    data: {
      circleId,
      recordedById: userId,
      type: data.type,
      value: data.value,
      value2: data.value2,
      unit: data.unit,
      notes: data.notes,
    },
  });

  // Check if the value is outside normal range and notify circle members
  const range = VITAL_NORMAL_RANGES[data.type];
  let isAbnormal = false;

  if (data.value < range.min || data.value > range.max) {
    isAbnormal = true;
  }
  if (data.value2 !== undefined && range.min2 !== undefined && range.max2 !== undefined) {
    if (data.value2 < range.min2 || data.value2 > range.max2) {
      isAbnormal = true;
    }
  }

  if (isAbnormal) {
    const label = range.label;
    const valueStr = data.value2 !== undefined ? `${data.value}/${data.value2}` : `${data.value}`;
    await notifyCircle(
      circleId,
      userId,
      'Abnormal Vital Reading',
      `${data.type.replace(/_/g, ' ')} reading of ${valueStr} ${data.unit} is outside the normal range (${label}).`,
      { type: 'vital_alert', vitalId: vital.id }
    );
  }

  return vital;
}

export async function getVitals(
  circleId: string,
  type?: VitalType,
  days?: number,
  limit?: number
) {
  const where: any = { circleId };

  if (type) {
    where.type = type;
  }

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    where.recordedAt = { gte: since };
  }

  return prisma.vitalReading.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take: limit,
  });
}

export async function getVitalTrends(
  circleId: string,
  type: VitalType,
  days: number
) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const readings = await prisma.vitalReading.findMany({
    where: {
      circleId,
      type,
      recordedAt: { gte: since },
    },
    orderBy: { recordedAt: 'asc' },
  });

  if (readings.length === 0) {
    return { dailyAverages: [], min: null, max: null, latest: null };
  }

  // Compute daily averages
  const dailyMap = new Map<string, { sum: number; sum2: number; count: number }>();
  let min = readings[0].value;
  let max = readings[0].value;

  for (const r of readings) {
    const dateKey = r.recordedAt.toISOString().slice(0, 10);
    const entry = dailyMap.get(dateKey) || { sum: 0, sum2: 0, count: 0 };
    entry.sum += r.value;
    entry.sum2 += r.value2 ?? 0;
    entry.count += 1;
    dailyMap.set(dateKey, entry);

    if (r.value < min) min = r.value;
    if (r.value > max) max = r.value;
  }

  const dailyAverages = Array.from(dailyMap.entries()).map(([date, entry]) => ({
    date,
    average: Math.round((entry.sum / entry.count) * 10) / 10,
    average2: entry.sum2 > 0 ? Math.round((entry.sum2 / entry.count) * 10) / 10 : undefined,
    count: entry.count,
  }));

  const latest = readings[readings.length - 1];

  return { dailyAverages, min, max, latest };
}

export async function deleteVital(vitalId: string, userId: string) {
  const vital = await prisma.vitalReading.findUnique({ where: { id: vitalId } });
  if (!vital) throw new AppError(404, 'not_found', 'Vital reading not found');
  if (vital.recordedById !== userId) {
    throw new AppError(403, 'forbidden', 'You can only delete your own vital readings');
  }

  await prisma.vitalReading.delete({ where: { id: vitalId } });
}
