import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useCircleStore } from '../../stores/circleStore';
import { careNoteService } from '../../services/careNotes';
import { Spinner } from '../../components/ui/Spinner';
import { formatRelative } from '../../utils/formatDate';

const noteTypeConfig: Record<string, { emoji: string; label: string; bg: string }> = {
  SHIFT_HANDOFF: { emoji: '🔄', label: 'Shift Handoff', bg: colors.tintTask },
  DOCTOR_VISIT: { emoji: '🩺', label: 'Doctor Visit', bg: colors.tintAppt },
  DAILY_UPDATE: { emoji: '📝', label: 'Daily Update', bg: colors.tintJournal },
  INCIDENT: { emoji: '⚠️', label: 'Incident', bg: colors.tintEmergency },
  OBSERVATION: { emoji: '👁️', label: 'Observation', bg: colors.tintMed },
};

export default function CareNoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeCircleId } = useCircleStore();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeCircleId && id) {
      careNoteService.get(activeCircleId, id)
        .then((data) => setNote(data.note))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeCircleId, id]);

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this care note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await careNoteService.delete(activeCircleId!, id!);
            router.back();
          } catch {}
        },
      },
    ]);
  };

  const handlePin = async () => {
    try {
      const updated = await careNoteService.update(activeCircleId!, id!, { pinned: !note.pinned });
      setNote(updated.note);
    } catch {}
  };

  if (loading) return <View style={[styles.root, styles.center]}><Spinner /></View>;
  if (!note) return <View style={[styles.root, styles.center]}><Text>Note not found</Text></View>;

  const cfg = noteTypeConfig[note.type] || noteTypeConfig.DAILY_UPDATE;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'}</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handlePin} style={styles.actionBtn}>
            <Text style={{ fontSize: 18 }}>{note.pinned ? '📌' : '📎'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <Text style={{ fontSize: 18 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
          <Text style={{ fontSize: 16 }}>{cfg.emoji}</Text>
          <Text style={styles.typeLabel}>{cfg.label}</Text>
        </View>

        <Text style={styles.title}>{note.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.author}>{note.author?.firstName} {note.author?.lastName}</Text>
          <Text style={styles.time}>{formatRelative(note.createdAt)}</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.content}>{note.content}</Text>
        </View>

        {note.tags && (
          <View style={styles.tagRow}>
            {note.tags.split(',').map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag.trim()}</Text>
              </View>
            ))}
          </View>
        )}

        {note.voiceUrl && (
          <View style={styles.voiceCard}>
            <Text style={{ fontSize: 24 }}>🎙️</Text>
            <Text style={styles.voiceText}>Voice memo attached</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: Platform.OS === 'web' ? 24 : 56, paddingBottom: 12,
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 28, color: colors.primary, fontWeight: '300' },
  headerActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 16,
  },
  typeLabel: { ...typography.labelSmall, color: colors.textSecondary },
  title: { ...typography.displayMedium, color: colors.textPrimary, marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  author: { ...typography.labelMedium, color: colors.primary },
  time: { ...typography.labelSmall, color: colors.textHint },
  contentCard: { backgroundColor: '#fff', padding: 20, borderRadius: 18, marginBottom: 16 },
  content: { ...typography.bodyLarge, color: colors.textPrimary, lineHeight: 28 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { backgroundColor: colors.divider, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { ...typography.labelSmall, color: colors.textSecondary },
  voiceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    backgroundColor: colors.tintAppt, borderRadius: 14, marginBottom: 16,
  },
  voiceText: { ...typography.bodyMedium, color: colors.textSecondary },
});
