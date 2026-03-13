import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { useAuthStore } from '../../stores/authStore';
import { useCircleStore } from '../../stores/circleStore';
import { useCircle } from '../../hooks/useCircle';
import { useTasks } from '../../hooks/useTasks';
import { useMedications } from '../../hooks/useMedications';
import { useAppointments } from '../../hooks/useAppointments';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { EmergencyFAB } from '../../components/EmergencyFAB';
import { formatDate, formatTime } from '../../utils/formatDate';
import api from '../../services/api';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { circles, activeCircleId, setActiveCircle } = useCircleStore();
  const { fetchCircles, loading: circlesLoading } = useCircle();
  const { tasks, fetchTasks } = useTasks();
  const { medications, fetchMedications } = useMedications();
  const { appointments, fetchAppointments } = useAppointments();
  const [refreshing, setRefreshing] = useState(false);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    fetchCircles();
  }, []);

  useEffect(() => {
    if (activeCircleId) {
      fetchTasks({ status: 'PENDING' });
      fetchMedications();
      fetchAppointments({ status: 'UPCOMING' });
    }
  }, [activeCircleId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCircles();
    if (activeCircleId) {
      await Promise.all([
        fetchTasks({ status: 'PENDING' }),
        fetchMedications(),
        fetchAppointments({ status: 'UPCOMING' }),
      ]);
    }
    setRefreshing(false);
  };

  const handleEmergency = async () => {
    if (!activeCircleId) return;
    await api.post(`/circles/${activeCircleId}/emergency`, {});
  };

  const todayTasks = tasks.filter((t: any) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const today = new Date();
    return due.toDateString() === today.toDateString();
  });

  const nextMed = medications
    .flatMap((m: any) =>
      (m.schedules || []).map((s: any) => ({ ...s, medName: m.name, medDosage: m.dosage }))
    )
    .sort((a: any, b: any) => a.time.localeCompare(b.time))
    .find((s: any) => {
      const [h, m] = s.time.split(':').map(Number);
      const now = new Date();
      return h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
    });

  const nextAppt = appointments[0];
  const activeCircle = circles.find((c) => c.id === activeCircleId);

  if (circles.length === 0 && !circlesLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          title="Create your first Care Circle"
          message="Start by adding the person you're caring for"
          buttonTitle="Create Circle"
          onPress={() => router.push('/circle/create')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/more')}>
            <Avatar name={`${user?.firstName} ${user?.lastName}`} uri={user?.avatarUrl} size={36} />
          </TouchableOpacity>
          <Text style={styles.greeting}>{greeting()}, {user?.firstName}</Text>
        </View>

        {circles.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.circlePicker}>
            {circles.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.circlePill, c.id === activeCircleId && styles.circlePillActive]}
                onPress={() => setActiveCircle(c.id)}
              >
                <Text style={[styles.circlePillText, c.id === activeCircleId && styles.circlePillTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryRow}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
            <Card style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.summaryNumber}>{todayTasks.length}</Text>
              <Text style={styles.summaryLabel}>Today's Tasks</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(tabs)/health')}>
            <Card style={[styles.summaryCard, { backgroundColor: colors.primaryDark }]}>
              <Text style={styles.summaryNumber}>{nextMed ? formatTime(nextMed.time) : '—'}</Text>
              <Text style={styles.summaryLabel}>{nextMed ? nextMed.medName : 'No meds'}</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
            <Card style={[styles.summaryCard, { backgroundColor: '#5B8C85' }]}>
              <Text style={styles.summaryNumber}>{nextAppt ? formatDate(nextAppt.date) : '—'}</Text>
              <Text style={styles.summaryLabel}>{nextAppt ? nextAppt.title : 'No appointments'}</Text>
            </Card>
          </TouchableOpacity>
        </ScrollView>
      </ScrollView>

      {activeCircle && (
        <EmergencyFAB
          circleName={activeCircle.name}
          memberCount={activeCircle.memberCount}
          onAlert={handleEmergency}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  greeting: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  circlePicker: { paddingHorizontal: 16, marginBottom: 16 },
  circlePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  circlePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  circlePillText: { fontSize: 14, color: colors.textSecondary },
  circlePillTextActive: { color: '#fff', fontWeight: '600' },
  summaryRow: { paddingHorizontal: 16, marginBottom: 24 },
  summaryCard: { width: 160, marginRight: 12, padding: 20 },
  summaryNumber: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
});
