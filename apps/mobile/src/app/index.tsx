import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { Spinner } from '@/components/ui';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (user?.role === 'PROFESSIONAL') {
    return <Redirect href="/(professional)/dashboard" />;
  }

  return <Redirect href="/(client)/home" />;
}
