import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

export default function AuthLayout() {
  const { isAuthenticated, role } = useAuthStore();

  if (isAuthenticated) {
    if (role === 'PROFESSIONAL') return <Redirect href="/(professional)/(tabs)/dashboard" />;
    return <Redirect href="/(client)/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
