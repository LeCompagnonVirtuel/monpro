import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

export default function ProfessionalLayout() {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (role !== 'PROFESSIONAL') {
    return <Redirect href="/(client)/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
      <Stack.Screen name="request-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="create-quote" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="quote-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="booking-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="intervention" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="revenue" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="reviews" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="services" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="availability" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="kyc" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="conversation" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="terms" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
