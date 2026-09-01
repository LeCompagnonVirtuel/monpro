import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { useConversations } from '@/hooks/use-conversations';

const TAB_CONFIG: {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
}[] = [
  { key: 'home', icon: 'home-outline', iconActive: 'home', label: 'Accueil' },
  { key: 'search', icon: 'search-outline', iconActive: 'search', label: 'Rechercher' },
  { key: 'publish', icon: 'add', iconActive: 'add', label: 'Publier' },
  { key: 'messages', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', label: 'Messages' },
  { key: 'profile', icon: 'person-outline', iconActive: 'person', label: 'Profil' },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routeNames = state.routes.map((r) => r.name);
  const { data: conversations } = useConversations();
  const unreadMsgCount = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {TAB_CONFIG.map((tab) => {
        if (tab.key === 'publish') {
          return (
            <Pressable
              key={tab.key}
              style={styles.publishButton}
              onPress={() => router.push('/(client)/create-request')}
              accessibilityLabel="Publier une demande"
              accessibilityRole="button"
            >
              <View style={styles.publishCircle}>
                <Ionicons name="add" size={28} color={colors.primary} />
              </View>
              <Text variant="caption" color={colors.textSecondary} style={styles.label}>
                {tab.label}
              </Text>
            </Pressable>
          );
        }

        const routeIndex = routeNames.indexOf(tab.key);
        const isActive = state.index === routeIndex;
        const badgeCount = getBadgeCount(tab.key, unreadMsgCount);

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

function getBadgeCount(key: string, unreadMsgCount: number): number {
  if (key === 'messages') return unreadMsgCount;
  return 0;
}

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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    backgroundColor: colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {},
  label: {},
});
