import { TransitionType, TransitionStatus } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyCircle } from './notifications';

const DEFAULT_CHECKLISTS: Record<string, { id: string; text: string; done: boolean; category: string }[]> = {
  HOSPITAL_TO_HOME: [
    { id: '1', text: 'Get discharge summary and care instructions', done: false, category: 'Documents' },
    { id: '2', text: 'Confirm follow-up appointments scheduled', done: false, category: 'Medical' },
    { id: '3', text: 'Pick up new prescriptions from pharmacy', done: false, category: 'Medications' },
    { id: '4', text: 'Set up medication schedule changes', done: false, category: 'Medications' },
    { id: '5', text: 'Arrange home medical equipment if needed', done: false, category: 'Home Setup' },
    { id: '6', text: 'Remove trip hazards and prepare safe pathways', done: false, category: 'Home Setup' },
    { id: '7', text: 'Stock groceries and easy-to-prepare meals', done: false, category: 'Home Setup' },
    { id: '8', text: 'Set up a recovery area (bed, supplies within reach)', done: false, category: 'Home Setup' },
    { id: '9', text: 'Arrange transportation home', done: false, category: 'Logistics' },
    { id: '10', text: 'Notify primary care physician of discharge', done: false, category: 'Medical' },
    { id: '11', text: 'Schedule home health aide if prescribed', done: false, category: 'Care Team' },
    { id: '12', text: 'Update care circle on status and needs', done: false, category: 'Communication' },
    { id: '13', text: 'Review signs to watch for / when to call doctor', done: false, category: 'Medical' },
    { id: '14', text: 'Set up 24-hour care schedule for first 48 hours', done: false, category: 'Care Team' },
  ],
  HOME_TO_FACILITY: [
    { id: '1', text: 'Research and visit potential facilities', done: false, category: 'Research' },
    { id: '2', text: 'Review facility inspection reports and ratings', done: false, category: 'Research' },
    { id: '3', text: 'Check insurance coverage and costs', done: false, category: 'Financial' },
    { id: '4', text: 'Complete admission paperwork', done: false, category: 'Documents' },
    { id: '5', text: 'Provide complete medical history and medication list', done: false, category: 'Medical' },
    { id: '6', text: 'Pack personal items and comfort objects', done: false, category: 'Personal' },
    { id: '7', text: 'Label all clothing and belongings', done: false, category: 'Personal' },
    { id: '8', text: 'Set up room with familiar photos and items', done: false, category: 'Personal' },
    { id: '9', text: 'Meet the care team and establish communication plan', done: false, category: 'Care Team' },
    { id: '10', text: 'Discuss advance directives with facility', done: false, category: 'Legal' },
    { id: '11', text: 'Set up visiting schedule for family', done: false, category: 'Communication' },
    { id: '12', text: 'Arrange mail forwarding if needed', done: false, category: 'Logistics' },
  ],
  FACILITY_TO_HOME: [
    { id: '1', text: 'Get discharge plan and ongoing care needs', done: false, category: 'Medical' },
    { id: '2', text: 'Confirm all medications and schedule', done: false, category: 'Medications' },
    { id: '3', text: 'Arrange in-home care support', done: false, category: 'Care Team' },
    { id: '4', text: 'Prepare home for accessibility needs', done: false, category: 'Home Setup' },
    { id: '5', text: 'Install grab bars, ramps, or other equipment', done: false, category: 'Home Setup' },
    { id: '6', text: 'Set up follow-up appointments', done: false, category: 'Medical' },
    { id: '7', text: 'Create daily care routine schedule', done: false, category: 'Care Team' },
    { id: '8', text: 'Stock necessary supplies and food', done: false, category: 'Home Setup' },
  ],
  HOSPICE: [
    { id: '1', text: 'Meet with hospice team to discuss goals of care', done: false, category: 'Care Team' },
    { id: '2', text: 'Review and finalize advance directives', done: false, category: 'Legal' },
    { id: '3', text: 'Ensure power of attorney documents are in place', done: false, category: 'Legal' },
    { id: '4', text: 'Discuss pain management and comfort measures', done: false, category: 'Medical' },
    { id: '5', text: 'Set up comfort items in care space', done: false, category: 'Personal' },
    { id: '6', text: 'Notify extended family and friends', done: false, category: 'Communication' },
    { id: '7', text: 'Understand hospice services: nurse visits, aide, chaplain, social worker', done: false, category: 'Care Team' },
    { id: '8', text: 'Learn about medication management for comfort', done: false, category: 'Medications' },
    { id: '9', text: 'Discuss spiritual and emotional support needs', done: false, category: 'Personal' },
    { id: '10', text: 'Create a visiting schedule that respects energy levels', done: false, category: 'Communication' },
  ],
  REHAB: [
    { id: '1', text: 'Understand rehabilitation goals and timeline', done: false, category: 'Medical' },
    { id: '2', text: 'Meet therapy team (PT, OT, speech)', done: false, category: 'Care Team' },
    { id: '3', text: 'Bring comfortable clothes and walking shoes', done: false, category: 'Personal' },
    { id: '4', text: 'Review insurance coverage for rehab stay', done: false, category: 'Financial' },
    { id: '5', text: 'Set up home exercises for between sessions', done: false, category: 'Medical' },
    { id: '6', text: 'Plan for home modifications needed after discharge', done: false, category: 'Home Setup' },
    { id: '7', text: 'Coordinate with outpatient therapy for continuation', done: false, category: 'Medical' },
  ],
};

export async function createTransition(
  circleId: string,
  createdById: string,
  data: {
    type: TransitionType;
    fromLocation?: string;
    toLocation?: string;
    targetDate?: string;
    notes?: string;
  }
) {
  const defaultChecklist = DEFAULT_CHECKLISTS[data.type] || [];

  const transition = await prisma.careTransition.create({
    data: {
      circleId,
      createdById,
      type: data.type,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      notes: data.notes,
      checklistJson: JSON.stringify(defaultChecklist),
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const user = await prisma.user.findUnique({ where: { id: createdById }, select: { firstName: true } });
  const typeLabels: Record<string, string> = {
    HOSPITAL_TO_HOME: 'Hospital to Home',
    HOME_TO_FACILITY: 'Home to Facility',
    FACILITY_TO_HOME: 'Facility to Home',
    HOSPICE: 'Hospice',
    REHAB: 'Rehabilitation',
  };

  await notifyCircle(circleId, createdById, 'Care transition started', `${user?.firstName} created a ${typeLabels[data.type] || data.type} transition plan`, {
    type: 'TRANSITION_CREATED',
    circleId,
  });

  return transition;
}

export async function getTransitions(circleId: string, status?: TransitionStatus) {
  const where: any = { circleId };
  if (status) where.status = status;

  return prisma.careTransition.findMany({
    where,
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTransition(transitionId: string, circleId: string) {
  const transition = await prisma.careTransition.findFirst({
    where: { id: transitionId, circleId },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!transition) throw new AppError(404, 'not_found', 'Transition not found');
  return transition;
}

export async function updateTransition(
  transitionId: string,
  circleId: string,
  data: Partial<{
    status: TransitionStatus;
    fromLocation: string;
    toLocation: string;
    targetDate: string;
    notes: string;
    checklistJson: string;
  }>
) {
  const transition = await prisma.careTransition.findFirst({ where: { id: transitionId, circleId } });
  if (!transition) throw new AppError(404, 'not_found', 'Transition not found');

  const updateData: any = { ...data };
  if (data.targetDate) updateData.targetDate = new Date(data.targetDate);

  return prisma.careTransition.update({
    where: { id: transitionId },
    data: updateData,
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function deleteTransition(transitionId: string, circleId: string) {
  const transition = await prisma.careTransition.findFirst({ where: { id: transitionId, circleId } });
  if (!transition) throw new AppError(404, 'not_found', 'Transition not found');
  await prisma.careTransition.delete({ where: { id: transitionId } });
}
