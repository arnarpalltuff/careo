import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuText}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll}>
        <View style={styles.profile}>
          <Avatar name={`${user?.firstName} ${user?.lastName}`} uri={user?.avatarUrl} size={72} />
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.group}>
          <MenuItem label="Care Circles" onPress={() => router.push('/circle/create')} />
        </View>

        <View style={styles.group}>
          <MenuItem label="Documents" onPress={() => router.push('/documents')} />
          <MenuItem label="Emergency History" onPress={() => router.push('/emergency')} />
        </View>

        <View style={styles.group}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/subscription')}>
            <View style={styles.subRow}>
              <Text style={styles.menuText}>Subscription</Text>
              <Badge
                label={user?.subscriptionTier || 'FREE'}
                color={user?.subscriptionTier === 'FAMILY' ? colors.success : colors.divider}
                textColor={user?.subscriptionTier === 'FAMILY' ? '#fff' : colors.textSecondary}
              />
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  profile: { alignItems: 'center', paddingVertical: 32 },
  name: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginTop: 12 },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  group: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuText: { fontSize: 16, color: colors.textPrimary },
  chevron: { fontSize: 20, color: colors.textHint },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 32,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.danger },
});
