import pino from 'pino';
import { prisma } from '../utils/prisma';
import { sendPush } from '../utils/push';

const logger = pino({ name: 'notifications' });

export async function notifyCircle(
  circleId: string,
  excludeUserId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const members = await prisma.circleMember.findMany({
      where: { circleId },
      include: { user: { select: { pushToken: true } } },
    });

    const tokens = members
      .filter((m) => m.userId !== excludeUserId && m.user.pushToken)
      .map((m) => m.user.pushToken!);

    if (tokens.length > 0) {
      await sendPush(tokens, title, body, data);
    }
  } catch (error) {
    logger.error({ error, circleId }, 'Failed to send circle notification');
  }
}

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });

    if (user?.pushToken) {
      await sendPush([user.pushToken], title, body, data);
    }
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send user notification');
  }
}
