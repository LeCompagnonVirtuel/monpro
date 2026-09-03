import { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { colors } from '@/theme/colors';

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(12)).current;
  const accentWidth = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]),
      Animated.timing(accentWidth, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(taglineTranslateY, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(600),
      Animated.timing(fadeOut, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onFinish());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <View style={styles.content}>
        <Animated.Text
          style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        >
          MONPRO
        </Animated.Text>

        <Animated.View
          style={[
            styles.accent,
            { width: accentWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 56] }) },
          ]}
        />

        <Animated.Text
          style={[
            styles.tagline,
            { opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }] },
          ]}
        >
          Services professionnels
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 3,
  },
  accent: {
    height: 3,
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },
  tagline: {
    fontSize: 14,
    color: colors.textInverseMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
