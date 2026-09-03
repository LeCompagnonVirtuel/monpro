import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

export default function ClientLayout() {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (role === 'PROFESSIONAL') {
    return <Redirect href="/(professional)/(tabs)/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="category" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="service" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="professional" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="create-request" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="request-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="quotes" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="quote-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="booking-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="intervention" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="payment" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="review" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="conversation" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="favorites" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="addresses" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="terms" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="payment-methods" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="history" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
