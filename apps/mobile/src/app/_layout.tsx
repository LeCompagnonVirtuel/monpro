import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { setSessionExpiredHandler } from '@/api/client';
import { useSocket } from '@/hooks/use-socket';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { GlobalErrorBoundary } from '@/components/feedback/GlobalErrorBoundary';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { initSentry } from '@/lib/sentry';
import '@/lib/i18n';

initSentry();
SplashScreen.preventAutoHideAsync();

let onboardingChecked = false;

export function getOnboardingChecked() {
  return onboardingChecked;
}

function AppServices() {
  useSocket();
  usePushNotifications();
  useRealtimeSync();
  return null;
}

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const logout = useAuthStore((s) => s.logout);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout();
    });

    Promise.all([
      restoreSession(),
      hasCompletedOnboarding(),
    ]).then(([, onboardingCompleted]) => {
      onboardingChecked = onboardingCompleted;
      setAppReady(true);
      SplashScreen.hideAsync();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!appReady) {
    return null;
  }

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppServices />
        <OfflineBanner />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(client)" />
          <Stack.Screen name="(professional)" />
        </Stack>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}
