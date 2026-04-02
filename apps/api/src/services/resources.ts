import { SubscriptionTier, TIER_LIMITS, ResourceCategory } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';

export async function createResource(
  circleId: string,
  addedById: string,
  data: {
    title: string;
    description: string;
    category: ResourceCategory;
    url?: string;
    phone?: string;
    address?: string;
    rating?: number;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: addedById } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  const limit = TIER_LIMITS[tier].resources;

  if (limit !== Infinity) {
    const count = await prisma.resource.count({ where: { circleId } });
    if (count >= limit) {
      throw new AppError(403, 'upgrade_required', `You've reached your ${tier} plan limit of ${limit} resources. Upgrade for more.`);
    }
  }

  return prisma.resource.create({
    data: {
      circleId,
      addedById,
      title: data.title,
      description: data.description,
      category: data.category,
      url: data.url,
      phone: data.phone,
      address: data.address,
      rating: data.rating,
    },
    include: {
      addedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getResources(
  circleId: string,
  query: { category?: string; search?: string; page?: number; limit?: number }
) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    OR: [{ circleId }, { isGlobal: true }],
  };
  if (query.category) where.category = query.category;
  if (query.search) {
    where.AND = [
      {
        OR: [
          { title: { contains: query.search } },
          { description: { contains: query.search } },
        ],
      },
    ];
  }

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: {
        addedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.resource.count({ where }),
  ]);

  return { resources, total, page, limit };
}

export async function updateResource(
  resourceId: string,
  circleId: string,
  userId: string,
  userRole: string,
  data: Partial<{
    title: string;
    description: string;
    category: ResourceCategory;
    url: string;
    phone: string;
    address: string;
    rating: number;
  }>
) {
  const resource = await prisma.resource.findFirst({ where: { id: resourceId, circleId } });
  if (!resource) throw new AppError(404, 'not_found', 'Resource not found');
  if (userRole !== 'ADMIN' && resource.addedById !== userId) {
    throw new AppError(403, 'forbidden', 'Only admins or the resource creator can edit resources');
  }

  return prisma.resource.update({
    where: { id: resourceId },
    data,
    include: {
      addedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function deleteResource(resourceId: string, circleId: string, userId: string, userRole: string) {
  const resource = await prisma.resource.findFirst({ where: { id: resourceId, circleId } });
  if (!resource) throw new AppError(404, 'not_found', 'Resource not found');
  if (userRole !== 'ADMIN' && resource.addedById !== userId) {
    throw new AppError(403, 'forbidden', 'Only admins or the resource creator can delete resources');
  }
  await prisma.resource.delete({ where: { id: resourceId } });
}
