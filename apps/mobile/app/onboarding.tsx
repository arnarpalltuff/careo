import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useOnboardingStore } from '../stores/onboardingStore';

const { width } = Dimensions.get('window');

// ─── Step definitions ───────────────────────────────────────────────

type StepType = 'intro' | 'select' | 'multi' | 'emotional' | 'reveal' | 'promise';

interface Step {
  type: StepType;
  bgColor: string;
  // intro / emotional / reveal / promise
  emoji?: string;
  headline?: string;
  body?: string;
  bodySecond?: string;
  // select (single choice)
  question?: string;
  options?: { label: string; emoji: string }[];
  // multi (checkbox)
  multiOptions?: { label: string; emoji: string }[];
  multiPrompt?: string;
  // stat
  stat?: string;
  statLabel?: string;
}

const steps: Step[] = [
  // 0 — Warm open. No question, just validation.
  {
    type: 'intro',
    bgColor: '#FAF9F7',
    emoji: '💛',
    headline: 'You showed up.',
    body: "That already says more about you\nthan you realize.",
    bodySecond: "Let's make sure you never\nhave to do this alone.",
  },

  // 1 — Personalize: who are you caring for?
  {
    type: 'select',
    bgColor: '#F0F7F5',
    question: 'Who are you helping\ntake care of?',
    options: [
      { label: 'My mom', emoji: '👩' },
      { label: 'My dad', emoji: '👨' },
      { label: 'My spouse', emoji: '💑' },
      { label: 'A grandparent', emoji: '👴' },
      { label: 'Someone else I love', emoji: '❤️' },
    ],
  },

  // 2 — Multi-select: "that's me" moment
  {
    type: 'multi',
    bgColor: '#FFF8F0',
    multiPrompt: 'Which of these keep you\nup at night?',
    multiOptions: [
      { label: 'Did they take their medication?', emoji: '💊' },
      { label: "I'm the only one who remembers appointments", emoji: '📅' },
      { label: 'My siblings don\'t know what I do every day', emoji: '😤' },
      { label: 'I worry something will happen when I\'m not there', emoji: '😰' },
      { label: "I can't keep track of everything in my head", emoji: '🧠' },
      { label: 'I feel guilty when I take time for myself', emoji: '💔' },
    ],
  },

  // 3 — Emotional validation based on their answers
  {
    type: 'emotional',
    bgColor: '#F5F0FF',
    emoji: '🫂',
    headline: 'You\'re carrying a lot.',
    body: "53 million Americans are family caregivers.\nMost do it without any help or tools.",
    stat: '53M',
    statLabel: 'family caregivers in the US',
    bodySecond: "You are not alone in this.\nBut you shouldn't have to feel like you are.",
  },

  // 4 — The reveal: show what life could look like
  {
    type: 'reveal',
    bgColor: '#F0F7F5',
    emoji: '✨',
    headline: 'Imagine this instead.',
    body: "Your brother gets a notification:\n\"Mom's 8pm Lisinopril — not yet taken.\"",
    bodySecond: "Your sister sees the task list and picks up\nthe prescription on her way home.\n\nYou check the app and see:\neverything is handled. For once.",
  },

  // 5 — The promise
  {
    type: 'promise',
    bgColor: '#FAF9F7',
    emoji: '🏡',
    headline: 'Careo makes\nthis real.',
    body: "💊 Shared medication tracking\n✓ Family task lists\n📋 Health journals & calendars\n🚨 One-tap emergency alerts\n📄 Shared documents vault\n👨‍👩‍👧 Invite your whole family",
  },
];

// ─── Component ──────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<Set<string>>(new Set());
  const [caringFor, setCaringFor] = useState('your loved one');
  const { setHasSeenOnboarding, setCaringFor: saveCaringFor, setPainPoints } = useOnboardingStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animate in each step
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [currentStep]);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const totalSteps = steps.length;

  const goNext = () => {
    if (currentStep === 1 && selectedOption) {
      // Save who they're caring for
      const map: Record<string, string> = {
        'My mom': 'Mom',
        'My dad': 'Dad',
        'My spouse': 'your spouse',
        'A grandparent': 'Grandma',
        'Someone else I love': 'your loved one',
      };
      setCaringFor(map[selectedOption] || 'your loved one');
    }

    if (isLast) {
      finishOnboarding();
    } else {
      setSelectedOption(null);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const finishOnboarding = async () => {
    // Persist personalization from onboarding answers
    await saveCaringFor(caringFor);
    await setPainPoints(Array.from(selectedMulti));
    await setHasSeenOnboarding(true);
    router.replace('/(auth)/register');
  };

  const toggleMulti = (label: string) => {
    setSelectedMulti((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const canProceed = () => {
    if (step.type === 'select') return selectedOption !== null;
    if (step.type === 'multi') return selectedMulti.size > 0;
    return true;
  };

  const getButtonText = () => {
    if (isLast) return "Let's do this";
    if (step.type === 'intro') return "I'm ready";
    if (step.type === 'select') return 'Continue';
    if (step.type === 'multi') return `That's ${selectedMulti.size === 0 ? '...' : selectedMulti.size + ' of mine'}`;
    if (step.type === 'emotional') return 'What can I do?';
    if (step.type === 'reveal') return 'I want this';
    return 'Continue';
  };

  // Inject the caregiving person's name into the emotional text
  const personalizeText = (text: string) => {
    return text.replace(/\{person\}/g, caringFor);
  };

  return (
    <View style={[styles.container, { backgroundColor: step.bgColor }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((currentStep + 1) / totalSteps) * 100}%` }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* ─── INTRO ─── */}
          {step.type === 'intro' && (
            <View style={styles.centeredBlock}>
              <Text style={styles.bigEmoji}>{step.emoji}</Text>
              <Text style={styles.headline}>{step.headline}</Text>
              <Text style={styles.body}>{step.body}</Text>
              <View style={styles.spacer24} />
              <Text style={styles.bodyLight}>{step.bodySecond}</Text>
            </View>
          )}

          {/* ─── SINGLE SELECT ─── */}
          {step.type === 'select' && (
            <View style={styles.questionBlock}>
              <Text style={styles.questionText}>{step.question}</Text>
              <View style={styles.optionsList}>
                {step.options?.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.optionCard,
                      selectedOption === opt.label && styles.optionCardSelected,
                    ]}
                    onPress={() => setSelectedOption(opt.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    <Text style={[
                      styles.optionLabel,
                      selectedOption === opt.label && styles.optionLabelSelected,
                    ]}>{opt.label}</Text>
                    <View style={[
                      styles.radioOuter,
                      selectedOption === opt.label && styles.radioOuterSelected,
                    ]}>
                      {selectedOption === opt.label && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ─── MULTI SELECT ─── */}
          {step.type === 'multi' && (
            <View style={styles.questionBlock}>
              <Text style={styles.questionText}>{step.multiPrompt}</Text>
              <Text style={styles.tapHint}>Tap all that apply</Text>
              <View style={styles.multiList}>
                {step.multiOptions?.map((opt) => {
                  const isSelected = selectedMulti.has(opt.label);
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={[styles.multiCard, isSelected && styles.multiCardSelected]}
                      onPress={() => toggleMulti(opt.label)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.multiEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.multiLabel, isSelected && styles.multiLabelSelected]}>
                        {opt.label}
                      </Text>
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ─── EMOTIONAL / STAT ─── */}
          {step.type === 'emotional' && (
            <View style={styles.centeredBlock}>
              <Text style={styles.bigEmoji}>{step.emoji}</Text>
              <Text style={styles.headline}>{step.headline}</Text>
              <View style={styles.spacer16} />
              {step.stat && (
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{step.stat}</Text>
                  <Text style={styles.statLabel}>{step.statLabel}</Text>
                </View>
              )}
              <View style={styles.spacer16} />
              <Text style={styles.body}>{personalizeText(step.body || '')}</Text>
              <View style={styles.spacer24} />
              <Text style={styles.bodyEmphasized}>{personalizeText(step.bodySecond || '')}</Text>
            </View>
          )}

          {/* ─── REVEAL ─── */}
          {step.type === 'reveal' && (
            <View style={styles.centeredBlock}>
              <Text style={styles.bigEmoji}>{step.emoji}</Text>
              <Text style={styles.headline}>{step.headline}</Text>
              <View style={styles.spacer20} />
              <View style={styles.scenarioBox}>
                <Text style={styles.scenarioText}>{personalizeText(step.body || '')}</Text>
              </View>
              <View style={styles.spacer16} />
              <View style={styles.scenarioBox}>
                <Text style={styles.scenarioText}>{personalizeText(step.bodySecond || '')}</Text>
              </View>
            </View>
          )}

          {/* ─── PROMISE ─── */}
          {step.type === 'promise' && (
            <View style={styles.centeredBlock}>
              <Text style={styles.bigEmoji}>{step.emoji}</Text>
              <Text style={styles.headline}>{step.headline}</Text>
              <View style={styles.spacer24} />
              <View style={styles.featureList}>
                {(step.body || '').split('\n').filter(Boolean).map((line, i) => {
                  // Split "emoji text" — emoji is first 1-2 chars before space
                  const spaceIdx = line.indexOf(' ');
                  const emoji = spaceIdx > 0 ? line.slice(0, spaceIdx) : '✓';
                  const text = spaceIdx > 0 ? line.slice(spaceIdx + 1) : line;
                  const bgColors = [colors.tintMed, colors.tintTask, colors.tintJournal, colors.tintEmergency, colors.tintAppt, colors.tintMed];
                  return (
                    <View key={i} style={[styles.featureRow, { backgroundColor: bgColors[i % bgColors.length] }]}>
                      <Text style={styles.featureEmoji}>{emoji}</Text>
                      <Text style={styles.featureText}>{text}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* ─── Bottom CTA ─── */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            !canProceed() && styles.ctaButtonDisabled,
            isLast && { backgroundColor: colors.accent },
          ]}
          onPress={goNext}
          disabled={!canProceed()}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{getButtonText()}</Text>
        </TouchableOpacity>

        {currentStep === 0 && (
          <TouchableOpacity
            style={styles.skipLink}
            onPress={finishOnboarding}
          >
            <Text style={styles.skipText}>Skip intro</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Progress
  progressContainer: {
    paddingTop: 56,
    paddingHorizontal: 28,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  // Scroll
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 16,
  },
  content: {
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },

  // Centered content (intro, emotional, reveal, promise)
  centeredBlock: {
    alignItems: 'center',
  },
  bigEmoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  headline: {
    ...typography.displayLarge,
    fontSize: 36,
    lineHeight: 44,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  bodyLight: {
    ...typography.bodyLarge,
    color: colors.textHint,
    textAlign: 'center',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  bodyEmphasized: {
    ...typography.bodyLarge,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '600',
  },

  // Question block (select, multi)
  questionBlock: {
    alignItems: 'center',
  },
  questionText: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  tapHint: {
    ...typography.labelMedium,
    color: colors.textHint,
    marginBottom: 16,
  },

  // Single select options
  optionsList: {
    width: '100%',
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 14,
  },
  optionLabel: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    flex: 1,
  },
  optionLabelSelected: {
    fontWeight: '600',
    color: colors.primaryDark,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  // Multi-select
  multiList: {
    width: '100%',
    gap: 10,
  },
  multiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  multiCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  multiEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  multiLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  multiLabelSelected: {
    fontWeight: '600',
    color: '#B8432E',
  },
  checkMark: {
    fontSize: 18,
    color: colors.accent,
    fontWeight: '700',
  },

  // Stat box
  statBox: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statNumber: {
    ...typography.displayLarge,
    fontSize: 56,
    color: colors.primary,
    letterSpacing: -2,
  },
  statLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginTop: 6,
  },

  // Scenario box (reveal step)
  scenarioBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
    padding: 22,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  scenarioText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    lineHeight: 28,
  },

  // Feature list (promise step)
  featureList: {
    width: '100%',
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  featureEmoji: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  featureText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },

  // Spacers
  spacer16: { height: 16 },
  spacer20: { height: 20 },
  spacer24: { height: 24 },

  // Bottom
  bottom: {
    paddingHorizontal: 28,
    paddingBottom: 44,
    paddingTop: 12,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
  },
  ctaText: {
    ...typography.button,
    color: '#FFFFFF',
    fontSize: 17,
  },
  skipLink: {
    marginTop: 16,
    padding: 8,
  },
  skipText: {
    ...typography.labelMedium,
    color: colors.textHint,
  },
});
