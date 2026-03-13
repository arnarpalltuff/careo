import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';
import { formatDate } from '../utils/formatDate';
import { Avatar } from './ui/Avatar';

const moodEmojis: Record<string, string> = {
  GREAT: '😄',
  GOOD: '🙂',
  OKAY: '😐',
  LOW: '😟',
  BAD: '😢',
};

interface JournalCardProps {
  entry: any;
  onPress: () => void;
}

export function JournalCard({ entry, onPress }: JournalCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(entry.date)}</Text>
        {entry.mood && <Text style={styles.mood}>{moodEmojis[entry.mood]}</Text>}
      </View>
      <Text style={styles.notes} numberOfLines={2}>
        {entry.notes}
      </Text>
      <View style={styles.author}>
        <Avatar
          name={`${entry.author.firstName} ${entry.author.lastName}`}
          uri={entry.author.avatarUrl}
          size={20}
        />
        <Text style={styles.authorName}>{entry.author.firstName}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mood: {
    fontSize: 20,
  },
  notes: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 13,
    color: colors.textHint,
  },
});
