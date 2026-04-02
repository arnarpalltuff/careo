import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { CrossHatch, RadialRings, TopoLines } from '../components/Texture';
import {
  requestNotificationPermissions,
  getPermissionStatus,
  getNotificationPreferences,
  saveNotificationPreferences,
  scheduleWeeklyWellnessCheck,
  cancelNotificationsByType,
  NotificationPreferences,
} from '../services/notifications';

const PUSH_SETTINGS = [
  {
    key: 'medicationReminders' as const,
    emoji: '💊',
    title: 'Medication reminders',
    subtitle: 'Get reminded when it\'s time to take medications',
    bg: colors.tintMed,
  },
  {
    key: 'appointmentReminders' as const,
    emoji: '🩺',
    title: 'Appointment alerts',
    subtitle: '24 hours and 1 hour before appointments',
    bg: colors.tintAppt,
  },
  {
    key: 'taskAssigned' as const,
    emoji: '✓',
    title: 'Task assignments',
    subtitle: 'When a task is assigned to you or completed',
    bg: colors.tintTask,
  },
  {
    key: 'wellnessCheckWeekly' as const,
    emoji: '🧘',
    title: 'Weekly wellness check',
    subtitle: 'Sunday morning reminder to check in with yourself',
    bg: colors.tintJournal,
  },
  {
    key: 'helpBoardUpdates' as const,
    emoji: '🙋',
    title: 'Help board updates',
    subtitle: 'When someone posts or claims a help request',
    bg: colors.tintMed,
  },
];

const EMAIL_SETTINGS = [
  {
    key: 'emailWeeklyDigest' as const,
    emoji: '📧',
    title: 'Weekly care digest',
    subtitle: 'Summary of medications, tasks, and activity sent every Monday',
    bg: colors.tintAppt,
  },
  {
    key: 'emailMedicationAlerts' as const,
    emoji: '💊',
    title: 'Missed medication alerts',
    subtitle: 'Email when a medication dose is missed',
    bg: colors.tintMed,
  },
  {
    key: 'emailAppointmentReminders' as const,
    emoji: '📅',
    title: 'Appointment reminders',
    subtitle: 'Email reminder 24 hours before appointments',
    bg: colors.tintJournal,
  },
];

export default function NotificationSettingsScreen() {
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    const status = await getPermissionStatus();
    setPermissionStatus(status);
    const p = await getNotificationPreferences();
    setPrefs(p);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermissions();
    if (granted) {
      setPermissionStatus('granted');
      // Schedule default wellness check
      if (prefs?.wellnessCheckWeekly) {
        await scheduleWeeklyWellnessCheck();
      }
    } else {
      Alert.alert(
        'Notifications Disabled',
        'To enable notifications, go to your device Settings and allow notifications for Careo.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const updated = await saveNotificationPreferences({ [key]: value });
    setPrefs(updated);

    // Handle wellness check scheduling
    if (key === 'wellnessCheckWeekly') {
      if (value) {
        await scheduleWeeklyWellnessCheck();
      } else {
        await cancelNotificationsByType('wellness');
      }
    }
  };

  return (
    <View style={styles.root}>
      <TopoLines color="#1B6B5F" opacity={0.02} variant="wide" />
      {/* Hero */}
      <View style={styles.hero}>
        <CrossHatch color="#fff" opacity={0.04} />
        <RadialRings color="#fff" opacity={0.05} cx={320} cy={40} />
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heroEmoji}>🔔</Text>
        <Text style={styles.heroTitle}>Notifications</Text>
        <Text style={styles.heroSub}>Stay on top of what matters</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Permission Banner */}
        {permissionStatus !== 'granted' && (
          <TouchableOpacity style={styles.permBanner} onPress={handleEnableNotifications} accessibilityRole="button" accessibilityLabel="Enable notifications">
            <View style={styles.permLeft}>
              <Text style={styles.permEmoji}>🔕</Text>
              <View style={styles.permText}>
                <Text style={styles.permTitle}>Notifications are off</Text>
                <Text style={styles.permSub}>Tap to enable and never miss a reminder</Text>
              </View>
            </View>
            <View style={styles.permArrow}>
              <Text style={styles.permArrowText}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Push Notifications */}
        <Text style={styles.sectionLabel}>PUSH NOTIFICATIONS</Text>
        <View style={styles.card}>
          {prefs && PUSH_SETTINGS.map((setting, i) => (
            <View
              key={setting.key}
              style={[styles.row, i < PUSH_SETTINGS.length - 1 && styles.rowBorder]}
            >
              <View style={[styles.iconWrap, { backgroundColor: setting.bg }]}>
                <Text style={styles.icon}>{setting.emoji}</Text>
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.title}>{setting.title}</Text>
                <Text style={styles.subtitle}>{setting.subtitle}</Text>
              </View>
              <Switch
                value={prefs[setting.key]}
                onValueChange={(v) => handleToggle(setting.key, v)}
                trackColor={{ false: colors.divider, true: colors.primaryLight }}
                thumbColor={prefs[setting.key] ? colors.primary : '#f4f3f4'}
                disabled={permissionStatus !== 'granted'}
                accessibilityRole="switch"
                accessibilityLabel={setting.title}
              />
            </View>
          ))}
        </View>

        {permissionStatus === 'granted' && (
          <Text style={styles.hint}>
            Notifications are managed on your device. You can also adjust them in your device Settings.
          </Text>
        )}

        {/* Email Notifications */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>EMAIL NOTIFICATIONS</Text>
        <View style={styles.card}>
          {prefs && EMAIL_SETTINGS.map((setting, i) => (
            <View
              key={setting.key}
              style={[styles.row, i < EMAIL_SETTINGS.length - 1 && styles.rowBorder]}
            >
              <View style={[styles.iconWrap, { backgroundColor: setting.bg }]}>
                <Text style={styles.icon}>{setting.emoji}</Text>
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.title}>{setting.title}</Text>
                <Text style={styles.subtitle}>{setting.subtitle}</Text>
              </View>
              <Switch
                value={prefs[setting.key]}
                onValueChange={(v) => handleToggle(setting.key, v)}
                trackColor={{ false: colors.divider, true: colors.primaryLight }}
                thumbColor={prefs[setting.key] ? colors.primary : '#f4f3f4'}
                accessibilityRole="switch"
                accessibilityLabel={setting.title}
              />
            </View>
          ))}
        </View>
        <Text style={styles.hint}>
          Emails are sent to your account email address. You can unsubscribe at any time.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.heroStart,
    paddingTop: Platform.OS === 'web' ? 48 : 60,
    paddingBottom: 24,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'web' ? 48 : 60,
  },
  backText: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.8)' },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: { ...typography.displayMedium, color: '#fff' },
  heroSub: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  scroll: { flex: 1, paddingTop: 20 },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1.5,
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 22,
    marginBottom: 10,
  },

  permBanner: {
    marginHorizontal: 18,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: colors.tintEmergency,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  permLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  permEmoji: { fontSize: 28 },
  permText: { flex: 1 },
  permTitle: { ...typography.headingSmall, color: colors.danger },
  permSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  permArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permArrowText: { fontSize: 18, color: '#fff', fontWeight: '600' },

  card: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  textWrap: { flex: 1 },
  title: { ...typography.headingSmall, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
  hint: {
    ...typography.bodySmall,
    color: colors.textHint,
    textAlign: 'center',
    marginHorizontal: 18,
    marginTop: 20,
  },
});
