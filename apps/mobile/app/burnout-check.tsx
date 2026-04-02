import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useCircleStore } from '../stores/circleStore';
import { burnoutService } from '../services/burnout';
import { Spinner } from '../components/ui/Spinner';

const dimensions = [
  { key: 'emotional', label: 'Emotional Exhaustion', emoji: '😮‍💨', question: 'How emotionally drained do you feel?', low: 'Energized', high: 'Depleted' },
  { key: 'physical', label: 'Physical Fatigue', emoji: '🫠', question: 'How physically tired are you?', low: 'Well-rested', high: 'Exhausted' },
  { key: 'social', label: 'Social Isolation', emoji: '🫂', question: 'How socially isolated do you feel?', low: 'Connected', high: 'Very isolated' },
  { key: 'workload', label: 'Workload Overwhelm', emoji: '📋', question: 'How overwhelmed by caregiving tasks?', low: 'Manageable', high: 'Overwhelming' },
  { key: 'sleep', label: 'Sleep Quality', emoji: '😴', question: 'How is your sleep quality?', low: 'Poor sleep', high: 'Great sleep' },
  { key: 'selfCare', label: 'Self-Care', emoji: '🧘', question: 'How often are you taking care of yourself?', low: 'Never', high: 'Regularly' },
];

const riskColors: Record<string, string> = {
  LOW: colors.success,
  MODERATE: colors.warning,
  HIGH: colors.accent,
  CRITICAL: colors.danger,
};

const riskMessages: Record<string, { title: string; message: string }> = {
  LOW: { title: 'You\'re doing well!', message: 'Your burnout risk is low. Keep up the good self-care habits.' },
  MODERATE: { title: 'Keep an eye on things', message: 'You\'re showing moderate stress. Make time for breaks and ask family for help.' },
  HIGH: { title: 'You need support', message: 'Your burnout risk is high. Please reach out to your care circle for help and prioritize rest.' },
  CRITICAL: { title: 'Please take action now', message: 'You\'re at critical burnout risk. Your wellbeing matters. We\'ve notified your care circle admins and scheduled respite reminders.' },
};

export default function BurnoutCheckScreen() {
  const { activeCircleId } = useCircleStore();
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ overallScore: number; riskLevel: string } | null>(null);

  const currentDim = dimensions[step];
  const isLastStep = step === dimensions.length - 1;

  const handleScore = async (value: number) => {
    const newScores = { ...scores, [currentDim.key]: value };
    setScores(newScores);

    if (isLastStep) {
      // Submit
      setLoading(true);
      try {
        const res = await burnoutService.createAssessment(activeCircleId!, {
          ...newScores,
          notes: notes || undefined,
        });
        setResult({ overallScore: res.assessment.overallScore, riskLevel: res.assessment.riskLevel });
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.message || 'Failed to submit assessment');
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <Spinner />
        <Text style={styles.loadingText}>Analyzing your wellbeing...</Text>
      </View>
    );
  }

  if (result) {
    const risk = riskMessages[result.riskLevel] || riskMessages.MODERATE;
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={[styles.scoreCircle, { borderColor: riskColors[result.riskLevel] }]}>
            <Text style={styles.scoreNumber}>{result.overallScore}</Text>
            <Text style={styles.scoreOf}>/10</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: riskColors[result.riskLevel] }]}>
            <Text style={styles.riskBadgeText}>{result.riskLevel} RISK</Text>
          </View>
          <Text style={styles.resultTitle}>{risk.title}</Text>
          <Text style={styles.resultMessage}>{risk.message}</Text>

          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/care-insights')}>
            <Text style={styles.historyBtnText}>View Trends</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Burnout Check-in</Text>
        <Text style={styles.stepIndicator}>{step + 1}/{dimensions.length}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / dimensions.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.questionContainer}>
        <Text style={styles.emoji}>{currentDim.emoji}</Text>
        <Text style={styles.question}>{currentDim.question}</Text>
        <Text style={styles.label}>{currentDim.label}</Text>

        <View style={styles.scaleRow}>
          <Text style={styles.scaleLow}>{currentDim.low}</Text>
          <Text style={styles.scaleHigh}>{currentDim.high}</Text>
        </View>

        <View style={styles.buttonGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.scoreBtn,
                scores[currentDim.key] === val && styles.scoreBtnActive,
                val <= 3 && { backgroundColor: '#E7F9EE' },
                val >= 4 && val <= 6 && { backgroundColor: '#FFF8EB' },
                val >= 7 && { backgroundColor: '#FEE2E2' },
              ]}
              onPress={() => handleScore(val)}
              activeOpacity={0.6}
            >
              <Text style={[styles.scoreBtnText, scores[currentDim.key] === val && styles.scoreBtnTextActive]}>
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {step > 0 && (
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'web' ? 24 : 56,
    paddingBottom: 12,
  },
  closeBtn: { padding: 8 },
  closeBtnText: { ...typography.bodyMedium, color: colors.textSecondary },
  headerTitle: { ...typography.headingMedium, color: colors.textPrimary },
  stepIndicator: { ...typography.labelSmall, color: colors.textHint },
  progressBar: { height: 4, backgroundColor: colors.divider, marginHorizontal: 18, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  questionContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 },
  emoji: { fontSize: 64, marginBottom: 20 },
  question: { ...typography.displaySmall, color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  label: { ...typography.bodyMedium, color: colors.textHint, marginBottom: 32 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  scaleLow: { ...typography.labelSmall, color: colors.success },
  scaleHigh: { ...typography.labelSmall, color: colors.danger },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  scoreBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  scoreBtnActive: { borderColor: colors.primary, borderWidth: 2 },
  scoreBtnText: { ...typography.headingLarge, color: colors.textPrimary },
  scoreBtnTextActive: { color: colors.primary },
  backBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 44,
    left: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  backBtnText: { ...typography.labelMedium, color: colors.textSecondary },
  loadingText: { ...typography.bodyMedium, color: colors.textHint, marginTop: 16 },
  // Result screen
  resultContainer: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 80 },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scoreNumber: { ...typography.displayLarge, fontSize: 48 },
  scoreOf: { ...typography.bodyMedium, color: colors.textHint },
  riskBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginBottom: 24 },
  riskBadgeText: { ...typography.labelSmall, color: '#fff', fontWeight: '700', letterSpacing: 1 },
  resultTitle: { ...typography.displayMedium, color: colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  resultMessage: { ...typography.bodyLarge, color: colors.textSecondary, textAlign: 'center', lineHeight: 26, marginBottom: 40 },
  doneBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: { ...typography.button, color: '#fff' },
  historyBtn: { paddingVertical: 12 },
  historyBtnText: { ...typography.labelMedium, color: colors.primary },
});
