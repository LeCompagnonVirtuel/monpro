import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { Text } from './Text';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  dot?: boolean;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: colors.successLight, text: colors.success, dot: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning, dot: colors.warning },
  error: { bg: colors.errorLight, text: colors.error, dot: colors.error },
  info: { bg: colors.infoLight, text: colors.info, dot: colors.info },
  neutral: { bg: colors.surfaceSecondary, text: colors.textSecondary, dot: colors.textSecondary },
};

export function Badge({ label, variant = 'neutral', dot = false }: BadgeProps) {
  const { bg, text, dot: dotColor } = VARIANT_COLORS[variant];

  if (dot) {
    return (
      <View style={styles.dotContainer}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        {label && (
          <Text variant="caption" color={text} style={styles.dotLabel}>
            {label}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="caption" color={text} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotLabel: {
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
});
