import { Tabs } from 'expo-router';
import { colors } from '@/theme/colors';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';

export default function ClientTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="search" options={{ title: 'Rechercher' }} />
      <Tabs.Screen name="requests" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
