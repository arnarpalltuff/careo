import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { colors } from '../../utils/colors';
import { createCircleSchema, CreateCircleForm } from '../../utils/validation';
import { useCircle } from '../../hooks/useCircle';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function CreateCircleScreen() {
  const { createCircle } = useCircle();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateCircleForm>({
    resolver: zodResolver(createCircleSchema),
    defaultValues: { name: '', careRecipient: '' },
  });

  const onSubmit = async (data: CreateCircleForm) => {
    const circle = await createCircle(data);
    router.replace('/(tabs)/home');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'New Care Circle' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24 },
  gap: { height: 12 },
  gap32: { height: 32 },
});
