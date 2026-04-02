import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';

// ─── Types ──────────────────────────────────────────────────────────

type Severity = 'mild' | 'moderate' | 'severe';
type BehaviorType = 'agitation' | 'wandering' | 'confusion' | 'sundowning' | 'repetition' | 'aggression';
type WanderingRisk = 'low' | 'medium' | 'high';

interface BehaviorEntry {
  id: string;
  type: BehaviorType;
  severity: Severity;
  trigger: string;
  time: string;
  notes: string;
}

interface RoutineItem {
  id: string;
  label: string;
  emoji: string;
  completed: boolean;
  time: string;
}

interface CognitiveExercise {
  id: string;
  title: string;
  emoji: string;
  duration: string;
  category: string;
  description: string;
}

interface CommunicationTip {
  id: string;
  title: string;
  emoji: string;
  tip: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────

const BEHAVIOR_TYPES: { type: BehaviorType; emoji: string; label: string }[] = [
  { type: 'agitation', emoji: '😤', label: 'Agitation' },
  { type: 'wandering', emoji: '🚶', label: 'Wandering' },
  { type: 'confusion', emoji: '😵‍💫', label: 'Confusion' },
  { type: 'sundowning', emoji: '🌅', label: 'Sundowning' },
  { type: 'repetition', emoji: '🔁', label: 'Repetition' },
  { type: 'aggression', emoji: '😠', label: 'Aggression' },
];

const SEVERITY_OPTIONS: { value: Severity; label: string; color: string }[] = [
  { value: 'mild', label: 'Mild', color: colors.success },
  { value: 'moderate', label: 'Moderate', color: colors.warning },
  { value: 'severe', label: 'Severe', color: colors.danger },
];

const TRIGGERS = [
  'Unfamiliar environment',
  'Noise / overstimulation',
  'Hunger / thirst',
  'Pain / discomfort',
  'Change in routine',
  'Fatigue',
  'Caregiver change',
  'Unknown',
];

const INITIAL_BEHAVIOR_LOG: BehaviorEntry[] = [
  { id: '1', type: 'sundowning', severity: 'moderate', trigger: 'Fatigue', time: '5:30 PM', notes: 'Became restless and anxious as sun set. Redirected with music.' },
  { id: '2', type: 'wandering', severity: 'mild', trigger: 'Change in routine', time: '2:15 PM', notes: 'Walked to the front door twice. Gently guided back.' },
  { id: '3', type: 'confusion', severity: 'moderate', trigger: 'Unfamiliar environment', time: '11:00 AM', notes: 'Did not recognize guest. Became withdrawn.' },
  { id: '4', type: 'agitation', severity: 'severe', trigger: 'Noise / overstimulation', time: '9:45 AM', notes: 'TV was too loud during morning news. Became very upset.' },
  { id: '5', type: 'repetition', severity: 'mild', trigger: 'Unknown', time: '8:00 AM', notes: 'Asked about breakfast 4 times within 20 minutes.' },
  { id: '6', type: 'sundowning', severity: 'severe', trigger: 'Fatigue', time: '6:10 PM (Yesterday)', notes: 'Severe anxiety episode. Refused dinner. Calmed with hand massage.' },
  { id: '7', type: 'wandering', severity: 'moderate', trigger: 'Unknown', time: '3:00 PM (Yesterday)', notes: 'Found near back gate. Installed additional lock.' },
];

const SUNDOWNING_TIMELINE = [
  { hour: '3 PM', intensity: 1, label: 'Calm' },
  { hour: '4 PM', intensity: 2, label: 'Mild restlessness' },
  { hour: '5 PM', intensity: 4, label: 'Moderate agitation' },
  { hour: '6 PM', intensity: 5, label: 'Peak episode' },
  { hour: '7 PM', intensity: 4, label: 'Declining' },
  { hour: '8 PM', intensity: 3, label: 'Settling' },
  { hour: '9 PM', intensity: 1, label: 'Calm' },
];

const DAILY_ROUTINE: RoutineItem[] = [
  { id: 'r1', label: 'Morning hygiene', emoji: '🪥', completed: true, time: '7:30 AM' },
  { id: 'r2', label: 'Breakfast', emoji: '🍳', completed: true, time: '8:00 AM' },
  { id: 'r3', label: 'Morning medication', emoji: '💊', completed: true, time: '8:30 AM' },
  { id: 'r4', label: 'Cognitive exercise', emoji: '🧩', completed: true, time: '9:30 AM' },
  { id: 'r5', label: 'Morning walk', emoji: '🚶', completed: false, time: '10:30 AM' },
  { id: 'r6', label: 'Lunch', emoji: '🥗', completed: false, time: '12:00 PM' },
  { id: 'r7', label: 'Afternoon nap', emoji: '😴', completed: false, time: '1:30 PM' },
  { id: 'r8', label: 'Music therapy', emoji: '🎵', completed: false, time: '3:00 PM' },
  { id: 'r9', label: 'Evening medication', emoji: '💊', completed: false, time: '5:30 PM' },
  { id: 'r10', label: 'Dinner', emoji: '🍽️', completed: false, time: '6:00 PM' },
  { id: 'r11', label: 'Evening routine', emoji: '🌙', completed: false, time: '8:00 PM' },
];

const COGNITIVE_EXERCISES: CognitiveExercise[] = [
  { id: 'c1', title: 'Photo Memory Game', emoji: '📸', duration: '15 min', category: 'Memory', description: 'Use family photos to prompt recall of names, places, and stories.' },
  { id: 'c2', title: 'Word Association', emoji: '💬', duration: '10 min', category: 'Language', description: 'Say a word and ask for related words. Start with familiar categories like food or animals.' },
  { id: 'c3', title: 'Favorite Songs', emoji: '🎵', duration: '20 min', category: 'Music Therapy', description: 'Play songs from their youth. Music memories are often preserved even in advanced stages.' },
  { id: 'c4', title: 'Simple Puzzles', emoji: '🧩', duration: '15 min', category: 'Problem Solving', description: 'Large-piece jigsaw puzzles with familiar images. 12-24 pieces maximum.' },
  { id: 'c5', title: 'Sorting Activities', emoji: '🔤', duration: '10 min', category: 'Motor Skills', description: 'Sort buttons by color, fold towels, or organize silverware. Familiar tasks boost confidence.' },
  { id: 'c6', title: 'Sensory Stimulation', emoji: '🌸', duration: '15 min', category: 'Sensory', description: 'Aromatherapy with lavender or vanilla. Gentle hand massage with lotion.' },
];

const COMMUNICATION_TIPS: CommunicationTip[] = [
  { id: 't1', title: 'Redirecting', emoji: '🔄', tip: 'When agitated, gently change the subject or activity. "Let\'s go look at the garden" works better than "calm down."' },
  { id: 't2', title: 'Validating Feelings', emoji: '💛', tip: 'Acknowledge their emotions even if the situation isn\'t real to you. "I can see you\'re worried. You\'re safe here with me."' },
  { id: 't3', title: 'Repetitive Questions', emoji: '🔁', tip: 'Answer as if hearing it for the first time. Write key info on a whiteboard they can see. Never say "I already told you."' },
  { id: 't4', title: 'Simple Sentences', emoji: '📝', tip: 'Use short, clear sentences. Offer choices between 2 options, not open-ended questions. "Tea or juice?" not "What do you want?"' },
  { id: 't5', title: 'Non-Verbal Cues', emoji: '🤲', tip: 'Approach from the front. Make eye contact. Use a calm tone. Gentle touch on the hand can be reassuring.' },
  { id: 't6', title: 'Therapeutic Fibbing', emoji: '🕊️', tip: 'Sometimes a kind fib prevents distress. If they ask for a deceased spouse, saying "They\'ll be here later" may be kinder than the truth.' },
];

// ─── Summary Stats ──────────────────────────────────────────────────

const WEEKLY_STATS = {
  episodesThisWeek: 12,
  episodesLastWeek: 9,
  trendPercent: 33,
  trendDirection: 'up' as const,
  mostCommonTrigger: 'Fatigue',
  mostCommonType: 'Sundowning',
  averageSeverity: 'moderate' as Severity,
};

const CAREGIVER_STRESS = {
  level: 72,
  label: 'Elevated',
  tips: [
    'Take a 10-minute break every 2 hours',
    'Accept help from family and friends',
    'Join an online caregiver support group',
    'Practice deep breathing when feeling overwhelmed',
    'Remember: you cannot pour from an empty cup',
  ],
};

// ─── Helper Functions ───────────────────────────────────────────────

function getWanderingRisk(entries: BehaviorEntry[]): WanderingRisk {
  const wanderingCount = entries.filter((e) => e.type === 'wandering').length;
  const severeWandering = entries.filter((e) => e.type === 'wandering' && e.severity === 'severe').length;
  if (severeWandering > 0 || wanderingCount >= 3) return 'high';
  if (wanderingCount >= 1) return 'medium';
  return 'low';
}

function getWanderingRiskConfig(risk: WanderingRisk) {
  switch (risk) {
    case 'high':
      return { color: colors.danger, bg: colors.tintEmergency, label: 'HIGH', emoji: '🔴', message: 'Multiple wandering episodes detected. Ensure doors are secured and GPS tracker is active.' };
    case 'medium':
      return { color: colors.warning, bg: colors.goldLight, label: 'MEDIUM', emoji: '🟡', message: 'Some wandering behavior noted. Monitor closely and consider door alarms.' };
    case 'low':
      return { color: colors.success, bg: '#E7F9EE', label: 'LOW', emoji: '🟢', message: 'No significant wandering patterns. Continue regular monitoring.' };
  }
}

function getStressColor(level: number): string {
  if (level >= 70) return colors.danger;
  if (level >= 40) return colors.warning;
  return colors.success;
}

function getBehaviorEmoji(type: BehaviorType): string {
  return BEHAVIOR_TYPES.find((b) => b.type === type)?.emoji ?? '❓';
}

function getSeverityColor(severity: Severity): string {
  return SEVERITY_OPTIONS.find((s) => s.value === severity)?.color ?? colors.textHint;
}

// ─── Component ──────────────────────────────────────────────────────

export default function DementiaCareScreen() {
  const [behaviorLog, setBehaviorLog] = useState<BehaviorEntry[]>(INITIAL_BEHAVIOR_LOG);
  const [routine, setRoutine] = useState<RoutineItem[]>(DAILY_ROUTINE);
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedType, setSelectedType] = useState<BehaviorType | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const wanderingRisk = getWanderingRisk(behaviorLog);
  const wanderingConfig = getWanderingRiskConfig(wanderingRisk);
  const completedRoutine = routine.filter((r) => r.completed).length;
  const routineProgress = completedRoutine / routine.length;

  const handleToggleRoutine = (id: string) => {
    setRoutine((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleQuickLog = (type: BehaviorType) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const entry: BehaviorEntry = {
      id: Date.now().toString(),
      type,
      severity: 'mild',
      trigger: 'Unknown',
      time,
      notes: 'Quick-logged',
    };
    setBehaviorLog((prev) => [entry, ...prev]);
  };

  const handleSubmitLog = () => {
    if (!selectedType || !selectedSeverity || !selectedTrigger) return;
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const entry: BehaviorEntry = {
      id: Date.now().toString(),
      type: selectedType,
      severity: selectedSeverity,
      trigger: selectedTrigger,
      time,
      notes: '',
    };
    setBehaviorLog((prev) => [entry, ...prev]);
    setShowLogForm(false);
    setSelectedType(null);
    setSelectedSeverity(null);
    setSelectedTrigger(null);
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ─── Hero Header ─── */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>{'←'}</Text>
          </TouchableOpacity>
          <Text style={styles.heroEmoji}>🧠</Text>
          <Text style={styles.heroTitle}>Dementia Care Suite</Text>
          <Text style={styles.heroSub}>
            Comprehensive tracking, exercises,{'\n'}and caregiver support
          </Text>
        </View>

        {/* ─── Summary Stats ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{WEEKLY_STATS.episodesThisWeek}</Text>
            <Text style={styles.statLabel}>Episodes</Text>
            <View style={[styles.trendBadge, { backgroundColor: WEEKLY_STATS.trendDirection === 'up' ? colors.tintEmergency : '#E7F9EE' }]}>
              <Text style={[styles.trendText, { color: WEEKLY_STATS.trendDirection === 'up' ? colors.danger : colors.success }]}>
                {WEEKLY_STATS.trendDirection === 'up' ? '↑' : '↓'} {WEEKLY_STATS.trendPercent}%
              </Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{WEEKLY_STATS.mostCommonType}</Text>
            <Text style={styles.statLabel}>Most Common</Text>
            <Text style={styles.statSubDetail}>🌅 Type</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{WEEKLY_STATS.mostCommonTrigger}</Text>
            <Text style={styles.statLabel}>Top Trigger</Text>
            <Text style={styles.statSubDetail}>⚡ Trigger</Text>
          </View>
        </View>

        {/* ─── Quick-Log Buttons ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>QUICK LOG</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickLogScroll} contentContainerStyle={styles.quickLogContent}>
          {BEHAVIOR_TYPES.map((bt) => (
            <TouchableOpacity
              key={bt.type}
              style={styles.quickLogBtn}
              onPress={() => handleQuickLog(bt.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickLogEmoji}>{bt.emoji}</Text>
              <Text style={styles.quickLogLabel}>{bt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ─── Detailed Log Form ─── */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.addLogBtn}
            onPress={() => setShowLogForm(!showLogForm)}
            activeOpacity={0.7}
          >
            <Text style={styles.addLogBtnEmoji}>{showLogForm ? '✕' : '+'}</Text>
            <Text style={styles.addLogBtnText}>
              {showLogForm ? 'Cancel' : 'Log Detailed Behavior'}
            </Text>
          </TouchableOpacity>
        </View>

        {showLogForm && (
          <View style={styles.logFormCard}>
            {/* Behavior type */}
            <Text style={styles.formLabel}>Behavior Type</Text>
            <View style={styles.chipRow}>
              {BEHAVIOR_TYPES.map((bt) => (
                <TouchableOpacity
                  key={bt.type}
                  style={[styles.chip, selectedType === bt.type && styles.chipSelected]}
                  onPress={() => setSelectedType(bt.type)}
                >
                  <Text style={styles.chipEmoji}>{bt.emoji}</Text>
                  <Text style={[styles.chipText, selectedType === bt.type && styles.chipTextSelected]}>
                    {bt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Severity */}
            <Text style={styles.formLabel}>Severity</Text>
            <View style={styles.severityRow}>
              {SEVERITY_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.severityBtn,
                    { borderColor: s.color },
                    selectedSeverity === s.value && { backgroundColor: s.color },
                  ]}
                  onPress={() => setSelectedSeverity(s.value)}
                >
                  <Text
                    style={[
                      styles.severityText,
                      { color: selectedSeverity === s.value ? '#fff' : s.color },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Trigger */}
            <Text style={styles.formLabel}>Trigger</Text>
            <View style={styles.chipRow}>
              {TRIGGERS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, selectedTrigger === t && styles.chipSelected]}
                  onPress={() => setSelectedTrigger(t)}
                >
                  <Text style={[styles.chipText, selectedTrigger === t && styles.chipTextSelected]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitLogBtn,
                (!selectedType || !selectedSeverity || !selectedTrigger) && styles.submitLogBtnDisabled,
              ]}
              onPress={handleSubmitLog}
              disabled={!selectedType || !selectedSeverity || !selectedTrigger}
              activeOpacity={0.8}
            >
              <Text style={styles.submitLogBtnText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Wandering Risk Indicator ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>WANDERING RISK</Text>
        </View>
        <View style={[styles.wanderingCard, { backgroundColor: wanderingConfig.bg, borderLeftColor: wanderingConfig.color }]}>
          <View style={styles.wanderingHeader}>
            <Text style={styles.wanderingEmoji}>{wanderingConfig.emoji}</Text>
            <Text style={[styles.wanderingLevel, { color: wanderingConfig.color }]}>
              {wanderingConfig.label} RISK
            </Text>
          </View>
          <Text style={styles.wanderingMessage}>{wanderingConfig.message}</Text>
        </View>

        {/* ─── Sundowning Monitor ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>SUNDOWNING PATTERN</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌅 Late-Afternoon / Evening Timeline</Text>
          <Text style={styles.cardSubtitle}>Average intensity over the past 7 days</Text>
          <View style={styles.timelineContainer}>
            {SUNDOWNING_TIMELINE.map((item, index) => {
              const barHeight = (item.intensity / 5) * 80;
              const barColor =
                item.intensity >= 4
                  ? colors.danger
                  : item.intensity >= 3
                  ? colors.warning
                  : item.intensity >= 2
                  ? colors.gold
                  : colors.success;
              return (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        { height: barHeight, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                  <Text style={styles.timelineHour}>{item.hour}</Text>
                  <Text style={styles.timelineLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.timelineLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Calm</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.gold }]} />
              <Text style={styles.legendText}>Mild</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendText}>Moderate</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.legendText}>Severe</Text>
            </View>
          </View>
        </View>

        {/* ─── Daily Routine Tracker ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>DAILY ROUTINE</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.routineHeaderRow}>
            <Text style={styles.cardTitle}>📋 Today's Routine</Text>
            <Text style={styles.routineProgress}>
              {completedRoutine}/{routine.length}
            </Text>
          </View>
          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${routineProgress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(routineProgress * 100)}% complete
          </Text>
          {routine.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.routineRow}
              onPress={() => handleToggleRoutine(item.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.routineCheck,
                  item.completed && styles.routineCheckDone,
                ]}
              >
                {item.completed && <Text style={styles.routineCheckMark}>✓</Text>}
              </View>
              <Text style={styles.routineEmoji}>{item.emoji}</Text>
              <View style={styles.routineInfo}>
                <Text
                  style={[
                    styles.routineLabel,
                    item.completed && styles.routineLabelDone,
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={styles.routineTime}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Cognitive Exercises ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>COGNITIVE EXERCISES</Text>
        </View>
        {COGNITIVE_EXERCISES.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={styles.exerciseCard}
            onPress={() =>
              setExpandedExercise(
                expandedExercise === exercise.id ? null : exercise.id
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                <View style={styles.exerciseMeta}>
                  <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                  <Text style={styles.exerciseDuration}>⏱ {exercise.duration}</Text>
                </View>
              </View>
              <Text style={styles.expandIcon}>
                {expandedExercise === exercise.id ? '▲' : '▼'}
              </Text>
            </View>
            {expandedExercise === exercise.id && (
              <View style={styles.exerciseBody}>
                <Text style={styles.exerciseDescription}>
                  {exercise.description}
                </Text>
                <TouchableOpacity style={styles.startExerciseBtn} activeOpacity={0.8}>
                  <Text style={styles.startExerciseBtnText}>Start Activity</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* ─── Communication Tips ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>COMMUNICATION TIPS</Text>
        </View>
        {COMMUNICATION_TIPS.map((tip) => (
          <TouchableOpacity
            key={tip.id}
            style={styles.tipCard}
            onPress={() =>
              setExpandedTip(expandedTip === tip.id ? null : tip.id)
            }
            activeOpacity={0.7}
          >
            <View style={styles.tipHeader}>
              <Text style={styles.tipEmoji}>{tip.emoji}</Text>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.expandIcon}>
                {expandedTip === tip.id ? '▲' : '▼'}
              </Text>
            </View>
            {expandedTip === tip.id && (
              <Text style={styles.tipBody}>{tip.tip}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* ─── Caregiver Stress Indicator ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>CAREGIVER STRESS</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.stressHeaderRow}>
            <Text style={styles.cardTitle}>🫂 Your Stress Level</Text>
            <View
              style={[
                styles.stressBadge,
                { backgroundColor: getStressColor(CAREGIVER_STRESS.level) },
              ]}
            >
              <Text style={styles.stressBadgeText}>{CAREGIVER_STRESS.label}</Text>
            </View>
          </View>
          {/* Stress meter */}
          <View style={styles.stressMeterBg}>
            <View
              style={[
                styles.stressMeterFill,
                {
                  width: `${CAREGIVER_STRESS.level}%`,
                  backgroundColor: getStressColor(CAREGIVER_STRESS.level),
                },
              ]}
            />
          </View>
          <Text style={styles.stressPercent}>{CAREGIVER_STRESS.level}%</Text>

          <Text style={styles.stressTipsTitle}>Tips for you:</Text>
          {CAREGIVER_STRESS.tips.map((tip, i) => (
            <View key={i} style={styles.stressTipRow}>
              <Text style={styles.stressTipBullet}>•</Text>
              <Text style={styles.stressTipText}>{tip}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.wellnessCheckBtn}
            onPress={() => router.push('/wellness-check')}
            activeOpacity={0.8}
          >
            <Text style={styles.wellnessCheckBtnText}>Take Full Wellness Check</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Recent Behavior Log ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>BEHAVIOR TIMELINE</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Recent Entries</Text>
          {behaviorLog.slice(0, 8).map((entry, index) => (
            <View
              key={entry.id}
              style={[
                styles.logEntry,
                index === behaviorLog.slice(0, 8).length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.logTimelineCol}>
                <View
                  style={[
                    styles.logDot,
                    { backgroundColor: getSeverityColor(entry.severity) },
                  ]}
                />
                {index < behaviorLog.slice(0, 8).length - 1 && (
                  <View style={styles.logLine} />
                )}
              </View>
              <View style={styles.logContent}>
                <View style={styles.logHeaderRow}>
                  <Text style={styles.logEmoji}>
                    {getBehaviorEmoji(entry.type)}
                  </Text>
                  <Text style={styles.logType}>
                    {BEHAVIOR_TYPES.find((b) => b.type === entry.type)?.label}
                  </Text>
                  <View
                    style={[
                      styles.logSeverityBadge,
                      { backgroundColor: getSeverityColor(entry.severity) + '20', borderColor: getSeverityColor(entry.severity) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.logSeverityText,
                        { color: getSeverityColor(entry.severity) },
                      ]}
                    >
                      {entry.severity}
                    </Text>
                  </View>
                </View>
                <Text style={styles.logTime}>🕐 {entry.time}</Text>
                <Text style={styles.logTrigger}>⚡ Trigger: {entry.trigger}</Text>
                {entry.notes ? (
                  <Text style={styles.logNotes}>{entry.notes}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backText: { fontSize: 20, color: '#fff', fontWeight: '600' },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: {
    ...typography.displayMedium,
    color: '#FFFFFF',
  },
  heroSub: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    lineHeight: 22,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    fontSize: 18,
    textAlign: 'center',
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textHint,
    marginTop: 4,
    textAlign: 'center',
  },
  statSubDetail: {
    ...typography.bodySmall,
    color: colors.textHint,
    fontSize: 11,
    marginTop: 4,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  trendText: {
    ...typography.labelSmall,
    fontWeight: '700',
    fontSize: 11,
  },

  // Quick log
  quickLogScroll: {
    marginBottom: 8,
  },
  quickLogContent: {
    paddingHorizontal: 18,
    gap: 10,
  },
  quickLogBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    minWidth: 80,
  },
  quickLogEmoji: { fontSize: 24, marginBottom: 4 },
  quickLogLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },

  // Add log button
  cardContainer: {
    paddingHorizontal: 18,
    marginVertical: 8,
  },
  addLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.primaryMid,
    borderStyle: 'dashed',
  },
  addLogBtnEmoji: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  addLogBtnText: {
    ...typography.labelMedium,
    color: colors.primary,
  },

  // Log form
  logFormCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formLabel: {
    ...typography.labelMedium,
    color: colors.textPrimary,
    marginBottom: 10,
    marginTop: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipEmoji: { fontSize: 14 },
  chipText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  severityBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  severityText: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  submitLogBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitLogBtnDisabled: {
    backgroundColor: colors.textHint,
  },
  submitLogBtnText: {
    ...typography.button,
    color: '#fff',
  },

  // Wandering risk
  wanderingCard: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  wanderingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  wanderingEmoji: { fontSize: 20 },
  wanderingLevel: {
    ...typography.headingMedium,
    fontWeight: '800',
    letterSpacing: 1,
  },
  wanderingMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Generic card
  card: {
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...typography.bodySmall,
    color: colors.textHint,
    marginBottom: 16,
  },

  // Sundowning timeline
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: 20,
    borderRadius: 6,
    minHeight: 8,
  },
  timelineHour: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 6,
  },
  timelineLabel: {
    ...typography.bodySmall,
    color: colors.textHint,
    fontSize: 8,
    textAlign: 'center',
    marginTop: 2,
  },
  timelineLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.bodySmall,
    color: colors.textHint,
    fontSize: 11,
  },

  // Daily routine
  routineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routineProgress: {
    ...typography.headingMedium,
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.bg,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textHint,
    marginBottom: 14,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 12,
  },
  routineCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineCheckDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  routineCheckMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  routineEmoji: { fontSize: 20 },
  routineInfo: { flex: 1 },
  routineLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  routineLabelDone: {
    textDecorationLine: 'line-through',
    color: colors.textHint,
  },
  routineTime: {
    ...typography.bodySmall,
    color: colors.textHint,
    fontSize: 12,
  },

  // Cognitive exercises
  exerciseCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseEmoji: { fontSize: 28 },
  exerciseInfo: { flex: 1 },
  exerciseTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  exerciseCategory: {
    ...typography.bodySmall,
    color: colors.primary,
    fontSize: 12,
  },
  exerciseDuration: {
    ...typography.bodySmall,
    color: colors.textHint,
    fontSize: 12,
  },
  expandIcon: {
    color: colors.textHint,
    fontSize: 12,
  },
  exerciseBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  exerciseDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  startExerciseBtn: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  startExerciseBtnText: {
    ...typography.labelMedium,
    color: colors.primary,
    fontWeight: '700',
  },

  // Communication tips
  tipCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipEmoji: { fontSize: 22 },
  tipTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    flex: 1,
  },
  tipBody: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  // Caregiver stress
  stressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stressBadgeText: {
    ...typography.labelSmall,
    color: '#fff',
    fontWeight: '700',
  },
  stressMeterBg: {
    height: 12,
    backgroundColor: colors.bg,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  stressMeterFill: {
    height: 12,
    borderRadius: 6,
  },
  stressPercent: {
    ...typography.bodySmall,
    color: colors.textHint,
    textAlign: 'right',
    marginBottom: 16,
  },
  stressTipsTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  stressTipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  stressTipBullet: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontSize: 16,
  },
  stressTipText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  wellnessCheckBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  wellnessCheckBtnText: {
    ...typography.button,
    color: '#fff',
  },

  // Behavior log timeline
  logEntry: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
  },
  logTimelineCol: {
    alignItems: 'center',
    width: 20,
  },
  logDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  logLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.divider,
    marginTop: 4,
  },
  logContent: {
    flex: 1,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  logEmoji: { fontSize: 16 },
  logType: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    flex: 1,
  },
  logSeverityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  logSeverityText: {
    ...typography.labelSmall,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  logTime: {
    ...typography.bodySmall,
    color: colors.textHint,
    marginBottom: 2,
  },
  logTrigger: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  logNotes: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
