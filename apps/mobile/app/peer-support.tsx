import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { CrossHatch, RadialRings, TopoLines } from '../components/Texture';

// ─── Mock Data ──────────────────────────────────────────────────────

const EMOJI_MOODS = [
  { emoji: '😊', label: 'Great' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😔', label: 'Struggling' },
  { emoji: '😢', label: 'Overwhelmed' },
];

const MY_GROUPS = [
  {
    id: 'g1',
    name: "Alzheimer's Caregivers",
    emoji: '🧠',
    members: 1284,
    activity: 'Very active',
    activityColor: colors.success,
    description: 'Support for those caring for loved ones with Alzheimer\'s and dementia.',
    unread: 5,
  },
  {
    id: 'g2',
    name: 'Long-Distance Caregiving',
    emoji: '✈️',
    members: 743,
    activity: 'Active',
    activityColor: colors.primary,
    description: 'Navigating caregiving when you can\'t be there in person.',
    unread: 2,
  },
];

const DISCOVER_GROUPS = [
  {
    id: 'g3',
    name: 'Spouse Caregivers',
    emoji: '💑',
    members: 956,
    activity: 'Very active',
    activityColor: colors.success,
    description: 'When your partner becomes the one you care for. Share your journey.',
  },
  {
    id: 'g4',
    name: 'Parent Caregivers',
    emoji: '👨‍👩‍👦',
    members: 2103,
    activity: 'Very active',
    activityColor: colors.success,
    description: 'Caring for aging parents while juggling your own family and career.',
  },
  {
    id: 'g5',
    name: 'Working Caregivers',
    emoji: '💼',
    members: 1567,
    activity: 'Active',
    activityColor: colors.primary,
    description: 'Balancing a full-time job with caregiving responsibilities.',
  },
  {
    id: 'g6',
    name: 'Self-Care for Caregivers',
    emoji: '🧘',
    members: 891,
    activity: 'Moderate',
    activityColor: colors.warning,
    description: 'Reminders, tips, and support for taking care of yourself too.',
  },
  {
    id: 'g7',
    name: 'Grief & Loss Support',
    emoji: '🕊️',
    members: 624,
    activity: 'Active',
    activityColor: colors.primary,
    description: 'A safe space for caregivers processing anticipatory grief or loss.',
  },
];

const RECENT_POSTS = [
  {
    id: 'p1',
    avatar: '🌻',
    username: 'SunflowerMom',
    timeAgo: '2h ago',
    group: "Alzheimer's Caregivers",
    content: 'Dad didn\'t recognize me today for the first time. I knew this day would come but nothing prepares you. How did others cope with this moment?',
    likes: 47,
    replies: 23,
  },
  {
    id: 'p2',
    avatar: '🌊',
    username: 'OceanBreeze',
    timeAgo: '4h ago',
    group: 'Long-Distance Caregiving',
    content: 'Finally set up a Ring camera in Mom\'s kitchen after she left the stove on twice. She was resistant at first but now she likes waving at me through it. Small wins!',
    likes: 82,
    replies: 15,
  },
  {
    id: 'p3',
    avatar: '🦋',
    username: 'ButterflyWings',
    timeAgo: '6h ago',
    group: 'Spouse Caregivers',
    content: 'My husband has good days and bad days. Today was a good one \u2014 he remembered our wedding song. I\'m crying happy tears. Cherish every moment.',
    likes: 134,
    replies: 41,
  },
  {
    id: 'p4',
    avatar: '🌱',
    username: 'GrowingStrong',
    timeAgo: '8h ago',
    group: 'Working Caregivers',
    content: 'Does anyone else feel guilty taking a lunch break at work because you\'re not with your loved one? My therapist says it\'s normal but it doesn\'t feel normal.',
    likes: 63,
    replies: 29,
  },
];

const SPOTLIGHT = {
  avatar: '🌟',
  username: 'GentleHeart',
  story: 'Has been caring for her mother with Parkinson\'s for 7 years and still finds time to mentor new caregivers in the community. "The best thing I ever did was ask for help."',
  likes: 312,
};

const RESOURCES = [
  { id: 'r1', emoji: '📖', title: 'Caregiver Burnout: Signs & Recovery', type: 'Article', readTime: '8 min read' },
  { id: 'r2', emoji: '🎥', title: 'Gentle Communication Techniques', type: 'Video', readTime: '12 min watch' },
  { id: 'r3', emoji: '📞', title: 'Caregiver Action Network Hotline', type: 'Hotline', readTime: '1-855-227-3640' },
  { id: 'r4', emoji: '📖', title: 'Managing Caregiver Guilt', type: 'Article', readTime: '6 min read' },
  { id: 'r5', emoji: '🎥', title: 'Bedtime Routines for Dementia Care', type: 'Video', readTime: '15 min watch' },
];

// ─── Component ──────────────────────────────────────────────────────

export default function PeerSupportScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);

  const handleJoinGroup = (groupId: string) => {
    setJoinedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  return (
    <View style={styles.root}>
      <TopoLines color="#1B6B5F" opacity={0.02} variant="wide" />

      {/* ─── Hero ─── */}
      <View style={styles.hero}>
        <CrossHatch color="#fff" opacity={0.04} />
        <RadialRings color="#fff" opacity={0.05} cx={320} cy={40} />
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.heroEmoji}>💬</Text>
        <Text style={styles.heroTitle}>Peer Support</Text>
        <Text style={styles.heroSub}>You are not alone in this journey</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ─── Search ─── */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups, posts, resources..."
            placeholderTextColor={colors.textHint}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ─── Emotional Check-in ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HOW ARE YOU FEELING TODAY?</Text>
          <View style={styles.moodCard}>
            <View style={styles.moodRow}>
              {EMOJI_MOODS.map((mood, index) => (
                <TouchableOpacity
                  key={mood.label}
                  style={[
                    styles.moodBtn,
                    selectedMood === index && styles.moodBtnActive,
                  ]}
                  onPress={() => setSelectedMood(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      selectedMood === index && styles.moodLabelActive,
                    ]}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedMood !== null && (
              <Text style={styles.moodResponse}>
                {selectedMood <= 1
                  ? "That's wonderful! Share your positive energy with the community."
                  : selectedMood === 2
                  ? 'Hanging in there. Remember, every day you show up matters.'
                  : "We're here for you. Consider reaching out in one of the groups below."}
              </Text>
            )}
          </View>
        </View>

        {/* ─── Anonymous Mode Toggle ─── */}
        <View style={styles.anonRow}>
          <View style={styles.anonTextWrap}>
            <Text style={styles.anonTitle}>Anonymous Posting</Text>
            <Text style={styles.anonSub}>Hide your identity when posting</Text>
          </View>
          <Switch
            value={anonymousMode}
            onValueChange={setAnonymousMode}
            trackColor={{ false: colors.divider, true: colors.primaryLight }}
            thumbColor={anonymousMode ? colors.primary : '#ccc'}
          />
        </View>

        {/* ─── My Groups ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY GROUPS</Text>
          {MY_GROUPS.map((group) => (
            <TouchableOpacity key={group.id} style={styles.groupCard} activeOpacity={0.7}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupEmoji}>{group.emoji}</Text>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <View style={styles.groupMeta}>
                    <Text style={styles.groupMembers}>
                      {group.members.toLocaleString()} members
                    </Text>
                    <View style={[styles.activityDot, { backgroundColor: group.activityColor }]} />
                    <Text style={[styles.activityText, { color: group.activityColor }]}>
                      {group.activity}
                    </Text>
                  </View>
                </View>
                {group.unread && group.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{group.unread}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.groupDesc} numberOfLines={2}>
                {group.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Caregiver of the Week ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CAREGIVER OF THE WEEK</Text>
          <View style={styles.spotlightCard}>
            <View style={styles.spotlightHeader}>
              <Text style={styles.spotlightAvatar}>{SPOTLIGHT.avatar}</Text>
              <View>
                <Text style={styles.spotlightName}>{SPOTLIGHT.username}</Text>
                <Text style={styles.spotlightBadge}>Community Champion</Text>
              </View>
            </View>
            <Text style={styles.spotlightStory}>{SPOTLIGHT.story}</Text>
            <View style={styles.spotlightFooter}>
              <Text style={styles.spotlightLikes}>{SPOTLIGHT.likes} people inspired</Text>
            </View>
          </View>
        </View>

        {/* ─── Recent Posts ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT POSTS</Text>
          {RECENT_POSTS.map((post) => (
            <TouchableOpacity key={post.id} style={styles.postCard} activeOpacity={0.7}>
              <View style={styles.postHeader}>
                <Text style={styles.postAvatar}>{post.avatar}</Text>
                <View style={styles.postUserInfo}>
                  <Text style={styles.postUsername}>{post.username}</Text>
                  <Text style={styles.postMeta}>
                    {post.timeAgo} \u00B7 {post.group}
                  </Text>
                </View>
              </View>
              <Text style={styles.postContent} numberOfLines={3}>
                {post.content}
              </Text>
              <View style={styles.postFooter}>
                <Text style={styles.postStat}>\u2764\uFE0F {post.likes}</Text>
                <Text style={styles.postStat}>\uD83D\uDCAC {post.replies}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Discover Groups ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DISCOVER GROUPS</Text>
          {DISCOVER_GROUPS.map((group) => {
            const joined = joinedGroups.includes(group.id);
            return (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupEmoji}>{group.emoji}</Text>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <View style={styles.groupMeta}>
                      <Text style={styles.groupMembers}>
                        {group.members.toLocaleString()} members
                      </Text>
                      <View
                        style={[styles.activityDot, { backgroundColor: group.activityColor }]}
                      />
                      <Text style={[styles.activityText, { color: group.activityColor }]}>
                        {group.activity}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.groupDesc} numberOfLines={2}>
                  {group.description}
                </Text>
                <TouchableOpacity
                  style={[styles.joinBtn, joined && styles.joinBtnJoined]}
                  onPress={() => handleJoinGroup(group.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.joinBtnText, joined && styles.joinBtnTextJoined]}>
                    {joined ? 'Joined' : 'Join Group'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* ─── Resource Library ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RESOURCE LIBRARY</Text>
          {RESOURCES.map((resource) => (
            <TouchableOpacity key={resource.id} style={styles.resourceCard} activeOpacity={0.7}>
              <Text style={styles.resourceEmoji}>{resource.emoji}</Text>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <View style={styles.resourceMeta}>
                  <View style={styles.resourceTypeBadge}>
                    <Text style={styles.resourceTypeText}>{resource.type}</Text>
                  </View>
                  <Text style={styles.resourceReadTime}>{resource.readTime}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Floating Action Button ─── */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Ask the Community</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.heroStart,
    paddingTop: Platform.OS === 'web' ? 48 : 60,
    paddingBottom: 24,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  backBtn: { position: 'absolute', left: 20, top: Platform.OS === 'web' ? 48 : 60 },
  backText: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.8)' },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: { ...typography.displayMedium, color: '#fff' },
  heroSub: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  scroll: { flex: 1 },

  // Search
  searchContainer: { paddingHorizontal: 18, marginTop: 18 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Sections
  section: { paddingHorizontal: 18, marginTop: 24 },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1.5,
    marginBottom: 12,
    fontSize: 11,
  },

  // Mood check-in
  moodCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  moodEmoji: { fontSize: 28, marginBottom: 4 },
  moodLabel: { ...typography.labelSmall, color: colors.textHint, fontSize: 10 },
  moodLabelActive: { color: colors.primary },
  moodResponse: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Anonymous toggle
  anonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  anonTextWrap: { flex: 1, marginRight: 12 },
  anonTitle: { ...typography.headingSmall, color: colors.textPrimary },
  anonSub: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },

  // Group cards
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  groupEmoji: { fontSize: 36, marginRight: 14 },
  groupInfo: { flex: 1 },
  groupName: { ...typography.headingMedium, color: colors.textPrimary },
  groupMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  groupMembers: { ...typography.bodySmall, color: colors.textHint },
  activityDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 10, marginRight: 4 },
  activityText: { ...typography.labelSmall, fontSize: 11 },
  groupDesc: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 18 },
  unreadBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { ...typography.labelSmall, color: '#fff', fontSize: 11, fontWeight: '700' },
  joinBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinBtnJoined: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  joinBtnText: { ...typography.labelMedium, color: colors.primary },
  joinBtnTextJoined: { color: colors.primaryDark },

  // Spotlight
  spotlightCard: {
    backgroundColor: colors.goldLight,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  spotlightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  spotlightAvatar: { fontSize: 40, marginRight: 12 },
  spotlightName: { ...typography.headingMedium, color: colors.textPrimary },
  spotlightBadge: {
    ...typography.labelSmall,
    color: colors.gold,
    fontSize: 11,
    marginTop: 2,
  },
  spotlightStory: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  spotlightFooter: { marginTop: 12, alignItems: 'flex-end' },
  spotlightLikes: { ...typography.labelSmall, color: colors.gold },

  // Post cards
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAvatar: { fontSize: 32, marginRight: 12 },
  postUserInfo: { flex: 1 },
  postUsername: { ...typography.headingSmall, color: colors.textPrimary },
  postMeta: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
  postContent: { ...typography.bodyMedium, color: colors.textSecondary, lineHeight: 22 },
  postFooter: { flexDirection: 'row', marginTop: 12, gap: 18 },
  postStat: { ...typography.labelSmall, color: colors.textHint },

  // Resource cards
  resourceCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  resourceEmoji: { fontSize: 28, marginRight: 14 },
  resourceInfo: { flex: 1 },
  resourceTitle: { ...typography.headingSmall, color: colors.textPrimary },
  resourceMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  resourceTypeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  resourceTypeText: { ...typography.labelSmall, color: colors.primary, fontSize: 10 },
  resourceReadTime: { ...typography.bodySmall, color: colors.textHint },

  // FAB
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 44,
    right: 20,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabIcon: { fontSize: 20, color: '#fff', fontWeight: '700', marginRight: 8 },
  fabText: { ...typography.labelMedium, color: '#fff', fontWeight: '600' },

  bottomSpacer: { height: 100 },
});
