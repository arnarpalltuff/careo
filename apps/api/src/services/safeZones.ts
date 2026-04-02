import { SubscriptionTier, TIER_LIMITS } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';
import { notifyCircle } from './notifications';

// Haversine distance in meters between two lat/lng points
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function createSafeZone(
  circleId: string,
  userId: string,
  data: {
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    notifyOnExit?: boolean;
    notifyOnEntry?: boolean;
  }
) {
  // Check subscription tier limit
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = (user?.subscriptionTier || 'FREE') as SubscriptionTier;
  const limit = TIER_LIMITS[tier].safeZones;
  if (limit !== Infinity) {
    const count = await prisma.safeZone.count({
      where: { circleId, isActive: true },
    });
    if (count >= limit) {
      throw new AppError(
        403,
        'upgrade_required',
        `You've reached your ${tier} plan limit of ${limit} safe zones. Upgrade to add more.`
      );
    }
  }

  return prisma.safeZone.create({
    data: {
      circleId,
      createdById: userId,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      radiusMeters: data.radiusMeters,
      notifyOnExit: data.notifyOnExit ?? true,
      notifyOnEntry: data.notifyOnEntry ?? false,
    },
  });
}

export async function getSafeZones(circleId: string) {
  return prisma.safeZone.findMany({
    where: { circleId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateSafeZone(
  zoneId: string,
  userId: string,
  data: {
    name?: string;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    notifyOnExit?: boolean;
    notifyOnEntry?: boolean;
  }
) {
  const zone = await prisma.safeZone.findFirst({
    where: { id: zoneId, isActive: true },
  });
  if (!zone) throw new AppError(404, 'not_found', 'Safe zone not found');

  return prisma.safeZone.update({
    where: { id: zoneId },
    data,
  });
}

export async function deleteSafeZone(zoneId: string, userId: string) {
  const zone = await prisma.safeZone.findFirst({
    where: { id: zoneId, isActive: true },
  });
  if (!zone) throw new AppError(404, 'not_found', 'Safe zone not found');

  await prisma.safeZone.update({
    where: { id: zoneId },
    data: { isActive: false },
  });
}

export async function updateLocation(
  circleId: string,
  userId: string,
  data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    battery?: number;
  }
) {
  // Get the user's previous location to determine entry/exit
  const previousLocation = await prisma.locationUpdate.findFirst({
    where: { circleId, userId },
    orderBy: { recordedAt: 'desc' },
  });

  // Store the new location
  const location = await prisma.locationUpdate.create({
    data: {
      circleId,
      userId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      battery: data.battery,
    },
  });

  // Check against all active safe zones
  const zones = await prisma.safeZone.findMany({
    where: { circleId, isActive: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });
  const userName = user?.firstName || 'A member';

  for (const zone of zones) {
    const currentDistance = haversineDistance(
      data.latitude,
      data.longitude,
      zone.latitude,
      zone.longitude
    );
    const isInsideNow = currentDistance <= zone.radiusMeters;

    if (previousLocation) {
      const previousDistance = haversineDistance(
        previousLocation.latitude,
        previousLocation.longitude,
        zone.latitude,
        zone.longitude
      );
      const wasInside = previousDistance <= zone.radiusMeters;

      // Exited the zone
      if (wasInside && !isInsideNow && zone.notifyOnExit) {
        await notifyCircle(
          circleId,
          userId,
          `${userName} left safe zone`,
          `${userName} has left the "${zone.name}" safe zone.`,
          { type: 'SAFE_ZONE_EXIT', circleId, zoneId: zone.id }
        );
      }

      // Entered the zone
      if (!wasInside && isInsideNow && zone.notifyOnEntry) {
        await notifyCircle(
          circleId,
          userId,
          `${userName} entered safe zone`,
          `${userName} has entered the "${zone.name}" safe zone.`,
          { type: 'SAFE_ZONE_ENTRY', circleId, zoneId: zone.id }
        );
      }
    }
  }

  return location;
}

export async function getLocationHistory(
  circleId: string,
  userId?: string,
  hours: number = 24
) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const where: any = { circleId, recordedAt: { gte: since } };
  if (userId) where.userId = userId;

  return prisma.locationUpdate.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
  });
}

export async function getLatestLocations(circleId: string) {
  const members = await prisma.circleMember.findMany({
    where: { circleId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  const locations = [];
  for (const member of members) {
    const latest = await prisma.locationUpdate.findFirst({
      where: { circleId, userId: member.userId },
      orderBy: { recordedAt: 'desc' },
    });
    locations.push({
      user: member.user,
      location: latest
        ? {
            latitude: latest.latitude,
            longitude: latest.longitude,
            accuracy: latest.accuracy,
            battery: latest.battery,
            recordedAt: latest.recordedAt,
          }
        : null,
    });
  }

  return locations;
}
