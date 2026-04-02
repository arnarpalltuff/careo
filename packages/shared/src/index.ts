// Shared types between API and Mobile

export type SubscriptionTier = 'FREE' | 'PLUS' | 'FAMILY';

// Feature limits per tier — matches paywall pricing
export const TIER_LIMITS = {
  FREE:   { circles: 1,  members: 3,        docs: 3,        activeTasks: 5,       historyDays: 7,    emergencyAlerts: false, healthReports: false, expenses: 10,    careNotes: 5,   meetings: 1,   protocols: 1,   burnoutTracking: false, resources: 5,   vitalTracking: false, drugInteractions: false, safeZones: 0,  cognitiveExercises: 2, dailyCheckIns: false, predictiveInsights: false },
  PLUS:   { circles: 3,  members: 8,        docs: 25,       activeTasks: Infinity, historyDays: 90,   emergencyAlerts: true,  healthReports: true,  expenses: Infinity, careNotes: Infinity, meetings: Infinity, protocols: Infinity, burnoutTracking: true, resources: 50,  vitalTracking: true,  drugInteractions: true,  safeZones: 3,  cognitiveExercises: Infinity, dailyCheckIns: true, predictiveInsights: true },
  FAMILY: { circles: 5,  members: Infinity,  docs: Infinity, activeTasks: Infinity, historyDays: Infinity, emergencyAlerts: true, healthReports: true, expenses: Infinity, careNotes: Infinity, meetings: Infinity, protocols: Infinity, burnoutTracking: true, resources: Infinity, vitalTracking: true, drugInteractions: true, safeZones: Infinity, cognitiveExercises: Infinity, dailyCheckIns: true, predictiveInsights: true },
} as const;

export type CircleRole = 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type RecurringType = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type MedLogStatus = 'PENDING' | 'TAKEN' | 'SKIPPED' | 'MISSED';
export type MoodLevel = 'GREAT' | 'GOOD' | 'OKAY' | 'LOW' | 'BAD';
export type AppointmentStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
export type DocCategory = 'INSURANCE' | 'PRESCRIPTION' | 'LEGAL' | 'MEDICAL' | 'ID' | 'OTHER';

// ═══ New Feature Types ═══

export type BurnoutRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type ExpenseCategory = 'MEDICAL' | 'PHARMACY' | 'TRANSPORT' | 'SUPPLIES' | 'HOME_CARE' | 'INSURANCE' | 'FOOD' | 'OTHER';

export type CareNoteType = 'SHIFT_HANDOFF' | 'DOCTOR_VISIT' | 'DAILY_UPDATE' | 'INCIDENT' | 'OBSERVATION';

export type TransitionType = 'HOSPITAL_TO_HOME' | 'HOME_TO_FACILITY' | 'FACILITY_TO_HOME' | 'HOSPICE' | 'REHAB';
export type TransitionStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';

export type RespiteType = 'BREAK' | 'EXERCISE' | 'SOCIAL' | 'SLEEP' | 'HOBBY';

export type ProtocolType = 'FALL' | 'CHEST_PAIN' | 'BREATHING' | 'SEIZURE' | 'CONFUSION' | 'WANDERING' | 'MEDICATION_ERROR' | 'CUSTOM';

export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ResourceCategory = 'SUPPORT_GROUP' | 'HOME_CARE' | 'LEGAL' | 'FINANCIAL' | 'MEDICAL' | 'RESPITE' | 'TRANSPORT' | 'MEAL_DELIVERY' | 'EQUIPMENT' | 'OTHER';

// ═══ Advanced Feature Types ═══

// Vital Signs Tracking
export type VitalType = 'BLOOD_PRESSURE' | 'HEART_RATE' | 'BLOOD_GLUCOSE' | 'WEIGHT' | 'TEMPERATURE' | 'OXYGEN_SATURATION';

export interface VitalReading {
  id: string;
  circleId: string;
  recordedById: string;
  type: VitalType;
  value: number;         // primary value (systolic for BP, BPM for HR, etc.)
  value2?: number;       // secondary value (diastolic for BP)
  unit: string;          // mmHg, bpm, mg/dL, kg, °F, %
  notes?: string;
  recordedAt: string;
}

export const VITAL_UNITS: Record<VitalType, string> = {
  BLOOD_PRESSURE: 'mmHg',
  HEART_RATE: 'bpm',
  BLOOD_GLUCOSE: 'mg/dL',
  WEIGHT: 'lbs',
  TEMPERATURE: '°F',
  OXYGEN_SATURATION: '%',
};

export const VITAL_NORMAL_RANGES: Record<VitalType, { min: number; max: number; min2?: number; max2?: number; label: string }> = {
  BLOOD_PRESSURE:    { min: 90, max: 140, min2: 60, max2: 90, label: 'Systolic / Diastolic' },
  HEART_RATE:        { min: 60, max: 100, label: 'Beats per minute' },
  BLOOD_GLUCOSE:     { min: 70, max: 140, label: 'Fasting mg/dL' },
  WEIGHT:            { min: 0,  max: 500, label: 'Pounds' },
  TEMPERATURE:       { min: 97, max: 99.5, label: 'Degrees Fahrenheit' },
  OXYGEN_SATURATION: { min: 95, max: 100, label: 'SpO2 %' },
};

// Drug Interaction Severity
export type InteractionSeverity = 'LOW' | 'MODERATE' | 'SEVERE' | 'CONTRAINDICATED';

export interface DrugInteraction {
  medication1: string;
  medication2: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
}

// Geo-fencing & Safe Zones
export type SafeZoneShape = 'CIRCLE' | 'POLYGON';

export interface SafeZone {
  id: string;
  circleId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;   // for CIRCLE shape
  isActive: boolean;
  notifyOnExit: boolean;
  notifyOnEntry: boolean;
}

export interface LocationUpdate {
  id: string;
  circleId: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  battery?: number;
  recordedAt: string;
}

// Cognitive Exercises
export type CognitiveCategory = 'MEMORY' | 'ATTENTION' | 'LANGUAGE' | 'PROBLEM_SOLVING' | 'PROCESSING_SPEED';
export type ExerciseDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface CognitiveExercise {
  id: string;
  category: CognitiveCategory;
  title: string;
  description: string;
  difficulty: ExerciseDifficulty;
  durationMinutes: number;
  instructions: string;
  gameData: string; // JSON game config
}

export interface CognitiveSession {
  id: string;
  circleId: string;
  usereId: string;
  exerciseId: string;
  score: number;
  accuracy: number;       // 0-100
  durationSeconds: number;
  completedAt: string;
}

// Daily Safety Check-in
export type CheckInStatus = 'PENDING' | 'OK' | 'NEEDS_HELP' | 'MISSED';

export interface DailyCheckIn {
  id: string;
  circleId: string;
  userId: string;
  status: CheckInStatus;
  notes?: string;
  respondedAt?: string;
  scheduledFor: string;
}

// Predictive Health Insights
export type InsightType = 'TREND_ALERT' | 'ANOMALY' | 'RISK_PREDICTION' | 'RECOMMENDATION';
export type InsightPriority = 'INFO' | 'WARNING' | 'URGENT';

export interface PredictiveInsight {
  id: string;
  circleId: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  dataPoints: string;     // JSON evidence
  recommendation: string;
  acknowledged: boolean;
  createdAt: string;
}

// Default cognitive exercises library
export const COGNITIVE_EXERCISES: Omit<CognitiveExercise, 'id'>[] = [
  {
    category: 'MEMORY',
    title: 'Card Match',
    description: 'Flip cards to find matching pairs. Train your visual memory.',
    difficulty: 'EASY',
    durationMinutes: 5,
    instructions: 'Tap cards to flip them. Find all matching pairs with as few moves as possible.',
    gameData: JSON.stringify({ type: 'card_match', pairs: 6, theme: 'animals' }),
  },
  {
    category: 'MEMORY',
    title: 'Number Recall',
    description: 'Remember sequences of numbers that get progressively longer.',
    difficulty: 'MEDIUM',
    durationMinutes: 5,
    instructions: 'Watch the number sequence, then enter it from memory. Sequences get longer as you succeed.',
    gameData: JSON.stringify({ type: 'number_recall', startLength: 3, maxLength: 9 }),
  },
  {
    category: 'MEMORY',
    title: 'Word List Recall',
    description: 'Memorize a list of words, then recall as many as you can.',
    difficulty: 'HARD',
    durationMinutes: 10,
    instructions: 'Study the word list for 60 seconds, then type as many words as you can remember.',
    gameData: JSON.stringify({ type: 'word_recall', wordCount: 15, studyTimeSeconds: 60 }),
  },
  {
    category: 'ATTENTION',
    title: 'Color Word Challenge',
    description: 'Identify the color of the text, not the word itself (Stroop test).',
    difficulty: 'MEDIUM',
    durationMinutes: 3,
    instructions: 'Tap the button matching the COLOR the word is displayed in, not the word itself.',
    gameData: JSON.stringify({ type: 'stroop', rounds: 20, timePerRound: 5 }),
  },
  {
    category: 'ATTENTION',
    title: 'Spot the Difference',
    description: 'Find subtle differences between two similar images.',
    difficulty: 'EASY',
    durationMinutes: 5,
    instructions: 'Two images are shown side by side. Tap on the differences you find.',
    gameData: JSON.stringify({ type: 'spot_difference', differences: 5, timeLimit: 120 }),
  },
  {
    category: 'LANGUAGE',
    title: 'Word Scramble',
    description: 'Unscramble letters to form words. Keeps language skills sharp.',
    difficulty: 'EASY',
    durationMinutes: 5,
    instructions: 'Rearrange the scrambled letters to form a valid word.',
    gameData: JSON.stringify({ type: 'word_scramble', words: 10, difficulty: 'common' }),
  },
  {
    category: 'LANGUAGE',
    title: 'Category Naming',
    description: 'Name as many items in a category as you can within the time limit.',
    difficulty: 'MEDIUM',
    durationMinutes: 3,
    instructions: 'You\'ll be given a category. Type as many items in that category as you can in 60 seconds.',
    gameData: JSON.stringify({ type: 'category_naming', timeSeconds: 60, categories: ['animals', 'fruits', 'countries', 'colors', 'tools'] }),
  },
  {
    category: 'PROBLEM_SOLVING',
    title: 'Pattern Recognition',
    description: 'Identify the next item in a visual or numerical pattern.',
    difficulty: 'MEDIUM',
    durationMinutes: 5,
    instructions: 'Study the pattern and select what comes next.',
    gameData: JSON.stringify({ type: 'pattern', rounds: 10, types: ['number', 'shape', 'color'] }),
  },
  {
    category: 'PROBLEM_SOLVING',
    title: 'Daily Sudoku',
    description: 'Classic number puzzle that exercises logical reasoning.',
    difficulty: 'HARD',
    durationMinutes: 15,
    instructions: 'Fill each row, column, and 3x3 box with numbers 1-9. Each number appears once per group.',
    gameData: JSON.stringify({ type: 'sudoku', difficulty: 'easy', size: 9 }),
  },
  {
    category: 'PROCESSING_SPEED',
    title: 'Quick Tap',
    description: 'Tap targets as fast as they appear. Measures reaction time.',
    difficulty: 'EASY',
    durationMinutes: 2,
    instructions: 'Tap each circle as quickly as you can when it appears. Try to get the fastest time!',
    gameData: JSON.stringify({ type: 'reaction_time', targets: 20, minDelay: 500, maxDelay: 3000 }),
  },
  {
    category: 'PROCESSING_SPEED',
    title: 'Symbol Match',
    description: 'Match symbols to numbers as quickly as possible (digit symbol substitution).',
    difficulty: 'MEDIUM',
    durationMinutes: 3,
    instructions: 'Using the key at the top, enter the number that matches each symbol. Be fast and accurate!',
    gameData: JSON.stringify({ type: 'symbol_match', symbols: 30, timeLimit: 90 }),
  },
];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  timezone: string;
  subscriptionTier: SubscriptionTier;
  language?: string;
}

export interface CareCircle {
  id: string;
  name: string;
  careRecipient: string;
  recipientDob?: string;
  recipientPhoto?: string;
}

export interface NotificationData {
  type: string;
  circleId?: string;
  taskId?: string;
  entryId?: string;
  alertId?: string;
}

// ═══ Burnout Assessment Scoring ═══
export function computeBurnoutScore(scores: {
  emotional: number;
  physical: number;
  social: number;
  workload: number;
  sleep: number;
  selfCare: number;
}): { overallScore: number; riskLevel: BurnoutRiskLevel } {
  // Sleep and selfCare are inverted (high = good), so we invert them for risk calculation
  const invertedSleep = 11 - scores.sleep;
  const invertedSelfCare = 11 - scores.selfCare;
  const overallScore = (
    scores.emotional * 0.25 +
    scores.physical * 0.20 +
    scores.social * 0.15 +
    scores.workload * 0.20 +
    invertedSleep * 0.10 +
    invertedSelfCare * 0.10
  );
  let riskLevel: BurnoutRiskLevel;
  if (overallScore <= 3) riskLevel = 'LOW';
  else if (overallScore <= 5) riskLevel = 'MODERATE';
  else if (overallScore <= 7.5) riskLevel = 'HIGH';
  else riskLevel = 'CRITICAL';
  return { overallScore: Math.round(overallScore * 10) / 10, riskLevel };
}

// ═══ Default Emergency Protocol Templates ═══
export const DEFAULT_PROTOCOL_TEMPLATES: Record<string, { title: string; steps: { order: number; instruction: string; callNumber?: string }[] }> = {
  FALL: {
    title: 'Fall Response Protocol',
    steps: [
      { order: 1, instruction: 'Stay calm and assess if the person is conscious and responsive' },
      { order: 2, instruction: 'Do NOT move them if they complain of severe pain or cannot move a limb' },
      { order: 3, instruction: 'If serious injury suspected, call 911', callNumber: '911' },
      { order: 4, instruction: 'Check for visible injuries: bleeding, swelling, deformity' },
      { order: 5, instruction: 'If they can move safely, help them to a comfortable position' },
      { order: 6, instruction: 'Apply ice to any bumps or bruises' },
      { order: 7, instruction: 'Document the fall: time, location, what happened, injuries' },
      { order: 8, instruction: 'Notify their primary care doctor within 24 hours' },
    ],
  },
  CHEST_PAIN: {
    title: 'Chest Pain Emergency Protocol',
    steps: [
      { order: 1, instruction: 'Call 911 immediately', callNumber: '911' },
      { order: 2, instruction: 'Have them sit down and stay still' },
      { order: 3, instruction: 'If prescribed, give them nitroglycerin or aspirin' },
      { order: 4, instruction: 'Loosen any tight clothing' },
      { order: 5, instruction: 'Stay with them and monitor breathing' },
      { order: 6, instruction: 'Be ready to perform CPR if they become unresponsive' },
      { order: 7, instruction: 'Gather their medication list and health card for paramedics' },
    ],
  },
  BREATHING: {
    title: 'Breathing Difficulty Protocol',
    steps: [
      { order: 1, instruction: 'Help them sit upright — do not lay them down' },
      { order: 2, instruction: 'If they have an inhaler or oxygen, help them use it' },
      { order: 3, instruction: 'If breathing does not improve in 5 minutes, call 911', callNumber: '911' },
      { order: 4, instruction: 'Loosen any restrictive clothing' },
      { order: 5, instruction: 'Open windows for fresh air if possible' },
      { order: 6, instruction: 'Stay calm and encourage slow, deep breaths' },
    ],
  },
  SEIZURE: {
    title: 'Seizure Response Protocol',
    steps: [
      { order: 1, instruction: 'Time the seizure — if over 5 minutes, call 911', callNumber: '911' },
      { order: 2, instruction: 'Clear the area of hard or sharp objects' },
      { order: 3, instruction: 'Do NOT restrain them or put anything in their mouth' },
      { order: 4, instruction: 'Turn them on their side (recovery position) if possible' },
      { order: 5, instruction: 'Protect their head with a soft object' },
      { order: 6, instruction: 'Stay with them until they are fully conscious' },
      { order: 7, instruction: 'After the seizure: note duration, movements, and responsiveness' },
    ],
  },
  CONFUSION: {
    title: 'Sudden Confusion / Delirium Protocol',
    steps: [
      { order: 1, instruction: 'Stay calm and speak in a reassuring, simple tone' },
      { order: 2, instruction: 'Check for obvious causes: UTI symptoms, fever, missed medication, dehydration' },
      { order: 3, instruction: 'If confusion is sudden and new, call their doctor immediately' },
      { order: 4, instruction: 'If accompanied by weakness, slurred speech, or facial drooping — call 911 (possible stroke)', callNumber: '911' },
      { order: 5, instruction: 'Ensure they are safe and in a familiar environment' },
      { order: 6, instruction: 'Do not argue or try to reorient forcefully' },
      { order: 7, instruction: 'Document when it started and any triggers' },
    ],
  },
  WANDERING: {
    title: 'Wandering / Missing Person Protocol',
    steps: [
      { order: 1, instruction: 'Search the immediate area: home, yard, garage, neighbors' },
      { order: 2, instruction: 'Check their favorite or familiar places' },
      { order: 3, instruction: 'If not found within 15 minutes, call 911', callNumber: '911' },
      { order: 4, instruction: 'Alert all family members and neighbors' },
      { order: 5, instruction: 'Provide police with a recent photo and physical description' },
      { order: 6, instruction: 'Check if they have a GPS tracker or ID bracelet' },
      { order: 7, instruction: 'After found: assess for injuries, dehydration, or distress' },
    ],
  },
  MEDICATION_ERROR: {
    title: 'Medication Error Protocol',
    steps: [
      { order: 1, instruction: 'Identify what was taken, how much, and when' },
      { order: 2, instruction: 'Call Poison Control: 1-800-222-1222', callNumber: '1-800-222-1222' },
      { order: 3, instruction: 'Do NOT induce vomiting unless instructed by Poison Control' },
      { order: 4, instruction: 'If unconscious, having seizures, or difficulty breathing — call 911', callNumber: '911' },
      { order: 5, instruction: 'Keep the medication bottle/container for reference' },
      { order: 6, instruction: 'Monitor for symptoms: nausea, dizziness, drowsiness, confusion' },
      { order: 7, instruction: 'Notify their prescribing doctor' },
    ],
  },
};
