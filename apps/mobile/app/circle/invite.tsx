import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../utils/colors';
import { useCircleStore } from '../../stores/circleStore';
import { useCircle } from '../../hooks/useCircle';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function InviteScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { activeCircleId } = useCircleStore();
  const { inviteMember } = useCircle();

  const handleInvite = async () => {
    if (!activeCircleId || !email) return;
    setLoading(true);
    try {
      await inviteMember(activeCircleId, email);
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <Stack.Screen options={{ title: 'Invite Member' }} />
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successText}>Invitation sent to {email}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Invite Member' }} />
      <View style={styles.container}>
        <Input
          label="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="family@example.com"
        />
        <View style={{ height: 24 }} />
        <Button title="Send Invitation" onPress={handleInvite} loading={loading} disabled={!email} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  successIcon: { fontSize: 48, color: colors.success, marginBottom: 16 },
  successText: { fontSize: 16, color: colors.textPrimary },
});
