import { CircleRole } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { sendEmail } from '../utils/email';
import { AppError } from '../types';
import { notifyCircle } from './notifications';

export async function createCircle(
  userId: string,
  data: { name: string; careRecipient: string; recipientDob?: string }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'not_found', 'User not found');

  const adminCircleCount = await prisma.circleMember.count({
    where: { userId, role: 'ADMIN' },
  });
  const limit = user.subscriptionTier === 'FAMILY' ? 5 : 1;
  if (adminCircleCount >= limit) {
    throw new AppError(403, 'upgrade_required', `Upgrade to Family to create more circles. Limit: ${limit}`);
  }

  const circle = await prisma.careCircle.create({
    data: {
      name: data.name,
      careRecipient: data.careRecipient,
      recipientDob: data.recipientDob ? new Date(data.recipientDob) : undefined,
      members: {
        create: { userId, role: 'ADMIN' },
      },
    },
    include: {
      members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } } },
    },
  });

  return circle;
}

export async function getUserCircles(userId: string) {
  const memberships = await prisma.circleMember.findMany({
    where: { userId },
    include: {
      circle: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  });

  return memberships.map((m) => ({
    ...m.circle,
    memberCount: m.circle._count.members,
    myRole: m.role,
  }));
}

export async function getCircleDetail(circleId: string) {
  const circle = await prisma.careCircle.findUnique({
    where: { id: circleId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });
  if (!circle) throw new AppError(404, 'not_found', 'Circle not found');
  return circle;
}

export async function updateCircle(
  circleId: string,
  data: { name?: string; careRecipient?: string; recipientDob?: string; recipientPhoto?: string }
) {
  return prisma.careCircle.update({
    where: { id: circleId },
    data: {
      ...data,
      recipientDob: data.recipientDob ? new Date(data.recipientDob) : undefined,
    },
  });
}

export async function deleteCircle(circleId: string) {
  await prisma.careCircle.delete({ where: { id: circleId } });
}

export async function inviteMember(
  circleId: string,
  inviterUserId: string,
  data: { email: string; role?: CircleRole }
) {
  const circle = await prisma.careCircle.findUnique({
    where: { id: circleId },
    include: { _count: { select: { members: true } } },
  });
  if (!circle) throw new AppError(404, 'not_found', 'Circle not found');

  // Check member limit
  const inviter = await prisma.user.findUnique({ where: { id: inviterUserId } });
  const memberLimit = inviter?.subscriptionTier === 'FAMILY' ? 15 : 3;
  if (circle._count.members >= memberLimit) {
    throw new AppError(403, 'upgrade_required', `Member limit reached. Limit: ${memberLimit}`);
  }

  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    const existingMember = await prisma.circleMember.findUnique({
      where: { userId_circleId: { userId: existingUser.id, circleId } },
    });
    if (existingMember) {
      throw new AppError(409, 'already_member', 'This user is already a member of the circle');
    }
  }

  const invite = await prisma.circleInvite.create({
    data: {
      circleId,
      email: data.email,
      role: data.role || 'MEMBER',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const appUrl = process.env.APP_URL || 'https://elderlink.app';
  await sendEmail(
    data.email,
    `You're invited to ${circle.name} on ElderLink`,
    `<p>You've been invited to join <strong>${circle.name}</strong> on ElderLink.</p>
     <p><a href="${appUrl}/circles/join/${invite.token}">Click here to join</a></p>
     <p>This invitation expires in 7 days.</p>`
  );

  return invite;
}

export async function joinCircle(token: string, userId: string) {
  const invite = await prisma.circleInvite.findUnique({ where: { token } });
  if (!invite) throw new AppError(404, 'not_found', 'Invitation not found');
  if (invite.expiresAt < new Date()) throw new AppError(410, 'expired', 'Invitation has expired');
  if (invite.accepted) throw new AppError(409, 'already_used', 'Invitation already used');

  const existing = await prisma.circleMember.findUnique({
    where: { userId_circleId: { userId, circleId: invite.circleId } },
  });
  if (existing) throw new AppError(409, 'already_member', 'You are already a member of this circle');

  const [member, , circle] = await prisma.$transaction([
    prisma.circleMember.create({
      data: { userId, circleId: invite.circleId, role: invite.role },
    }),
    prisma.circleInvite.update({ where: { id: invite.id }, data: { accepted: true } }),
    prisma.careCircle.findUnique({ where: { id: invite.circleId } }),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });

  if (circle && user) {
    await notifyCircle(
      invite.circleId,
      userId,
      'New member',
      `${user.firstName} joined ${circle.name}`,
      { type: 'MEMBER_JOINED', circleId: invite.circleId }
    );
  }

  return prisma.careCircle.findUnique({
    where: { id: invite.circleId },
    include: {
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
      },
    },
  });
}

export async function updateMemberRole(circleId: string, memberId: string, role: CircleRole) {
  return prisma.circleMember.update({
    where: { id: memberId, circleId },
    data: { role },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
    },
  });
}

export async function removeMember(circleId: string, memberId: string, requesterId: string) {
  const member = await prisma.circleMember.findUnique({ where: { id: memberId } });
  if (!member) throw new AppError(404, 'not_found', 'Member not found');

  // Prevent last admin from leaving
  if (member.role === 'ADMIN') {
    const adminCount = await prisma.circleMember.count({
      where: { circleId, role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      throw new AppError(400, 'last_admin', 'Cannot remove the last admin. Transfer admin role first.');
    }
  }

  await prisma.circleMember.delete({ where: { id: memberId } });
}
