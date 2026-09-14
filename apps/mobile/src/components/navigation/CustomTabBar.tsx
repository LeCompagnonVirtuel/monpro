import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { useConversations } from '@/hooks/use-conversations';

export interface TabConfig {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
}

interface CustomTabBarProps extends BottomTabBarProps {
  centerAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label: string;
  };
  tabConfigs?: TabConfig[];
}

const DEFAULT_CLIENT_TABS: TabConfig[] = [
  { key: 'home', icon: 'home-outline', iconActive: 'home', label: 'Accueil' },
  { key: 'search', icon: 'search-outline', iconActive: 'search', label: 'Rechercher' },
  { key: 'messages', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', label: 'Messages' },
  { key: 'profile', icon: 'person-outline', iconActive: 'person', label: 'Profil' },
];

const DEFAULT_PRO_TABS: TabConfig[] = [
  { key: 'dashboard', icon: 'home-outline', iconActive: 'home', label: 'Accueil' },
  { key: 'requests', icon: 'document-text-outline', iconActive: 'document-text', label: 'Demandes' },
  { key: 'interventions', icon: 'calendar-outline', iconActive: 'calendar', label: 'Interventions' },
  { key: 'messages', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', label: 'Messages' },
  { key: 'profile', icon: 'person-outline', iconActive: 'person', label: 'Profil' },
];

export function CustomTabBar({ state, navigation, centerAction, tabConfigs }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routeNames = state.routes.map((r) => r.name);
  const { data: conversations } = useConversations();
  const unreadMsgCount = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0;

  const tabs = tabConfigs || DEFAULT_CLIENT_TABS;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.map((tab, index) => {
        const routeIndex = routeNames.indexOf(tab.key);
        const isActive = state.index === routeIndex;
        const badgeCount = tab.badge ?? (tab.key === 'messages' ? unreadMsgCount : 0);

        const isCenter = centerAction && index === Math.floor(tabs.length / 2);

        if (isCenter && centerAction) {
          return (
            <Pressable
              key={tab.key}
              style={styles.publishButton}
              onPress={centerAction.onPress}
              accessibilityLabel={centerAction.label}
              accessibilityRole="button"
            >
              <View style={styles.publishCircle}>
                <Ionicons name={centerAction.icon} size={28} color={colors.primary} />
              </View>
              <Text variant="caption" color={colors.textSecondary} style={styles.label}>
                {centerAction.label}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => {
              if (routeIndex >= 0) {
                navigation.navigate(state.routes[routeIndex].name);
              }
            }}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={22}
                color={isActive ? colors.textInverse : colors.textSecondary}
              />
            </View>
            {badgeCount > 0 && (
              <View style={styles.badge}>
                <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </Text>
              </View>
            )}
            <Text
              variant="caption"
              color={isActive ? colors.primary : colors.textSecondary}
              style={styles.label}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export { DEFAULT_CLIENT_TABS, DEFAULT_PRO_TABS };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xxs,
    position: 'relative',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primary,
  },
  publishButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xxs,
    marginTop: -20,
  },
  publishCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: '25%',
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  label: {},
});
