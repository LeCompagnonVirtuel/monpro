import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

interface SecurityBannerProps {
  onDismiss: () => void;
}

export function SecurityBanner({ onDismiss }: SecurityBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={24} color={colors.textInverse} />
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.secondary} />
          </View>
        </View>

        <View style={styles.textCol}>
          <Text variant="body" style={styles.title}>
            Vos échanges sont sécurisés
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            MONPRO protège vos conversations et vos données personnelles.
          </Text>
        </View>

        <Pressable
          onPress={onDismiss}
          style={styles.closeButton}
          accessibilityLabel="Fermer le message de sécurité"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={20} color={colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  textCol: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {},
  closeButton: {
    padding: spacing.xs,
  },
});
