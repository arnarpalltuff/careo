import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { ConfirmModal } from './ui/Modal';

interface EmergencyFABProps {
  circleName: string;
  memberCount: number;
  onAlert: () => Promise<void>;
}

export function EmergencyFAB({ circleName, memberCount, onAlert }: EmergencyFABProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onAlert();
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={handlePress} activeOpacity={0.8} accessibilityLabel="Emergency" accessibilityRole="button">
        <Text style={styles.icon}>!</Text>
      </TouchableOpacity>
      <ConfirmModal
        visible={showModal}
        title="Send Emergency Alert"
        message={`This will notify all ${memberCount} members of ${circleName} immediately.`}
        confirmText="Send Alert"
        confirmVariant="danger"
        onCancel={() => setShowModal(false)}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
});
