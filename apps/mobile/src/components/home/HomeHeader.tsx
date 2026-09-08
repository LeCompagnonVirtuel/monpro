import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
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
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay} />

      <Animated.View entering={FadeIn.duration(400)} style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text variant="bodySmall" color={colors.textInverseMuted} style={styles.greetingLine}>
            Bonjour,
          </Text>
          <Text variant="h1" color={colors.textInverse} style={styles.nameLine}>
            {firstName || 'Client'} 👋
          </Text>
        </View>

        <View style={styles.rightRow}>
          <Pressable
            style={styles.avatarBtn}
            onPress={() => router.push('/(client)/(tabs)/profile')}
            accessibilityLabel="Mon profil"
            accessibilityRole="button"
          >
            <Avatar uri={avatarUrl} name={firstName || 'C'} size={42} />
          </Pressable>

          <Pressable
            style={styles.bellBtn}
            onPress={() => router.push('/(client)/notifications')}
            accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} non lues` : ''}`}
            accessibilityRole="button"
          >
            <View style={styles.bellCircle}>
              <Ionicons name="notifications-outline" size={20} color={colors.textInverse} />
              {(unreadCount ?? 0) > 0 && (
                <View style={styles.badge}>
                  <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
                    {unreadCount! > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.heroText}>
        <Text variant="body" color={colors.textInverseSoft} style={styles.heroLine}>
          Trouvez le bon professionnel,
        </Text>
        <Text variant="body" color={colors.textInverseSoft} style={styles.heroLine}>
          près de chez vous.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.signature}>
        <Text variant="caption" color={colors.textInverseMuted} style={styles.signatureText}>
          Des services fiables
        </Text>
        <Text variant="caption" color={colors.textInverseMuted} style={styles.signatureText}>
          pour un quotidien plus simple.
        </Text>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxxxl + spacing.lg,
  },
  backgroundImage: {
    resizeMode: 'cover',
    opacity: 0.2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.92,
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
  greetingLine: {
    opacity: 0.7,
  },
  nameLine: {
    letterSpacing: -0.3,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  bellBtn: {},
  bellCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
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
  heroText: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xxs,
    marginBottom: spacing.md,
  },
  heroLine: {
    lineHeight: 22,
  },
  signature: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  signatureText: {
    fontStyle: 'italic',
    opacity: 0.6,
    lineHeight: 18,
  },
});
