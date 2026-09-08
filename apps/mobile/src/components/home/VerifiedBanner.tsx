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
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Image
          source={require('../../../assets/images/hero-technicians.png')}
          style={styles.bgImage}
          contentFit="cover"
          accessibilityLabel="Technicien MONPRO vérifié"
        />
        <View style={styles.overlay} />

        <View style={styles.content}>
          <View style={styles.shieldRow}>
            <View style={styles.shieldBadge}>
              <Ionicons name="shield-checkmark" size={20} color={colors.secondary} />
            </View>
            <Text variant="caption" color={colors.secondary} style={styles.badgeLabel}>
              VÉRIFIÉ &amp; CERTIFIÉ
            </Text>
          </View>

          <Text variant="h2" color={colors.textInverse} style={styles.headline}>
            Des professionnels{'\n'}vérifiés pour votre{'\n'}sécurité
          </Text>

          <Text variant="bodySmall" color={colors.textInverseSoft} style={styles.subline}>
            Des services de qualité, en toute confiance.
          </Text>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.secondary} />
              <Text variant="caption" color={colors.textInverseMuted}>Identité vérifiée</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.secondary} />
              <Text variant="caption" color={colors.textInverseMuted}>Compétences validées</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomTag}>
        <Ionicons name="heart" size={12} color={colors.error} />
        <Text variant="caption" color={colors.textSecondary} style={styles.bottomTagText}>
          Votre confiance, notre priorité.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.xl,
  },
  card: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    height: 240,
    ...shadows.lg,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryOverlayMedium,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
    zIndex: 1,
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.goldTintMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headline: {
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  subline: {
    opacity: 0.8,
    lineHeight: 20,
  },
  trustRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bottomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  bottomTagText: {
    fontStyle: 'italic',
  },
});
