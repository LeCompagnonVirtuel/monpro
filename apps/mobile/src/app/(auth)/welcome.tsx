import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/images/hero-technicians.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + spacing.xxxl,
              paddingBottom: insets.bottom + spacing.xxl,
            },
          ]}
        >
          {/* Logo */}
          <Image
            source={require('../../../assets/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="MONPRO"
          />

          <View style={styles.grow} />

          {/* Value proposition */}
          <View style={styles.hero}>
            <Text
              variant="display"
              color={colors.textInverse}
              style={styles.heroTitle}
            >
              Trouvez le bon{'\n'}professionnel,{'\n'}en un instant.
            </Text>
            <View style={styles.goldBar} />
            <Text variant="body" color={colors.textInverseSoft}>
              {"Des milliers de professionnels vérifiés à votre service en Côte d'Ivoire."}
            </Text>
          </View>

          {/* CTAs */}
          <View style={styles.ctas}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryCta,
                pressed && styles.ctaPressed,
              ]}
              onPress={() => router.push('/(auth)/phone')}
              accessibilityLabel="C'est parti"
              accessibilityRole="button"
            >
              <Text variant="button" color={colors.primary}>
                {"C'est parti"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.primary} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/phone')}
              style={styles.secondaryCta}
              accessibilityLabel="Se connecter avec un compte existant"
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text
                variant="bodySmall"
                color={colors.textInverseMuted}
                align="center"
              >
                {"J’ai déjà un compte ? "}
                <Text
                  variant="bodySmall"
                  color={colors.textInverse}
                  style={styles.loginLink}
                >
                  Se connecter
                </Text>
              </Text>
            </Pressable>
          </View>

          {/* Trust */}
          <View style={styles.trust}>
            <View style={styles.trustItem}>
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={colors.secondary}
              />
              <Text variant="caption" color={colors.textInverseMuted}>
                Sécurisé
              </Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Ionicons name="ribbon" size={14} color={colors.secondary} />
              <Text variant="caption" color={colors.textInverseMuted}>
                Certifié
              </Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Ionicons name="headset" size={14} color={colors.secondary} />
              <Text variant="caption" color={colors.textInverseMuted}>
                Support 24/7
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 31, 73, 0.78)',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  logo: { width: 64, height: 64 },
  grow: { flex: 1 },

  hero: { gap: spacing.lg, marginBottom: spacing.xxxxl },
  heroTitle: { fontWeight: '800', letterSpacing: -0.5 },
  goldBar: {
    width: 40,
    height: 3,
    backgroundColor: colors.secondary,
    borderRadius: 1.5,
  },

  ctas: { gap: spacing.xl, marginBottom: spacing.xxxl },
  primaryCta: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: colors.secondary,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  ctaPressed: { opacity: 0.9 },
  secondaryCta: { alignItems: 'center', paddingVertical: spacing.xs },
  loginLink: { fontWeight: '700', textDecorationLine: 'underline' },

  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
