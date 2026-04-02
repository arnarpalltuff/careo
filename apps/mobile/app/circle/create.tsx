import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { createCircleSchema, CreateCircleForm } from '../../utils/validation';
import { useCircle } from '../../hooks/useCircle';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function CreateCircleScreen() {
  const { createCircle } = useCircle();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateCircleForm>({
    resolver: zodResolver(createCircleSchema),
    defaultValues: { name: '', careRecipient: '' },
  });

  const onSubmit = async (data: CreateCircleForm) => {
    setError(null);
    try {
      await createCircle(data);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create circle';
      if (err.response?.data?.code === 'upgrade_required') {
        Alert.alert('Upgrade Required', msg, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/subscription') },
        ]);
      } else {
        setError(msg);
      }
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'New Care Circle' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Header illustration */}
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.heroTitle}>Start a Care Circle</Text>
            <Text style={styles.heroDesc}>
              A care circle brings your family together to coordinate care for a loved one.
            </Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input label="Circle name" placeholder="Mom's Care Team" value={value} onChangeText={onChange} error={errors.name?.message} />
            )}
          />
          <View style={styles.gap} />
          <Controller
            control={control}
            name="careRecipient"
            render={({ field: { onChange, value } }) => (
              <Input label="Care recipient name" placeholder="Margaret Johnson" value={value} onChangeText={onChange} error={errors.careRecipient?.message} />
            )}
          />

          <View style={styles.gap32} />
          <Button title="Create Circle" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

          {/* What happens next */}
          <View style={styles.nextSection}>
            <Text style={styles.nextTitle}>What happens next?</Text>
            {[
              { emoji: '1️⃣', text: 'Your circle is created and you become the admin' },
              { emoji: '2️⃣', text: 'Invite family members via email' },
              { emoji: '3️⃣', text: 'Start tracking medications, tasks, and appointments together' },
            ].map((step, i) => (
              <View key={i} style={styles.nextRow}>
                <Text style={styles.nextEmoji}>{step.emoji}</Text>
                <Text style={styles.nextText}>{step.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, paddingBottom: 40 },

  hero: { alignItems: 'center', marginBottom: 28 },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { ...typography.headingLarge, color: colors.textPrimary, marginBottom: 6 },
  heroDesc: { ...typography.bodyMedium, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 },

  errorBanner: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 14, marginBottom: 16 },
  errorText: { ...typography.bodySmall, color: colors.danger, textAlign: 'center' },

  gap: { height: 12 },
  gap32: { height: 32 },

  nextSection: { marginTop: 32, backgroundColor: colors.primaryLight, borderRadius: 18, padding: 20 },
  nextTitle: { ...typography.headingSmall, color: colors.textPrimary, marginBottom: 14 },
  nextRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  nextEmoji: { fontSize: 16, marginTop: 1 },
  nextText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1, lineHeight: 20 },
});
