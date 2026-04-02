import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { CrossHatch, RadialRings, TopoLines } from '../components/Texture';

// ─── Types ─────────────────────────────────────────────────────────
type Severity = 'critical' | 'major' | 'moderate' | 'minor';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  category: string;
  emoji: string;
}

interface DrugInteraction {
  id: string;
  drugA: string;
  drugB: string;
  severity: Severity;
  description: string;
  symptoms: string[];
  action: string;
}

interface FoodInteraction {
  id: string;
  drug: string;
  food: string;
  emoji: string;
  severity: Severity;
  description: string;
  action: string;
}

// ─── Severity Config ──────────────────────────────────────────────
const severityConfig: Record<Severity, { color: string; bg: string; label: string; emoji: string }> = {
  critical: { color: '#DC2626', bg: '#FEE2E2', label: 'Critical', emoji: '🔴' },
  major:    { color: '#EA580C', bg: '#FFF7ED', label: 'Major',    emoji: '🟠' },
  moderate: { color: '#CA8A04', bg: '#FEFCE8', label: 'Moderate', emoji: '🟡' },
  minor:    { color: '#16A34A', bg: '#F0FDF4', label: 'Minor',    emoji: '🟢' },
};

// ─── Mock Data: Current Medications ───────────────────────────────
const currentMedications: Medication[] = [
  { id: '1', name: 'Warfarin',      dosage: '5 mg',   frequency: 'Once daily',      category: 'Blood Thinner',   emoji: '💉' },
  { id: '2', name: 'Lisinopril',    dosage: '10 mg',  frequency: 'Once daily',      category: 'ACE Inhibitor',   emoji: '❤️' },
  { id: '3', name: 'Metformin',     dosage: '500 mg', frequency: 'Twice daily',     category: 'Diabetes',        emoji: '🩸' },
  { id: '4', name: 'Atorvastatin',  dosage: '20 mg',  frequency: 'Once at bedtime', category: 'Cholesterol',     emoji: '💊' },
  { id: '5', name: 'Omeprazole',    dosage: '20 mg',  frequency: 'Once daily',      category: 'Stomach Acid',    emoji: '🫁' },
  { id: '6', name: 'Amlodipine',    dosage: '5 mg',   frequency: 'Once daily',      category: 'Blood Pressure',  emoji: '🩺' },
  { id: '7', name: 'Levothyroxine', dosage: '50 mcg', frequency: 'Once morning',    category: 'Thyroid',         emoji: '🦋' },
];

// ─── Mock Data: Drug-Drug Interactions ────────────────────────────
const drugInteractions: DrugInteraction[] = [
  {
    id: 'di1',
    drugA: 'Warfarin',
    drugB: 'Omeprazole',
    severity: 'major',
    description: 'Omeprazole may increase the blood-thinning effect of Warfarin by inhibiting its metabolism through CYP2C19. This raises the risk of bleeding events.',
    symptoms: ['Unusual bruising', 'Blood in urine or stool', 'Prolonged bleeding from cuts', 'Nosebleeds', 'Dark or tarry stools'],
    action: 'Monitor INR closely. Doctor may adjust Warfarin dose. Report any unusual bleeding immediately. Consider switching to pantoprazole as an alternative PPI.',
  },
  {
    id: 'di2',
    drugA: 'Lisinopril',
    drugB: 'Metformin',
    severity: 'moderate',
    description: 'ACE inhibitors like Lisinopril may enhance the blood-sugar-lowering effect of Metformin. This can occasionally lead to hypoglycemia, particularly in elderly patients.',
    symptoms: ['Shakiness or trembling', 'Excessive sweating', 'Dizziness or lightheadedness', 'Confusion', 'Rapid heartbeat'],
    action: 'Monitor blood sugar levels more frequently. Keep a fast-acting glucose source nearby. Inform doctor if experiencing frequent low blood sugar episodes.',
  },
  {
    id: 'di3',
    drugA: 'Warfarin',
    drugB: 'Atorvastatin',
    severity: 'moderate',
    description: 'Atorvastatin may slightly increase Warfarin levels. The combination is generally safe but requires monitoring, especially when starting or changing the statin dose.',
    symptoms: ['Easy bruising', 'Gum bleeding when brushing teeth', 'Heavier than normal menstrual periods', 'Prolonged bleeding from minor wounds'],
    action: 'Regular INR monitoring, especially during the first few weeks of co-administration or dose changes. No dose adjustment usually needed if INR stays in range.',
  },
  {
    id: 'di4',
    drugA: 'Amlodipine',
    drugB: 'Atorvastatin',
    severity: 'major',
    description: 'Amlodipine increases atorvastatin blood levels by inhibiting CYP3A4, raising the risk of statin-related muscle damage (rhabdomyolysis). Atorvastatin dose should not exceed 20 mg when taken with amlodipine.',
    symptoms: ['Unexplained muscle pain or tenderness', 'Muscle weakness', 'Dark-colored urine', 'Fatigue', 'Fever'],
    action: 'Atorvastatin dose must not exceed 20 mg daily with amlodipine. Report any muscle pain, tenderness, or weakness immediately. Doctor may check creatine kinase (CK) levels.',
  },
  {
    id: 'di5',
    drugA: 'Levothyroxine',
    drugB: 'Omeprazole',
    severity: 'moderate',
    description: 'Omeprazole reduces stomach acid, which may decrease levothyroxine absorption. This can lead to subtherapeutic thyroid hormone levels over time.',
    symptoms: ['Increased fatigue', 'Weight gain', 'Feeling cold', 'Constipation', 'Dry skin', 'Brain fog'],
    action: 'Take levothyroxine at least 4 hours before omeprazole. Monitor TSH levels every 6-8 weeks until stable. Doctor may need to increase levothyroxine dose.',
  },
  {
    id: 'di6',
    drugA: 'Lisinopril',
    drugB: 'Amlodipine',
    severity: 'minor',
    description: 'Both medications lower blood pressure through different mechanisms. The combination is commonly prescribed and generally beneficial, but may occasionally cause excessive blood pressure reduction.',
    symptoms: ['Dizziness when standing up', 'Lightheadedness', 'Fainting', 'Fatigue'],
    action: 'Monitor blood pressure regularly, especially after position changes. Rise slowly from sitting or lying positions. Stay well hydrated.',
  },
];

// ─── Mock Data: Food Interactions ─────────────────────────────────
const foodInteractions: FoodInteraction[] = [
  {
    id: 'fi1',
    drug: 'Warfarin',
    food: 'Leafy greens (Vitamin K)',
    emoji: '🥬',
    severity: 'critical',
    description: 'Vitamin K directly counteracts Warfarin. Large changes in Vitamin K intake (kale, spinach, broccoli, Brussels sprouts) can make Warfarin less effective, increasing clot risk.',
    action: 'Maintain consistent daily Vitamin K intake rather than avoiding these foods entirely. Do not suddenly increase or decrease consumption. Notify doctor of any major diet changes.',
  },
  {
    id: 'fi2',
    drug: 'Atorvastatin',
    food: 'Grapefruit',
    emoji: '🍊',
    severity: 'major',
    description: 'Grapefruit and grapefruit juice inhibit CYP3A4 in the gut, dramatically increasing statin absorption. This can raise atorvastatin blood levels by up to 250%, greatly increasing risk of muscle damage.',
    action: 'Avoid grapefruit and grapefruit juice entirely while taking atorvastatin. This includes Seville oranges and pomelos. Other citrus fruits (oranges, lemons, limes) are safe.',
  },
  {
    id: 'fi3',
    drug: 'Metformin',
    food: 'Alcohol',
    emoji: '🍷',
    severity: 'major',
    description: 'Alcohol combined with metformin significantly increases the risk of lactic acidosis, a rare but serious complication. Alcohol also impairs the liver\'s ability to produce glucose.',
    action: 'Limit alcohol to 1 drink per day for women, 2 for men. Never drink on an empty stomach. Avoid binge drinking entirely. Seek emergency help if experiencing nausea, vomiting, or rapid breathing after drinking.',
  },
  {
    id: 'fi4',
    drug: 'Levothyroxine',
    food: 'Calcium-rich foods & Soy',
    emoji: '🥛',
    severity: 'moderate',
    description: 'Calcium (dairy, fortified juices), soy products, and high-fiber foods can bind to levothyroxine in the gut, reducing absorption by up to 40%.',
    action: 'Take levothyroxine on an empty stomach, 30-60 minutes before breakfast. Wait at least 4 hours before consuming calcium-rich foods or soy products.',
  },
  {
    id: 'fi5',
    drug: 'Lisinopril',
    food: 'Potassium-rich foods',
    emoji: '🍌',
    severity: 'moderate',
    description: 'ACE inhibitors reduce potassium excretion. Excessive potassium intake from bananas, oranges, potatoes, and salt substitutes can lead to dangerously high potassium levels (hyperkalemia).',
    action: 'Moderate intake of high-potassium foods. Avoid potassium-based salt substitutes. Have potassium levels checked regularly. Seek care if experiencing muscle weakness or irregular heartbeat.',
  },
  {
    id: 'fi6',
    drug: 'Warfarin',
    food: 'Cranberry juice',
    emoji: '🫐',
    severity: 'moderate',
    description: 'Cranberry juice may increase Warfarin\'s effect by inhibiting CYP2C9. Large amounts can raise bleeding risk.',
    action: 'Limit cranberry juice to small, consistent amounts (no more than 8 oz daily). Monitor for signs of increased bleeding. Inform doctor of cranberry supplement use.',
  },
];

// ─── Searchable Medication Database ───────────────────────────────
const medicationDatabase = [
  'Aspirin', 'Ibuprofen', 'Naproxen', 'Acetaminophen', 'Amoxicillin',
  'Azithromycin', 'Ciprofloxacin', 'Prednisone', 'Gabapentin', 'Tramadol',
  'Hydrocodone', 'Sertraline', 'Fluoxetine', 'Alprazolam', 'Diazepam',
  'Clopidogrel', 'Digoxin', 'Furosemide', 'Potassium Chloride', 'Insulin',
  'Vitamin D', 'Fish Oil', 'Turmeric Supplement', 'St. John\'s Wort',
  'Ginkgo Biloba', 'CoQ10', 'Magnesium', 'Iron Supplement',
];

// Mock interactions for "Check New Medication" feature
const newMedInteractions: Record<string, { with: string; severity: Severity; note: string }[]> = {
  'Aspirin': [
    { with: 'Warfarin', severity: 'critical', note: 'Drastically increases bleeding risk. Both are blood thinners. Combination requires close medical supervision and is generally avoided.' },
    { with: 'Lisinopril', severity: 'moderate', note: 'May reduce the blood-pressure-lowering effect of Lisinopril. Also increases kidney risk when combined.' },
  ],
  'Ibuprofen': [
    { with: 'Warfarin', severity: 'critical', note: 'NSAIDs significantly increase bleeding risk with Warfarin. This combination should be avoided.' },
    { with: 'Lisinopril', severity: 'major', note: 'Ibuprofen can reduce the effectiveness of Lisinopril and worsen kidney function.' },
    { with: 'Metformin', severity: 'moderate', note: 'May increase risk of lactic acidosis by affecting kidney function.' },
    { with: 'Amlodipine', severity: 'minor', note: 'NSAIDs may slightly reduce the blood pressure lowering effect.' },
  ],
  'Naproxen': [
    { with: 'Warfarin', severity: 'critical', note: 'High bleeding risk. Avoid combining NSAIDs with anticoagulants.' },
    { with: 'Lisinopril', severity: 'major', note: 'Reduces ACE inhibitor effectiveness and increases kidney risk.' },
  ],
  'Ciprofloxacin': [
    { with: 'Warfarin', severity: 'major', note: 'Ciprofloxacin increases Warfarin levels, raising bleeding risk significantly.' },
    { with: 'Levothyroxine', severity: 'moderate', note: 'May reduce levothyroxine absorption. Separate doses by at least 4 hours.' },
  ],
  'Sertraline': [
    { with: 'Warfarin', severity: 'major', note: 'SSRIs increase bleeding risk with Warfarin by affecting platelet function.' },
    { with: 'Omeprazole', severity: 'moderate', note: 'Omeprazole may increase sertraline levels through CYP2C19 inhibition.' },
  ],
  'St. John\'s Wort': [
    { with: 'Warfarin', severity: 'critical', note: 'St. John\'s Wort dramatically reduces Warfarin effectiveness by inducing CYP enzymes. Can lead to dangerous clot formation.' },
    { with: 'Atorvastatin', severity: 'major', note: 'Significantly reduces statin levels, making cholesterol treatment ineffective.' },
    { with: 'Omeprazole', severity: 'major', note: 'Reduces omeprazole effectiveness through enzyme induction.' },
    { with: 'Amlodipine', severity: 'moderate', note: 'May reduce amlodipine levels, decreasing blood pressure control.' },
  ],
  'Fluoxetine': [
    { with: 'Warfarin', severity: 'major', note: 'Increases Warfarin levels and also impairs platelet function. Double bleeding risk.' },
    { with: 'Metformin', severity: 'minor', note: 'May enhance blood sugar lowering. Monitor glucose levels.' },
  ],
  'Ginkgo Biloba': [
    { with: 'Warfarin', severity: 'critical', note: 'Ginkgo has antiplatelet properties that dangerously increase bleeding risk with Warfarin.' },
    { with: 'Amlodipine', severity: 'minor', note: 'May slightly affect blood pressure. Monitor closely.' },
  ],
  'Clopidogrel': [
    { with: 'Warfarin', severity: 'critical', note: 'Dual anticoagulation/antiplatelet therapy. Extreme bleeding risk without strict medical supervision.' },
    { with: 'Omeprazole', severity: 'major', note: 'Omeprazole significantly reduces clopidogrel activation. Use pantoprazole instead.' },
    { with: 'Atorvastatin', severity: 'minor', note: 'Minimal interaction. Generally safe to combine.' },
  ],
  'Prednisone': [
    { with: 'Warfarin', severity: 'major', note: 'Corticosteroids increase bleeding risk and may affect INR unpredictably.' },
    { with: 'Metformin', severity: 'major', note: 'Prednisone raises blood sugar significantly, counteracting Metformin.' },
    { with: 'Lisinopril', severity: 'moderate', note: 'Corticosteroids cause fluid retention, counteracting blood pressure control.' },
  ],
};

// ─── Component ─────────────────────────────────────────────────────
export default function DrugInteractionsScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'check' | 'food'>('overview');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMedQuery, setNewMedQuery] = useState('');
  const [selectedNewMed, setSelectedNewMed] = useState<string | null>(null);

  // Summary stats
  const totalMeds = currentMedications.length;
  const totalInteractions = drugInteractions.length;
  const criticalAlerts = drugInteractions.filter((i) => i.severity === 'critical').length
    + foodInteractions.filter((i) => i.severity === 'critical').length;
  const majorAlerts = drugInteractions.filter((i) => i.severity === 'major').length;

  // Filter medications by search
  const filteredMeds = useMemo(() => {
    if (!searchQuery.trim()) return currentMedications;
    const q = searchQuery.toLowerCase();
    return currentMedications.filter(
      (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  // Search suggestions for new medication check
  const newMedSuggestions = useMemo(() => {
    if (!newMedQuery.trim() || selectedNewMed) return [];
    const q = newMedQuery.toLowerCase();
    return medicationDatabase.filter(
      (m) => m.toLowerCase().includes(q) && !currentMedications.some((cm) => cm.name === m),
    );
  }, [newMedQuery, selectedNewMed]);

  // Interactions for selected new medication
  const newMedResults = useMemo(() => {
    if (!selectedNewMed) return [];
    return newMedInteractions[selectedNewMed] || [];
  }, [selectedNewMed]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const sortedDrugInteractions = [...drugInteractions].sort((a, b) => {
    const order: Record<Severity, number> = { critical: 0, major: 1, moderate: 2, minor: 3 };
    return order[a.severity] - order[b.severity];
  });

  const sortedFoodInteractions = [...foodInteractions].sort((a, b) => {
    const order: Record<Severity, number> = { critical: 0, major: 1, moderate: 2, minor: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <View style={styles.root}>
      <TopoLines color="#1B6B5F" opacity={0.02} variant="wide" />

      {/* Hero */}
      <View style={styles.hero}>
        <CrossHatch color="#fff" opacity={0.04} />
        <RadialRings color="#fff" opacity={0.05} cx={320} cy={40} />
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.heroEmoji}>💊</Text>
        <Text style={styles.heroTitle}>Drug Interactions</Text>
        <Text style={styles.heroSub}>Keep your loved one safe from harmful combinations</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>💊</Text>
          <Text style={styles.statNum}>{totalMeds}</Text>
          <Text style={styles.statLabel}>Medications</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⚠️</Text>
          <Text style={[styles.statNum, { color: colors.warning }]}>{totalInteractions}</Text>
          <Text style={styles.statLabel}>Interactions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔴</Text>
          <Text style={[styles.statNum, { color: severityConfig.critical.color }]}>{criticalAlerts}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🟠</Text>
          <Text style={[styles.statNum, { color: severityConfig.major.color }]}>{majorAlerts}</Text>
          <Text style={styles.statLabel}>Major</Text>
        </View>
      </View>

      {/* Tab Toggle */}
      <View style={styles.toggleRow}>
        {(['overview', 'check', 'food'] as const).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.toggleBtn, activeTab === v && styles.toggleActive]}
            onPress={() => setActiveTab(v)}
          >
            <Text style={[styles.toggleText, activeTab === v && styles.toggleTextActive]}>
              {v === 'overview' ? 'Drug-Drug' : v === 'check' ? 'Check New' : 'Food'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Overview Tab ──────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {/* Search */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search medications..."
                placeholderTextColor={colors.textHint}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Current Medications */}
            <Text style={styles.sectionLabel}>CURRENT MEDICATIONS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.medScroll} contentContainerStyle={styles.medScrollContent}>
              {filteredMeds.map((med) => (
                <View key={med.id} style={styles.medPill}>
                  <Text style={styles.medPillEmoji}>{med.emoji}</Text>
                  <View>
                    <Text style={styles.medPillName}>{med.name}</Text>
                    <Text style={styles.medPillDose}>{med.dosage} - {med.frequency}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Interactions List */}
            <Text style={styles.sectionLabel}>KNOWN INTERACTIONS</Text>
            {sortedDrugInteractions.map((interaction) => {
              const config = severityConfig[interaction.severity];
              const isExpanded = expandedId === interaction.id;
              return (
                <TouchableOpacity
                  key={interaction.id}
                  style={[styles.interactionCard, { borderLeftColor: config.color, borderLeftWidth: 4 }]}
                  onPress={() => toggleExpand(interaction.id)}
                  activeOpacity={0.7}
                >
                  {/* Header */}
                  <View style={styles.interactionHeader}>
                    <View style={styles.interactionDrugs}>
                      <Text style={styles.interactionDrugA}>{interaction.drugA}</Text>
                      <Text style={styles.interactionPlus}>+</Text>
                      <Text style={styles.interactionDrugB}>{interaction.drugB}</Text>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
                      <Text style={styles.severityBadgeEmoji}>{config.emoji}</Text>
                      <Text style={[styles.severityBadgeText, { color: config.color }]}>{config.label}</Text>
                    </View>
                  </View>

                  {/* Preview */}
                  <Text style={styles.interactionPreview} numberOfLines={isExpanded ? undefined : 2}>
                    {interaction.description}
                  </Text>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={styles.expandedSection}>
                      {/* Symptoms */}
                      <View style={styles.expandedBlock}>
                        <Text style={styles.expandedLabel}>⚠️ SYMPTOMS TO WATCH FOR</Text>
                        {interaction.symptoms.map((symptom, idx) => (
                          <View key={idx} style={styles.symptomRow}>
                            <Text style={styles.symptomBullet}>{'•'}</Text>
                            <Text style={styles.symptomText}>{symptom}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Action */}
                      <View style={[styles.expandedBlock, styles.actionBlock]}>
                        <Text style={styles.expandedLabel}>✅ WHAT TO DO</Text>
                        <Text style={styles.actionText}>{interaction.action}</Text>
                      </View>
                    </View>
                  )}

                  {/* Expand indicator */}
                  <Text style={styles.expandHint}>{isExpanded ? 'Tap to collapse ▲' : 'Tap for details ▼'}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* ── Check New Medication Tab ─────────────────────────── */}
        {activeTab === 'check' && (
          <>
            <View style={styles.checkIntro}>
              <Text style={styles.checkIntroEmoji}>🔬</Text>
              <Text style={styles.checkIntroTitle}>Check a New Medication</Text>
              <Text style={styles.checkIntroText}>
                Before starting a new medication or supplement, check here to see if it interacts with current prescriptions.
              </Text>
            </View>

            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>💊</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Type medication or supplement name..."
                placeholderTextColor={colors.textHint}
                value={newMedQuery}
                onChangeText={(text) => {
                  setNewMedQuery(text);
                  setSelectedNewMed(null);
                }}
              />
              {newMedQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setNewMedQuery(''); setSelectedNewMed(null); }}>
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Suggestions Dropdown */}
            {newMedSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {newMedSuggestions.map((med) => (
                  <TouchableOpacity
                    key={med}
                    style={styles.suggestionRow}
                    onPress={() => {
                      setNewMedQuery(med);
                      setSelectedNewMed(med);
                    }}
                  >
                    <Text style={styles.suggestionIcon}>💊</Text>
                    <Text style={styles.suggestionText}>{med}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Results */}
            {selectedNewMed && (
              <>
                {newMedResults.length > 0 ? (
                  <>
                    <View style={[styles.resultsBanner, { backgroundColor: severityConfig[newMedResults.sort((a, b) => {
                      const order: Record<Severity, number> = { critical: 0, major: 1, moderate: 2, minor: 3 };
                      return order[a.severity] - order[b.severity];
                    })[0].severity].bg }]}>
                      <Text style={styles.resultsBannerEmoji}>
                        {newMedResults.some((r) => r.severity === 'critical') ? '🚨' : '⚠️'}
                      </Text>
                      <View style={styles.resultsBannerContent}>
                        <Text style={styles.resultsBannerTitle}>
                          {newMedResults.length} interaction{newMedResults.length !== 1 ? 's' : ''} found
                        </Text>
                        <Text style={styles.resultsBannerSub}>
                          {selectedNewMed} interacts with your current medications
                        </Text>
                      </View>
                    </View>

                    {newMedResults
                      .sort((a, b) => {
                        const order: Record<Severity, number> = { critical: 0, major: 1, moderate: 2, minor: 3 };
                        return order[a.severity] - order[b.severity];
                      })
                      .map((result, idx) => {
                        const config = severityConfig[result.severity];
                        return (
                          <View key={idx} style={[styles.resultCard, { borderLeftColor: config.color, borderLeftWidth: 4 }]}>
                            <View style={styles.resultHeader}>
                              <Text style={styles.resultDrug}>{selectedNewMed} + {result.with}</Text>
                              <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
                                <Text style={styles.severityBadgeEmoji}>{config.emoji}</Text>
                                <Text style={[styles.severityBadgeText, { color: config.color }]}>{config.label}</Text>
                              </View>
                            </View>
                            <Text style={styles.resultNote}>{result.note}</Text>
                          </View>
                        );
                      })}

                    <TouchableOpacity style={styles.consultBtn}>
                      <Text style={styles.consultBtnEmoji}>📞</Text>
                      <Text style={styles.consultBtnText}>Share with Doctor / Pharmacist</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.noInteractions}>
                    <Text style={styles.noInteractionsEmoji}>✅</Text>
                    <Text style={styles.noInteractionsTitle}>No Known Interactions</Text>
                    <Text style={styles.noInteractionsText}>
                      {selectedNewMed} does not have known interactions with your current medications in our database. Always confirm with your pharmacist.
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Not searched yet */}
            {!selectedNewMed && !newMedQuery.trim() && (
              <View style={styles.commonChecks}>
                <Text style={styles.sectionLabel}>COMMONLY CHECKED</Text>
                {['Aspirin', 'Ibuprofen', 'St. John\'s Wort', 'Ginkgo Biloba', 'Clopidogrel', 'Prednisone'].map((med) => (
                  <TouchableOpacity
                    key={med}
                    style={styles.commonCheckRow}
                    onPress={() => {
                      setNewMedQuery(med);
                      setSelectedNewMed(med);
                    }}
                  >
                    <Text style={styles.commonCheckEmoji}>💊</Text>
                    <Text style={styles.commonCheckName}>{med}</Text>
                    <Text style={styles.commonCheckArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── Food Interactions Tab ────────────────────────────── */}
        {activeTab === 'food' && (
          <>
            <View style={styles.foodIntro}>
              <Text style={styles.foodIntroEmoji}>🍽️</Text>
              <Text style={styles.foodIntroTitle}>Food & Beverage Interactions</Text>
              <Text style={styles.foodIntroText}>
                Certain foods can dramatically affect how medications work. These are known interactions with the current medication list.
              </Text>
            </View>

            {sortedFoodInteractions.map((fi) => {
              const config = severityConfig[fi.severity];
              const isExpanded = expandedId === fi.id;
              return (
                <TouchableOpacity
                  key={fi.id}
                  style={[styles.foodCard, { borderLeftColor: config.color, borderLeftWidth: 4 }]}
                  onPress={() => toggleExpand(fi.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.foodHeader}>
                    <View style={styles.foodPair}>
                      <Text style={styles.foodEmoji}>{fi.emoji}</Text>
                      <View>
                        <Text style={styles.foodName}>{fi.food}</Text>
                        <Text style={styles.foodDrug}>affects {fi.drug}</Text>
                      </View>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
                      <Text style={styles.severityBadgeEmoji}>{config.emoji}</Text>
                      <Text style={[styles.severityBadgeText, { color: config.color }]}>{config.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.foodDesc} numberOfLines={isExpanded ? undefined : 2}>
                    {fi.description}
                  </Text>

                  {isExpanded && (
                    <View style={[styles.expandedBlock, styles.actionBlock, { marginTop: 12 }]}>
                      <Text style={styles.expandedLabel}>✅ WHAT TO DO</Text>
                      <Text style={styles.actionText}>{fi.action}</Text>
                    </View>
                  )}

                  <Text style={styles.expandHint}>{isExpanded ? 'Tap to collapse ▲' : 'Tap for details ▼'}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Quick Reference */}
            <View style={styles.quickRef}>
              <Text style={styles.quickRefTitle}>📋 Quick Reference</Text>
              <View style={styles.quickRefRow}>
                <Text style={styles.quickRefEmoji}>🚫</Text>
                <Text style={styles.quickRefText}>Avoid grapefruit with statins</Text>
              </View>
              <View style={styles.quickRefRow}>
                <Text style={styles.quickRefEmoji}>📏</Text>
                <Text style={styles.quickRefText}>Keep Vitamin K intake consistent with Warfarin</Text>
              </View>
              <View style={styles.quickRefRow}>
                <Text style={styles.quickRefEmoji}>⏰</Text>
                <Text style={styles.quickRefText}>Take thyroid meds 30-60 min before eating</Text>
              </View>
              <View style={styles.quickRefRow}>
                <Text style={styles.quickRefEmoji}>🍷</Text>
                <Text style={styles.quickRefText}>Limit alcohol with Metformin</Text>
              </View>
              <View style={styles.quickRefRow}>
                <Text style={styles.quickRefEmoji}>🍌</Text>
                <Text style={styles.quickRefText}>Moderate potassium with ACE inhibitors</Text>
              </View>
            </View>
          </>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerEmoji}>ℹ️</Text>
          <Text style={styles.disclaimerText}>
            This tool is for informational purposes only and does not replace professional medical advice. Always consult your doctor or pharmacist before making changes to medications.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
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
    alignItems: 'center',
  },
  backBtn: { position: 'absolute', left: 20, top: Platform.OS === 'web' ? 48 : 60 },
  backText: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.8)' },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: { ...typography.displayMedium, color: '#fff' },
  heroSub: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'center' },

  // Stats
  statsRow: { flexDirection: 'row', marginHorizontal: 18, marginTop: -12, gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statNum: { ...typography.headingMedium, color: colors.primary },
  statLabel: { ...typography.labelSmall, color: colors.textHint, marginTop: 2, fontSize: 10 },

  // Toggle
  toggleRow: { flexDirection: 'row', marginHorizontal: 18, marginTop: 16, backgroundColor: '#fff', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.divider },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { ...typography.labelMedium, color: colors.textHint },
  toggleTextActive: { color: '#fff', fontWeight: '700' },

  scroll: { flex: 1, paddingTop: 16 },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, ...typography.bodyMedium, color: colors.textPrimary, paddingVertical: 12 },
  clearBtn: { ...typography.bodyMedium, color: colors.textHint, paddingHorizontal: 8, fontSize: 16 },

  // Section Labels
  sectionLabel: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1.5, fontWeight: '700', fontSize: 11, paddingHorizontal: 18, marginBottom: 12, marginTop: 4 },

  // Medication Pills
  medScroll: { marginBottom: 20 },
  medScrollContent: { paddingHorizontal: 18, gap: 10 },
  medPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    minWidth: 180,
  },
  medPillEmoji: { fontSize: 22 },
  medPillName: { ...typography.headingSmall, color: colors.textPrimary },
  medPillDose: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },

  // Interaction Cards
  interactionCard: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  interactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  interactionDrugs: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  interactionDrugA: { ...typography.headingSmall, color: colors.textPrimary },
  interactionPlus: { ...typography.bodyMedium, color: colors.textHint },
  interactionDrugB: { ...typography.headingSmall, color: colors.textPrimary },
  interactionPreview: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },

  // Severity Badge
  severityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 4 },
  severityBadgeEmoji: { fontSize: 10 },
  severityBadgeText: { ...typography.labelSmall, fontWeight: '700', fontSize: 11 },

  // Expanded
  expandedSection: { marginTop: 14 },
  expandedBlock: { marginBottom: 14 },
  expandedLabel: { ...typography.labelSmall, letterSpacing: 1, fontWeight: '700', color: colors.textHint, marginBottom: 8, fontSize: 11 },
  symptomRow: { flexDirection: 'row', gap: 8, marginBottom: 4, paddingLeft: 4 },
  symptomBullet: { color: colors.textHint, fontSize: 14, marginTop: 1 },
  symptomText: { ...typography.bodySmall, color: colors.textPrimary, flex: 1 },
  actionBlock: { backgroundColor: colors.primaryLight, borderRadius: 12, padding: 14 },
  actionText: { ...typography.bodySmall, color: colors.primaryDark, lineHeight: 20 },
  expandHint: { ...typography.labelSmall, color: colors.textHint, textAlign: 'center', marginTop: 10, fontSize: 11 },

  // Check New Tab
  checkIntro: { marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryLight },
  checkIntroEmoji: { fontSize: 36, marginBottom: 8 },
  checkIntroTitle: { ...typography.headingMedium, color: colors.primary, marginBottom: 6 },
  checkIntroText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Suggestions
  suggestionsContainer: { marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginTop: -8, marginBottom: 16, overflow: 'hidden' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 10 },
  suggestionIcon: { fontSize: 16 },
  suggestionText: { ...typography.bodyMedium, color: colors.textPrimary },

  // Results
  resultsBanner: { flexDirection: 'row', marginHorizontal: 18, borderRadius: 14, padding: 16, marginBottom: 14, alignItems: 'center', gap: 12 },
  resultsBannerEmoji: { fontSize: 28 },
  resultsBannerContent: { flex: 1 },
  resultsBannerTitle: { ...typography.headingSmall, color: colors.textPrimary },
  resultsBannerSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },

  resultCard: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resultDrug: { ...typography.headingSmall, color: colors.textPrimary, flex: 1 },
  resultNote: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },

  consultBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 18, marginTop: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: colors.primary, gap: 8 },
  consultBtnEmoji: { fontSize: 18 },
  consultBtnText: { ...typography.labelLarge, color: '#fff', fontWeight: '700' },

  // No interactions
  noInteractions: { marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: colors.divider },
  noInteractionsEmoji: { fontSize: 48, marginBottom: 12 },
  noInteractionsTitle: { ...typography.headingMedium, color: colors.success, marginBottom: 8 },
  noInteractionsText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Common Checks
  commonChecks: { marginTop: 8 },
  commonCheckRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: colors.divider },
  commonCheckEmoji: { fontSize: 18 },
  commonCheckName: { ...typography.headingSmall, color: colors.textPrimary, flex: 1 },
  commonCheckArrow: { ...typography.bodyMedium, color: colors.textHint, fontSize: 18 },

  // Food Tab
  foodIntro: { marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryLight },
  foodIntroEmoji: { fontSize: 36, marginBottom: 8 },
  foodIntroTitle: { ...typography.headingMedium, color: colors.primary, marginBottom: 6 },
  foodIntroText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  foodCard: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  foodPair: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  foodEmoji: { fontSize: 28 },
  foodName: { ...typography.headingSmall, color: colors.textPrimary },
  foodDrug: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
  foodDesc: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },

  // Quick Reference
  quickRef: { marginHorizontal: 18, backgroundColor: '#fff', borderRadius: 18, padding: 18, marginTop: 8, borderWidth: 1, borderColor: colors.primaryLight },
  quickRefTitle: { ...typography.headingSmall, color: colors.primary, marginBottom: 14 },
  quickRefRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  quickRefEmoji: { fontSize: 16, width: 24, textAlign: 'center' },
  quickRefText: { ...typography.bodySmall, color: colors.textPrimary, flex: 1 },

  // Disclaimer
  disclaimer: { flexDirection: 'row', marginHorizontal: 18, marginTop: 20, padding: 16, backgroundColor: colors.surfaceWarm, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: colors.divider },
  disclaimerEmoji: { fontSize: 16, marginTop: 2 },
  disclaimerText: { ...typography.bodySmall, color: colors.textHint, flex: 1, lineHeight: 18 },
});
