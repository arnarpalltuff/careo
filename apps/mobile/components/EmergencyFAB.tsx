import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../utils/colors';
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onAlert();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={handlePress} activeOpacity={0.8}>
        <Text style={styles.icon}>!</Text>
      </TouchableOpacity>
      <ConfirmModal
        visible={showModal}
        title="Send Emergency Alert"
        message={`This will immediately notify all ${memberCount} members of ${circleName}.`}
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
});
