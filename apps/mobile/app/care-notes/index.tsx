import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useCircleStore } from '../../stores/circleStore';
import { careNoteService } from '../../services/careNotes';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { formatRelative } from '../../utils/formatDate';

const noteTypeConfig: Record<string, { emoji: string; label: string; bg: string }> = {
  SHIFT_HANDOFF: { emoji: '🔄', label: 'Shift Handoff', bg: colors.tintTask },
  DOCTOR_VISIT: { emoji: '🩺', label: 'Doctor Visit', bg: colors.tintAppt },
  DAILY_UPDATE: { emoji: '📝', label: 'Daily Update', bg: colors.tintJournal },
  INCIDENT: { emoji: '⚠️', label: 'Incident', bg: colors.tintEmergency },
  OBSERVATION: { emoji: '👁️', label: 'Observation', bg: colors.tintMed },
};

const filterOptions = [
  { value: undefined, label: 'All' },
  { value: 'SHIFT_HANDOFF', label: 'Handoffs' },
  { value: 'DOCTOR_VISIT', label: 'Doctor' },
  { value: 'DAILY_UPDATE', label: 'Daily' },
  { value: 'INCIDENT', label: 'Incident' },
  { value: 'OBSERVATION', label: 'Observe' },
];

export default function CareNotesScreen() {
  const { activeCircleId } = useCircleStore();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  const loadNotes = useCallback(async () => {
    if (!activeCircleId) return;
    try {
      const data = await careNoteService.list(activeCircleId, { type: filter });
      setNotes(data.notes);
    } catch {} finally {
      setLoading(false);
    }
  }, [activeCircleId, filter]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  }, [loadNotes]);

  if (loading) return <View style={[styles.root, styles.center]}><Spinner /></View>;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Care Notes</Text>
        <TouchableOpacity onPress={() => router.push('/care-notes/add')} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {filterOptions.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.filterPill, filter === opt.value && styles.filterPillActive]}
            onPress={() => setFilter(opt.value)}
          >
            <Text style={[styles.filterText, filter === opt.value && styles.filterTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {notes.length === 0 && <EmptyState title="No care notes yet" subtitle="Record shift handoffs, doctor visits, and observations" />}
        {notes.map((note) => {
          const cfg = noteTypeConfig[note.type] || noteTypeConfig.DAILY_UPDATE;
          return (
            <TouchableOpacity
              key={note.id}
              style={styles.noteCard}
              onPress={() => router.push(`/care-notes/${note.id}`)}
              activeOpacity={0.75}
            >
              {note.pinned && <Text style={styles.pinIcon}>📌</Text>}
              <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
                <Text style={{ fontSize: 16 }}>{cfg.emoji}</Text>
                <Text style={styles.typeLabel}>{cfg.label}</Text>
              </View>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <Text style={styles.notePreview} numberOfLines={2}>{note.content}</Text>
              <View style={styles.noteMeta}>
                <Text style={styles.noteAuthor}>{note.author?.firstName} {note.author?.lastName}</Text>
                <Text style={styles.noteTime}>{formatRelative(note.createdAt)}</Text>
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
                <View style={styles.voiceBadge}>
                  <Text style={{ fontSize: 14 }}>🎙️</Text>
                  <Text style={styles.voiceText}>Voice memo attached</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
  title: { ...typography.displaySmall, color: colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 24, color: '#fff', fontWeight: '600' },
  filterScroll: { maxHeight: 48, marginBottom: 8 },
  filterContent: { paddingHorizontal: 18, gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.divider },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.labelSmall, color: colors.textSecondary },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  scroll: { flex: 1 },
  noteCard: {
    marginHorizontal: 18, marginBottom: 12, backgroundColor: '#fff', padding: 18, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  pinIcon: { position: 'absolute', top: 12, right: 12, fontSize: 14 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
  typeLabel: { ...typography.labelSmall, color: colors.textSecondary, fontSize: 11 },
  noteTitle: { ...typography.headingMedium, color: colors.textPrimary, marginBottom: 6 },
  notePreview: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: 10 },
  noteMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  noteAuthor: { ...typography.labelSmall, color: colors.primary },
  noteTime: { ...typography.labelSmall, color: colors.textHint },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { backgroundColor: colors.divider, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { ...typography.labelSmall, color: colors.textSecondary, fontSize: 10 },
  voiceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  voiceText: { ...typography.labelSmall, color: colors.textHint },
});
