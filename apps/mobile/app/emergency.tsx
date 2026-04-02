import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Platform, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useCircleStore } from '../stores/circleStore';
import { formatRelative } from '../utils/formatDate';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmModal } from '../components/ui/Modal';
import api from '../services/api';

export default function EmergencyScreen() {
  const { activeCircleId, getActiveCircle } = useCircleStore();
  const activeCircle = getActiveCircle();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    if (!activeCircleId) return;
    try {
      const { data } = await api.get(`/circles/${activeCircleId}/emergency`);
      setAlerts(data.alerts);
    } catch {
      // Silently fail on load — alerts will show empty state
    }
  };

  const handleSend = async () => {
    if (!activeCircleId) return;
    setLoading(true);
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      if (Platform.OS !== 'web') {
        try {
          const Location = require('expo-location');
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            latitude = loc.coords.latitude;
            longitude = loc.coords.longitude;
          }
        } catch {}
      }

      await api.post(`/circles/${activeCircleId}/emergency`, { latitude, longitude });
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSent(true);
      loadAlerts();
    } catch {
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'Failed to send emergency alert. Please try again or call 911 directly.');
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Emergency' }} />
      <View style={styles.container}>
        <View style={styles.center}>
          {sent ? (
            <>
              <Text style={styles.sentIcon}>✓</Text>
              <Text style={styles.sentText}>Alert sent to {activeCircle?.memberCount} members</Text>
              <TouchableOpacity onPress={() => setSent(false)} style={styles.resetBtn}>
                <Text style={styles.resetText}>Done</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    const Haptics = require('expo-haptics');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  }
                  setShowModal(true);
                }}
                activeOpacity={0.8}
                accessibilityLabel="Send emergency alert"
                accessibilityRole="button"
              >
                <Text style={styles.alertIcon}>!</Text>
              </TouchableOpacity>
              <Text style={styles.alertLabel}>SEND ALERT</Text>
              <Text style={styles.alertDesc}>
                This will immediately notify all members of {activeCircle?.name || 'your circle'}
              </Text>
            </>
          )}
        </View>

        {/* Quick call buttons */}
        <View style={styles.callSection}>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL('tel:911')}
            activeOpacity={0.7}
          >
            <Text style={styles.callEmoji}>📞</Text>
            <Text style={styles.callLabel}>Call 911</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL('tel:988')}
            activeOpacity={0.7}
          >
            <Text style={styles.callEmoji}>🆘</Text>
            <Text style={styles.callLabel}>Crisis Line (988)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL('tel:211')}
            activeOpacity={0.7}
          >
            <Text style={styles.callEmoji}>ℹ️</Text>
            <Text style={styles.callLabel}>Social Services (211)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent Alerts</Text>
          <FlatList
            data={alerts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.alertRow}>
                <Avatar name={`${item.sender.firstName} ${item.sender.lastName}`} uri={item.sender.avatarUrl} size={32} />
                <View style={styles.alertInfo}>
                  <Text style={styles.alertSender}>{item.sender.firstName} {item.sender.lastName}</Text>
                  <Text style={styles.alertTime}>{formatRelative(item.createdAt)}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No recent alerts</Text>}
          />
        </View>

        <ConfirmModal
          visible={showModal}
          title="Send Emergency Alert"
          message={`Are you sure? This will send an emergency push notification to ${activeCircle?.memberCount || 0} people.`}
          confirmText="Send Alert"
          confirmVariant="danger"
          onCancel={() => setShowModal(false)}
          onConfirm={handleSend}
          loading={loading}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  alertButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  alertIcon: { color: '#fff', fontSize: 56, fontWeight: '800' },
  alertLabel: { ...typography.headingLarge, color: colors.danger, marginTop: 20 },
  alertDesc: { ...typography.bodyMedium, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  sentIcon: { fontSize: 64, color: colors.success, marginBottom: 16 },
  sentText: { ...typography.headingMedium, color: colors.textPrimary },
  resetBtn: { marginTop: 24 },
  resetText: { ...typography.button, color: colors.primary },
  callSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  callEmoji: { fontSize: 22, marginBottom: 4 },
  callLabel: { ...typography.labelSmall, color: colors.textSecondary, textAlign: 'center' },

  historySection: { flex: 1, paddingHorizontal: 16 },
  historyTitle: { ...typography.headingMedium, color: colors.textPrimary, marginBottom: 12 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  alertInfo: { flex: 1 },
  alertSender: { ...typography.headingSmall, color: colors.textPrimary },
  alertTime: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
  emptyText: { ...typography.labelMedium, color: colors.textHint, textAlign: 'center', paddingVertical: 24 },
});
