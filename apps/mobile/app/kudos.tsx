import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useCircleStore } from '../stores/circleStore';
import { useAuthStore } from '../stores/authStore';
import { kudosService } from '../services/kudos';
import { Avatar } from '../components/ui/Avatar';
import { Spinner } from '../components/ui/Spinner';
import { formatRelative } from '../utils/formatDate';

const emojiOptions = ['💛', '🌟', '👏', '💪', '🙏', '❤️', '🏆', '🎉'];

export default function KudosScreen() {
  const { activeCircleId, circles } = useCircleStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'feed' | 'leaderboard' | 'send'>('feed');
  const [kudosList, setKudosList] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Send form
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [emoji, setEmoji] = useState('💛');
  const [sending, setSending] = useState(false);

  const activeCircle = circles.find((c) => c.id === activeCircleId);

  const loadData = useCallback(async () => {
    if (!activeCircleId) return;
    try {
      const [kData, lData] = await Promise.all([
        kudosService.list(activeCircleId),
        kudosService.leaderboard(activeCircleId),
      ]);
      setKudosList(kData.kudos);
      setLeaderboard(lData.leaderboard);
    } catch {} finally {
      setLoading(false);
    }
  }, [activeCircleId]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSend = async () => {
    if (!selectedUser || !message || !activeCircleId) {
      Alert.alert('Required', 'Select a person and write a message.');
      return;
    }
    setSending(true);
    try {
      await kudosService.send(activeCircleId, { toUserId: selectedUser, message, emoji });
      setMessage('');
      setSelectedUser(null);
      setTab('feed');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send kudos');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <View style={[styles.root, styles.center]}><Spinner /></View>;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Kudos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['feed', 'leaderboard', 'send'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'feed' ? '💛 Feed' : t === 'leaderboard' ? '🏆 Board' : '✨ Send'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {tab === 'feed' && (
          <>
            {kudosList.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 48 }}>💛</Text>
                <Text style={styles.emptyTitle}>No kudos yet</Text>
                <Text style={styles.emptySub}>Recognize a family member for their caregiving</Text>
                <TouchableOpacity style={styles.sendFirstBtn} onPress={() => setTab('send')}>
                  <Text style={styles.sendFirstText}>Send first kudos</Text>
                </TouchableOpacity>
              </View>
            )}
            {kudosList.map((k) => (
              <View key={k.id} style={styles.kudosCard}>
                <View style={styles.kudosTop}>
                  <Avatar name={`${k.fromUser.firstName} ${k.fromUser.lastName}`} uri={k.fromUser.avatarUrl} size={36} />
                  <View style={styles.kudosInfo}>
                    <Text style={styles.kudosSender}>{k.fromUser.firstName}</Text>
                    <Text style={styles.kudosArrow}>sent kudos to</Text>
                    <Text style={styles.kudosReceiver}>{k.toUser.firstName}</Text>
                  </View>
                  <Text style={{ fontSize: 28 }}>{k.emoji}</Text>
                </View>
                <Text style={styles.kudosMessage}>{k.message}</Text>
                <Text style={styles.kudosTime}>{formatRelative(k.createdAt)}</Text>
              </View>
            ))}
          </>
        )}

        {tab === 'leaderboard' && (
          <>
            {leaderboard.map((entry, i) => (
              <View key={entry.user.id} style={styles.leaderRow}>
                <Text style={styles.rank}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</Text>
                <Avatar name={`${entry.user.firstName} ${entry.user.lastName}`} uri={entry.user.avatarUrl} size={40} />
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>{entry.user.firstName} {entry.user.lastName}</Text>
                  <Text style={styles.leaderStats}>
                    {entry.kudosReceived} received · {entry.tasksCompleted} tasks · {entry.kudosSent} sent
                  </Text>
                </View>
                <Text style={styles.leaderScore}>{entry.contributionScore}</Text>
              </View>
            ))}
          </>
        )}

        {tab === 'send' && (
          <View style={styles.sendContainer}>
            <Text style={styles.sendTitle}>Send kudos to...</Text>

            {/* Emoji picker */}
            <View style={styles.emojiRow}>
              {emojiOptions.map((e) => (
                <TouchableOpacity key={e} style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]} onPress={() => setEmoji(e)}>
                  <Text style={{ fontSize: 28 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Member picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll}>
              {leaderboard.filter(m => m.user.id !== user?.id).map((m) => (
                <TouchableOpacity
                  key={m.user.id}
                  style={[styles.memberBtn, selectedUser === m.user.id && styles.memberBtnActive]}
                  onPress={() => setSelectedUser(m.user.id)}
                >
                  <Avatar name={`${m.user.firstName} ${m.user.lastName}`} uri={m.user.avatarUrl} size={48} />
                  <Text style={[styles.memberName, selectedUser === m.user.id && styles.memberNameActive]}>
                    {m.user.firstName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Thank them for something specific..."
              placeholderTextColor={colors.textHint}
              multiline
            />

            <TouchableOpacity
              style={[styles.sendBtn, (!selectedUser || !message) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!selectedUser || !message || sending}
            >
              <Text style={styles.sendBtnText}>{sending ? 'Sending...' : `Send ${emoji}`}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: Platform.OS === 'web' ? 24 : 56, paddingBottom: 12,
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 28, color: colors.primary, fontWeight: '300' },
  title: { ...typography.displaySmall, color: colors.textPrimary },
  tabs: { flexDirection: 'row', marginHorizontal: 18, marginBottom: 16, backgroundColor: colors.divider, borderRadius: 12, padding: 3 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { ...typography.labelMedium, color: colors.textHint },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  // Feed
  kudosCard: {
    marginHorizontal: 18, marginBottom: 12, backgroundColor: '#fff', padding: 18, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  kudosTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  kudosInfo: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  kudosSender: { ...typography.headingSmall, color: colors.primary },
  kudosArrow: { ...typography.bodySmall, color: colors.textHint },
  kudosReceiver: { ...typography.headingSmall, color: colors.accent },
  kudosMessage: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: 8, fontStyle: 'italic' },
  kudosTime: { ...typography.labelSmall, color: colors.textHint },
  // Empty
  emptyCard: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { ...typography.displaySmall, color: colors.textPrimary, marginTop: 16 },
  emptySub: { ...typography.bodyMedium, color: colors.textHint, textAlign: 'center', marginTop: 8 },
  sendFirstBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 20 },
  sendFirstText: { ...typography.button, color: '#fff' },
  // Leaderboard
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginBottom: 10,
    backgroundColor: '#fff', padding: 16, borderRadius: 16, gap: 12,
  },
  rank: { fontSize: 20, width: 32, textAlign: 'center' },
  leaderInfo: { flex: 1 },
  leaderName: { ...typography.headingSmall, color: colors.textPrimary },
  leaderStats: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
  leaderScore: { ...typography.headingLarge, color: colors.primary },
  // Send
  sendContainer: { paddingHorizontal: 18 },
  sendTitle: { ...typography.displaySmall, color: colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  emojiRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  emojiBtn: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.divider },
  emojiBtnActive: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryLight },
  memberScroll: { maxHeight: 100, marginBottom: 20 },
  memberBtn: { alignItems: 'center', marginRight: 16, gap: 6 },
  memberBtnActive: { opacity: 1 },
  memberName: { ...typography.labelSmall, color: colors.textHint },
  memberNameActive: { color: colors.primary, fontWeight: '700' },
  messageInput: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16,
    ...typography.bodyLarge, color: colors.textPrimary, minHeight: 100, textAlignVertical: 'top',
    borderWidth: 1, borderColor: colors.divider, marginBottom: 20,
  },
  sendBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { ...typography.button, color: '#fff' },
});
