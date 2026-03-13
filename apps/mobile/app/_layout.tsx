import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';
import { Spinner } from '../components/ui/Spinner';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const { isLoading, isAuthenticated, setAuth, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        const refreshToken = await useAuthStore.getState().hydrate();
        if (refreshToken) {
          const data = await authService.refresh(refreshToken);
          const me = await authService.getMe();
          await setAuth(me.user, data.accessToken, data.refreshToken);
        } else {
          setLoading(false);
        }
      } catch {
        await clearAuth();
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      registerForPush();
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'TASK_ASSIGNED' || data?.type === 'TASK_COMPLETED' || data?.type === 'TASK_DUE_TODAY') {
        router.push(`/task/${data.taskId}`);
      } else if (data?.type === 'EMERGENCY') {
        router.push('/emergency');
      } else if (data?.type === 'JOURNAL_NEW') {
        router.push(`/journal/${data.entryId}`);
      }
    });
    return () => sub.remove();
  }, []);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="circle" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="task" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="medication" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="journal" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="appointment" options={{ headerShown: true, headerTitle: '' }} />
        <Stack.Screen name="documents" options={{ headerShown: true, headerTitle: 'Documents' }} />
        <Stack.Screen name="emergency" options={{ headerShown: false }} />
        <Stack.Screen name="subscription" options={{ headerShown: true, headerTitle: 'Subscription' }} />
      </Stack>
    </>
  );
}

async function registerForPush() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await authService.savePushToken(token);
  } catch {
    // Push not available in simulator
  }
}
