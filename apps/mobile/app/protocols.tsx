import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useCircleStore } from '../stores/circleStore';
import { protocolService } from '../services/protocols';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';

const protocolEmoji: Record<string, string> = {
  FALL: '🫠', CHEST_PAIN: '💔', BREATHING: '😤', SEIZURE: '⚡',
  CONFUSION: '😵', WANDERING: '🚶', MEDICATION_ERROR: '💊', CUSTOM: '📋',
};

export default function ProtocolsScreen() {
  const { activeCircleId } = useCircleStore();
  const [protocols, setProtocols] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeCircleId) return;
    try {
      const [pData, tData] = await Promise.all([
        protocolService.list(activeCircleId),
        protocolService.getTemplates(),
      ]);
      setProtocols(pData.protocols);
      setTemplates(tData.templates);
    } catch {} finally {
      setLoading(false);
    }
  }, [activeCircleId]);

  useEffect(() => { loadData(); }, [loadData]);

  const addFromTemplate = async (type: string) => {
    try {
      await protocolService.create(activeCircleId!, { type });
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create protocol');
    }
  };

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number.replace(/[^0-9+]/g, '')}`);
  };

  if (loading) return <View style={[styles.root, styles.center]}><Spinner /></View>;

  const existingTypes = new Set(protocols.map(p => p.type));
  const availableTemplates = templates.filter(t => !existingTypes.has(t.type));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Emergency Protocols</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={{ fontSize: 24 }}>🚨</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Be prepared for emergencies</Text>
            <Text style={styles.infoSub}>Step-by-step protocols your whole care team can follow in a crisis.</Text>
          </View>
        </View>

        {/* Active Protocols */}
        {protocols.length > 0 && (
          <Text style={styles.sectionLabel}>YOUR PROTOCOLS</Text>
        )}
        {protocols.map((protocol) => {
          const isOpen = expanded === protocol.id;
          let steps: any[] = [];
          try { steps = JSON.parse(protocol.stepsJson || '[]'); } catch {}

          return (
            <View key={protocol.id} style={styles.protocolCard}>
              <TouchableOpacity
                style={styles.protocolHeader}
                onPress={() => setExpanded(isOpen ? null : protocol.id)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 28 }}>{protocolEmoji[protocol.type] || '📋'}</Text>
                <View style={styles.protocolInfo}>
                  <Text style={styles.protocolTitle}>{protocol.title}</Text>
                  <Text style={styles.protocolSteps}>{steps.length} steps</Text>
                </View>
                <Text style={styles.chevron}>{isOpen ? '▾' : '›'}</Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.stepsContainer}>
                  {steps.map((step: any, i: number) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumText}>{step.order || i + 1}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepText}>{step.instruction}</Text>
                        {step.callNumber && (
                          <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(step.callNumber)}>
                            <Text style={styles.callBtnText}>Call {step.callNumber}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Available Templates */}
        {availableTemplates.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>ADD PROTOCOL</Text>
            {availableTemplates.map((t) => (
              <TouchableOpacity key={t.type} style={styles.templateCard} onPress={() => addFromTemplate(t.type)} activeOpacity={0.75}>
                <Text style={{ fontSize: 28 }}>{protocolEmoji[t.type] || '📋'}</Text>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateTitle}>{t.title}</Text>
                  <Text style={styles.templateSteps}>{t.stepCount} steps included</Text>
                </View>
                <View style={styles.addPill}>
                  <Text style={styles.addPillText}>Add</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {protocols.length === 0 && availableTemplates.length === 0 && (
          <EmptyState title="No protocols available" subtitle="Emergency protocols help your care team respond to crises" />
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
  scroll: { flex: 1 },
  infoBanner: {
    flexDirection: 'row', marginHorizontal: 18, marginBottom: 24, padding: 18,
    backgroundColor: colors.tintEmergency, borderRadius: 18, gap: 14, alignItems: 'center',
  },
  infoText: { flex: 1 },
  infoTitle: { ...typography.headingMedium, color: colors.textPrimary },
  infoSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  sectionLabel: { ...typography.labelSmall, color: colors.textHint, letterSpacing: 1.5, fontWeight: '700', fontSize: 11, paddingHorizontal: 18, marginBottom: 12, marginTop: 8 },
  protocolCard: { marginHorizontal: 18, marginBottom: 10, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  protocolHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  protocolInfo: { flex: 1 },
  protocolTitle: { ...typography.headingMedium, color: colors.textPrimary },
  protocolSteps: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.textHint },
  stepsContainer: { paddingHorizontal: 18, paddingBottom: 18 },
  stepRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  stepNumber: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  stepNumText: { ...typography.labelMedium, color: colors.primary, fontWeight: '700' },
  stepContent: { flex: 1 },
  stepText: { ...typography.bodyMedium, color: colors.textPrimary, lineHeight: 22 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 8,
    backgroundColor: colors.danger, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  callBtnText: { ...typography.labelSmall, color: '#fff', fontWeight: '700' },
  templateCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginBottom: 10,
    backgroundColor: '#fff', padding: 18, borderRadius: 18, gap: 14,
    borderWidth: 1, borderColor: colors.divider, borderStyle: 'dashed',
  },
  templateInfo: { flex: 1 },
  templateTitle: { ...typography.headingSmall, color: colors.textPrimary },
  templateSteps: { ...typography.bodySmall, color: colors.textHint, marginTop: 2 },
  addPill: { backgroundColor: colors.primaryLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  addPillText: { ...typography.labelSmall, color: colors.primary, fontWeight: '700' },
});
