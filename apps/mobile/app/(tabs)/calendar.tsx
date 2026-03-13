import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { colors } from '../../utils/colors';
import { useAppointments } from '../../hooks/useAppointments';
import { AppointmentCard } from '../../components/AppointmentCard';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { appointments, loading, fetchAppointments } = useAppointments();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const markedDates: any = {};
  appointments.forEach((a: any) => {
    const date = format(new Date(a.date), 'yyyy-MM-dd');
    markedDates[date] = { marked: true, dotColor: colors.primary };
  });
  markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: colors.primary };

  const dayAppointments = appointments.filter(
    (a: any) => format(new Date(a.date), 'yyyy-MM-dd') === selectedDate
  );

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          arrowColor: colors.primary,
          textDayFontSize: 15,
          textMonthFontWeight: '600',
        }}
      />

      <View style={styles.listHeader}>
        <Text style={styles.dateLabel}>{format(new Date(selectedDate), 'EEEE, MMMM d')}</Text>
      </View>

      {dayAppointments.length === 0 ? (
        <Text style={styles.empty}>No appointments on this date</Text>
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

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/appointment/add')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  dateLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  empty: { textAlign: 'center', color: colors.textHint, fontSize: 14, padding: 32 },
  list: { paddingHorizontal: 16 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
