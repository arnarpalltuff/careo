import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '../utils/colors';
import { useAuthStore } from '../stores/authStore';
import { subscriptionService } from '../services/subscriptions';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export default function SubscriptionScreen() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionService.status().then((data) => {
      setStatus(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    try {
      const { checkoutUrl } = await subscriptionService.checkout();
      if (checkoutUrl) {
        await WebBrowser.openBrowserAsync(checkoutUrl);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to start checkout');
    }
  };

  const handleManage = async () => {
    try {
      const { portalUrl } = await subscriptionService.portal();
      if (portalUrl) {
        await WebBrowser.openBrowserAsync(portalUrl);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to open portal');
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Subscription', 'Your subscription will remain active until the end of the billing period.', [
      { text: 'Keep Subscription', style: 'cancel' },
      {
        text: 'Cancel', style: 'destructive',
        onPress: async () => {
          try {
            await subscriptionService.cancel();
            Alert.alert('Cancelled', 'Your subscription will end at the current billing period.');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to cancel');
          }
        },
      },
    ]);
  };

  if (loading) return <Spinner />;

  const isFree = user?.subscriptionTier === 'FREE';

  return (
    <>
      <Stack.Screen options={{ title: 'Subscription' }} />
      <ScrollView style={styles.container}>
        <View style={styles.currentPlan}>
          <Text style={styles.planLabel}>Current Plan</Text>
          <Badge
            label={user?.subscriptionTier || 'FREE'}
            color={isFree ? colors.divider : colors.success}
            textColor={isFree ? colors.textSecondary : '#fff'}
          />
        </View>

        {isFree ? (
          <Card style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>Upgrade to Family</Text>
            <Text style={styles.price}>$14.99/month</Text>
            <View style={styles.benefits}>
              <BenefitRow text="Up to 5 care circles" />
              <BenefitRow text="Up to 15 members per circle" />
              <BenefitRow text="100 documents per circle" />
              <BenefitRow text="Medication adherence reports" />
            </View>
            <Button title="Upgrade" onPress={handleUpgrade} />
          </Card>
        ) : (
          <View style={styles.managePlan}>
            {status?.currentPeriodEnd && (
              <Text style={styles.renewalText}>
                {status.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
                {new Date(status.currentPeriodEnd).toLocaleDateString()}
              </Text>
            )}
            <Button title="Manage Subscription" onPress={handleManage} style={styles.manageBtn} />
            <Button title="Cancel Subscription" variant="ghost" onPress={handleCancel} />
          </View>
        )}
      </ScrollView>
    </>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  currentPlan: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  planLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  upgradeCard: { padding: 24 },
  upgradeTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  price: { fontSize: 28, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  benefits: { marginBottom: 24 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  checkmark: { color: colors.success, fontSize: 16, fontWeight: '700' },
  benefitText: { fontSize: 15, color: colors.textPrimary },
  managePlan: { alignItems: 'center' },
  renewalText: { fontSize: 15, color: colors.textSecondary, marginBottom: 24 },
  manageBtn: { marginBottom: 12, width: '100%' },
});
