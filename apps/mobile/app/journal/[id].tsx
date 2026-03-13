import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { colors } from '../../utils/colors';
import { useCircleStore } from '../../stores/circleStore';
import { journalService } from '../../services/journal';
import { formatDate } from '../../utils/formatDate';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

const moodEmojis: Record<string, string> = { GREAT: '😄', GOOD: '🙂', OKAY: '😐', LOW: '😟', BAD: '😢' };

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeCircleId } = useCircleStore();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCircleId) return;
    journalService.get(activeCircleId, id).then((data) => {
      setEntry(data.entry);
      setLoading(false);
    });
  }, []);

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!activeCircleId) return;
          await journalService.delete(activeCircleId, id);
          router.back();
        },
      },
    ]);
  };

  if (loading) return <Spinner />;
  if (!entry) return null;

  return (
    <>
      <Stack.Screen options={{ title: 'Health Update' }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.date}>{formatDate(entry.date)}</Text>
          {entry.mood && <Text style={styles.mood}>{moodEmojis[entry.mood]} {entry.mood}</Text>}
        </View>

        <View style={styles.metrics}>
          {entry.energy && <MetricRow label="Energy" value={`${entry.energy}/5`} />}
          {entry.pain !== null && entry.pain !== undefined && <MetricRow label="Pain" value={`${entry.pain}/10`} />}
          {entry.sleep && <MetricRow label="Sleep" value={entry.sleep} />}
          {entry.appetite && <MetricRow label="Appetite" value={entry.appetite} />}
        </View>

        <Text style={styles.notes}>{entry.notes}</Text>

        <View style={styles.author}>
          <Avatar name={`${entry.author.firstName} ${entry.author.lastName}`} uri={entry.author.avatarUrl} size={24} />
          <Text style={styles.authorName}>
            {entry.author.firstName} {entry.author.lastName}
          </Text>
        </View>

        <View style={{ height: 32 }} />
        <Button title="Delete Entry" variant="danger" onPress={handleDelete} />
        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  date: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
  mood: { fontSize: 16, color: colors.textSecondary },
  metrics: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  metricLabel: { fontSize: 15, color: colors.textSecondary },
  metricValue: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  notes: { fontSize: 16, lineHeight: 24, color: colors.textPrimary, marginBottom: 16 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorName: { fontSize: 14, color: colors.textSecondary },
});
