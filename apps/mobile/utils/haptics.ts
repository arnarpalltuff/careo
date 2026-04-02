import { Platform } from 'react-native';

export async function impactLight() {
  if (Platform.OS === 'web') return;
  const Haptics = require('expo-haptics');
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function impactMedium() {
  if (Platform.OS === 'web') return;
  const Haptics = require('expo-haptics');
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function impactHeavy() {
  if (Platform.OS === 'web') return;
  const Haptics = require('expo-haptics');
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export async function notificationSuccess() {
  if (Platform.OS === 'web') return;
  const Haptics = require('expo-haptics');
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function notificationError() {
  if (Platform.OS === 'web') return;
  const Haptics = require('expo-haptics');
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
