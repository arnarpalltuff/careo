import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t))
    .map((t) => ({
      to: t,
      title,
      body,
      data,
      sound: 'default' as const,
      priority: 'high' as const,
    }));

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}
