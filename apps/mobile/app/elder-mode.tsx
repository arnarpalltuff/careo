import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { useOnboardingStore } from '../stores/onboardingStore';

// ─── Elder Mode ────────────────────────────────────────────────────
// A simplified, large-text interface designed for the care recipient.
// Big buttons, high contrast, simple actions. No competitor has this.

const now = new Date();
const hour = now.getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

interface MedReminder {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
}

const demoMeds: MedReminder[] = [
  { id: '1', name: 'Lisinopril', dosage: '10mg', time: '8:00 AM', taken: hour >= 9 },
  { id: '2', name: 'Vitamin D', dosage: '2000 IU', time: '9:00 AM', taken: hour >= 10 },
  { id: '3', name: 'Metformin', dosage: '500mg', time: '12:00 PM', taken: false },
  { id: '4', name: 'Lisinopril', dosage: '10mg', time: '8:00 PM', taken: false },
];

const demoEvents = [
  { id: '1', emoji: '🩺', title: 'Dr. Patel', subtitle: 'Cardiology', time: 'Thursday 10:30 AM' },
  { id: '2', emoji: '🏋️', title: 'Physical Therapy', subtitle: 'RehabWorks', time: 'Next Monday 2:00 PM' },
];

export default function ElderModeScreen() {
  const { caringFor } = useOnboardingStore();
  const [meds, setMeds] = useState(demoMeds);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    // Pulse the SOS button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const toggleMed = (id: string) => {
    setMeds((prev) => prev.map((m) => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const nextMed = meds.find((m) => !m.taken);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <LinearGradient colors={['#134E45', '#1B6B5F']} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>{'←'} Back</Text>
            </TouchableOpacity>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{caringFor || 'Margaret'}</Text>
            <View style={styles.timeRow}>
              <Text style={styles.time}>{timeStr}</Text>
              <Text style={styles.date}>{dateStr}</Text>
            </View>
          </LinearGradient>

          {/* Next Medication - Big Card */}
          {nextMed && (
            <View style={styles.nextMedSection}>
              <Text style={styles.sectionTitle}>NEXT MEDICATION</Text>
              <TouchableOpacity
                style={styles.nextMedCard}
                onPress={() => toggleMed(nextMed.id)}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#FFF1EE', '#FFE5E0']} style={styles.nextMedGradient}>
                  <Text style={styles.nextMedEmoji}>💊</Text>
                  <View style={styles.nextMedInfo}>
                    <Text style={styles.nextMedName}>{nextMed.name}</Text>
                    <Text style={styles.nextMedDosage}>{nextMed.dosage} — {nextMed.time}</Text>
                  </View>
                  <View style={styles.nextMedAction}>
                    <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.takePill}>
                      <Text style={styles.takePillText}>I took it ✓</Text>
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* All Medications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TODAY'S MEDICATIONS</Text>
            {meds.map((med) => (
              <TouchableOpacity
                key={med.id}
                style={[styles.medRow, med.taken && styles.medRowDone]}
                onPress={() => toggleMed(med.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.medCheck, med.taken && styles.medCheckDone]}>
                  {med.taken && <Text style={styles.medCheckMark}>✓</Text>}
                </View>
                <View style={styles.medInfo}>
                  <Text style={[styles.medName, med.taken && styles.medNameDone]}>{med.name} {med.dosage}</Text>
                  <Text style={styles.medTime}>{med.time}</Text>
                </View>
                {med.taken && (
                  <View style={styles.takenBadge}>
                    <Text style={styles.takenText}>Taken</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Upcoming */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COMING UP</Text>
            {demoEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <Text style={styles.eventEmoji}>{event.emoji}</Text>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventSub}>{event.subtitle}</Text>
                </View>
                <Text style={styles.eventTime}>{event.time}</Text>
              </View>
            ))}
          </View>

          {/* How are you feeling? */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HOW ARE YOU FEELING?</Text>
            <View style={styles.feelingRow}>
              {[
                { emoji: '😄', label: 'Great', color: '#22C55E' },
                { emoji: '🙂', label: 'Good', color: '#3B82F6' },
                { emoji: '😐', label: 'Okay', color: '#F59E0B' },
                { emoji: '😟', label: 'Not great', color: '#EF4444' },
              ].map((f) => (
                <TouchableOpacity key={f.label} style={styles.feelingBtn} activeOpacity={0.7}>
                  <Text style={styles.feelingEmoji}>{f.emoji}</Text>
                  <Text style={styles.feelingLabel}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.bigBtnRow}>
              <TouchableOpacity style={styles.bigBtn} activeOpacity={0.8}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.bigBtnGradient}>
                  <Text style={styles.bigBtnEmoji}>📞</Text>
                  <Text style={styles.bigBtnText}>Call Family</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bigBtn} activeOpacity={0.8}>
                <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.bigBtnGradient}>
                  <Text style={styles.bigBtnEmoji}>💬</Text>
                  <Text style={styles.bigBtnText}>Send Message</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* SOS Button */}
          <View style={styles.sosSection}>
            <Text style={styles.sosLabel}>Need help right now?</Text>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity activeOpacity={0.8}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.sosBtn}>
                  <Text style={styles.sosEmoji}>🚨</Text>
                  <Text style={styles.sosText}>SOS — Call for Help</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Family update */}
          <View style={styles.familyCard}>
            <Text style={styles.familyTitle}>Your Care Team Today</Text>
            <View style={styles.familyRow}>
              <View style={styles.familyMember}>
                <Text style={styles.familyAvatar}>👩</Text>
                <Text style={styles.familyName}>Sarah</Text>
                <Text style={styles.familyRole}>On shift</Text>
              </View>
              <View style={styles.familyMember}>
                <Text style={styles.familyAvatar}>👨</Text>
                <Text style={styles.familyName}>Mike</Text>
                <Text style={styles.familyRole}>Backup</Text>
              </View>
              <View style={styles.familyMember}>
                <Text style={styles.familyAvatar}>👩‍🦰</Text>
                <Text style={styles.familyName}>Emily</Text>
                <Text style={styles.familyRole}>Weekend</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F3F0' },
  flex: { flex: 1 },
  scroll: { paddingBottom: 40 },

  header: {
    paddingTop: Platform.OS === 'web' ? 48 : 64,
    paddingBottom: 32,
    paddingHorizontal: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  backBtn: { position: 'absolute', left: 24, top: Platform.OS === 'web' ? 48 : 64 },
  backText: { fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  greeting: { fontSize: 22, color: 'rgba(255,255,255,0.7)', fontWeight: '400', marginTop: 8 },
  name: { fontSize: 38, color: '#fff', fontWeight: '700', marginTop: 4, letterSpacing: -0.5 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 16, marginTop: 14 },
  time: { fontSize: 28, color: '#fff', fontWeight: '600' },
  date: { fontSize: 16, color: 'rgba(255,255,255,0.6)' },

  section: { paddingHorizontal: 24, marginTop: 28 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#8E93A6', letterSpacing: 2, marginBottom: 16 },

  // Next Med
  nextMedSection: { paddingHorizontal: 24, marginTop: 28 },
  nextMedCard: { borderRadius: 24, overflow: 'hidden', shadowColor: '#E8725A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 6 },
  nextMedGradient: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 18 },
  nextMedEmoji: { fontSize: 44 },
  nextMedInfo: { flex: 1 },
  nextMedName: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  nextMedDosage: { fontSize: 18, color: '#52566B', marginTop: 4 },
  nextMedAction: {},
  takePill: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16 },
  takePillText: { fontSize: 18, color: '#fff', fontWeight: '700' },

  // Med list
  medRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 10, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  medRowDone: { opacity: 0.6 },
  medCheck: { width: 36, height: 36, borderRadius: 12, borderWidth: 3, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  medCheckDone: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  medCheckMark: { fontSize: 20, color: '#fff', fontWeight: '700' },
  medInfo: { flex: 1 },
  medName: { fontSize: 20, fontWeight: '600', color: '#1A1A2E' },
  medNameDone: { textDecorationLine: 'line-through', color: '#8E93A6' },
  medTime: { fontSize: 16, color: '#8E93A6', marginTop: 2 },
  takenBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  takenText: { fontSize: 14, color: '#16A34A', fontWeight: '700' },

  // Events
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 10, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  eventEmoji: { fontSize: 36 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A2E' },
  eventSub: { fontSize: 16, color: '#8E93A6', marginTop: 2 },
  eventTime: { fontSize: 14, fontWeight: '600', color: '#7C6EDB' },

  // Feelings
  feelingRow: { flexDirection: 'row', gap: 12 },
  feelingBtn: { flex: 1, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  feelingEmoji: { fontSize: 40 },
  feelingLabel: { fontSize: 16, fontWeight: '600', color: '#52566B', marginTop: 8 },

  // Big buttons
  bigBtnRow: { flexDirection: 'row', gap: 12 },
  bigBtn: { flex: 1, borderRadius: 22, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  bigBtnGradient: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  bigBtnEmoji: { fontSize: 36 },
  bigBtnText: { fontSize: 20, fontWeight: '700', color: '#fff' },

  // SOS
  sosSection: { alignItems: 'center', marginTop: 36, paddingHorizontal: 24 },
  sosLabel: { fontSize: 16, color: '#8E93A6', marginBottom: 14 },
  sosBtn: { paddingHorizontal: 48, paddingVertical: 24, borderRadius: 28, alignItems: 'center', flexDirection: 'row', gap: 14, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  sosEmoji: { fontSize: 32 },
  sosText: { fontSize: 22, fontWeight: '800', color: '#fff' },

  // Family
  familyCard: { marginHorizontal: 24, marginTop: 32, backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  familyTitle: { fontSize: 16, fontWeight: '700', color: '#8E93A6', letterSpacing: 1, marginBottom: 18, textAlign: 'center' },
  familyRow: { flexDirection: 'row', justifyContent: 'space-around' },
  familyMember: { alignItems: 'center' },
  familyAvatar: { fontSize: 44 },
  familyName: { fontSize: 18, fontWeight: '600', color: '#1A1A2E', marginTop: 8 },
  familyRole: { fontSize: 14, color: '#22C55E', fontWeight: '600', marginTop: 2 },
});
