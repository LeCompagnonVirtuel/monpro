import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

export function PremiumCTA() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="ribbon" size={28} color={colors.secondary} />
        </View>

        <View style={styles.textCol}>
          <Text variant="body" style={styles.title}>
            Passez à MONPRO Premium
          </Text>
          <Text variant="caption" color={colors.textSecondary} style={styles.desc}>
            {"Accédez à plus de professionnels certifiés, à des réductions et à un support prioritaire."}
          </Text>
        </View>

        <Pressable
          style={styles.cta}
          onPress={() => {}}
          accessibilityLabel="Découvrir MONPRO Premium"
          accessibilityRole="button"
        >
          <Text variant="caption" color={colors.primary} style={styles.ctaText}>
            Découvrir
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
  },
  desc: {
    fontSize: 11,
    lineHeight: 15,
  },
  cta: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  ctaText: {
    fontWeight: '700',
    fontSize: 12,
  },
});
