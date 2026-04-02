import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useCircleStore } from '../../stores/circleStore';
import { expenseService } from '../../services/expenses';

const categories = [
  { value: 'MEDICAL', emoji: '🏥', label: 'Medical' },
  { value: 'PHARMACY', emoji: '💊', label: 'Pharmacy' },
  { value: 'TRANSPORT', emoji: '🚗', label: 'Transport' },
  { value: 'SUPPLIES', emoji: '📦', label: 'Supplies' },
  { value: 'HOME_CARE', emoji: '🏠', label: 'Home Care' },
  { value: 'INSURANCE', emoji: '🛡️', label: 'Insurance' },
  { value: 'FOOD', emoji: '🍽️', label: 'Food' },
  { value: 'OTHER', emoji: '📋', label: 'Other' },
];

export default function AddExpenseScreen() {
  const { activeCircleId } = useCircleStore();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MEDICAL');
  const [taxDeductible, setTaxDeductible] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || !description || !activeCircleId) {
      Alert.alert('Required', 'Please enter an amount and description.');
      return;
    }
    setSaving(true);
    try {
      await expenseService.create(activeCircleId, {
        amount: parseFloat(amount),
        category,
        description,
        date: new Date().toISOString(),
        taxDeductible,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Expense</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textHint}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="What was this expense for?"
            placeholderTextColor={colors.textHint}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.catGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.catBtn, category === cat.value && styles.catBtnActive]}
                onPress={() => setCategory(cat.value)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                <Text style={[styles.catLabel, category === cat.value && styles.catLabelActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tax Deductible */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Tax Deductible</Text>
            <Text style={styles.switchHint}>Medical expenses may be deductible</Text>
          </View>
          <Switch
            value={taxDeductible}
            onValueChange={setTaxDeductible}
            trackColor={{ false: colors.divider, true: colors.primaryLight }}
            thumbColor={taxDeductible ? colors.primary : '#fff'}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: Platform.OS === 'web' ? 24 : 56, paddingBottom: 12,
  },
  cancelBtn: { padding: 8 },
  cancelText: { ...typography.bodyMedium, color: colors.textSecondary },
  title: { ...typography.headingMedium, color: colors.textPrimary },
  saveBtn: { padding: 8 },
  saveText: { ...typography.headingMedium, color: colors.primary },
  scroll: { flex: 1, paddingHorizontal: 18 },
  amountCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', padding: 24, borderRadius: 24, marginBottom: 24, marginTop: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  dollarSign: { ...typography.displayLarge, color: colors.textHint, marginRight: 4, fontSize: 36 },
  amountInput: { ...typography.displayLarge, color: colors.textPrimary, fontSize: 48, minWidth: 120, textAlign: 'center' },
  field: { marginBottom: 20 },
  fieldLabel: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1, marginBottom: 8, fontWeight: '700', fontSize: 11 },
  input: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, ...typography.bodyLarge,
    color: colors.textPrimary, borderWidth: 1, borderColor: colors.divider,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 1, borderColor: colors.divider, alignItems: 'center', flexDirection: 'row', gap: 6,
  },
  catBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  catLabel: { ...typography.labelSmall, color: colors.textSecondary },
  catLabelActive: { color: colors.primary, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 20,
  },
  switchLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  switchHint: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
});
