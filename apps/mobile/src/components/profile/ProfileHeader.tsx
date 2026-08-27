import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text } from '@/components/ui';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';

export function ProfileHeader() {
  const insets = useSafeAreaInsets();
  const { data: unreadCount } = useUnreadNotificationCount();

  return (
    <ImageBackground
      source={require('../../../assets/images/header-skyline.png')}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay} />
      <View style={styles.row}>
        <Text variant="h1" color={colors.textInverse} style={styles.title}>
          Mon profil
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/(client)/settings' as never)}
            accessibilityLabel="Ouvrir les paramètres"
            accessibilityRole="button"
          >
            <Ionicons name="settings-outline" size={24} color={colors.textInverse} />
          </Pressable>

          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/(client)/notifications')}
            accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} non lues` : ''}`}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textInverse} />
            {unreadCount != null && unreadCount > 0 && (
              <View style={styles.badge}>
                <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.xl,
    backgroundColor: colors.primary,
  },
  backgroundImage: {
    opacity: 0.15,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '800',
    fontSize: 26,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    position: 'relative',
    padding: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: colors.secondary,
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
    lineHeight: 14,
  },
});
