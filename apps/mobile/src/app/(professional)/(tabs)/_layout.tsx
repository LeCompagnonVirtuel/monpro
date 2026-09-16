import { Tabs } from 'expo-router';
import { colors } from '@/theme/colors';
import { CustomTabBar, DEFAULT_PRO_TABS } from '@/components/navigation/CustomTabBar';
import { useConversations } from '@/hooks/use-conversations';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';
import { useProfessionalRequests } from '@/hooks/use-professional-requests';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';

export default function ProfessionalTabsLayout() {
  const { data: profile } = useMyProfessionalProfile();
  const { data: conversations } = useConversations();
  const { data: unreadNotifCount } = useUnreadNotificationCount();
  const { data: requestsData } = useProfessionalRequests({ limit: 1, enabled: !!profile });

  const unreadMsgCount = Array.isArray(conversations)
    ? conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)
    : 0;

  const requestCount = requestsData?.total ?? 0;

  const proTabs = DEFAULT_PRO_TABS.map((tab) => {
    if (tab.key === 'requests') return { ...tab, badge: requestCount };
    if (tab.key === 'messages') return { ...tab, badge: unreadMsgCount };
    if (tab.key === 'profile') return { ...tab, badge: unreadNotifCount ?? 0 };
    return tab;
  });

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} tabConfigs={proTabs} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="requests" options={{ title: 'Demandes' }} />
      <Tabs.Screen name="map" options={{ title: 'Carte' }} />
      <Tabs.Screen name="interventions" options={{ title: 'Interventions' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
