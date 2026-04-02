import { SubscriptionTier, TIER_LIMITS, ProtocolType, DEFAULT_PROTOCOL_TEMPLATES } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';

export async function createProtocol(
  circleId: string,
  createdById: string,
  data: {
    type: ProtocolType;
    title?: string;
    stepsJson?: string;
    contactsJson?: string;
    goBagJson?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: createdById } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  const limit = TIER_LIMITS[tier].protocols;

  if (limit !== Infinity) {
    const count = await prisma.emergencyProtocol.count({ where: { circleId } });
    if (count >= limit) {
      throw new AppError(403, 'upgrade_required', `You've reached your ${tier} plan limit of ${limit} protocol(s). Upgrade for more.`);
    }
  }

  // Use default template if no steps provided
  const template = DEFAULT_PROTOCOL_TEMPLATES[data.type];
  const stepsJson = data.stepsJson || (template ? JSON.stringify(template.steps) : '[]');
  const title = data.title || (template ? template.title : `${data.type} Protocol`);

  return prisma.emergencyProtocol.create({
    data: {
      circleId,
      createdById,
      type: data.type,
      title,
      stepsJson,
      contactsJson: data.contactsJson,
      goBagJson: data.goBagJson,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getProtocols(circleId: string, type?: ProtocolType) {
  const where: any = { circleId, isActive: true };
  if (type) where.type = type;

  return prisma.emergencyProtocol.findMany({
    where,
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { type: 'asc' },
  });
}

export async function getProtocol(protocolId: string, circleId: string) {
  const protocol = await prisma.emergencyProtocol.findFirst({
    where: { id: protocolId, circleId },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!protocol) throw new AppError(404, 'not_found', 'Protocol not found');
  return protocol;
}

export async function updateProtocol(
  protocolId: string,
  circleId: string,
  data: Partial<{
    title: string;
    stepsJson: string;
    contactsJson: string;
    goBagJson: string;
    isActive: boolean;
  }>
) {
  const protocol = await prisma.emergencyProtocol.findFirst({ where: { id: protocolId, circleId } });
  if (!protocol) throw new AppError(404, 'not_found', 'Protocol not found');

  return prisma.emergencyProtocol.update({
    where: { id: protocolId },
    data,
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function deleteProtocol(protocolId: string, circleId: string) {
  const protocol = await prisma.emergencyProtocol.findFirst({ where: { id: protocolId, circleId } });
  if (!protocol) throw new AppError(404, 'not_found', 'Protocol not found');
  await prisma.emergencyProtocol.delete({ where: { id: protocolId } });
}

export async function getAvailableTemplates() {
  return Object.entries(DEFAULT_PROTOCOL_TEMPLATES).map(([type, template]) => ({
    type,
    title: template.title,
    stepCount: template.steps.length,
  }));
}
