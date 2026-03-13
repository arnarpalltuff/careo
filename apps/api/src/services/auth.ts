import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { sendEmail } from '../utils/email';
import { AppError } from '../types';

export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError(409, 'email_taken', 'Email already registered');
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      subscriptionTier: true,
    },
  });

  const accessToken = signAccessToken(user.id, user.email);
  const refreshTokenValue = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { user, accessToken, refreshToken: refreshTokenValue };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'invalid_credentials', 'Invalid credentials');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'invalid_credentials', 'Invalid credentials');
  }

  const accessToken = signAccessToken(user.id, user.email);
  const refreshTokenValue = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscriptionTier: user.subscriptionTier,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken: refreshTokenValue,
  };
}

export async function refreshTokens(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'invalid_token', 'Invalid or expired refresh token');
  }

  // Token rotation: delete old token
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    throw new AppError(401, 'invalid_token', 'User not found');
  }

  const accessToken = signAccessToken(user.id, user.email);
  const newRefreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

export async function forgotPassword(email: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await hashPassword(code);

  await prisma.passwordReset.create({
    data: {
      email,
      codeHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  // Only send if user exists, but always return same response
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await sendEmail(
      email,
      'Your ElderLink reset code',
      `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`
    );
  }
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const reset = await prisma.passwordReset.findFirst({
    where: { email, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!reset) {
    throw new AppError(400, 'invalid_code', 'Invalid or expired code');
  }

  const valid = await comparePassword(code, reset.codeHash);
  if (!valid) {
    throw new AppError(400, 'invalid_code', 'Invalid or expired code');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
    prisma.refreshToken.deleteMany({
      where: { user: { email } },
    }),
  ]);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      timezone: true,
      subscriptionTier: true,
      stripeCustomerId: true,
      createdAt: true,
    },
  });
  if (!user) throw new AppError(404, 'not_found', 'User not found');
  return user;
}

export async function updateMe(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    timezone?: string;
    avatarUrl?: string;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      timezone: true,
      subscriptionTier: true,
      createdAt: true,
    },
  });
}

export async function savePushToken(userId: string, pushToken: string) {
  await prisma.user.update({ where: { id: userId }, data: { pushToken } });
}
