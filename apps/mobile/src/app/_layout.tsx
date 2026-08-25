import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { usersApi } from '@/api/users';
import '@/lib/i18n';

export default function RootLayout() {
  const { restoreSession, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    (async () => {
      const hasToken = await restoreSession();
      if (hasToken) {
        try {
          const { data } = await usersApi.getMe();
          setUser(data.data);
        } catch {
          setLoading(false);
        }
      }
    })();
  }, [restoreSession, setUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(professional)" />
      </Stack>
    </QueryClientProvider>
  );
}
