import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text } from '@/components/ui';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';

interface HomeHeaderProps {
  firstName?: string;
  locationLabel?: string;
}

export function HomeHeader({ firstName, locationLabel }: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const { data: unreadCount } = useUnreadNotificationCount();

  return (
    <ImageBackground
      source={require('../../../assets/images/header-skyline.png')}
      style={[styles.container, { paddingTop: insets.top + spacing.sm }]}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay} />

      <View style={styles.topRow}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
          accessibilityLabel="MONPRO"
        />

        <View style={styles.rightRow}>
          {locationLabel && (
            <View style={styles.locationChip}>
              <Ionicons name="location" size={14} color={colors.secondary} />
              <Text variant="caption" color={colors.textInverse}>
                {locationLabel}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.textInverse} />
            </View>
          )}

          <Pressable
            style={styles.bellContainer}
            onPress={() => router.push('/(client)/notifications')}
            accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} non lues` : ''}`}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textInverse} />
            {unreadCount ? (
              <View style={styles.badge}>
                <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <View style={styles.greeting}>
        <Text variant="h1" color={colors.textInverse}>
          {firstName ? `Bonjour ${firstName} \u{1F44B}` : 'Bonjour \u{1F44B}'}
        </Text>
        <Text variant="body" color={colors.textInverseSoft}>
          {"Comment pouvons-nous"}{'\n'}{"vous aider aujourd'hui ?"}
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxxxl + spacing.lg,
  },
  backgroundImage: {
    resizeMode: 'cover',
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: 130,
    height: 36,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.borderInverse,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  bellContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
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
  greeting: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
});
