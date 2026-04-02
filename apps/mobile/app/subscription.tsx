import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, Platform, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useAuthStore } from '../stores/authStore';
import { subscriptionService, SubscriptionStatus } from '../services/subscriptions';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

type Tier = 'FREE' | 'PLUS' | 'FAMILY';

const PLANS: { tier: Tier; name: string; price: string; period: string; features: string[] }[] = [
  {
    tier: 'FREE',
    name: 'Free',
    price: '$0',
    period: '',
    features: ['1 care circle', 'Up to 3 members', '3 documents', '5 active tasks', '7-day history'],
  },
  {
    tier: 'PLUS',
    name: 'Plus',
    price: '$4.17',
    period: '/mo billed annually',
    features: ['3 care circles', 'Up to 8 members', '25 documents', 'Unlimited tasks', '90-day history', 'Emergency alerts', 'Health reports'],
  },
  {
    tier: 'FAMILY',
    name: 'Family Pro',
    price: '$8.33',
    period: '/mo billed annually',
    features: ['5 care circles', 'Unlimited members', 'Unlimited documents', 'Unlimited tasks', 'Unlimited history', 'Emergency alerts + SMS', 'Weekly email digest'],
  },
];

const TIER_RANK: Record<Tier, number> = { FREE: 0, PLUS: 1, FAMILY: 2 };

const TIER_COLORS: Record<Tier, { bg: string; border: string; badge: string; badgeText: string }> = {
  FREE: { bg: '#fff', border: colors.divider, badge: colors.divider, badgeText: colors.textHint },
  PLUS: { bg: colors.goldLight, border: colors.gold, badge: colors.gold, badgeText: '#fff' },
  FAMILY: { bg: '#ECFDF5', border: colors.success, badge: colors.success, badgeText: '#fff' },
};

export default function SubscriptionScreen() {
  const { user, setUser } = useAuthStore();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const currentTier = (user?.subscriptionTier || 'FREE') as Tier;

  useEffect(() => {
    subscriptionService.status().then((data) => {
      setStatus(data);
      if (user && data.tier !== user.subscriptionTier) {
        setUser({ ...user, subscriptionTier: data.tier });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (tier: 'PLUS' | 'FAMILY') => {
    setActionLoading(true);
    try {
      const { checkoutUrl } = await subscriptionService.checkout(tier);
      if (checkoutUrl) {
        if (Platform.OS === 'web') {
          window.open(checkoutUrl, '_blank');
        } else {
          await Linking.openURL(checkoutUrl);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to start checkout');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    setActionLoading(true);
    try {
      const { portalUrl } = await subscriptionService.portal();
      if (portalUrl) {
        if (Platform.OS === 'web') {
          window.open(portalUrl, '_blank');
        } else {
          await Linking.openURL(portalUrl);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to open billing portal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Your subscription will remain active until the end of the current billing period. You can resubscribe anytime.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel', style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await subscriptionService.cancel();
              setStatus((prev) => prev ? { ...prev, cancelAtPeriodEnd: true } : prev);
              Alert.alert('Cancelled', 'Your subscription will end at the current billing period.');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <Spinner />;

  return (
    <>
      <Stack.Screen options={{ title: 'Subscription' }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Current plan header */}
        <View style={styles.currentHeader}>
          <Text style={styles.currentLabel}>Current Plan</Text>
          <View style={[styles.currentBadge, { backgroundColor: TIER_COLORS[currentTier].badge }]}>
            <Text style={[styles.currentBadgeText, { color: TIER_COLORS[currentTier].badgeText }]}>
              {currentTier === 'FAMILY' ? 'Family Pro' : currentTier === 'PLUS' ? 'Plus' : 'Free'}
            </Text>
          </View>
        </View>

        {/* Billing info for paid users */}
        {currentTier !== 'FREE' && status?.currentPeriodEnd && (
          <View style={styles.billingInfo}>
            <Text style={styles.billingIcon}>
              {status.cancelAtPeriodEnd ? '⏳' : '🔄'}
            </Text>
            <Text style={styles.billingText}>
              {status.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
              {new Date(status.currentPeriodEnd).toLocaleDateString(undefined, {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </Text>
          </View>
        )}

        {/* Plan cards */}
        {PLANS.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const isUpgrade = TIER_RANK[plan.tier] > TIER_RANK[currentTier];
          const tc = TIER_COLORS[plan.tier];

          return (
            <View
              key={plan.tier}
              style={[
                styles.planCard,
                { backgroundColor: tc.bg, borderColor: isCurrent ? tc.border : colors.divider },
                isCurrent && styles.planCardCurrent,
              ]}
            >
              <View style={styles.planTop}>
                <View>
                  <View style={styles.planNameRow}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {isCurrent && (
                      <View style={[styles.currentPill, { backgroundColor: tc.badge }]}>
                        <Text style={styles.currentPillText}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    {plan.period ? <Text style={styles.planPeriod}>{plan.period}</Text> : null}
                  </View>
                </View>
              </View>

              <View style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              {isUpgrade && plan.tier !== 'FREE' && (
                <Button
                  title={`Upgrade to ${plan.name}`}
                  onPress={() => handleUpgrade(plan.tier as 'PLUS' | 'FAMILY')}
                  loading={actionLoading}
                  style={{ marginTop: 12 }}
                />
              )}
              {isCurrent && currentTier !== 'FREE' && !status?.cancelAtPeriodEnd && (
                <View style={styles.manageActions}>
                  <Button
                    title="Manage Billing"
                    variant="outline"
                    onPress={handleManage}
                    loading={actionLoading}
                  />
                  <TouchableOpacity onPress={handleCancel} style={styles.cancelLink}>
                    <Text style={styles.cancelText}>Cancel subscription</Text>
                  </TouchableOpacity>
                </View>
              )}
              {isCurrent && status?.cancelAtPeriodEnd && (
                <View style={styles.cancelledNotice}>
                  <Text style={styles.cancelledText}>
                    Your plan will downgrade to Free at the end of the billing period.
                  </Text>
                  <Button
                    title="Resubscribe"
                    onPress={() => handleUpgrade(currentTier as 'PLUS' | 'FAMILY')}
                    loading={actionLoading}
                    style={{ marginTop: 8 }}
                  />
                </View>
              )}
              {plan.tier === 'FREE' && currentTier !== 'FREE' && !status?.cancelAtPeriodEnd && (
                <Text style={styles.downgradeHint}>Cancel your current plan to switch to Free</Text>
              )}
            </View>
          );
        })}

        {/* Trial reminder */}
        {currentTier === 'FREE' && (
          <View style={styles.trialBanner}>
            <Text style={styles.trialEmoji}>🛡️</Text>
            <View style={styles.trialTextBlock}>
              <Text style={styles.trialBold}>7-day free trial on all paid plans</Text>
              <Text style={styles.trialLight}>Cancel anytime. No questions asked.</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20 },

  currentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  currentLabel: { ...typography.headingMedium, color: colors.textPrimary },
  currentBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14 },
  currentBadgeText: { ...typography.labelMedium, fontWeight: '700' },

  billingInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.primaryLight, padding: 14, borderRadius: 14, marginBottom: 20,
  },
  billingIcon: { fontSize: 20 },
  billingText: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },

  planCard: {
    borderRadius: 18, borderWidth: 2, padding: 20, marginBottom: 14,
  },
  planCardCurrent: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  planTop: { marginBottom: 14 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  planName: { ...typography.headingMedium, color: colors.textPrimary },
  currentPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  currentPillText: { ...typography.labelSmall, color: '#fff', fontWeight: '800', fontSize: 9, letterSpacing: 0.5 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  planPrice: { ...typography.displayMedium, color: colors.textPrimary },
  planPeriod: { ...typography.bodySmall, color: colors.textHint },

  featureList: { gap: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureCheck: { fontSize: 14, color: colors.success, fontWeight: '700' },
  featureText: { ...typography.bodySmall, color: colors.textSecondary },

  manageActions: { marginTop: 14, gap: 10, alignItems: 'center' },
  cancelLink: { padding: 8 },
  cancelText: { ...typography.labelMedium, color: colors.danger, textDecorationLine: 'underline' },

  cancelledNotice: { marginTop: 12, padding: 14, backgroundColor: '#FEF3C7', borderRadius: 12 },
  cancelledText: { ...typography.bodySmall, color: '#92400E', textAlign: 'center' },

  downgradeHint: { ...typography.bodySmall, color: colors.textHint, marginTop: 10, textAlign: 'center', fontStyle: 'italic' },

  trialBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primaryLight, padding: 16, borderRadius: 14, marginTop: 6,
  },
  trialEmoji: { fontSize: 26 },
  trialTextBlock: { flex: 1 },
  trialBold: { ...typography.headingSmall, color: colors.textPrimary },
  trialLight: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
});
