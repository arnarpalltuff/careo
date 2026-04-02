import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { formatDate } from '../utils/formatDate';
import { Avatar } from './ui/Avatar';

const moodEmojis: Record<string, string> = {
  GREAT: '😄', GOOD: '🙂', OKAY: '😐', LOW: '😟', BAD: '😢',
};

const moodColors: Record<string, string> = {
  GREAT: '#E7F9EE', GOOD: '#EEF8F6', OKAY: '#FFF8EB', LOW: '#FFF1EE', BAD: '#FEE2E2',
};

interface JournalCardProps {
  entry: any;
  onPress: () => void;
}

export function JournalCard({ entry, onPress }: JournalCardProps) {
  const borderColor = entry.mood === 'BAD' || entry.mood === 'LOW'
    ? colors.danger
    : entry.mood === 'GREAT' || entry.mood === 'GOOD'
    ? colors.success
    : colors.gold;

  return (
    <TouchableOpacity style={[styles.container, { borderLeftColor: borderColor }]} onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`Journal entry from ${entry.author.firstName} on ${entry.date}`}>
      <View style={styles.header}>
        <View style={styles.dateRow}>
          {entry.mood && (
            <View style={[styles.moodBubble, { backgroundColor: moodColors[entry.mood] || colors.tintJournal }]}>
              <Text style={{ fontSize: 18 }}>{moodEmojis[entry.mood]}</Text>
            </View>
          )}
          <View>
            <Text style={styles.date}>{formatDate(entry.date)}</Text>
            <Text style={styles.authorName}>by {entry.author.firstName}</Text>
          </View>
        </View>
        <Avatar
          name={`${entry.author.firstName} ${entry.author.lastName}`}
          uri={entry.author.avatarUrl}
          size={28}
        />
      </View>
      <Text style={styles.notes} numberOfLines={2}>
        {entry.notes}
      </Text>
      {(entry.energy || entry.pain > 0) && (
        <View style={styles.metricsRow}>
          {entry.energy && (
            <View style={styles.metricPill}>
              <Text style={styles.metricText}>Energy: {entry.energy}/5</Text>
            </View>
          )}
          {entry.pain > 0 && (
            <View style={[styles.metricPill, entry.pain > 5 && styles.metricPillDanger]}>
              <Text style={[styles.metricText, entry.pain > 5 && styles.metricTextDanger]}>Pain: {entry.pain}/10</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moodBubble: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  authorName: {
    ...typography.labelSmall,
    color: colors.textHint,
    fontSize: 10,
    marginTop: 1,
  },
  notes: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  metricPill: {
    backgroundColor: colors.tintTask,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricPillDanger: {
    backgroundColor: colors.tintEmergency,
  },
  metricText: {
    ...typography.labelSmall,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  metricTextDanger: {
    color: colors.danger,
  },
});
