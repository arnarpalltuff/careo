import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useCircleStore } from '../stores/circleStore';
import { transitionService } from '../services/transitions';
import { Spinner } from '../components/ui/Spinner';
import { formatDate } from '../utils/formatDate';

const transitionTypes = [
  { value: 'HOSPITAL_TO_HOME', emoji: '🏥→🏠', label: 'Hospital to Home' },
  { value: 'HOME_TO_FACILITY', emoji: '🏠→🏢', label: 'Home to Facility' },
  { value: 'FACILITY_TO_HOME', emoji: '🏢→🏠', label: 'Facility to Home' },
  { value: 'HOSPICE', emoji: '🕊️', label: 'Hospice Care' },
  { value: 'REHAB', emoji: '💪', label: 'Rehabilitation' },
];

const statusColors: Record<string, string> = {
  PLANNING: colors.warning,
  IN_PROGRESS: colors.primary,
  COMPLETED: colors.success,
};

export default function TransitionsScreen() {
  const { activeCircleId } = useCircleStore();
  const [transitions, setTransitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!activeCircleId) return;
    try {
      const data = await transitionService.list(activeCircleId);
      setTransitions(data.transitions);
    } catch {} finally {
      setLoading(false);
    }
  }, [activeCircleId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (type: string) => {
    try {
      await transitionService.create(activeCircleId!, { type });
      setShowCreate(false);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create transition');
    }
  };

  const toggleChecklistItem = async (transitionId: string, checklist: any[], itemId: string) => {
    const updated = checklist.map((item: any) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    try {
      await transitionService.update(activeCircleId!, transitionId, {
        checklistJson: JSON.stringify(updated),
      });
      await loadData();
    } catch {}
  };

  if (loading) return <View style={[styles.root, styles.center]}><Spinner /></View>;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Care Transitions</Text>
        <TouchableOpacity onPress={() => setShowCreate(!showCreate)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Info */}
        <View style={styles.infoBanner}>
          <Text style={{ fontSize: 24 }}>🗺️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Navigate care transitions</Text>
            <Text style={styles.infoSub}>Step-by-step checklists to guide your family through major care changes.</Text>
          </View>
        </View>

        {/* Create */}
        {showCreate && (
          <View style={styles.createSection}>
            <Text style={styles.sectionLabel}>START A TRANSITION</Text>
            {transitionTypes.map((t) => (
              <TouchableOpacity key={t.value} style={styles.typeCard} onPress={() => handleCreate(t.value)} activeOpacity={0.75}>
                <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
                <Text style={styles.typeLabel}>{t.label}</Text>
                <Text style={styles.typeArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Active Transitions */}
        {transitions.map((tr) => {
          const isOpen = expanded === tr.id;
          let checklist: any[] = [];
          try { checklist = JSON.parse(tr.checklistJson || '[]'); } catch {}
          const done = checklist.filter((c: any) => c.done).length;
          const total = checklist.length;
          const pct = total > 0 ? (done / total) * 100 : 0;
          const typeConfig = transitionTypes.find(t => t.value === tr.type);

          return (
            <View key={tr.id} style={styles.transitionCard}>
              <TouchableOpacity
                style={styles.transitionHeader}
                onPress={() => setExpanded(isOpen ? null : tr.id)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 28 }}>{typeConfig?.emoji || '📋'}</Text>
                <View style={styles.transitionInfo}>
                  <Text style={styles.transitionTitle}>{typeConfig?.label || tr.type}</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{done}/{total}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[tr.status] || colors.textHint }]}>
                  <Text style={styles.statusText}>{tr.status}</Text>
                </View>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.checklistContainer}>
                  {tr.targetDate && (
                    <Text style={styles.targetDate}>Target: {formatDate(tr.targetDate)}</Text>
                  )}

                  {/* Group by category */}
                  {Object.entries(
                    checklist.reduce((acc: Record<string, any[]>, item: any) => {
                      const cat = item.category || 'General';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(item);
                      return acc;
                    }, {})
                  ).map(([category, items]) => (
                    <View key={category}>
                      <Text style={styles.checkCategory}>{category}</Text>
                      {(items as any[]).map((item: any) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.checkRow}
                          onPress={() => toggleChecklistItem(tr.id, checklist, item.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
                            {item.done && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                          <Text style={[styles.checkText, item.done && styles.checkTextDone]}>{item.text}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {transitions.length === 0 && !showCreate && (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48 }}>🗺️</Text>
            <Text style={styles.emptyTitle}>No active transitions</Text>
            <Text style={styles.emptySub}>When a care transition begins, start one here to get a guided checklist.</Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.startBtnText}>Start a transition</Text>
            </TouchableOpacity>
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
  title: { ...typography.displaySmall, color: colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 24, color: '#fff', fontWeight: '600' },
  scroll: { flex: 1 },
  infoBanner: {
    flexDirection: 'row', marginHorizontal: 18, marginBottom: 20, padding: 18,
    backgroundColor: colors.tintAppt, borderRadius: 18, gap: 14, alignItems: 'center',
  },
  infoContent: { flex: 1 },
  infoTitle: { ...typography.headingMedium, color: colors.textPrimary },
  infoSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  createSection: { marginBottom: 20 },
  sectionLabel: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1.5, fontWeight: '700', fontSize: 11, paddingHorizontal: 18, marginBottom: 12 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginBottom: 8,
    backgroundColor: '#fff', padding: 18, borderRadius: 16, gap: 14,
  },
  typeLabel: { ...typography.headingSmall, color: colors.textPrimary, flex: 1 },
  typeArrow: { fontSize: 20, color: colors.textHint },
  transitionCard: { marginHorizontal: 18, marginBottom: 12, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  transitionHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  transitionInfo: { flex: 1 },
  transitionTitle: { ...typography.headingMedium, color: colors.textPrimary, marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBg: { flex: 1, height: 6, backgroundColor: colors.divider, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: colors.success, borderRadius: 3 },
  progressText: { ...typography.labelSmall, color: colors.textHint, width: 40, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { ...typography.labelSmall, color: '#fff', fontWeight: '700', fontSize: 9 },
  checklistContainer: { paddingHorizontal: 18, paddingBottom: 18 },
  targetDate: { ...typography.labelSmall, color: colors.accent, marginBottom: 12 },
  checkCategory: { ...typography.labelSmall, color: colors.primary, letterSpacing: 1, fontWeight: '700', fontSize: 10, marginTop: 12, marginBottom: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  checkbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkText: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, lineHeight: 22 },
  checkTextDone: { color: colors.textHint, textDecorationLine: 'line-through' },
  emptyContainer: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { ...typography.displaySmall, color: colors.textPrimary, marginTop: 16 },
  emptySub: { ...typography.bodyMedium, color: colors.textHint, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  startBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 24 },
  startBtnText: { ...typography.button, color: '#fff' },
});
