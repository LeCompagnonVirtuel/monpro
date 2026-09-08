import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';

interface HomeHeaderProps {
  firstName?: string;
  avatarUrl?: string;
}

export function HomeHeader({ firstName, avatarUrl }: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const { data: unreadCount } = useUnreadNotificationCount();

  return (
    <ImageBackground
      source={require('../../../assets/images/header-skyline.png')}
      style={[styles.container, { paddingTop: insets.top + spacing.lg }]}
      imageStyle={styles.bgImage}
    >
      <LinearGradient
        colors={['rgba(7,31,73,0.95)', 'rgba(7,31,73,0.82)', 'rgba(7,31,73,0.65)']}
        style={styles.gradient}
      />

      <Animated.View entering={FadeIn.duration(350)} style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text variant="caption" color={colors.textInverseMuted} style={styles.greetingLabel}>
            Bonjour,
          </Text>
          <Text variant="h1" color={colors.textInverse} style={styles.nameLine}>
            {firstName || 'Client'} 👋
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/(client)/notifications')}
            accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} non lues` : ''}`}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textInverse} />
            {(unreadCount ?? 0) > 0 && (
              <View style={styles.badge}>
                <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
                  {unreadCount! > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/(client)/(tabs)/profile')}
            accessibilityLabel="Mon profil"
            accessibilityRole="button"
          >
            <Avatar uri={avatarUrl} name={firstName || 'C'} size={44} />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.heroBlock}>
        <Text variant="body" color={colors.textInverseSoft} style={styles.heroText}>
          Trouvez le bon professionnel,
        </Text>
        <Text variant="body" color={colors.textInverseSoft} style={styles.heroText}>
          près de chez vous.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250).duration(400)}>
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/(client)/(tabs)/search')}
          accessibilityLabel="Rechercher un service"
          accessibilityRole="search"
        >
          <Ionicons name="search" size={18} color={colors.primary} />
          <Text variant="body" color={colors.textTertiary} style={styles.searchPlaceholder}>
            Quel service recherchez-vous ?
          </Text>
          <View style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color={colors.primary} />
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(380).duration(400)} style={styles.signature}>
        <Text variant="caption" color={colors.textInverseMuted} style={styles.signatureText}>
          Des services fiables pour un quotidien plus simple.
        </Text>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxxl,
  },
  bgImage: {
    resizeMode: 'cover',
    opacity: 0.3,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  greetingBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  greetingLabel: {
    opacity: 0.6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  nameLine: {
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  heroBlock: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xxs,
    marginBottom: spacing.xl,
  },
  heroText: {
    lineHeight: 24,
    fontSize: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginHorizontal: spacing.xl,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    height: 52,
    gap: spacing.sm,
    ...shadows.lg,
  },
  searchPlaceholder: {
    flex: 1,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.lg,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signature: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  signatureText: {
    fontStyle: 'italic',
    opacity: 0.5,
    lineHeight: 18,
  },
});
