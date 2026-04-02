import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useWellnessStore } from '../stores/wellnessStore';

// ─── Questions ───────────────────────────────────────────────────────

const questions = [
  { emoji: '🔋', text: "How's your energy level?" },
  { emoji: '😴', text: 'How well did you sleep?' },
  { emoji: '🌊', text: 'Are you feeling overwhelmed?' },
  { emoji: '🧘', text: 'Have you had time for yourself?' },
  { emoji: '🤝', text: 'How connected do you feel to support?' },
];

const ratingColors = ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E'];
const ratingLabels = ['1', '2', '3', '4', '5'];

// ─── Component ───────────────────────────────────────────────────────

export default function WellnessCheckScreen() {
  const { addEntry, hydrate } = useWellnessStore();
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    hydrate();
  }, []);

  const allAnswered = answers.every((a) => a !== null);
  const score = allAnswered
    ? (answers as number[]).reduce((a, b) => a + b, 0)
    : 0;

  const handleSelect = (questionIndex: number, value: number) => {
    const updated = [...answers];
    updated[questionIndex] = value;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    await addEntry(answers as number[]);
    setSubmitted(true);
  };

  const getResultConfig = () => {
    if (score < 10) {
      return {
        title: 'Burnout alert',
        message:
          "Your score suggests you're running on empty. Caregiving is incredibly hard — please reach out to someone you trust, or call the Caregiver Action Network at 1-855-227-3640.",
        bg: colors.tintEmergency,
        border: colors.danger,
        titleColor: colors.danger,
      };
    }
    if (score <= 17) {
      return {
        title: 'Take care of yourself',
        message:
          "You're managing, but don't forget YOU matter too. Try to carve out even 15 minutes today just for you. A walk, a call with a friend, or simply sitting quietly.",
        bg: colors.tintJournal,
        border: colors.gold,
        titleColor: '#B8860B',
      };
    }
    return {
      title: "You're doing great!",
      message:
        "Your wellness score is strong. Keep prioritizing yourself — it makes you a better caregiver. You're not just surviving, you're thriving.",
      bg: '#E7F9EE',
      border: colors.success,
      titleColor: '#15803D',
    };
  };

  const handleShare = async () => {
    const result = getResultConfig();
    const breakdown = questions
      .map((q, i) => `  ${q.emoji} ${q.text} — ${answers[i]}/5`)
      .join('\n');

    const message = [
      `CAREGIVER WELLNESS CHECK`,
      `━━━━━━━━━━━━━━━━━━━━━━━`,
      `Score: ${score}/25 — ${result.title}`,
      ``,
      breakdown,
      ``,
      result.message,
      ``,
      `Shared from Careo`,
    ].join('\n');

    try {
      await Share.share({ message, title: 'My Wellness Check' });
    } catch (err) {
      // Share was cancelled or failed — no action needed
    }
  };

  const handleDone = () => {
    router.back();
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ─── Hero Header ─── */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>{'←'}</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>How are YOU doing?</Text>
          <Text style={styles.heroSub}>
            Caregiving is hard.{'\n'}Check in with yourself.
          </Text>
        </View>

        {!submitted ? (
          <>
            {/* ─── Questions ─── */}
            {questions.map((q, qi) => (
              <View key={qi} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionEmoji}>{q.emoji}</Text>
                  <Text style={styles.questionText}>{q.text}</Text>
                </View>
                <View style={styles.ratingRow}>
                  {ratingColors.map((color, ri) => {
                    const value = ri + 1;
                    const selected = answers[qi] === value;
                    return (
                      <TouchableOpacity
                        key={ri}
                        style={[
                          styles.ratingCircle,
                          { borderColor: color },
                          selected && { backgroundColor: color, borderColor: color },
                        ]}
                        onPress={() => handleSelect(qi, value)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Rate ${value} out of 5`}
                      >
                        <Text
                          style={[
                            styles.ratingLabel,
                            selected && styles.ratingLabelSelected,
                          ]}
                        >
                          {ratingLabels[ri]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.scaleHints}>
                  <Text style={styles.scaleHint}>Not at all</Text>
                  <Text style={styles.scaleHint}>Very much</Text>
                </View>
              </View>
            ))}

            {/* ─── Submit ─── */}
            <View style={styles.submitSection}>
              <TouchableOpacity
                style={[styles.submitBtn, !allAnswered && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                activeOpacity={allAnswered ? 0.8 : 1}
                disabled={!allAnswered}
                accessibilityRole="button"
                accessibilityLabel="Submit wellness check"
              >
                <Text style={styles.submitBtnText}>See my results</Text>
              </TouchableOpacity>
              {!allAnswered && (
                <Text style={styles.submitHint}>
                  Answer all 5 questions to see your results
                </Text>
              )}
            </View>
          </>
        ) : (
          <>
            {/* ─── Results ─── */}
            <View style={styles.resultsSection}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{score}</Text>
                <Text style={styles.scoreOf}>/25</Text>
              </View>

              {(() => {
                const cfg = getResultConfig();
                return (
                  <View
                    style={[
                      styles.resultCard,
                      { backgroundColor: cfg.bg, borderLeftColor: cfg.border },
                    ]}
                  >
                    <Text style={[styles.resultTitle, { color: cfg.titleColor }]}>
                      {cfg.title}
                    </Text>
                    <Text style={styles.resultMessage}>{cfg.message}</Text>
                  </View>
                );
              })()}

              {/* Breakdown */}
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Your answers</Text>
                {questions.map((q, i) => (
                  <View key={i} style={styles.breakdownRow}>
                    <Text style={styles.breakdownEmoji}>{q.emoji}</Text>
                    <Text style={styles.breakdownQuestion}>{q.text}</Text>
                    <View
                      style={[
                        styles.breakdownScore,
                        { backgroundColor: ratingColors[(answers[i] as number) - 1] },
                      ]}
                    >
                      <Text style={styles.breakdownScoreText}>{answers[i]}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share with family">
                <Text style={styles.shareBtnEmoji}>📤</Text>
                <Text style={styles.shareBtnText}>Share with family</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

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

  // Question cards
  questionCard: {
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
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  questionEmoji: { fontSize: 28 },
  questionText: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  ratingCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  ratingLabel: {
    ...typography.labelLarge,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  ratingLabelSelected: {
    color: '#fff',
  },
  scaleHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  scaleHint: {
    ...typography.bodySmall,
    color: colors.textHint,
    fontSize: 11,
  },

  // Submit
  submitSection: {
    paddingHorizontal: 18,
    marginTop: 10,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: colors.textHint,
    shadowOpacity: 0,
  },
  submitBtnText: {
    ...typography.button,
    color: '#fff',
    fontSize: 17,
  },
  submitHint: {
    ...typography.bodySmall,
    color: colors.textHint,
    textAlign: 'center',
    marginTop: 12,
  },

  // Results
  resultsSection: {
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
    flexDirection: 'row',
  },
  scoreNumber: {
    ...typography.displayLarge,
    color: colors.primary,
    fontSize: 36,
  },
  scoreOf: {
    ...typography.bodyMedium,
    color: colors.textHint,
    marginTop: 8,
  },

  resultCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    marginBottom: 20,
  },
  resultTitle: {
    ...typography.headingLarge,
    marginBottom: 8,
  },
  resultMessage: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  breakdownCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  breakdownTitle: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  breakdownEmoji: { fontSize: 20 },
  breakdownQuestion: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  breakdownScore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownScoreText: {
    ...typography.labelMedium,
    color: '#fff',
    fontWeight: '700',
  },

  // Actions
  shareBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  shareBtnEmoji: { fontSize: 18 },
  shareBtnText: { ...typography.button, color: '#fff', fontSize: 17 },

  doneBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  doneBtnText: { ...typography.button, color: colors.textSecondary },
});
