import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Configuration ──────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Types ──────────────────────────────────────────────────────────
export interface NotificationPreferences {
  medicationReminders: boolean;
  appointmentReminders: boolean;
  taskAssigned: boolean;
  wellnessCheckWeekly: boolean;
  helpBoardUpdates: boolean;
  emailWeeklyDigest: boolean;
  emailMedicationAlerts: boolean;
  emailAppointmentReminders: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  medicationReminders: true,
  appointmentReminders: true,
  taskAssigned: true,
  wellnessCheckWeekly: true,
  helpBoardUpdates: true,
  emailWeeklyDigest: true,
  emailMedicationAlerts: false,
  emailAppointmentReminders: true,
};

const PREFS_KEY = 'notificationPreferences';

// ─── Permission Handling ────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getPermissionStatus(): Promise<string> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// ─── Preferences ────────────────────────────────────────────────────
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const stored = await AsyncStorage.getItem(PREFS_KEY);
  if (stored) {
    return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  }
  return DEFAULT_PREFS;
}

export async function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  return updated;
}

// ─── Schedule Medication Reminder ───────────────────────────────────
export async function scheduleMedicationReminder(params: {
  medicationId: string;
  medicationName: string;
  dosage: string;
  hour: number;
  minute: number;
}): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Medication Reminder',
      body: `Time to take ${params.medicationName} (${params.dosage})`,
      data: { type: 'medication', medicationId: params.medicationId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: params.hour,
      minute: params.minute,
    },
  });
  return id;
}

// ─── Schedule Appointment Reminder ──────────────────────────────────
export async function scheduleAppointmentReminder(params: {
  appointmentId: string;
  title: string;
  location: string;
  date: Date;
  reminderMinutesBefore: number;
}): Promise<string> {
  const reminderDate = new Date(
    params.date.getTime() - params.reminderMinutesBefore * 60 * 1000
  );

  // Don't schedule if reminder time has passed
  if (reminderDate <= new Date()) return '';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🩺 Appointment Coming Up',
      body: `${params.title} at ${params.location} in ${params.reminderMinutesBefore} minutes`,
      data: { type: 'appointment', appointmentId: params.appointmentId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
  return id;
}

// ─── Schedule Weekly Wellness Check ─────────────────────────────────
export async function scheduleWeeklyWellnessCheck(): Promise<string> {
  // Cancel existing wellness notifications first
  await cancelNotificationsByType('wellness');

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧘 Weekly Wellness Check',
      body: 'How are you really doing? Take a moment to check in with yourself.',
      data: { type: 'wellness' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 10,
      minute: 0,
    },
  });
  return id;
}

// ─── Send Immediate Notification ────────────────────────────────────
export async function sendLocalNotification(params: {
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data,
      sound: true,
    },
    trigger: null, // Immediate
  });
  return id;
}

// ─── Cancel Notifications ───────────────────────────────────────────
export async function cancelNotificationsByType(type: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

// ─── Get Scheduled Notifications ────────────────────────────────────
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

// ─── Listener Setup ─────────────────────────────────────────────────
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
