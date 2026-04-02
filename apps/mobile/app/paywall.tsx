import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useOnboardingStore } from '../stores/onboardingStore';

// ─── Pricing (research-backed) ──────────────────────────────────────
// Annual shown first (anchor). Daily framing. 7-day trial.
// Based on: Calm $69.99/yr, Headspace $69.99/yr, MyFitnessPal $79.99/yr,
// Medisafe $27.99/yr. Caregiving apps are mostly free = market gap.

type Plan = 'free' | 'plus' | 'family';
type Billing = 'annual' | 'monthly';

const pricing = {
  plus:   { monthly: 7.99,  annual: 49.99, dailyAnnual: '0.14' },
  family: { monthly: 14.99, annual: 99.99, dailyAnnual: '0.27' },
};

// ─── Feature gates (what matters to caregivers) ─────────────────────
const features = [
  { icon: '👥', label: 'Care circle members',      free: 'Up to 3',    plus: 'Up to 8',     family: 'Unlimited' },
  { icon: '💊', label: 'Medication tracking',       free: 'Log only',   plus: 'Full + alerts', family: 'Full + reports' },
  { icon: '📅', label: 'History & data',            free: '7 days',     plus: '90 days',     family: 'Unlimited' },
  { icon: '📄', label: 'Document storage',          free: '3 docs',     plus: '25 docs',     family: 'Unlimited' },
  { icon: '📋', label: 'Active tasks',              free: '5',          plus: 'Unlimited',   family: 'Unlimited' },
  { icon: '🚨', label: 'Emergency alerts',          free: '---',        plus: 'Push',        family: 'Push + SMS' },
  { icon: '📊', label: 'Health trends & reports',   free: '---',        plus: 'Basic',       family: 'Weekly digest' },
  { icon: '📧', label: 'Family email updates',      free: '---',        plus: '---',         family: 'Weekly' },
];

export default function PaywallScreen() {
  const { setHasSeenPaywall, caringFor } = useOnboardingStore();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('plus');
  const [billing, setBilling] = useState<Billing>('annual');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleContinue = async () => {
    await setHasSeenPaywall(true);
    router.replace('/(tabs)/home');
  };

  const getPrice = (plan: 'plus' | 'family') => {
    if (billing === 'annual') return pricing[plan].annual;
    return pricing[plan].monthly;
  };

  const getSavings = (plan: 'plus' | 'family') => {
    const monthly12 = pricing[plan].monthly * 12;
    const annual = pricing[plan].annual;
    return Math.round(((monthly12 - annual) / monthly12) * 100);
  };

  return (
    <ScrollView style={styles.container} bounces={false} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeAnim }}>

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🤲</Text>
          <Text style={styles.headline}>
            {caringFor !== 'your loved one'
              ? `${caringFor} deserves\na full team.`
              : "Your family\ndeserves this."
            }
          </Text>
          <Text style={styles.subhead}>
            Choose the plan that fits your family.
          </Text>
        </View>

        {/* ─── Billing toggle ─── */}
        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[styles.billingOption, billing === 'annual' && styles.billingOptionActive]}
            onPress={() => setBilling('annual')}
          >
            <Text style={[styles.billingText, billing === 'annual' && styles.billingTextActive]}>
              Annual
            </Text>
            <View style={styles.savePill}>
              <Text style={styles.savePillText}>Save {getSavings('plus')}%</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingOption, billing === 'monthly' && styles.billingOptionActive]}
            onPress={() => setBilling('monthly')}
          >
            <Text style={[styles.billingText, billing === 'monthly' && styles.billingTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Plan cards ─── */}
        <View style={styles.planSection}>

          {/* Plus — the money maker */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'plus' && styles.planCardPlusSelected]}
            onPress={() => setSelectedPlan('plus')}
            activeOpacity={0.8}
          >
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>
            <View style={styles.planHeader}>
              <View style={[styles.radio, selectedPlan === 'plus' && styles.radioSelectedPlus]}>
                {selectedPlan === 'plus' && <View style={styles.radioDotPlus} />}
              </View>
              <View style={styles.planNameBlock}>
                <Text style={[styles.planName, selectedPlan === 'plus' && { color: '#fff' }]}>Plus</Text>
                <Text style={[styles.planTagline, selectedPlan === 'plus' && { color: 'rgba(255,255,255,0.7)' }]}>
                  For the primary caregiver
                </Text>
              </View>
            </View>
            <View style={styles.planPriceBlock}>
              <Text style={[styles.planPriceBig, selectedPlan === 'plus' && { color: '#fff' }]}>
                ${billing === 'annual' ? pricing.plus.dailyAnnual : getPrice('plus').toFixed(2)}
              </Text>
              <Text style={[styles.planPricePer, selectedPlan === 'plus' && { color: 'rgba(255,255,255,0.6)' }]}>
                {billing === 'annual' ? '/day' : '/month'}
              </Text>
              {billing === 'annual' && (
                <Text style={[styles.planPriceAnnual, selectedPlan === 'plus' && { color: 'rgba(255,255,255,0.5)' }]}>
                  ${pricing.plus.annual}/year
                </Text>
              )}
            </View>
            <View style={styles.planHighlights}>
              {['Up to 8 members', '90-day history', 'Missed dose alerts', '25 documents'].map((h, i) => (
                <View key={i} style={styles.highlightRow}>
                  <Text style={[styles.highlightCheck, selectedPlan === 'plus' && { color: '#A8E6CF' }]}>✓</Text>
                  <Text style={[styles.highlightText, selectedPlan === 'plus' && { color: 'rgba(255,255,255,0.9)' }]}>{h}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* Family Pro */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'family' && styles.planCardFamilySelected]}
            onPress={() => setSelectedPlan('family')}
            activeOpacity={0.8}
          >
            <View style={styles.planHeader}>
              <View style={[styles.radio, selectedPlan === 'family' && styles.radioSelected]}>
                {selectedPlan === 'family' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.planNameBlock}>
                <Text style={styles.planName}>Family Pro</Text>
                <Text style={styles.planTagline}>Multiple care recipients</Text>
              </View>
            </View>
            <View style={styles.planPriceBlock}>
              <Text style={styles.planPriceBig}>
                ${billing === 'annual' ? pricing.family.dailyAnnual : getPrice('family').toFixed(2)}
              </Text>
              <Text style={styles.planPricePer}>
                {billing === 'annual' ? '/day' : '/month'}
              </Text>
              {billing === 'annual' && (
                <Text style={styles.planPriceAnnual}>${pricing.family.annual}/year</Text>
              )}
            </View>
            <View style={styles.planHighlights}>
              {['Everything in Plus', 'Unlimited members & history', '3 circles (both parents, etc.)', 'Weekly email digest to family'].map((h, i) => (
                <View key={i} style={styles.highlightRow}>
                  <Text style={styles.highlightCheck}>✓</Text>
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* Free */}
          <TouchableOpacity
            style={[styles.planCardFree, selectedPlan === 'free' && styles.planCardFreeSelected]}
            onPress={() => setSelectedPlan('free')}
            activeOpacity={0.8}
          >
            <View style={[styles.radio, selectedPlan === 'free' && styles.radioSelected]}>
              {selectedPlan === 'free' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.freeName}>Free</Text>
            <Text style={styles.freeDesc}>3 members, 7-day history, basics</Text>
            <Text style={styles.freePrice}>$0</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Feature comparison (collapsed) ─── */}
        <View style={styles.featureSection}>
          <Text style={styles.sectionLabel}>FULL COMPARISON</Text>
          <View style={styles.featureHeaderRow}>
            <View style={styles.featureLabelCol} />
            <Text style={styles.featureColHeader}>Free</Text>
            <Text style={[styles.featureColHeader, { color: colors.primary }]}>Plus</Text>
            <Text style={[styles.featureColHeader, { color: colors.accent }]}>Pro</Text>
          </View>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureLabelCol}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
              <Text style={[styles.featureVal, styles.featureValFree]}>{f.free}</Text>
              <Text style={[styles.featureVal, styles.featureValPlus]}>{f.plus}</Text>
              <Text style={[styles.featureVal, styles.featureValFamily]}>{f.family}</Text>
            </View>
          ))}
        </View>

        {/* ─── Value prop ─── */}
        <View style={styles.proofStrip}>
          <Text style={styles.proofEmoji}>💛</Text>
          <Text style={styles.proofNumber}>Built for families like yours</Text>
          <Text style={styles.proofLabel}>Coordinate care, track medications, and stay connected</Text>
        </View>

        {/* ─── Testimonial ─── */}
        <View style={styles.testimonial}>
          <Text style={styles.quoteOpen}>{'"'}</Text>
          <Text style={styles.quoteText}>
            I used to lie awake at 2am wondering if Dad took his heart medication. Now my brother and I both get a notification. Last week he texted me: {'"'}I got it, go to sleep.{'"'} That never happened before Careo.
          </Text>
          <View style={styles.quoteAuthor}>
            <View style={styles.quoteAvatar}><Text style={styles.quoteAvatarText}>S</Text></View>
            <View>
              <Text style={styles.quoteName}>Sarah M.</Text>
              <Text style={styles.quoteRole}>Caregiver for her father, 78</Text>
            </View>
          </View>
        </View>

        {/* ─── Guarantee ─── */}
        {selectedPlan !== 'free' && (
          <View style={styles.guarantee}>
            <Text style={styles.guaranteeEmoji}>🛡️</Text>
            <View style={styles.guaranteeTextBlock}>
              <Text style={styles.guaranteeBold}>
                7 days free, then {billing === 'annual'
                  ? `$${getPrice(selectedPlan as 'plus' | 'family')}/year`
                  : `$${getPrice(selectedPlan as 'plus' | 'family').toFixed(2)}/month`
                }
              </Text>
              <Text style={styles.guaranteeLight}>Cancel anytime in 30 seconds. No questions asked.</Text>
            </View>
          </View>
        )}

        {/* ─── CTA ─── */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.ctaButton, selectedPlan === 'free' && styles.ctaButtonFree]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>
              {selectedPlan === 'free'
                ? 'Start with Free'
                : selectedPlan === 'plus'
                  ? 'Start 7-day free trial'
                  : 'Start Family Pro trial'
              }
            </Text>
            {selectedPlan !== 'free' && (
              <Text style={styles.ctaSub}>No credit card required</Text>
            )}
          </TouchableOpacity>

          {selectedPlan !== 'free' && (
            <TouchableOpacity onPress={() => { setSelectedPlan('free'); }} style={styles.skipLink}>
              <Text style={styles.skipText}>Start with free plan instead</Text>
            </TouchableOpacity>
          )}

          {selectedPlan === 'free' && (
            <TouchableOpacity onPress={handleContinue} style={styles.skipLink}>
              <Text style={styles.skipText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Fine print ─── */}
        <Text style={styles.finePrint}>
          {selectedPlan !== 'free'
            ? `After your 7-day trial, you'll be charged ${billing === 'annual' ? `$${getPrice(selectedPlan as 'plus' | 'family')}/year` : `$${getPrice(selectedPlan as 'plus' | 'family').toFixed(2)}/month`}. You can cancel anytime from Settings. By continuing you agree to our Terms of Service.`
            : 'You can upgrade anytime from Settings.'
          }
        </Text>

        <View style={{ height: 48 }} />
      </Animated.View>
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: { paddingTop: 56, paddingHorizontal: 28, paddingBottom: 24, alignItems: 'center' },
  headerEmoji: { fontSize: 44, marginBottom: 14 },
  headline: { ...typography.displayLarge, color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  subhead: { ...typography.bodyLarge, color: colors.textSecondary, textAlign: 'center' },

  // Billing toggle
  billingToggle: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 20,
    backgroundColor: colors.surface, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: colors.divider,
  },
  billingOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10, gap: 8,
  },
  billingOptionActive: { backgroundColor: colors.primary },
  billingText: { ...typography.labelMedium, color: colors.textSecondary },
  billingTextActive: { color: '#fff' },
  savePill: { backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  savePillText: { ...typography.labelSmall, color: '#5D4200', fontSize: 10, fontWeight: '700' },

  // Section
  sectionLabel: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1.5, marginBottom: 14, textAlign: 'center' },

  // Plan cards
  planSection: { paddingHorizontal: 20, marginBottom: 24 },
  planCard: {
    padding: 20, borderRadius: 18, borderWidth: 2, borderColor: colors.border,
    backgroundColor: '#fff', marginBottom: 12, position: 'relative', overflow: 'visible',
  },
  planCardPlusSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  planCardFamilySelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  planCardFree: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.divider, backgroundColor: '#fff', gap: 12,
  },
  planCardFreeSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },

  bestValueBadge: {
    position: 'absolute', top: -10, right: 14,
    backgroundColor: '#FFD700', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
  },
  bestValueText: { ...typography.labelSmall, color: '#5D4200', fontSize: 9, letterSpacing: 0.8, fontWeight: '800' },

  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  planNameBlock: {},
  planName: { ...typography.headingMedium, color: colors.textPrimary },
  planTagline: { ...typography.bodySmall, color: colors.textHint, marginTop: 1 },

  planPriceBlock: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 14 },
  planPriceBig: { ...typography.displayLarge, color: colors.textPrimary, fontSize: 36 },
  planPricePer: { ...typography.bodyMedium, color: colors.textHint },
  planPriceAnnual: { ...typography.bodySmall, color: colors.textHint, marginLeft: 8 },

  planHighlights: { gap: 8 },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  highlightCheck: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  highlightText: { ...typography.bodySmall, color: colors.textSecondary },

  freeName: { ...typography.headingSmall, color: colors.textPrimary },
  freeDesc: { ...typography.bodySmall, color: colors.textHint, flex: 1 },
  freePrice: { ...typography.headingMedium, color: colors.textHint },

  // Radio
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  radioSelectedPlus: { borderColor: 'rgba(255,255,255,0.6)' },
  radioDotPlus: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },

  // Feature comparison
  featureSection: { paddingHorizontal: 20, marginBottom: 24 },
  featureHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  featureLabelCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureColHeader: { ...typography.labelSmall, color: colors.textHint, width: 62, textAlign: 'center' },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  featureIcon: { fontSize: 16 },
  featureLabel: { ...typography.bodySmall, color: colors.textPrimary, flex: 1 },
  featureVal: { ...typography.labelSmall, width: 62, textAlign: 'center' },
  featureValFree: { color: colors.textHint },
  featureValPlus: { color: colors.primary, fontWeight: '600' },
  featureValFamily: { color: colors.accent, fontWeight: '600' },

  // Social proof
  proofStrip: { marginHorizontal: 20, padding: 18, backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, alignItems: 'center' },
  proofEmoji: { fontSize: 28, marginBottom: 8 },
  proofNumber: { ...typography.headingSmall, color: colors.textPrimary },
  proofLabel: { ...typography.bodySmall, color: colors.textHint, textAlign: 'center', marginTop: 4 },

  // Testimonial
  testimonial: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 18, padding: 22, marginBottom: 18, borderWidth: 1, borderColor: colors.divider },
  quoteOpen: { ...typography.displayLarge, color: colors.primaryLight, fontSize: 40, lineHeight: 40, marginBottom: -6 },
  quoteText: { ...typography.bodyMedium, color: colors.textPrimary, lineHeight: 24, fontStyle: 'italic', marginBottom: 14 },
  quoteAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quoteAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  quoteAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  quoteName: { ...typography.headingSmall, color: colors.textPrimary },
  quoteRole: { ...typography.bodySmall, color: colors.textHint },

  // Guarantee
  guarantee: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 16, backgroundColor: colors.primaryLight, borderRadius: 14, gap: 12, marginBottom: 22 },
  guaranteeEmoji: { fontSize: 26 },
  guaranteeTextBlock: { flex: 1 },
  guaranteeBold: { ...typography.headingSmall, color: colors.textPrimary },
  guaranteeLight: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },

  // CTA
  ctaSection: { paddingHorizontal: 20, alignItems: 'center' },
  ctaButton: {
    width: '100%', maxWidth: 400, paddingVertical: 20, borderRadius: 18, alignItems: 'center',
    backgroundColor: colors.accent, shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  ctaButtonFree: { backgroundColor: colors.primary, shadowColor: colors.primary },
  ctaText: { ...typography.button, color: '#FFFFFF', fontSize: 18 },
  ctaSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  skipLink: { marginTop: 16, padding: 8 },
  skipText: { ...typography.labelMedium, color: colors.textHint, textDecorationLine: 'underline' },

  // Fine print
  finePrint: { ...typography.bodySmall, color: colors.textHint, textAlign: 'center', paddingHorizontal: 32, marginTop: 16, lineHeight: 18 },
});
