import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
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

  const [error, setError] = useState(false);

  useEffect(() => {
    if (!activeCircleId) return;
    journalService
      .get(activeCircleId, id)
      .then((data) => {
        setEntry(data.entry);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
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
  if (error || !entry) return (
    <View style={styles.container}>
      <Text style={styles.emptyText}>
        {error ? 'Failed to load entry.' : 'Entry not found.'}
      </Text>
    </View>
  );

  const moodColors: Record<string, string> = {
    GREAT: '#E7F9EE', GOOD: '#EEF8F6', OKAY: '#FFF8EB', LOW: '#FFF1EE', BAD: '#FEE2E2',
  };
  const painColor = (entry.pain || 0) <= 3 ? colors.success : (entry.pain || 0) <= 6 ? '#F0AD4E' : colors.danger;

  return (
    <>
      <Stack.Screen options={{ title: 'Health Update' }} />
      <ScrollView style={styles.container}>
        {/* Mood header */}
        <View style={[styles.moodCard, { backgroundColor: moodColors[entry.mood] || colors.tintJournal }]}>
          {entry.mood && <Text style={styles.moodEmoji}>{moodEmojis[entry.mood]}</Text>}
          <Text style={styles.date}>{formatDate(entry.date)}</Text>
          {entry.mood && <Text style={styles.moodLabel}>{entry.mood.charAt(0) + entry.mood.slice(1).toLowerCase()}</Text>}
        </View>

        {/* Metrics grid */}
        <View style={styles.metricsGrid}>
          {entry.energy && (
            <View style={styles.metricCard}>
              <Text style={styles.metricEmoji}>🔋</Text>
              <Text style={styles.metricValue}>{entry.energy}/5</Text>
              <Text style={styles.metricLabel}>Energy</Text>
            </View>
          )}
          {entry.pain !== null && entry.pain !== undefined && (
            <View style={styles.metricCard}>
              <Text style={styles.metricEmoji}>💢</Text>
              <Text style={[styles.metricValue, { color: painColor }]}>{entry.pain}/10</Text>
              <Text style={styles.metricLabel}>Pain</Text>
            </View>
          )}
          {entry.sleep && (
            <View style={styles.metricCard}>
              <Text style={styles.metricEmoji}>😴</Text>
              <Text style={styles.metricValue}>{entry.sleep}</Text>
              <Text style={styles.metricLabel}>Sleep</Text>
            </View>
          )}
          {entry.appetite && (
            <View style={styles.metricCard}>
              <Text style={styles.metricEmoji}>🍽</Text>
              <Text style={styles.metricValue}>{entry.appetite}</Text>
              <Text style={styles.metricLabel}>Appetite</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>NOTES</Text>
          <Text style={styles.notes}>{entry.notes}</Text>
        </View>

        {/* Author */}
        <View style={styles.authorCard}>
          <Avatar name={`${entry.author.firstName} ${entry.author.lastName}`} uri={entry.author.avatarUrl} size={28} />
          <View>
            <Text style={styles.authorName}>{entry.author.firstName} {entry.author.lastName}</Text>
            <Text style={styles.authorHint}>Recorded this update</Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
        <Button title="Delete Entry" variant="danger" onPress={handleDelete} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 18 },
  emptyText: { ...typography.labelMedium, color: colors.textHint, textAlign: 'center', paddingVertical: 24 },
  moodCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  moodEmoji: { fontSize: 48, marginBottom: 8 },
  date: { ...typography.headingLarge, color: colors.textPrimary },
  moodLabel: { ...typography.labelMedium, color: colors.textSecondary, marginTop: 4 },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  metricEmoji: { fontSize: 22, marginBottom: 6 },
  metricValue: { ...typography.headingMedium, color: colors.textPrimary },
  metricLabel: { ...typography.labelSmall, color: colors.textHint, marginTop: 2 },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  notesLabel: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1.5, fontWeight: '700', fontSize: 11, marginBottom: 10 },
  notes: { ...typography.bodyLarge, color: colors.textPrimary, lineHeight: 26 },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  authorName: { ...typography.headingSmall, color: colors.textPrimary },
  authorHint: { ...typography.labelSmall, color: colors.textHint, marginTop: 1 },
});
