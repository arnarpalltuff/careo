import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActionSheetIOS, Platform } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { circleService } from '../../services/circles';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

const ROLE_CONFIG: Record<string, { label: string; color: string; textColor: string; rank: number }> = {
  ADMIN: { label: 'Admin', color: colors.primary, textColor: '#fff', rank: 3 },
  MEMBER: { label: 'Member', color: colors.primaryLight, textColor: colors.primary, rank: 2 },
  VIEWER: { label: 'Viewer', color: colors.divider, textColor: colors.textSecondary, rank: 1 },
};

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCircle = async () => {
    try {
      const data = await circleService.get(id);
      setCircle(data.circle);
    } catch {
      setError('Could not load circle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCircle(); }, []);

  if (loading) return <Spinner />;
  if (error || !circle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Circle not found'}</Text>
        <Button title="Go Back" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  const myMembership = circle.members.find((m: any) => m.user.id === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';
  const sortedMembers = [...circle.members].sort(
    (a: any, b: any) => (ROLE_CONFIG[b.role]?.rank || 0) - (ROLE_CONFIG[a.role]?.rank || 0)
  );

  const handleRoleChange = (member: any) => {
    if (!isAdmin || member.user.id === user?.id) return;

    const roles = ['ADMIN', 'MEMBER', 'VIEWER'];
    const options = [...roles, 'Cancel'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, title: `Change role for ${member.user.firstName}` },
        (idx) => {
          if (idx < roles.length) applyRoleChange(member.id, roles[idx]);
        }
      );
    } else {
      Alert.alert(
        `Change role for ${member.user.firstName}`,
        'Select a new role:',
        [
          ...roles.map((role) => ({ text: role, onPress: () => applyRoleChange(member.id, role) })),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
    }
  };

  const applyRoleChange = async (memberId: string, role: string) => {
    try {
      await circleService.updateMemberRole(id, memberId, role);
      await loadCircle();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = (member: any) => {
    const isSelf = member.user.id === user?.id;
    const title = isSelf ? 'Leave Circle' : `Remove ${member.user.firstName}`;
    const message = isSelf
      ? 'Are you sure you want to leave this circle?'
      : `Remove ${member.user.firstName} ${member.user.lastName} from ${circle.name}?`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isSelf ? 'Leave' : 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await circleService.removeMember(id, member.id);
            if (isSelf) {
              router.replace('/(tabs)/more');
            } else {
              await loadCircle();
            }
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to remove member');
          }
        },
      },
    ]);
  };

  const handleDeleteCircle = () => {
    Alert.alert(
      'Delete Circle',
      `Are you sure you want to delete "${circle.name}"? This will remove all data including tasks, medications, and documents. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await circleService.delete(id);
              router.replace('/(tabs)/more');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete circle');
            }
          },
        },
      ]
    );
  };

  const createdDate = circle.createdAt
    ? new Date(circle.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  return (
    <>
      <Stack.Screen options={{ title: circle.name }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero header */}
        <View style={styles.hero}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroEmoji}>💛</Text>
          </View>
          <Text style={styles.heroName}>{circle.name}</Text>
          <Text style={styles.heroRecipient}>Caring for {circle.careRecipient}</Text>
          {createdDate && <Text style={styles.heroDate}>Created {createdDate}</Text>}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{circle.members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
          </View>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            {(isAdmin || myMembership?.role === 'MEMBER') && (
              <TouchableOpacity onPress={() => router.push('/circle/invite')} style={styles.addBtn}>
                <Text style={styles.addBtnText}>+ Invite</Text>
              </TouchableOpacity>
            )}
          </View>

          {sortedMembers.map((member: any) => {
            const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.VIEWER;
            const isSelf = member.user.id === user?.id;
            const canManage = isAdmin && !isSelf;

            return (
              <View key={member.id} style={styles.memberRow}>
                <Avatar
                  name={`${member.user.firstName} ${member.user.lastName}`}
                  uri={member.user.avatarUrl}
                  size={44}
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.user.firstName} {member.user.lastName}
                    {isSelf ? ' (you)' : ''}
                  </Text>
                  <Text style={styles.memberEmail}>{member.user.email}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => canManage ? handleRoleChange(member) : undefined}
                  disabled={!canManage}
                  activeOpacity={canManage ? 0.6 : 1}
                >
                  <Badge label={rc.label} color={rc.color} textColor={rc.textColor} />
                </TouchableOpacity>
                {(canManage || isSelf) && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(member)}
                    style={styles.removeBtn}
                    accessibilityLabel={isSelf ? 'Leave circle' : `Remove ${member.user.firstName}`}
                  >
                    <Text style={styles.removeBtnText}>{isSelf ? 'Leave' : '×'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Quick links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.linksGrid}>
            {[
              { emoji: '💊', label: 'Medications', route: '/(tabs)/care' },
              { emoji: '📅', label: 'Calendar', route: '/(tabs)/calendar' },
              { emoji: '🏥', label: 'Health Card', route: '/health-card' },
              { emoji: '📄', label: 'Documents', route: '/documents' },
              { emoji: '📊', label: 'Insights', route: '/care-insights' },
              { emoji: '🚨', label: 'Emergency', route: '/emergency' },
            ].map((link, i) => (
              <TouchableOpacity
                key={i}
                style={styles.linkCard}
                onPress={() => router.push(link.route as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.linkEmoji}>{link.emoji}</Text>
                <Text style={styles.linkLabel}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Danger zone */}
        {isAdmin && (
          <View style={styles.dangerSection}>
            <TouchableOpacity onPress={handleDeleteCircle} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Delete Circle</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: colors.bg },
  errorText: { ...typography.bodyLarge, color: colors.danger, marginBottom: 16, textAlign: 'center' },

  hero: {
    alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20,
    backgroundColor: colors.primaryLight, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  heroEmoji: { fontSize: 32 },
  heroName: { ...typography.headingLarge, color: colors.textPrimary, marginBottom: 4 },
  heroRecipient: { ...typography.bodyMedium, color: colors.textSecondary },
  heroDate: { ...typography.bodySmall, color: colors.textHint, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 24 },
  statItem: { alignItems: 'center' },
  statNumber: { ...typography.displaySmall, color: colors.primary },
  statLabel: { ...typography.labelSmall, color: colors.textHint },

  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { ...typography.headingMedium, color: colors.textPrimary },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12 },
  addBtnText: { ...typography.labelSmall, color: '#fff', fontWeight: '700' },

  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  memberInfo: { flex: 1 },
  memberName: { ...typography.headingSmall, color: colors.textPrimary },
  memberEmail: { ...typography.bodySmall, color: colors.textHint, marginTop: 1 },
  removeBtn: { padding: 8 },
  removeBtnText: { ...typography.labelMedium, color: colors.danger },

  linksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  linkCard: {
    width: '31%', backgroundColor: '#fff', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: colors.divider,
  },
  linkEmoji: { fontSize: 24, marginBottom: 6 },
  linkLabel: { ...typography.labelSmall, color: colors.textSecondary, textAlign: 'center' },

  dangerSection: { paddingHorizontal: 20, paddingTop: 32, alignItems: 'center' },
  deleteBtn: { padding: 12 },
  deleteBtnText: { ...typography.labelMedium, color: colors.danger, textDecorationLine: 'underline' },
});
