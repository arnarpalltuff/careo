import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { format, isToday, isTomorrow, addDays, isWithinInterval } from 'date-fns';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useAppointments } from '../../hooks/useAppointments';
import { AppointmentCard } from '../../components/AppointmentCard';

const STATUS_DOT: Record<string, string> = {
  UPCOMING: colors.primary,
  COMPLETED: colors.success,
  CANCELLED: colors.textHint,
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { appointments, loading, fetchAppointments } = useAppointments();

  useEffect(() => { fetchAppointments(); }, []);

  // Marked dates with status-colored dots
  const markedDates: any = {};
  appointments.forEach((a: any) => {
    const date = format(new Date(a.date), 'yyyy-MM-dd');
    const dotColor = STATUS_DOT[a.status] || colors.primary;
    if (markedDates[date]?.dots) {
      const existing = markedDates[date].dots;
      if (!existing.find((d: any) => d.color === dotColor)) {
        existing.push({ key: a.id, color: dotColor });
      }
    } else {
      markedDates[date] = { dots: [{ key: a.id, color: dotColor }] };
    }
  });
  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: colors.primary,
  };

  const dayAppointments = appointments
    .filter((a: any) => format(new Date(a.date), 'yyyy-MM-dd') === selectedDate)
    .sort((a: any, b: any) => a.time.localeCompare(b.time));

  // Upcoming 7 days count
  const now = new Date();
  const weekEnd = addDays(now, 7);
  const upcomingCount = appointments.filter((a: any) =>
    a.status === 'UPCOMING' && isWithinInterval(new Date(a.date), { start: now, end: weekEnd })
  ).length;

  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const dateLabel = isToday(selectedDateObj) ? 'Today'
    : isTomorrow(selectedDateObj) ? 'Tomorrow'
    : format(selectedDateObj, 'EEEE, MMMM d');

  return (
    <View style={styles.root}>
      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{upcomingCount}</Text>
          <Text style={styles.summaryLabel}>This week</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{dayAppointments.length}</Text>
          <Text style={styles.summaryLabel}>{isToday(selectedDateObj) ? 'Today' : 'Selected'}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{appointments.filter((a: any) => a.status === 'UPCOMING').length}</Text>
          <Text style={styles.summaryLabel}>Total upcoming</Text>
        </View>
      </View>

      <View style={styles.calendarWrap}>
        <Calendar
          current={selectedDate}
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={{
            todayTextColor: colors.accent,
            selectedDayBackgroundColor: colors.primary,
            arrowColor: colors.primary,
            textDayFontFamily: 'Inter_400Regular',
            textMonthFontFamily: 'Inter_600SemiBold',
            textDayHeaderFontFamily: 'Inter_500Medium',
            textDayFontSize: 15,
            textMonthFontSize: 17,
            textDayHeaderFontSize: 12,
            textMonthFontWeight: '700',
            calendarBackground: '#fff',
            monthTextColor: colors.textPrimary,
            dayTextColor: colors.textPrimary,
            textDisabledColor: colors.textHint,
            selectedDayTextColor: '#fff',
          }}
          style={styles.calendar}
        />
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        <TouchableOpacity style={styles.addPill} onPress={() => router.push('/appointment/add')} accessibilityRole="button" accessibilityLabel="Add appointment">
          <Text style={styles.addPillText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {dayAppointments.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>No appointments</Text>
          <Text style={styles.emptyHint}>Tap + to schedule one</Text>
        </View>
      ) : (
        <FlatList
          data={dayAppointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AppointmentCard appointment={item} onPress={() => router.push(`/appointment/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchAppointments()} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  summaryStrip: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNumber: { ...typography.headingMedium, color: colors.primary },
  summaryLabel: { ...typography.labelSmall, color: colors.textHint, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.divider, marginVertical: 2 },

  calendarWrap: {
    marginHorizontal: 14,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  calendar: {
    borderRadius: 20,
    paddingBottom: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  dateLabel: {
    ...typography.headingMedium,
    color: colors.textPrimary,
  },
  addPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  addPillText: {
    ...typography.labelSmall,
    color: '#fff',
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 36,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10, opacity: 0.5 },
  emptyText: { ...typography.headingSmall, color: colors.textSecondary },
  emptyHint: { ...typography.bodySmall, color: colors.textHint, marginTop: 4 },
  list: { paddingHorizontal: 18 },
});
