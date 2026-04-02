import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { authService } from '../../services/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
      setCodeSent(true);
      setStep(2);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach server. Please check your connection.');
      } else {
        setError(err.response?.data?.message || 'Failed to send code. Please check your email and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!code.trim() || code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword({ email, code, newPassword });
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach server. Please check your connection.');
      } else {
        setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.heading}>Password Reset</Text>
          <Text style={styles.subtitle}>Your password has been reset successfully.</Text>
          <Button title="Back to Login" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Enter your email and we will send you a reset code.'
              : 'Enter the 6-digit code sent to your email.'}
          </Text>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {codeSent && step === 2 && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>Code sent to {email}</Text>
            </View>
          )}

          {step === 1 ? (
            <>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.gap} />
              <Button title="Send Code" onPress={handleSendCode} loading={loading} />
            </>
          ) : (
            <>
              <Input label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
              <View style={styles.gap} />
              <Input label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
              <Text style={styles.hint}>At least 8 characters with 1 number</Text>
              <View style={styles.gap} />
              <Button title="Reset Password" onPress={handleReset} loading={loading} />
            </>
          )}
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
  backText: { ...typography.bodyMedium, color: colors.primary },
  heading: { ...typography.headingLarge, color: colors.textPrimary, marginBottom: 8 },
  subtitle: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: 24, lineHeight: 22 },
  errorBanner: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 14, marginBottom: 16 },
  errorText: { ...typography.bodySmall, color: colors.danger, textAlign: 'center' },
  gap: { height: 16 },
  hint: { ...typography.bodySmall, color: colors.textHint, marginTop: 4 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { fontSize: 48, color: colors.success, marginBottom: 16 },
  successBanner: { backgroundColor: '#DCFCE7', padding: 12, borderRadius: 14, marginBottom: 16 },
  successBannerText: { ...typography.bodySmall, color: '#166534', textAlign: 'center' },
});
