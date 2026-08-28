import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

interface OnboardingProgressProps {
  total: number;
  current: number;
}

export function OnboardingProgress({ total, current }: OnboardingProgressProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Étape ${current + 1} sur ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current + 1 }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <ProgressDot key={i} isActive={i === current} />
      ))}
    </View>
  );
}

function ProgressDot({ isActive }: { isActive: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 28 : 8, { duration: 300 }),
    backgroundColor: withTiming(isActive ? colors.primary : colors.border, { duration: 300 }),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },
});
