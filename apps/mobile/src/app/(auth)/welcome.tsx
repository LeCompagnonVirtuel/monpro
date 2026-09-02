import { Image, ImageBackground, Pressable, StyleSheet, View, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { useEffect, useRef } from 'react';

const WORDS = ['Trouvez', 'le', 'bon', 'professionnel,', 'en', 'un', 'instant.'];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  const wordAnims = useRef(WORDS.map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(24),
  }))).current;

  const barWidth = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const wordAnimations = wordAnims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          delay: i * 90,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: 0,
          delay: i * 90,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.sequence([
      Animated.stagger(0, wordAnimations),
      Animated.parallel([
        Animated.spring(barWidth, { toValue: 1, tension: 60, friction: 10, useNativeDriver: false }),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(subtitleTranslate, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

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

          {/* Animated Value Proposition */}
          <View style={styles.hero}>
            <View style={styles.titleContainer}>
              {WORDS.map((word, i) => (
                <Animated.Text
                  key={i}
                  style={[
                    styles.heroWord,
                    {
                      opacity: wordAnims[i].opacity,
                      transform: [{ translateY: wordAnims[i].translateY }],
                    },
                  ]}
                >
                  {word}{' '}
                </Animated.Text>
              ))}
            </View>

            <Animated.View
              style={[
                styles.goldBar,
                {
                  width: barWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 48],
                  }),
                },
              ]}
            />

            <Animated.Text
              style={[
                styles.subtitle,
                {
                  opacity: subtitleOpacity,
                  transform: [{ translateY: subtitleTranslate }],
                },
              ]}
            >
              {"Des milliers de professionnels vérifiés à votre service en Côte d'Ivoire."}
            </Animated.Text>
          </View>

          {/* CTAs */}
          <View style={styles.ctas}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryCta,
                pressed && styles.ctaPressed,
              ]}
              onPress={() => router.push('/(auth)/phone')}
              accessibilityLabel="Continuer avec un téléphone"
              accessibilityRole="button"
            >
              <Ionicons name="call" size={20} color={colors.primary} />
              <Text variant="button" color={colors.primary}>
                Avec téléphone
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryCtaBtn,
                pressed && styles.ctaPressed,
              ]}
              onPress={() => router.push('/(auth)/email-register')}
              accessibilityLabel="Continuer avec un email"
              accessibilityRole="button"
            >
              <Ionicons name="mail" size={20} color={colors.primary} />
              <Text variant="button" color={colors.primary}>
                Avec email
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/email-login')}
              style={styles.loginCta}
              accessibilityLabel="Se connecter avec un compte existant"
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text variant="bodySmall" color={colors.textInverseMuted} align="center">
                {"J'ai déjà un compte ? "}
                <Text variant="bodySmall" color={colors.textInverse} style={styles.loginLink}>
                  Se connecter
                </Text>
              </Text>
            </Pressable>
          </View>

          {/* Trust */}
          <View style={styles.trust}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={14} color={colors.secondary} />
              <Text variant="caption" color={colors.textInverseMuted}>Sécurisé</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Ionicons name="ribbon" size={14} color={colors.secondary} />
              <Text variant="caption" color={colors.textInverseMuted}>Certifié</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Ionicons name="headset" size={14} color={colors.secondary} />
              <Text variant="caption" color={colors.textInverseMuted}>Support 24/7</Text>
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
  titleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  heroWord: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  goldBar: {
    height: 3,
    backgroundColor: colors.secondary,
    borderRadius: 1.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textInverseSoft,
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
  secondaryCtaBtn: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ctaPressed: { opacity: 0.9 },
  loginCta: { alignItems: 'center', paddingVertical: spacing.xs },
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
