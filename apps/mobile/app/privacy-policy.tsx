import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';

const sections = [
  {
    title: 'Information We Collect',
    body: `Careo collects the following types of information to provide caregiving coordination services:

• Health information (conditions, vitals, wellness check-ins)
• Medication details (names, dosages, schedules)
• Appointment information (dates, providers, notes)
• Location data (only during emergencies, to help locate nearby services)
• Documents (medical records, insurance cards, and other files you upload)
• Account information (name, email, profile photo)`,
  },
  {
    title: 'How We Use Your Data',
    body: `Your data is used solely for caregiving coordination within your care circle. Specifically, we use it to:

• Display health and medication information to authorized care circle members
• Send reminders for medications, appointments, and wellness check-ins
• Enable care task assignment and tracking among circle members
• Provide emergency contact and location features
• Improve app functionality and user experience`,
  },
  {
    title: 'Data Sharing',
    body: `Your information is only shared with care circle members you explicitly invite. We will never sell, rent, or trade your personal data to third parties.

We may share anonymized, aggregated data for analytics purposes, but this data cannot be used to identify you. We may also disclose information if required by law or to protect the safety of our users.`,
  },
  {
    title: 'Data Storage & Security',
    body: `All data is encrypted in transit and at rest. We use industry-standard security measures to protect your information, including:

• TLS encryption for all network communications
• AES-256 encryption for stored data
• Secure authentication with token-based sessions
• Regular security audits and vulnerability assessments`,
  },
  {
    title: 'Your Rights',
    body: `You have the right to:

• Access all personal data we hold about you
• Request deletion of your account and all associated data
• Export your data in a portable format
• Withdraw consent for data processing at any time
• Correct inaccurate information in your profile

To exercise any of these rights, contact us at privacy@careo.app.`,
  },
  {
    title: "Children's Privacy",
    body: `Careo is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal data, please contact us immediately at privacy@careo.app.`,
  },
  {
    title: 'HIPAA Notice',
    body: `Careo is designed to help families coordinate care for their loved ones. However, Careo is not a HIPAA-covered entity. While we take data security seriously and implement strong protections, the app is intended for personal family use and does not replace professional medical record systems.

If you are a healthcare provider, please do not use Careo as a primary medical records system.`,
  },
  {
    title: 'Contact Us',
    body: `If you have any questions or concerns about this Privacy Policy, please contact us at:

privacy@careo.app`,
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.root}>
      {/* Hero Header */}
      <View style={styles.hero}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Privacy Policy</Text>
        <Text style={styles.heroSubtitle}>
          Your privacy matters to us
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.lastUpdated}>Last Updated: March 15, 2026</Text>
          <Text style={styles.intro}>
            Careo ("we", "our", or "us") is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, and
            safeguard your information when you use the Careo mobile
            application.
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    backgroundColor: colors.heroStart,
    paddingTop: Platform.OS === 'web' ? 56 : 72,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  backArrow: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
  heroTitle: {
    ...typography.displayMedium,
    color: '#fff',
  },
  heroSubtitle: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  lastUpdated: {
    ...typography.labelSmall,
    color: colors.textHint,
    marginBottom: 12,
  },
  intro: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  sectionTitle: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  sectionBody: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
