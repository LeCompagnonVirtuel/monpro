import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { useConversations } from '@/hooks/use-conversations';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';

export default function ProfessionalTabsLayout() {
  const { data: conversations } = useConversations();
  const { data: unreadNotifCount } = useUnreadNotificationCount();

  const unreadMsgCount = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { borderTopColor: colors.borderLight },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Demandes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="interventions"
        options={{
          title: 'Interventions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: unreadMsgCount > 0 ? unreadMsgCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, fontSize: 10 },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarBadge: unreadNotifCount ? unreadNotifCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error, fontSize: 10 },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
