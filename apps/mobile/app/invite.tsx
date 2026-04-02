import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
  Animated,
  Clipboard,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '../utils/colors';
import { typography } from '../utils/fonts';
import { useCircleStore } from '../stores/circleStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAuthStore } from '../stores/authStore';

const INVITE_LINK = 'https://careo.app/join';

export default function InviteScreen() {
  const { user } = useAuthStore();
  const { getActiveCircle } = useCircleStore();
  const { caringFor } = useOnboardingStore();
  const activeCircle = getActiveCircle();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const circleName = activeCircle?.name || `${caringFor}'s Care Team`;
  const firstName = user?.firstName || 'Someone';

  const shareMessage = `Hey, I'm using Careo to coordinate care for ${caringFor}. It helps our family share medication tracking, tasks, appointments, and more — so nobody has to do it alone.\n\nJoin ${circleName} here: ${INVITE_LINK}/${activeCircle?.id || 'demo'}`;

  const shortMessage = `Join me on Careo to help care for ${caringFor} together. ${INVITE_LINK}/${activeCircle?.id || 'demo'}`;

  const handleShare = async (method: 'native' | 'sms' | 'whatsapp' | 'copy') => {
    switch (method) {
      case 'native':
        try {
          const result = await Share.share({
            message: shareMessage,
            title: `Join ${circleName} on Careo`,
          });
          if (result.action === Share.sharedAction) {
            setShared(true);
          }
        } catch {
          // Share was cancelled or failed
        }
        break;

      case 'sms':
        if (Platform.OS === 'web') {
          window.open(`sms:?body=${encodeURIComponent(shortMessage)}`, '_blank');
        } else {
          const { Linking } = require('react-native');
          Linking.openURL(`sms:?body=${encodeURIComponent(shortMessage)}`);
        }
        setShared(true);
        break;

      case 'whatsapp':
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        if (Platform.OS === 'web') {
          window.open(waUrl, '_blank');
        } else {
          const { Linking } = require('react-native');
          Linking.openURL(waUrl);
        }
        setShared(true);
        break;

      case 'copy':
        if (Platform.OS === 'web') {
          navigator.clipboard?.writeText(shareMessage);
        } else {
          Clipboard.setString(shareMessage);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '', headerShown: true }} />
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.emojiCircle}>
              <Text style={styles.heroEmoji}>👨‍👩‍👧‍👦</Text>
            </View>
            <Text style={styles.headline}>
              Caring alone{'\n'}is the hardest part.
            </Text>
            <Text style={styles.subtext}>
              Invite your family to {circleName} so everyone{'\n'}can share the load.
            </Text>
          </View>

          {/* What they'll see */}
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>THEY'LL GET A MESSAGE LIKE THIS</Text>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>
                Hey, I'm using Careo to coordinate care for {caringFor}. Join our family's care circle so we can share tasks, medications, and appointments.
              </Text>
              <Text style={styles.messageLink}>{INVITE_LINK}/...</Text>
            </View>
          </View>

          {/* Share buttons */}
          <View style={styles.shareSection}>
            <TouchableOpacity
              style={styles.shareButtonPrimary}
              onPress={() => handleShare('native')}
              activeOpacity={0.85}
            >
              <Text style={styles.shareIcon}>📤</Text>
              <Text style={styles.shareButtonText}>Share invite link</Text>
            </TouchableOpacity>

            <View style={styles.shareRow}>
              <TouchableOpacity
                style={styles.shareButtonSmall}
                onPress={() => handleShare('sms')}
                activeOpacity={0.8}
              >
                <Text style={styles.shareSmallIcon}>💬</Text>
                <Text style={styles.shareSmallText}>Text</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareButtonSmall, { backgroundColor: '#E7F9EE' }]}
                onPress={() => handleShare('whatsapp')}
                activeOpacity={0.8}
              >
                <Text style={styles.shareSmallIcon}>📱</Text>
                <Text style={[styles.shareSmallText, { color: '#25D366' }]}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareButtonSmall, { backgroundColor: colors.divider }]}
                onPress={() => handleShare('copy')}
                activeOpacity={0.8}
              >
                <Text style={styles.shareSmallIcon}>{copied ? '✅' : '📋'}</Text>
                <Text style={styles.shareSmallText}>{copied ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reassurance */}
          <View style={styles.reassurance}>
            <Text style={styles.reassuranceIcon}>🔒</Text>
            <Text style={styles.reassuranceText}>
              Only people you invite can see your circle.{'\n'}They can leave anytime.
            </Text>
          </View>

          {/* Success state */}
          {shared && (
            <View style={styles.sentBanner}>
              <Text style={styles.sentEmoji}>🎉</Text>
              <Text style={styles.sentText}>
                Nice! Once they join, everyone will see{'\n'}tasks, meds, and updates in real time.
              </Text>
            </View>
          )}

        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  emojiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroEmoji: {
    fontSize: 40,
  },
  headline: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtext: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Preview
  previewCard: {
    marginBottom: 28,
  },
  previewLabel: {
    ...typography.labelSmall,
    color: colors.textHint,
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  messageBubble: {
    backgroundColor: '#E3F6EE',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 18,
  },
  messageText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  messageLink: {
    ...typography.labelSmall,
    color: colors.primary,
    marginTop: 8,
  },

  // Share buttons
  shareSection: {
    gap: 12,
    marginBottom: 24,
  },
  shareButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  shareIcon: {
    fontSize: 20,
  },
  shareButtonText: {
    ...typography.button,
    color: '#fff',
    fontSize: 17,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareButtonSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareSmallIcon: {
    fontSize: 16,
  },
  shareSmallText: {
    ...typography.labelMedium,
    color: colors.primary,
  },

  // Reassurance
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 20,
  },
  reassuranceIcon: {
    fontSize: 20,
  },
  reassuranceText: {
    ...typography.bodySmall,
    color: colors.textHint,
    flex: 1,
    lineHeight: 18,
  },

  // Sent banner
  sentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E3F6EE',
    padding: 18,
    borderRadius: 16,
  },
  sentEmoji: {
    fontSize: 28,
  },
  sentText: {
    ...typography.bodyMedium,
    color: colors.primary,
    flex: 1,
    lineHeight: 22,
  },
});
