import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

export function VerifiedBanner() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.textSide}>
          <View style={styles.iconBadge}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          </View>
          <Text variant="bodyMedium" color={colors.primary} style={styles.title}>
            Des professionnels
          </Text>
          <Text variant="bodyMedium" color={colors.primary} style={styles.title}>
            vérifiés pour votre sécurité
          </Text>
          <Text variant="caption" color={colors.textSecondary} style={styles.subtitle}>
            Des services de qualité, en toute confiance.
          </Text>
        </View>

        <View style={styles.imageSide}>
          <Image
            source={require('../../../assets/images/hero-technicians.png')}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel="Technicien MONPRO vérifié"
          />
        </View>
      </View>

      <View style={styles.trustRow}>
        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
        <Text variant="caption" color={colors.textSecondary} style={styles.trustText}>
          Votre confiance, notre priorité.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  textSide: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontWeight: '600',
    lineHeight: 20,
  },
  subtitle: {
    marginTop: spacing.xxs,
    lineHeight: 18,
  },
  imageSide: {
    width: 110,
    backgroundColor: colors.surfaceSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  trustText: {
    fontStyle: 'italic',
  },
});
