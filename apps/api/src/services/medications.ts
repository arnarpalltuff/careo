import { MedLogStatus } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';

export async function createMedication(
  circleId: string,
  data: {
    name: string;
    dosage: string;
    frequency: string;
    instructions?: string;
    prescriber?: string;
    pharmacy?: string;
    refillDate?: string;
    schedules: { time: string; label: string }[];
  }
) {
  return prisma.medication.create({
    data: {
      circleId,
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      instructions: data.instructions,
      prescriber: data.prescriber,
      pharmacy: data.pharmacy,
      refillDate: data.refillDate ? new Date(data.refillDate) : undefined,
      schedules: {
        create: data.schedules.map((s) => ({ time: s.time, label: s.label })),
      },
    },
    include: { schedules: true },
  });
}

export async function getMedications(circleId: string, active?: boolean) {
  const where: any = { circleId };
  if (active !== undefined) where.isActive = active;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const meds = await prisma.medication.findMany({
    where,
    include: {
      schedules: true,
      logs: {
        where: {
          scheduledFor: { gte: today, lt: tomorrow },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return meds;
}

export async function getMedication(medId: string, circleId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const med = await prisma.medication.findFirst({
    where: { id: medId, circleId },
    include: {
      schedules: true,
      logs: {
        where: { scheduledFor: { gte: thirtyDaysAgo } },
        orderBy: { scheduledFor: 'desc' },
      },
    },
  });
  if (!med) throw new AppError(404, 'not_found', 'Medication not found');
  return med;
}

export async function updateMedication(
  medId: string,
  circleId: string,
  data: {
    name?: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
    prescriber?: string;
    pharmacy?: string;
    refillDate?: string;
    schedules?: { time: string; label: string }[];
  }
) {
  const existing = await prisma.medication.findFirst({ where: { id: medId, circleId } });
  if (!existing) throw new AppError(404, 'not_found', 'Medication not found');

  const { schedules, refillDate, ...rest } = data;

  if (schedules) {
    return prisma.$transaction(async (tx) => {
      await tx.medicationSchedule.deleteMany({ where: { medicationId: medId } });
      return tx.medication.update({
        where: { id: medId },
        data: {
          ...rest,
          refillDate: refillDate ? new Date(refillDate) : undefined,
          schedules: {
            create: schedules.map((s) => ({ time: s.time, label: s.label })),
          },
        },
        include: { schedules: true },
      });
    });
  }

  return prisma.medication.update({
    where: { id: medId },
    data: { ...rest, refillDate: refillDate ? new Date(refillDate) : undefined },
    include: { schedules: true },
  });
}

export async function deleteMedication(medId: string, circleId: string) {
  const med = await prisma.medication.findFirst({ where: { id: medId, circleId } });
  if (!med) throw new AppError(404, 'not_found', 'Medication not found');
  await prisma.medication.update({ where: { id: medId }, data: { isActive: false } });
}

export async function logDose(
  medId: string,
  circleId: string,
  userId: string,
  data: { scheduledFor: string; status: 'TAKEN' | 'SKIPPED'; skippedReason?: string }
) {
  const med = await prisma.medication.findFirst({ where: { id: medId, circleId } });
  if (!med) throw new AppError(404, 'not_found', 'Medication not found');

  const scheduledFor = new Date(data.scheduledFor);

  const existing = await prisma.medicationLog.findFirst({
    where: { medicationId: medId, scheduledFor },
  });

  if (existing) {
    return prisma.medicationLog.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        takenAt: data.status === 'TAKEN' ? new Date() : null,
        skippedReason: data.status === 'SKIPPED' ? data.skippedReason : null,
        loggedById: userId,
      },
    });
  }

  return prisma.medicationLog.create({
    data: {
      medicationId: medId,
      scheduledFor,
      status: data.status,
      takenAt: data.status === 'TAKEN' ? new Date() : null,
      skippedReason: data.status === 'SKIPPED' ? data.skippedReason : null,
      loggedById: userId,
    },
  });
}

export async function getLogs(medId: string, circleId: string, from?: string, to?: string) {
  const med = await prisma.medication.findFirst({ where: { id: medId, circleId } });
  if (!med) throw new AppError(404, 'not_found', 'Medication not found');

  const where: any = { medicationId: medId };
  if (from || to) {
    where.scheduledFor = {};
    if (from) where.scheduledFor.gte = new Date(from);
    if (to) where.scheduledFor.lte = new Date(to);
  }

  return prisma.medicationLog.findMany({
    where,
    orderBy: { scheduledFor: 'desc' },
  });
}
