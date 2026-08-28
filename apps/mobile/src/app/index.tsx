import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { getOnboardingChecked } from '@/app/_layout';
import { Spinner } from '@/components/ui';

export default function Index() {
  const { isAuthenticated, isLoading, role } = useAuthStore();

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  if (!getOnboardingChecked()) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (role === 'PROFESSIONAL') {
    return <Redirect href="/(professional)/(tabs)/dashboard" />;
  }

  return <Redirect href="/(client)/(tabs)/home" />;
}
