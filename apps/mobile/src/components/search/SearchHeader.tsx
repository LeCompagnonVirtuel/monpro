import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text } from '@/components/ui';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';

export function SearchHeader() {
  const insets = useSafeAreaInsets();
  const { data: unreadCount } = useUnreadNotificationCount();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Text variant="h2" color={colors.text} style={styles.title}>
        Rechercher
      </Text>

      <Pressable
        style={styles.bellContainer}
        onPress={() => router.push('/(client)/notifications')}
        accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} non lues` : ''}`}
        accessibilityRole="button"
      >
        <Ionicons name="notifications-outline" size={24} color={colors.text} />
        {unreadCount != null && unreadCount > 0 && (
          <View style={styles.badge}>
            <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  title: {},
  bellContainer: {
    position: 'relative',
    padding: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {},
});
