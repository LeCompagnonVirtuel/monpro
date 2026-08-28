import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiClient } from '@/api/client';
import { tokenStorage } from '@/lib/storage';
import { useAuthStore } from '@/stores/auth.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const registeredToken = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;

      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenData.data;

        if (token && token !== registeredToken.current) {
          await apiClient.post('/device-tokens', {
            token,
            platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
          });
          await tokenStorage.setPushToken(token);
          registeredToken.current = token;
        }
      } catch {
        // Push token registration is non-critical
      }
    })();
  }, [isAuthenticated]);
}
