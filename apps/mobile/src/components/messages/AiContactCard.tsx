import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

interface Props {
  onPress: () => void;
}

export function AiContactCard({ onPress }: Props) {
  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityLabel="Assistant MONPRO"
      accessibilityRole="button"
    >
      <View style={styles.avatar}>
        <Ionicons name="sparkles" size={22} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text variant="bodyMedium" numberOfLines={1}>Assistant MONPRO</Text>
          <View style={styles.aiBadge}>
            <Text variant="caption" color={colors.primary}>IA</Text>
          </View>
        </View>
        <Text variant="bodySmall" color={colors.textSecondary} numberOfLines={1}>
          Posez-moi vos questions sur vos projets
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  aiBadge: {
    backgroundColor: colors.secondaryMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
