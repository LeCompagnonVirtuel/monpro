import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { setSessionExpiredHandler } from '@/api/client';
import { useSocket } from '@/hooks/use-socket';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import '@/lib/i18n';

function AppServices() {
  useSocket();
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout();
    });
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppServices />
      <OfflineBanner />
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(professional)" />
      </Stack>
    </QueryClientProvider>
  );
}
