import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';

interface MedicationCardProps {
  medication: any;
  onPress: () => void;
}

export function MedicationCard({ medication, onPress }: MedicationCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.pill} />
      <View style={styles.content}>
        <Text style={styles.name}>{medication.name}</Text>
        <Text style={styles.dosage}>{medication.dosage} — {medication.frequency}</Text>
        {medication.prescriber && (
          <Text style={styles.prescriber}>Dr. {medication.prescriber}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  pill: {
    width: 8,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dosage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  prescriber: {
    fontSize: 13,
    color: colors.textHint,
    marginTop: 2,
  },
});
