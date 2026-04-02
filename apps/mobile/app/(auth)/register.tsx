import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { registerSchema, RegisterForm } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: colors.danger };
  if (score <= 2) return { score, label: 'Fair', color: colors.warning };
  if (score <= 3) return { score, label: 'Good', color: '#F59E0B' };
  return { score, label: 'Strong', color: colors.success };
}

export default function RegisterScreen() {
  const { register: registerUser, loading, error } = useAuth();
  const [password, setPassword] = useState('');
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const strength = getPasswordStrength(password);

  const onSubmit = (data: RegisterForm) => registerUser(data);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Join the families{'\n'}who care together.</Text>
          <Text style={styles.subheading}>Create your free account</Text>

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
              <Input
                label="Password"
                value={value}
                onChangeText={(text: string) => { onChange(text); setPassword(text); }}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBarBg}>
                <View style={[styles.strengthBarFill, { width: `${Math.min(strength.score / 5, 1) * 100}%`, backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}
          <View style={styles.requirements}>
            <Text style={[styles.reqItem, password.length >= 8 && styles.reqMet]}>
              {password.length >= 8 ? '✓' : '○'} 8+ characters
            </Text>
            <Text style={[styles.reqItem, /[0-9]/.test(password) && styles.reqMet]}>
              {/[0-9]/.test(password) ? '✓' : '○'} Number
            </Text>
            <Text style={[styles.reqItem, /[A-Z]/.test(password) && styles.reqMet]}>
              {/[A-Z]/.test(password) ? '✓' : '○'} Uppercase
            </Text>
            <Text style={[styles.reqItem, /[^A-Za-z0-9]/.test(password) && styles.reqMet]}>
              {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} Special char
            </Text>
          </View>

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
  back: { marginBottom: 20 },
  backText: { ...typography.labelMedium, color: colors.primary },
  heading: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subheading: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginBottom: 28,
  },
  errorBanner: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { ...typography.bodySmall, color: colors.danger, textAlign: 'center' },
  gap: { height: 12 },
  gap16: { height: 16 },
  gap24: { height: 24 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  strengthBarBg: { flex: 1, height: 4, backgroundColor: colors.divider, borderRadius: 2, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { ...typography.labelSmall, fontWeight: '700', width: 46 },
  requirements: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  reqItem: { ...typography.labelSmall, color: colors.textHint, fontSize: 11 },
  reqMet: { color: colors.success },
  loginLink: { alignItems: 'center' },
  loginText: { ...typography.bodyMedium, color: colors.textSecondary },
  loginBold: { color: colors.primary, fontWeight: '600' },
});
