import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import {
  useHelpBoardStore,
  HelpCategory,
  HelpUrgency,
  HelpRequest,
} from '../stores/helpBoardStore';
import { useAuthStore } from '../stores/authStore';

// ─── Constants ───────────────────────────────────────────────────────

const CATEGORIES: { key: HelpCategory; emoji: string; label: string }[] = [
  { key: 'errands', emoji: '🛒', label: 'Errands' },
  { key: 'meals', emoji: '🍳', label: 'Meals' },
  { key: 'transport', emoji: '🚗', label: 'Transport' },
  { key: 'medical', emoji: '💊', label: 'Medical' },
  { key: 'household', emoji: '🏠', label: 'Household' },
  { key: 'company', emoji: '💬', label: 'Company' },
];

const URGENCIES: { key: HelpUrgency; label: string; color: string; bg: string }[] = [
  { key: 'today', label: 'Today', color: colors.danger, bg: colors.tintEmergency },
  { key: 'this_week', label: 'This Week', color: colors.warning, bg: colors.tintJournal },
  { key: 'whenever', label: 'Whenever', color: colors.success, bg: colors.tintTask },
];

const categoryEmoji = (cat: HelpCategory) =>
  CATEGORIES.find((c) => c.key === cat)?.emoji || '📌';

const urgencyInfo = (urg: HelpUrgency) =>
  URGENCIES.find((u) => u.key === urg) || URGENCIES[2];

// ─── Component ───────────────────────────────────────────────────────

export default function HelpBoardScreen() {
  const { requests, addRequest, claimRequest, hydrate } = useHelpBoardStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<'open' | 'claimed'>('open');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState<HelpCategory>('errands');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrgency, setFormUrgency] = useState<HelpUrgency>('this_week');

  useEffect(() => {
    hydrate();
  }, []);

  const filtered = requests.filter((r) => r.status === filter);
  const openCount = requests.filter((r) => r.status === 'open').length;

  const handlePost = () => {
    if (!formTitle.trim()) return;
    addRequest({
      category: formCategory,
      title: formTitle.trim(),
      description: formDescription.trim(),
      urgency: formUrgency,
      createdBy: user?.firstName || 'You',
    });
    setFormTitle('');
    setFormDescription('');
    setFormCategory('errands');
    setFormUrgency('this_week');
    setShowModal(false);
  };

  const handleClaim = (id: string) => {
    const name = user?.firstName || 'You';
    claimRequest(id, name);
  };

  return (
    <View style={styles.root}>
      {/* ─── Hero Header ─── */}
      <View style={styles.hero}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Help Board</Text>
        <Text style={styles.heroSub}>Post what you need, family claims it</Text>
      </View>

      {/* ─── Filter Tabs ─── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, filter === 'open' && styles.tabActive]}
          onPress={() => setFilter('open')}
          accessibilityRole="button"
          accessibilityLabel="Open requests"
        >
          <Text style={[styles.tabText, filter === 'open' && styles.tabTextActive]}>
            Open ({openCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'claimed' && styles.tabActive]}
          onPress={() => setFilter('claimed')}
          accessibilityRole="button"
          accessibilityLabel="Claimed requests"
        >
          <Text style={[styles.tabText, filter === 'claimed' && styles.tabTextActive]}>
            Claimed
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Request List ─── */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{filter === 'open' ? '🎉' : '📋'}</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'open' ? 'All caught up!' : 'Nothing claimed yet'}
            </Text>
            <Text style={styles.emptyBody}>
              {filter === 'open'
                ? 'No open requests right now. Tap + to post one.'
                : 'Open requests are waiting for someone to claim them.'}
            </Text>
          </View>
        ) : (
          filtered.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onClaim={() => handleClaim(req.id)}
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── FAB ─── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add help request"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* ─── Add Request Modal ─── */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Help Request</Text>

            {/* Category Picker */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catChip,
                    formCategory === cat.key && styles.catChipActive,
                  ]}
                  onPress={() => setFormCategory(cat.key)}
                >
                  <Text style={styles.catChipEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.catChipLabel,
                      formCategory === cat.key && styles.catChipLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <Text style={styles.fieldLabel}>What do you need?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Pick up groceries"
              placeholderTextColor={colors.textHint}
              value={formTitle}
              onChangeText={setFormTitle}
            />

            {/* Description */}
            <Text style={styles.fieldLabel}>Details (optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Any extra info..."
              placeholderTextColor={colors.textHint}
              value={formDescription}
              onChangeText={setFormDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Urgency Picker */}
            <Text style={styles.fieldLabel}>Urgency</Text>
            <View style={styles.urgRow}>
              {URGENCIES.map((urg) => (
                <TouchableOpacity
                  key={urg.key}
                  style={[
                    styles.urgChip,
                    { backgroundColor: urg.bg },
                    formUrgency === urg.key && { borderColor: urg.color, borderWidth: 2 },
                  ]}
                  onPress={() => setFormUrgency(urg.key)}
                >
                  <View style={[styles.urgDot, { backgroundColor: urg.color }]} />
                  <Text style={[styles.urgLabel, { color: urg.color }]}>{urg.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.postBtn, !formTitle.trim() && styles.postBtnDisabled]}
                onPress={handlePost}
                disabled={!formTitle.trim()}
              >
                <Text style={styles.postBtnText}>Post Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Request Card ────────────────────────────────────────────────────

function RequestCard({
  request,
  onClaim,
}: {
  request: HelpRequest;
  onClaim: () => void;
}) {
  const urg = urgencyInfo(request.urgency);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardEmoji}>{categoryEmoji(request.category)}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{request.title}</Text>
            {!!request.description && (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {request.description}
              </Text>
            )}
            <Text style={styles.cardMeta}>
              Posted by {request.createdBy}
            </Text>
          </View>
        </View>
        <View style={[styles.urgPill, { backgroundColor: urg.bg }]}>
          <View style={[styles.urgPillDot, { backgroundColor: urg.color }]} />
          <Text style={[styles.urgPillText, { color: urg.color }]}>{urg.label}</Text>
        </View>
      </View>

      {request.status === 'open' ? (
        <TouchableOpacity style={styles.claimBtn} onPress={onClaim} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`Claim ${request.title}`}>
          <Text style={styles.claimBtnText}>I'll do it</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.claimedBadge}>
          <Text style={styles.claimedCheck}>✓</Text>
          <Text style={styles.claimedText}>Claimed by {request.claimedBy}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Hero
  hero: {
    backgroundColor: colors.heroStart,
    paddingTop: Platform.OS === 'web' ? 48 : 60,
    paddingBottom: 24,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  backText: { fontSize: 24, color: '#fff', marginTop: -2 },
  heroTitle: {
    ...typography.displayMedium,
    color: '#fff',
  },
  heroSub: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },

  // List
  list: {
    flex: 1,
    paddingHorizontal: 18,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    ...typography.headingLarge,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyBody: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  cardEmoji: { fontSize: 28, marginTop: 2 },
  cardInfo: { flex: 1 },
  cardTitle: {
    ...typography.headingMedium,
    color: colors.textPrimary,
  },
  cardDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cardMeta: {
    ...typography.labelSmall,
    color: colors.textHint,
    marginTop: 6,
  },

  // Urgency pill
  urgPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    marginLeft: 8,
  },
  urgPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  urgPillText: {
    ...typography.labelSmall,
    fontWeight: '700',
    fontSize: 11,
  },

  // Claim button
  claimBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
  },
  claimBtnText: {
    ...typography.button,
    color: '#fff',
  },

  // Claimed badge
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: colors.tintTask,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
  },
  claimedCheck: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  claimedText: {
    ...typography.labelMedium,
    color: colors.primary,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 22,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 14,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    ...typography.displaySmall,
    color: colors.textPrimary,
    marginBottom: 22,
  },

  // Fields
  fieldLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginBottom: 10,
    marginTop: 4,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.bg,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  catChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.tintTask,
  },
  catChipEmoji: { fontSize: 18 },
  catChipLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  catChipLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  input: {
    backgroundColor: colors.bg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  inputMulti: {
    minHeight: 80,
    paddingTop: 13,
  },

  urgRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  urgChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  urgDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  urgLabel: {
    ...typography.labelSmall,
    fontWeight: '700',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.bg,
  },
  cancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  postBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  postBtnDisabled: {
    opacity: 0.5,
  },
  postBtnText: {
    ...typography.button,
    color: '#fff',
  },
});
