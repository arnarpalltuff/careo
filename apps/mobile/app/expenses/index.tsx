import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useCircleStore } from '../../stores/circleStore';
import { expenseService } from '../../services/expenses';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';

const categoryConfig: Record<string, { emoji: string; label: string; color: string }> = {
  MEDICAL: { emoji: '🏥', label: 'Medical', color: '#E8725A' },
  PHARMACY: { emoji: '💊', label: 'Pharmacy', color: '#7C6EDB' },
  TRANSPORT: { emoji: '🚗', label: 'Transport', color: '#22C55E' },
  SUPPLIES: { emoji: '📦', label: 'Supplies', color: '#F59E0B' },
  HOME_CARE: { emoji: '🏠', label: 'Home Care', color: '#1B6B5F' },
  INSURANCE: { emoji: '🛡️', label: 'Insurance', color: '#3D9B8F' },
  FOOD: { emoji: '🍽️', label: 'Food', color: '#D4A853' },
  OTHER: { emoji: '📋', label: 'Other', color: '#8E93A6' },
};

export default function ExpensesScreen() {
  const { activeCircleId } = useCircleStore();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'list' | 'summary'>('list');

  const loadData = useCallback(async () => {
    if (!activeCircleId) return;
    try {
      const [expData, sumData] = await Promise.all([
        expenseService.list(activeCircleId),
        expenseService.getSummary(activeCircleId),
      ]);
      setExpenses(expData.expenses);
      setSummary(sumData.summary);
    } catch {} finally {
      setLoading(false);
    }
  }, [activeCircleId]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await expenseService.delete(activeCircleId!, id);
            await loadData();
          } catch {}
        },
      },
    ]);
  };

  if (loading) return <View style={[styles.root, styles.center]}><Spinner /></View>;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity onPress={() => router.push('/expenses/add')} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'list' && styles.tabActive]} onPress={() => setTab('list')}>
          <Text style={[styles.tabText, tab === 'list' && styles.tabTextActive]}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'summary' && styles.tabActive]} onPress={() => setTab('summary')}>
          <Text style={[styles.tabText, tab === 'summary' && styles.tabTextActive]}>Summary</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {tab === 'list' ? (
          <>
            {expenses.length === 0 && <EmptyState title="No expenses yet" subtitle="Track caregiving costs and split them with family" />}
            {expenses.map((exp) => {
              const cat = categoryConfig[exp.category] || categoryConfig.OTHER;
              return (
                <TouchableOpacity key={exp.id} style={styles.expenseCard} onLongPress={() => handleDelete(exp.id)} activeOpacity={0.75}>
                  <View style={[styles.catDot, { backgroundColor: cat.color }]}>
                    <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDesc}>{exp.description}</Text>
                    <Text style={styles.expenseMeta}>
                      {cat.label} {exp.paidBy ? `· Paid by ${exp.paidBy.firstName}` : ''} · {formatDate(exp.date)}
                    </Text>
                    {exp.taxDeductible && <Text style={styles.taxBadge}>Tax deductible</Text>}
                  </View>
                  <Text style={styles.amount}>${exp.amount.toFixed(2)}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          summary && (
            <View style={styles.summaryContainer}>
              {/* Total */}
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Spent ({summary.months} months)</Text>
                <Text style={styles.totalAmount}>${summary.totalSpent.toFixed(2)}</Text>
                {summary.taxDeductible > 0 && (
                  <Text style={styles.taxText}>Tax deductible: ${summary.taxDeductible.toFixed(2)}</Text>
                )}
              </View>

              {/* By Category */}
              <Text style={styles.sectionLabel}>BY CATEGORY</Text>
              {Object.entries(summary.byCategory as Record<string, number>).sort(([, a], [, b]) => (b as number) - (a as number)).map(([cat, amt]) => {
                const cfg = categoryConfig[cat] || categoryConfig.OTHER;
                const pct = summary.totalSpent > 0 ? ((amt as number) / summary.totalSpent) * 100 : 0;
                return (
                  <View key={cat} style={styles.catRow}>
                    <Text style={{ fontSize: 16 }}>{cfg.emoji}</Text>
                    <Text style={styles.catLabel}>{cfg.label}</Text>
                    <View style={styles.catBarWrap}>
                      <View style={[styles.catBar, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                    </View>
                    <Text style={styles.catAmount}>${(amt as number).toFixed(0)}</Text>
                  </View>
                );
              })}

              {/* By Payer */}
              {summary.byPayer?.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>BY PAYER</Text>
                  {summary.byPayer.map((p: any) => (
                    <View key={p.name} style={styles.payerRow}>
                      <Text style={styles.payerName}>{p.name}</Text>
                      <Text style={styles.payerAmount}>${p.amount.toFixed(2)}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Unsettled Splits */}
              {summary.unsettledSplits?.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>UNSETTLED</Text>
                  {summary.unsettledSplits.map((s: any) => (
                    <View key={s.id} style={styles.splitRow}>
                      <View style={styles.splitInfo}>
                        <Text style={styles.splitName}>{s.user.firstName} owes</Text>
                        <Text style={styles.splitDesc}>{s.expense.description}</Text>
                      </View>
                      <Text style={styles.splitAmount}>${s.amount.toFixed(2)}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )
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
  tabs: { flexDirection: 'row', marginHorizontal: 18, marginBottom: 16, backgroundColor: colors.divider, borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { ...typography.labelMedium, color: colors.textHint },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  expenseCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginBottom: 10,
    backgroundColor: '#fff', padding: 16, borderRadius: 16, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  catDot: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  expenseInfo: { flex: 1 },
  expenseDesc: { ...typography.headingSmall, color: colors.textPrimary },
  expenseMeta: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
  taxBadge: { ...typography.labelSmall, color: colors.success, fontSize: 10, marginTop: 3 },
  amount: { ...typography.headingMedium, color: colors.textPrimary },
  summaryContainer: { paddingHorizontal: 18 },
  totalCard: {
    backgroundColor: colors.primary, padding: 24, borderRadius: 20, alignItems: 'center', marginBottom: 24,
  },
  totalLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  totalAmount: { ...typography.displayLarge, color: '#fff', marginTop: 8 },
  taxText: { ...typography.bodySmall, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  sectionLabel: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1.5, marginBottom: 12, marginTop: 8, fontWeight: '700', fontSize: 11 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  catLabel: { ...typography.bodyMedium, color: colors.textPrimary, width: 80 },
  catBarWrap: { flex: 1, height: 8, backgroundColor: colors.divider, borderRadius: 4 },
  catBar: { height: 8, borderRadius: 4 },
  catAmount: { ...typography.labelMedium, color: colors.textPrimary, width: 60, textAlign: 'right' },
  payerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  payerName: { ...typography.bodyMedium, color: colors.textPrimary },
  payerAmount: { ...typography.headingSmall, color: colors.textPrimary },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  splitInfo: { flex: 1 },
  splitName: { ...typography.bodyMedium, color: colors.textPrimary },
  splitDesc: { ...typography.bodySmall, color: colors.textHint },
  splitAmount: { ...typography.headingSmall, color: colors.accent },
});
