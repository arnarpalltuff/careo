import { AppointmentStatus } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';

export async function createAppointment(
  circleId: string,
  data: {
    title: string;
    location?: string;
    date: string;
    time: string;
    duration?: number;
    doctor?: string;
    phone?: string;
    notes?: string;
    reminder?: number;
  }
) {
  return prisma.appointment.create({
    data: {
      circleId,
      title: data.title,
      location: data.location,
      date: new Date(data.date),
      time: data.time,
      duration: data.duration,
      doctor: data.doctor,
      phone: data.phone,
      notes: data.notes,
      reminder: data.reminder ?? 60,
    },
  });
}

export async function getAppointments(
  circleId: string,
  query: { from?: string; to?: string; status?: AppointmentStatus }
) {
  const where: any = { circleId };
  if (query.status) where.status = query.status;
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(query.from);
    if (query.to) where.date.lte = new Date(query.to);
  }

  return prisma.appointment.findMany({
    where,
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });
}

export async function getAppointment(apptId: string, circleId: string) {
  const appt = await prisma.appointment.findFirst({ where: { id: apptId, circleId } });
  if (!appt) throw new AppError(404, 'not_found', 'Appointment not found');
  return appt;
}

export async function updateAppointment(
  apptId: string,
  circleId: string,
  data: Partial<{
    title: string;
    location: string;
    date: string;
    time: string;
    duration: number;
    doctor: string;
    phone: string;
    notes: string;
    reminder: number;
    status: AppointmentStatus;
  }>
) {
  const existing = await prisma.appointment.findFirst({ where: { id: apptId, circleId } });
  if (!existing) throw new AppError(404, 'not_found', 'Appointment not found');

  const updateData: any = { ...data };
  if (data.date) updateData.date = new Date(data.date);

  return prisma.appointment.update({ where: { id: apptId }, data: updateData });
}

export async function deleteAppointment(apptId: string, circleId: string) {
  const appt = await prisma.appointment.findFirst({ where: { id: apptId, circleId } });
  if (!appt) throw new AppError(404, 'not_found', 'Appointment not found');
  await prisma.appointment.delete({ where: { id: apptId } });
}
