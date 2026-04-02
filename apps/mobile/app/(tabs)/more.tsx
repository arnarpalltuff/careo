import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { CrossHatch, RadialRings, TopoLines } from '../../components/Texture';

const menuSections = [
  {
    title: 'HEALTH TRACKING',
    items: [
      { label: 'Vital Signs', emoji: '📊', route: '/vitals', bg: '#E8F4FD' },
      { label: 'Symptom Tracker', emoji: '🩺', route: '/symptoms', bg: colors.tintAppt },
      { label: 'Care Timeline', emoji: '🕐', route: '/care-timeline', bg: colors.tintJournal },
      { label: 'Health Card', emoji: '🏥', route: '/health-card', bg: colors.tintMed },
      { label: 'Care Insights', emoji: '📈', route: '/care-insights', bg: colors.tintTask },
      { label: 'Drug Interactions', emoji: '⚠️', route: '/drug-interactions', bg: colors.tintEmergency },
      { label: 'Sleep Monitor', emoji: '🌙', route: '/sleep-monitor', bg: '#E8F0FD' },
      { label: 'Dementia Care', emoji: '🧠', route: '/dementia-care', bg: colors.tintAppt },
    ],
  },
  {
    title: 'COORDINATION',
    items: [
      { label: 'Care Shifts', emoji: '📅', route: '/shifts', bg: colors.tintTask },
      { label: 'Care Circles', emoji: '👥', route: '/circle/create', bg: colors.tintTask },
      { label: 'Help Board', emoji: '🙋', route: '/help-board', bg: colors.tintMed },
      { label: 'Documents', emoji: '📄', route: '/documents', bg: colors.tintJournal },
      { label: 'Care Assistant', emoji: '🤖', route: '/care-assistant', bg: colors.tintAppt },
      { label: 'Peer Support', emoji: '💬', route: '/peer-support', bg: colors.tintTask },
      { label: 'Doctor Report', emoji: '📋', route: '/doctor-report', bg: colors.tintJournal },
    ],
  },
  {
    title: 'SAFETY',
    items: [
      { label: 'Emergency', emoji: '🚨', route: '/emergency', bg: colors.tintEmergency },
      { label: 'Protocols', emoji: '📋', route: '/protocols', bg: colors.tintMed },
      { label: 'Burnout Check', emoji: '🧘', route: '/burnout-check', bg: colors.tintJournal },
      { label: 'Elder Mode', emoji: '👴', route: '/elder-mode', bg: colors.tintTask },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Notifications & Email', emoji: '🔔', route: '/notification-settings', bg: colors.tintAppt },
      { label: 'Subscription', emoji: '⭐', route: '/subscription', bg: colors.goldLight, showBadge: true },
      { label: 'Privacy Policy', emoji: '🔒', route: '/privacy-policy', bg: colors.tintAppt },
      { label: 'Invite Family', emoji: '📤', route: '/invite', bg: colors.tintMed },
    ],
  },
];

export default function MoreScreen() {
  const { user } = useAuthStore();
  const { caringFor } = useOnboardingStore();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.root}>
      <TopoLines color="#1B6B5F" opacity={0.02} variant="wide" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ─── Profile Hero ─── */}
        <View style={styles.profileHero}>
          <CrossHatch color="#fff" opacity={0.04} />
          <RadialRings color="#fff" opacity={0.05} cx={320} cy={30} />
          <TouchableOpacity onPress={() => router.push('/edit-profile')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Edit profile">
            <View style={styles.avatarWrap}>
              <Avatar name={`${user?.firstName} ${user?.lastName}`} uri={user?.avatarUrl} size={88} />
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>Edit</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {caringFor && (
            <View style={styles.caringPill}>
              <Text style={styles.caringIcon}>💛</Text>
              <Text style={styles.caringText}>Caring for {caringFor}</Text>
            </View>
          )}
        </View>

        {/* ─── Menu ─── */}
        {menuSections.map((section, si) => (
          <View key={si}>
            {(section as any).title && (
              <Text style={styles.sectionTitle}>{(section as any).title}</Text>
            )}
          <View style={styles.menuGroup}>
            {section.items.map((item, ii) => (
              <TouchableOpacity
                key={ii}
                style={[styles.menuItem, ii < section.items.length - 1 && styles.menuBorder]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                  <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <View style={styles.menuRight}>
                  {(item as any).showBadge && (
                    <Badge
                      label={user?.subscriptionTier === 'FAMILY' ? 'Family Pro' : user?.subscriptionTier === 'PLUS' ? 'Plus' : 'Free'}
                      color={user?.subscriptionTier === 'FAMILY' ? colors.success : user?.subscriptionTier === 'PLUS' ? colors.gold : colors.divider}
                      textColor={user?.subscriptionTier === 'FREE' ? colors.textHint : '#fff'}
                    />
                  )}
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel="Log out">
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Profile
  profileHero: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 56 : 72,
    paddingBottom: 28,
    backgroundColor: colors.heroStart,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 20,
  },
  avatarWrap: {
    position: 'relative',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 48,
    padding: 3,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  editBadgeText: { ...typography.labelSmall, color: '#fff', fontWeight: '700', fontSize: 10 },
  name: {
    ...typography.displaySmall,
    color: '#fff',
    marginTop: 14,
  },
  email: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  caringPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  caringIcon: { fontSize: 14 },
  caringText: { ...typography.labelSmall, color: 'rgba(255,255,255,0.9)' },

  // Menu
  sectionTitle: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1.5,
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 22,
    marginBottom: 8,
    marginTop: 4,
  },
  menuGroup: {
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    flex: 1,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    fontSize: 24,
    color: colors.border,
    fontWeight: '300',
  },

  logoutBtn: {
    marginHorizontal: 18,
    marginTop: 6,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
  },
  logoutText: {
    ...typography.labelLarge,
    color: colors.danger,
  },
});
