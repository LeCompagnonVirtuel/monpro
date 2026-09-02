import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
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
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
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
          {locationLabel ? (
            <View style={styles.locationChip}>
              <Ionicons name="location" size={12} color={colors.secondary} />
              <Text variant="caption" color={colors.textInverse} style={styles.locationText}>
                {locationLabel}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={styles.bellContainer}
            onPress={() => router.push('/(client)/notifications')}
            accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} non lues` : ''}`}
            accessibilityRole="button"
          >
            <View style={styles.bellCircle}>
              <Ionicons name="notifications-outline" size={20} color={colors.textInverse} />
              {unreadCount ? (
                <View style={styles.badge}>
                  <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.greeting}>
        <Text variant="h1" color={colors.textInverse} style={styles.greetingTitle}>
          {firstName ? `Bonjour ${firstName}` : 'Bonjour'}
        </Text>
        <Text variant="bodySmall" color={colors.textInverseSoft} style={styles.greetingSub}>
          {"Que recherchez-vous aujourd'hui ?"}
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
    opacity: 0.25,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.88,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  logoImage: {
    width: 120,
    height: 32,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.full,
  },
  locationText: {
    fontSize: 12,
  },
  bellContainer: {},
  bellCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  greeting: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  greetingTitle: {
    letterSpacing: -0.3,
  },
  greetingSub: {
    opacity: 0.8,
  },
});
