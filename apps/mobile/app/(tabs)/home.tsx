import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
import { useAuthStore } from '../../stores/authStore';
import { useCircleStore } from '../../stores/circleStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Avatar } from '../../components/ui/Avatar';
import { useHelpBoardStore } from '../../stores/helpBoardStore';
import { useTasks } from '../../hooks/useTasks';
import { useMedications } from '../../hooks/useMedications';
import { useAppointments } from '../../hooks/useAppointments';
import { activityService, ActivityItem } from '../../services/activity';
import { formatDate, formatTime, formatRelative } from '../../utils/formatDate';
import { isDemoMode, DEMO_ACTIVITY } from '../../utils/demoData';
import { TopoLines, CrossHatch, DotGrid, RadialRings, GrainOverlay } from '../../components/Texture';
import { impactLight, notificationSuccess } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Moods ──────────────────────────────────────────────────────────
const moods = [
  { value: 'great', emoji: '😄', label: 'Great', bg: '#E7F9EE', gradient: ['#A8E6CF', '#7CD9B3'] },
  { value: 'good', emoji: '🙂', label: 'Good', bg: '#EEF8F6', gradient: ['#88D8C0', '#5CC5A8'] },
  { value: 'okay', emoji: '😐', label: 'Okay', bg: '#FFF8EB', gradient: ['#FFE0A3', '#FFC857'] },
  { value: 'low', emoji: '😟', label: 'Low', bg: '#FFF1EE', gradient: ['#FFB8A8', '#FF9A85'] },
  { value: 'bad', emoji: '😢', label: 'Bad', bg: '#FEE2E2', gradient: ['#FCA5A5', '#F87171'] },
];

const moodMessages: Record<string, string> = {
  great: 'is doing great today',
  good: 'is having a good day',
  okay: 'is doing okay',
  low: 'is having a tough day',
  bad: 'needs extra love today',
};

// ─── Activity type config ───────────────────────────────────────────
const activityConfig: Record<string, { emoji: string; bg: string }> = {
  task_completed: { emoji: '✅', bg: colors.tintTask },
  med_taken: { emoji: '💊', bg: colors.tintMed },
  med_missed: { emoji: '⚠️', bg: colors.tintEmergency },
  journal_added: { emoji: '📝', bg: colors.tintAppt },
  emergency: { emoji: '🚨', bg: colors.tintEmergency },
  member_joined: { emoji: '👋', bg: colors.tintTask },
};

// ─── Component ──────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { circles, activeCircleId } = useCircleStore();
  const { caringFor, todayMood, todayMoodDate, setTodayMood, streakDays } = useOnboardingStore();
  const { requests } = useHelpBoardStore();
  const { tasks, fetchTasks } = useTasks();
  const { medications, fetchMedications } = useMedications();
  const { appointments, fetchAppointments } = useAppointments();
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMood = todayMoodDate === todayStr ? todayMood : null;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();

    // Gentle pulse for the briefing card
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadData = useCallback(async () => {
    if (!activeCircleId) return;
    await Promise.all([
      fetchTasks({ status: 'PENDING' }),
      fetchMedications(),
      fetchAppointments({}),
      isDemoMode()
        ? Promise.resolve().then(() => setActivityFeed(DEMO_ACTIVITY as ActivityItem[]))
        : activityService.list(activeCircleId, 10)
            .then((data) => setActivityFeed(data.activity))
            .catch(() => {}),
    ]);
  }, [activeCircleId]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const activeCircle = circles.find((c) => c.id === activeCircleId);
  const openRequests = requests.filter((r) => r.status === 'open').length;

  // Build timeline from real data
  const timelineItems: { id: string; type: string; emoji: string; title: string; subtitle: string; badge: string; badgeColor: string; gradient: string[] }[] = [];

  for (const med of (medications || []).slice(0, 2)) {
    const nextSchedule = (med.schedules || [])[0];
    if (nextSchedule) {
      timelineItems.push({
        id: `med-${med.id}`,
        type: 'med',
        emoji: '💊',
        title: `${med.name} ${med.dosage}`,
        subtitle: `${nextSchedule.label} — ${formatTime(nextSchedule.time)}`,
        badge: 'Today',
        badgeColor: '#E8725A',
        gradient: ['#FFE5E0', '#FFF1EE'],
      });
    }
  }

  for (const task of (tasks || []).slice(0, 2)) {
    timelineItems.push({
      id: `task-${task.id}`,
      type: 'task',
      emoji: '✓',
      title: task.title,
      subtitle: task.assignedTo ? `Assigned to ${task.assignedTo.firstName}` : 'Unassigned',
      badge: task.dueDate ? formatDate(task.dueDate) : 'No date',
      badgeColor: colors.primary,
      gradient: ['#E0F2EF', '#EEF8F6'],
    });
  }

  for (const appt of (appointments || []).slice(0, 1)) {
    timelineItems.push({
      id: `appt-${appt.id}`,
      type: 'appt',
      emoji: '🩺',
      title: appt.title + (appt.doctor ? ` — ${appt.doctor}` : ''),
      subtitle: appt.location || '',
      badge: formatDate(appt.date),
      badgeColor: '#7C6EDB',
      gradient: ['#EDE8FF', '#F0EEFF'],
    });
  }

  return (
    <View style={styles.root}>
      <TopoLines color="#1B6B5F" opacity={0.025} variant="wide" />
      <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>

          {/* ─── Hero Header with Gradient ─── */}
          <LinearGradient
            colors={['#134E45', '#1B6B5F', '#2D8B7E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* Texture + decorative circles */}
            <CrossHatch color="#fff" opacity={0.04} />
            <RadialRings color="#fff" opacity={0.05} cx={320} cy={40} />
            <View style={styles.heroDecor1} />
            <View style={styles.heroDecor2} />
            <View style={styles.heroDecor3} />

            <View style={styles.heroContent}>
              <View>
                <Text style={styles.heroGreeting}>{greeting()},</Text>
                <Text style={styles.heroName}>{user?.firstName}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/more')} style={styles.avatarRing} accessibilityRole="button" accessibilityLabel="Go to profile">
                <Avatar name={`${user?.firstName} ${user?.lastName}`} uri={user?.avatarUrl} size={48} />
              </TouchableOpacity>
            </View>

            {/* Streak inside hero */}
            {streakDays > 0 && (
              <View style={styles.streakPill}>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={styles.streakText}>{streakDays} day streak</Text>
                {streakDays >= 7 && <View style={styles.streakBadge}><Text style={styles.streakBadgeText}>Amazing!</Text></View>}
              </View>
            )}

            {/* Status pills inside hero */}
            <View style={styles.heroStats}>
              <View style={styles.heroStatPill}>
                <Text style={styles.heroStatEmoji}>💊</Text>
                <Text style={styles.heroStatText}>{medications?.length || 0} meds</Text>
              </View>
              <View style={styles.heroStatPill}>
                <Text style={styles.heroStatEmoji}>✓</Text>
                <Text style={styles.heroStatText}>{tasks?.length || 0} tasks</Text>
              </View>
              <View style={styles.heroStatPill}>
                <Text style={styles.heroStatEmoji}>📅</Text>
                <Text style={styles.heroStatText}>{appointments?.length || 0} appts</Text>
              </View>
            </View>
          </LinearGradient>

          {/* ─── Mood Check-in ─── */}
          <View style={styles.checkinCard}>
            {!currentMood ? (
              <>
                <Text style={styles.checkinQ}>
                  How is {caringFor || 'your loved one'} today?
                </Text>
                <View style={styles.moodRow}>
                  {moods.map((m) => (
                    <TouchableOpacity
                      key={m.value}
                      style={styles.moodBtn}
                      onPress={() => { notificationSuccess(); setTodayMood(m.value); }}
                      activeOpacity={0.6}
                      accessibilityRole="button"
                      accessibilityLabel={`Set mood to ${m.label}`}
                    >
                      <LinearGradient colors={m.gradient} style={styles.moodGradient}>
                        <Text style={styles.moodEmoji}>{m.emoji}</Text>
                      </LinearGradient>
                      <Text style={styles.moodLabel}>{m.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.checkinDone}>
                <LinearGradient
                  colors={moods.find((m) => m.value === currentMood)?.gradient || ['#eee', '#ddd']}
                  style={styles.moodResult}
                >
                  <Text style={{ fontSize: 36 }}>{moods.find((m) => m.value === currentMood)?.emoji}</Text>
                </LinearGradient>
                <View style={styles.checkinDoneText}>
                  <Text style={styles.checkinDoneTitle}>{caringFor} {moodMessages[currentMood!]}</Text>
                  <Text style={styles.checkinDoneHint}>Your family can see this</Text>
                </View>
              </View>
            )}
          </View>

          {/* ─── AI Daily Briefing ─── */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={['#F0EEFF', '#E8F4FD', '#EEF8F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.briefingCard}
            >
              <DotGrid color="#7C6EDB" opacity={0.06} spacing={16} />
              <View style={styles.briefingGlow} />
              <View style={styles.briefingHeader}>
                <LinearGradient colors={['#7C6EDB', '#5B4FC7']} style={styles.briefingIcon}>
                  <Text style={{ fontSize: 18 }}>🤖</Text>
                </LinearGradient>
                <View>
                  <Text style={styles.briefingTitle}>Today's Care Briefing</Text>
                  <Text style={styles.briefingMeta}>AI-generated • Updated just now</Text>
                </View>
              </View>
              <View style={styles.briefingBody}>
                <View style={styles.briefingItem}>
                  <View style={[styles.briefingBullet, { backgroundColor: colors.accent }]} />
                  <Text style={styles.briefingText}>
                    <Text style={{ fontWeight: '700' }}>3 medications</Text> scheduled today. Lisinopril at 8am & 8pm, Vitamin D at 9am.
                  </Text>
                </View>
                <View style={styles.briefingItem}>
                  <View style={[styles.briefingBullet, { backgroundColor: colors.warning }]} />
                  <Text style={styles.briefingText}>
                    <Text style={{ fontWeight: '700', color: '#B45309' }}>Blood pressure trending up</Text> — avg systolic 5 pts higher than last week.
                  </Text>
                </View>
                <View style={styles.briefingItem}>
                  <View style={[styles.briefingBullet, { backgroundColor: '#7C6EDB' }]} />
                  <Text style={styles.briefingText}>
                    <Text style={{ fontWeight: '700' }}>Cardiology follow-up</Text> with Dr. Patel in 2 days. Bring BP readings.
                  </Text>
                </View>
                <View style={styles.briefingItem}>
                  <View style={[styles.briefingBullet, { backgroundColor: colors.primary }]} />
                  <Text style={styles.briefingText}>
                    <Text style={{ fontWeight: '700' }}>Sarah</Text> is on shift today (7am–3pm). Mike has backup coverage.
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ─── Wellness Banner ─── */}
          <TouchableOpacity
            style={styles.wellnessBanner}
            onPress={() => router.push('/wellness-check')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#E0F2EF', '#D4EDE8']} style={styles.wellnessGradient}>
              <Text style={styles.wellnessEmoji}>🧘</Text>
              <View style={styles.wellnessText}>
                <Text style={styles.wellnessTitle}>Weekly wellness check</Text>
                <Text style={styles.wellnessSub}>How are you really doing?</Text>
              </View>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.wellnessArrow}>
                <Text style={styles.wellnessArrowText}>→</Text>
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>

          {/* ─── Right Now ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RIGHT NOW</Text>
            <View style={styles.timelineStack}>
              {timelineItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => item.type === 'appt' ? router.push('/(tabs)/calendar') : router.push('/(tabs)/care')}
                >
                  <LinearGradient
                    colors={item.gradient as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.timelineCard}
                  >
                    <View style={styles.timelineLeft}>
                      <View style={styles.timelineEmojiWrap}>
                        <Text style={styles.timelineEmoji}>{item.emoji}</Text>
                      </View>
                      <View style={styles.timelineInfo}>
                        <Text style={styles.timelineTitle}>{item.title}</Text>
                        <Text style={styles.timelineSub}>{item.subtitle}</Text>
                      </View>
                    </View>
                    <View style={[styles.timeBadge, { backgroundColor: item.badgeColor }]}>
                      <Text style={styles.timeBadgeText}>{item.badge}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─── Quick Actions ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            <View style={styles.quickGrid}>
              <QuickBtn emoji="✓" label="Add Task" gradient={['#1B6B5F', '#2D8B7E']} onPress={() => router.push('/task/add')} />
              <QuickBtn emoji="💊" label="Log Dose" gradient={['#E8725A', '#F09080']} onPress={() => router.push('/(tabs)/care')} />
              <QuickBtn emoji="📊" label="Vitals" gradient={['#0984E3', '#4BA3E8']} onPress={() => router.push('/vitals')} />
              <QuickBtn emoji="📅" label="Appt" gradient={['#7C6EDB', '#9B8FE8']} onPress={() => router.push('/appointment/add')} />
            </View>
            <View style={[styles.quickGrid, { marginTop: 10 }]}>
              <QuickBtn emoji="🩺" label="Symptoms" gradient={['#6C5CE7', '#8B7FEE']} onPress={() => router.push('/symptoms')} />
              <QuickBtn emoji="🕐" label="Timeline" gradient={['#D4A853', '#E0BC6E']} onPress={() => router.push('/care-timeline')} />
              <QuickBtn emoji="👥" label="Shifts" gradient={['#00B894', '#2ECDA7']} onPress={() => router.push('/shifts')} />
              <QuickBtn emoji="🚨" label="SOS" gradient={['#EF4444', '#F87171']} onPress={() => router.push('/emergency')} />
            </View>
            <View style={[styles.quickGrid, { marginTop: 10 }]}>
              <QuickBtn emoji="⚠️" label="Drug Check" gradient={['#B45309', '#D97706']} onPress={() => router.push('/drug-interactions')} />
              <QuickBtn emoji="🧠" label="Dementia" gradient={['#7C3AED', '#9B6FE8']} onPress={() => router.push('/dementia-care')} />
              <QuickBtn emoji="🌙" label="Sleep" gradient={['#1E40AF', '#3B82F6']} onPress={() => router.push('/sleep-monitor')} />
              <QuickBtn emoji="📋" label="Dr Report" gradient={['#0F766E', '#2DD4BF']} onPress={() => router.push('/doctor-report')} />
            </View>
          </View>

          {/* ─── Invite Banner ─── */}
          {activeCircle && activeCircle.memberCount <= 1 && (
            <TouchableOpacity
              onPress={() => router.push('/invite')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.accent, '#F09080']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inviteCard}
              >
                <View style={styles.inviteGlow} />
                <View style={styles.inviteInner}>
                  <Text style={styles.inviteEmoji}>👨‍👩‍👧</Text>
                  <View style={styles.inviteText}>
                    <Text style={styles.inviteTitle}>Invite your family</Text>
                    <Text style={styles.inviteSub}>Care is easier together</Text>
                  </View>
                  <View style={styles.inviteArrow}>
                    <Text style={styles.inviteArrowText}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ─── Help Board + AI Assistant + Community ─── */}
          <View style={styles.dualRow}>
            <TouchableOpacity style={styles.dualCard} onPress={() => router.push('/help-board')} activeOpacity={0.85}>
              <LinearGradient colors={['#FFF1EE', '#FFE5E0']} style={styles.dualGradient}>
                <Text style={styles.dualEmoji}>🙋</Text>
                <Text style={styles.dualTitle}>Help Board</Text>
                <Text style={styles.dualSub}>{openRequests} open</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dualCard} onPress={() => router.push('/care-assistant')} activeOpacity={0.85}>
              <LinearGradient colors={['#F0EEFF', '#E5E0FF']} style={styles.dualGradient}>
                <Text style={styles.dualEmoji}>🤖</Text>
                <Text style={styles.dualTitle}>Care AI</Text>
                <Text style={styles.dualSub}>Ask anything</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ─── Community + Elder Mode ─── */}
          <View style={styles.dualRow}>
            <TouchableOpacity style={styles.dualCard} onPress={() => router.push('/peer-support')} activeOpacity={0.85}>
              <LinearGradient colors={['#EEF8F6', '#E0F2EF']} style={styles.dualGradient}>
                <Text style={styles.dualEmoji}>💬</Text>
                <Text style={styles.dualTitle}>Community</Text>
                <Text style={styles.dualSub}>Peer support</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dualCard} onPress={() => router.push('/elder-mode')} activeOpacity={0.85}>
              <LinearGradient colors={['#FFF8EB', '#FFF0D6']} style={styles.dualGradient}>
                <Text style={styles.dualEmoji}>👴</Text>
                <Text style={styles.dualTitle}>Elder Mode</Text>
                <Text style={styles.dualSub}>Simplified view</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ─── Activity ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACTIVITY</Text>
            <View style={styles.activityCard}>
              {activityFeed.length === 0 && (
                <Text style={styles.emptyActivity}>No recent activity</Text>
              )}
              {activityFeed.map((item, i) => {
                const cfg = activityConfig[item.type] || { emoji: '📋', bg: colors.tintTask };
                const firstName = item.userName.split(' ')[0];
                const isMe = item.userId === user?.id;
                return (
                  <View key={item.id} style={[styles.actRow, i < activityFeed.length - 1 && styles.actRowBorder]}>
                    <View style={[styles.actIcon, { backgroundColor: cfg.bg }]}>
                      <Text style={{ fontSize: 16 }}>{cfg.emoji}</Text>
                    </View>
                    <View style={styles.actContent}>
                      <Text style={styles.actText}>
                        <Text style={styles.actWho}>{isMe ? 'You' : firstName} </Text>
                        {item.title}
                      </Text>
                      <Text style={styles.actTime}>{formatRelative(item.timestamp)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Quick Action Button ────────────────────────────────────────────

function QuickBtn({ emoji, label, gradient, onPress }: {
  emoji: string; label: string; gradient: [string, string]; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={() => { impactLight(); onPress(); }} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={label}>
      <LinearGradient colors={gradient} style={styles.quickDot}>
        <Text style={styles.quickEmoji}>{emoji}</Text>
      </LinearGradient>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flex: 1 },

  // ─── Hero ───
  hero: {
    paddingTop: Platform.OS === 'web' ? 48 : 60,
    paddingBottom: 24,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroDecor2: {
    position: 'absolute',
    bottom: -20,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroDecor3: {
    position: 'absolute',
    top: 30,
    left: '40%' as any,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroGreeting: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.7)',
  },
  heroName: {
    ...typography.displayMedium,
    color: '#FFFFFF',
    marginTop: 2,
  },
  avatarRing: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 27,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  streakFire: { fontSize: 14 },
  streakText: { ...typography.labelSmall, color: 'rgba(255,255,255,0.9)' },
  streakBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  streakBadgeText: {
    ...typography.labelSmall,
    fontSize: 10,
    color: '#5D4200',
    fontWeight: '700',
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  heroStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroStatEmoji: { fontSize: 12 },
  heroStatText: { ...typography.labelSmall, color: 'rgba(255,255,255,0.85)', fontSize: 11 },

  // ─── Check-in ───
  checkinCard: {
    marginHorizontal: 18,
    marginBottom: 20,
    padding: 22,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#1B6B5F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  checkinQ: {
    ...typography.displaySmall,
    color: colors.textPrimary,
    marginBottom: 18,
    textAlign: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  moodGradient: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { ...typography.labelSmall, color: colors.textSecondary, fontSize: 11 },
  checkinDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  moodResult: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinDoneText: { flex: 1 },
  checkinDoneTitle: { ...typography.headingMedium, color: colors.textPrimary },
  checkinDoneHint: { ...typography.bodySmall, color: colors.textHint, marginTop: 3 },

  // ─── AI Briefing ───
  briefingCard: {
    marginHorizontal: 18,
    marginBottom: 20,
    padding: 22,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#7C6EDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  briefingGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(124,110,219,0.08)',
  },
  briefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  briefingIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingTitle: {
    ...typography.headingMedium,
    color: '#4A3B8C',
  },
  briefingMeta: {
    ...typography.labelSmall,
    color: '#8B7FBF',
    fontSize: 10,
    marginTop: 2,
  },
  briefingBody: { gap: 10 },
  briefingItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  briefingBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  briefingText: {
    ...typography.bodySmall,
    color: '#3D3565',
    flex: 1,
    lineHeight: 20,
  },

  // ─── Wellness Banner ───
  wellnessBanner: {
    marginHorizontal: 18,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  wellnessGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  wellnessEmoji: { fontSize: 32 },
  wellnessText: { flex: 1 },
  wellnessTitle: { ...typography.headingMedium, color: colors.primary },
  wellnessSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  wellnessArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wellnessArrowText: { fontSize: 18, color: '#fff', fontWeight: '600' },

  // ─── Section ───
  section: {
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1.5,
    marginBottom: 14,
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── Timeline ───
  timelineStack: { gap: 10 },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  timelineEmojiWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineEmoji: { fontSize: 22 },
  timelineInfo: { flex: 1 },
  timelineTitle: { ...typography.headingSmall, color: colors.textPrimary },
  timelineSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timeBadgeText: {
    ...typography.labelSmall,
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },

  // ─── Quick Actions ───
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    minHeight: 44,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickDot: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  quickEmoji: {
    fontSize: 22,
    color: '#fff',
  },
  quickLabel: {
    ...typography.labelSmall,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },

  // ─── Invite ───
  inviteCard: {
    marginHorizontal: 18,
    marginBottom: 24,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  inviteGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ translateX: 50 }, { translateY: -50 }],
  },
  inviteInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  inviteEmoji: { fontSize: 34 },
  inviteText: { flex: 1 },
  inviteTitle: { ...typography.headingMedium, color: '#fff' },
  inviteSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  inviteArrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteArrowText: { fontSize: 20, color: '#fff', fontWeight: '600' },

  // ─── Dual cards ───
  dualRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 24,
  },
  dualCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  dualGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  dualEmoji: { fontSize: 32, marginBottom: 8 },
  dualTitle: { ...typography.headingSmall, color: colors.textPrimary },
  dualSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },

  // ─── Activity ───
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  actIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actContent: { flex: 1 },
  actText: { ...typography.bodyMedium, color: colors.textPrimary },
  actWho: { fontWeight: '600' },
  actTime: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
  emptyActivity: { ...typography.bodyMedium, color: colors.textHint, textAlign: 'center', paddingVertical: 20 },
});
