import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { loginSchema, LoginForm } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { startDemo } from '../../utils/demoData';
import { CrossHatch, RadialRings, TopoLines } from '../../components/Texture';

export default function LoginScreen() {
  const { login, loading, error } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const onSubmit = (data: LoginForm) => login(data.email, data.password);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await startDemo();
      router.replace('/(tabs)/home');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <TopoLines color="#1B6B5F" opacity={0.02} variant="wide" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Hero with gradient and decorative elements */}
          <LinearGradient
            colors={['#0F4A42', '#1B6B5F', '#2D8B7E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <CrossHatch color="#fff" opacity={0.05} />
            <RadialRings color="#fff" opacity={0.06} cx={340} cy={50} />
            <View style={styles.heroDecor1} />
            <View style={styles.heroDecor2} />
            <View style={styles.heroDecor3} />

            <Animated.View style={[styles.heroInner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>💛</Text>
              </View>
              <Text style={styles.logo}>Careo</Text>
              <Text style={styles.tagline}>Care together, worry less</Text>

              <View style={styles.trustRow}>
                <View style={styles.trustPill}>
                  <Text style={styles.trustText}>🔒 HIPAA Compliant</Text>
                </View>
                <View style={styles.trustPill}>
                  <Text style={styles.trustText}>👨‍👩‍👧 Family-first</Text>
                </View>
              </View>
            </Animated.View>
          </LinearGradient>

          {/* Form */}
          <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input label="Email" value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email?.message} />
              )}
            />
            <View style={{ height: 14 }} />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input label="Password" value={value} onChangeText={onChange} secureTextEntry error={errors.password?.message} />
              )}
            />

            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotLink}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
            <Button title="Log in" onPress={handleSubmit(onSubmit)} loading={loading} />

            <View style={{ height: 20 }} />
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={{ height: 16 }} />

            {/* Social Sign-In */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={handleDemo} activeOpacity={0.8}>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.socialLabel}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialBtn, styles.appleBtn]} onPress={handleDemo} activeOpacity={0.8}>
                <Text style={styles.appleIcon}>{'\uF8FF'}</Text>
                <Text style={[styles.socialLabel, { color: '#fff' }]}>Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 20 }} />
            <Button title="Create account" variant="outline" onPress={() => router.push('/(auth)/register')} />

            <View style={{ height: 16 }} />

            {/* Demo Button */}
            <TouchableOpacity onPress={handleDemo} activeOpacity={0.8} disabled={demoLoading}>
              <LinearGradient
                colors={['#FFF8EB', '#FFF0D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.demoBtn}
              >
                <Text style={styles.demoEmoji}>✨</Text>
                <View>
                  <Text style={styles.demoText}>{demoLoading ? 'Loading demo...' : 'Try the demo'}</Text>
                  <Text style={styles.demoSub}>No sign-up needed — explore all features</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },

  hero: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 60 : 80,
    paddingBottom: 48,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroDecor2: {
    position: 'absolute',
    bottom: -30,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroDecor3: {
    position: 'absolute',
    top: 40,
    left: '30%' as any,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroInner: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: { fontSize: 40 },
  logo: {
    ...typography.displayLarge,
    color: '#FFFFFF',
    fontSize: 42,
  },
  tagline: {
    ...typography.bodyLarge,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 8,
  },
  trustRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  trustPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  trustText: {
    ...typography.labelSmall,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },

  form: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  errorBanner: { backgroundColor: '#FEE2E2', padding: 14, borderRadius: 14, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
  errorText: { ...typography.bodySmall, color: colors.danger, textAlign: 'center' },
  forgotLink: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { ...typography.labelMedium, color: colors.primary },
  divider: { flexDirection: 'row', alignItems: 'center' },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.bodySmall, marginHorizontal: 16, color: colors.textHint },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#fff',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  googleG: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  socialLabel: {
    ...typography.labelMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  appleBtn: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  appleIcon: {
    color: '#fff',
    fontSize: 22,
  },

  // Demo
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E8C85A',
    shadowColor: '#D4A853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  demoEmoji: { fontSize: 24 },
  demoText: {
    ...typography.labelLarge,
    color: '#8B6914',
    fontWeight: '700',
  },
  demoSub: {
    ...typography.bodySmall,
    color: '#A68320',
    marginTop: 2,
    fontSize: 12,
  },
});
