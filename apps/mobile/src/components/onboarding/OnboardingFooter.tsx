import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

interface OnboardingFooterProps {
  isLast: boolean;
  isFirst: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function OnboardingFooter({
  isLast,
  isFirst,
  onNext,
  onBack,
  onSkip,
}: OnboardingFooterProps) {
  if (isLast) {
    return (
      <View style={styles.container}>
        <Pressable
          style={styles.secondaryButton}
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel="J'ai déjà un compte"
        >
          <Text variant="bodyMedium" color={colors.primary}>
            {"J'ai déjà un compte"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.primaryButton}
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel="Commencer avec MONPRO"
        >
          <Text variant="button" color={colors.textInverse}>
            Commencer
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFirst ? (
        <Pressable
          style={styles.skipButton}
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Passer l'introduction"
        >
          <Text variant="bodyMedium" color={colors.textSecondary}>
            Passer
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour à l'étape précédente"
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text variant="bodyMedium" color={colors.primary}>
            Retour
          </Text>
        </Pressable>
      )}
      <Pressable
        style={styles.nextButton}
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel="Passer à l'étape suivante"
      >
        <Text variant="button" color={colors.textInverse}>
          Suivant
        </Text>
        <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    flex: 1,
    ...shadows.sm,
  },
  secondaryButton: {
    height: 54,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  nextButton: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    flex: 1,
    ...shadows.sm,
  },
  skipButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
});
