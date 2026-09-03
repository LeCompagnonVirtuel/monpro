import { Image, ImageBackground, Pressable, StyleSheet, View, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';

const TAGLINES = [
  { word: 'Trouvez', rest: 'le bon professionnel,\nen un instant.' },
  { word: 'Votre besoin,', rest: 'notre expertise.' },
  { word: 'Des pros certifiés,', rest: 'à portée de main.' },
  { word: 'Interventions rapides,', rest: 'résultats garantis.' },
  { word: 'La qualité à domicile,', rest: 'en un clic.' },
];

const CYCLE_MS = 3200;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  const currentIndex = useRef(0);
  const [activeDot, setActiveDot] = useState(0);

  const wordOpacity = useRef(new Animated.Value(0)).current;
  const restOpacity = useRef(new Animated.Value(0)).current;
  const wordY = useRef(new Animated.Value(16)).current;
  const restY = useRef(new Animated.Value(12)).current;

  const barWidth = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslate = useRef(new Animated.Value(12)).current;

  const showTagline = useRef(true);

  useEffect(() => {
    Animated.sequence([
      animateIn(),
      Animated.parallel([
        Animated.spring(barWidth, { toValue: 1, tension: 60, friction: 10, useNativeDriver: false }),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(subtitleTranslate, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]),
    ]).start(() => {
      startCycle();
    });
  }, []);

  const animateIn = () => {
    wordOpacity.setValue(0);
    restOpacity.setValue(0);
    wordY.setValue(16);
    restY.setValue(12);

    return Animated.parallel([
      Animated.timing(wordOpacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(restOpacity, { toValue: 1, duration: 320, delay: 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(wordY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.spring(restY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]);
  };

  const animateOut = () => {
    return Animated.parallel([
      Animated.timing(wordOpacity, { toValue: 0, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(restOpacity, { toValue: 0, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(wordY, { toValue: -12, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(restY, { toValue: -6, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]);
  };

  const startCycle = () => {
    const loop = () => {
      if (!showTagline.current) return;

      setTimeout(() => {
        animateOut().start(() => {
          currentIndex.current = (currentIndex.current + 1) % TAGLINES.length;
          setActiveDot(currentIndex.current);
          animateIn().start(() => loop());
        });
      }, CYCLE_MS);
    };

    loop();
  };

  useEffect(() => {
    return () => { showTagline.current = false; };
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
              paddingTop: insets.top + spacing.xxl,
              paddingBottom: insets.bottom + spacing.lg,
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

          {/* Animated Tagline */}
          <View style={styles.hero}>
            <View style={styles.taglineContainer}>
              <Animated.Text
                style={[
                  styles.heroWord,
                  {
                    opacity: wordOpacity,
                    transform: [{ translateY: wordY }],
                  },
                ]}
              >
                {TAGLINES[currentIndex.current].word}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.heroRest,
                  {
                    opacity: restOpacity,
                    transform: [{ translateY: restY }],
                  },
                ]}
              >
                {TAGLINES[currentIndex.current].rest}
              </Animated.Text>
            </View>

            <Animated.View
              style={[
                styles.goldBar,
                {
                  width: barWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 40],
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

            {/* Dots indicator */}
            <Animated.View style={[styles.dots, { opacity: subtitleOpacity }]}>
              {TAGLINES.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeDot && styles.dotActive]}
                />
              ))}
            </Animated.View>
          </View>

          {/* CTAs */}
          <View style={styles.ctas}>
            <Pressable
              style={({ pressed }) => [styles.primaryCta, pressed && styles.ctaPressed]}
              onPress={() => router.push('/(auth)/phone')}
              accessibilityLabel="Continuer avec un téléphone"
              accessibilityRole="button"
            >
              <Ionicons name="call" size={18} color={colors.primary} />
              <Text variant="button" color={colors.primary}>Avec téléphone</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryCtaBtn, pressed && styles.ctaPressed]}
              onPress={() => router.push('/(auth)/email-register')}
              accessibilityLabel="Continuer avec un email"
              accessibilityRole="button"
            >
              <Ionicons name="mail" size={18} color={colors.primary} />
              <Text variant="button" color={colors.primary}>Avec email</Text>
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
                <Text variant="bodySmall" color={colors.textInverse} style={styles.loginLink}>Se connecter</Text>
              </Text>
            </Pressable>
          </View>

          {/* Trust */}
          <View style={styles.trust}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={12} color={colors.secondary} />
              <Text variant="caption" color={colors.textInverseMuted}>Sécurisé</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Ionicons name="ribbon" size={12} color={colors.secondary} />
              <Text variant="caption" color={colors.textInverseMuted}>Certifié</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Ionicons name="headset" size={12} color={colors.secondary} />
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
  content: { flex: 1, paddingHorizontal: spacing.xxl },
  logo: { width: 52, height: 52 },
  grow: { flex: 1 },

  hero: { gap: spacing.md, marginBottom: spacing.xl },
  taglineContainer: {},
  heroWord: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  heroRest: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: -0.3,
    lineHeight: 38,
  },
  goldBar: { height: 3, backgroundColor: colors.secondary, borderRadius: 1.5 },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.textInverse },
  dots: { flexDirection: 'row', gap: 5, marginTop: spacing.xs },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { width: 18, backgroundColor: colors.secondary },

  ctas: { gap: spacing.md, marginBottom: spacing.lg },
  primaryCta: {
    flexDirection: 'row', height: 52, backgroundColor: colors.secondary,
    borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, ...shadows.md,
  },
  secondaryCtaBtn: {
    flexDirection: 'row', height: 52, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  ctaPressed: { opacity: 0.9 },
  loginCta: { alignItems: 'center', paddingVertical: spacing.xs },
  loginLink: { fontWeight: '700', textDecorationLine: 'underline' },

  trust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trustDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.3)' },
});
