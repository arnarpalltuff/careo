import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display/500Medium';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { router } from 'expo-router';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useCareRecipientStore } from '../stores/careRecipientStore';
import { addNotificationResponseListener } from '../services/notifications';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { NetworkBanner } from '../components/NetworkBanner';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const { hydrate } = useOnboardingStore();
  const { hydrate: hydrateCareRecipient } = useCareRecipientStore();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    Promise.all([hydrate(), hydrateCareRecipient()]).then(() => setReady(true));

    // Handle notification tap — navigate to the right screen
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'medication') router.push('/(tabs)/care');
      else if (data?.type === 'appointment') router.push('/(tabs)/calendar');
      else if (data?.type === 'wellness') router.push('/wellness-check');
      else if (data?.type === 'task') router.push('/(tabs)/care');
      else if (data?.type === 'helpBoard') router.push('/help-board');
    });
    return () => sub.remove();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && ready) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, ready]);

  if (!fontsLoaded || !ready) {
    return null;
  }

  return (
    <ErrorBoundary>
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <NetworkBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="circle" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="task" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="medication" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="journal" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="appointment" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="documents" options={{ headerShown: true, headerTitle: 'Documents' }} />
        <Stack.Screen name="emergency" options={{ headerShown: false }} />
        <Stack.Screen name="health-card" options={{ headerShown: false }} />
        <Stack.Screen name="help-board" options={{ headerShown: false }} />
        <Stack.Screen name="wellness-check" options={{ headerShown: false }} />
        <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
        <Stack.Screen name="subscription" options={{ headerShown: true, headerTitle: 'Subscription' }} />
        <Stack.Screen name="invite" options={{ headerShown: true, headerTitle: '', presentation: 'modal' }} />
        <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="care-assistant" options={{ headerShown: false }} />
        <Stack.Screen name="care-insights" options={{ headerShown: false }} />
        <Stack.Screen name="vitals" options={{ headerShown: false }} />
        <Stack.Screen name="care-timeline" options={{ headerShown: false }} />
        <Stack.Screen name="shifts" options={{ headerShown: false }} />
        <Stack.Screen name="symptoms" options={{ headerShown: false }} />
      </Stack>
    </View>
    </ErrorBoundary>
  );
}
