import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { registerSchema, RegisterForm } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function RegisterScreen() {
  const { register: registerUser, loading, error } = useAuth();
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const onSubmit = (data: RegisterForm) => registerUser(data);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Create your account</Text>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, value } }) => (
              <Input label="First name" value={value} onChangeText={onChange} error={errors.firstName?.message} />
            )}
          />
          <View style={styles.gap} />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, value } }) => (
              <Input label="Last name" value={value} onChangeText={onChange} error={errors.lastName?.message} />
            )}
          />
          <View style={styles.gap} />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />
          <View style={styles.gap} />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input label="Password" value={value} onChangeText={onChange} secureTextEntry error={errors.password?.message} />
            )}
          />
          <Text style={styles.hint}>At least 8 characters with 1 number</Text>

          <View style={styles.gap24} />
          <Button title="Create account" onPress={handleSubmit(onSubmit)} loading={loading} />
          <View style={styles.gap16} />
          <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginBold}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24 },
  back: { marginBottom: 16 },
  backText: { fontSize: 16, color: colors.primary },
  heading: { fontSize: 22, fontWeight: '600', color: colors.textPrimary, marginBottom: 24 },
  errorBanner: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  gap: { height: 12 },
  gap16: { height: 16 },
  gap24: { height: 24 },
  hint: { fontSize: 13, color: colors.textHint, marginTop: 4 },
  loginLink: { alignItems: 'center' },
  loginText: { fontSize: 15, color: colors.textSecondary },
  loginBold: { color: colors.primary, fontWeight: '600' },
});
