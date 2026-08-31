import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text } from '@/components/ui';

interface PremiumBannerProps {
  memberSince?: string;
}

export function PremiumBanner({ memberSince }: PremiumBannerProps) {
  const formattedDate = memberSince
    ? new Date(memberSince).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.leftCol}>
          <View style={styles.memberRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text variant="caption" color={colors.textInverseSoft}>
              Membre depuis
            </Text>
          </View>
          {formattedDate && (
            <View style={styles.memberRow}>
              <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              <Text variant="caption" color={colors.textInverse} style={styles.dateText}>
                {formattedDate}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rightCol}>
          <View style={styles.premiumTitle}>
            <Text variant="body" color={colors.textInverse} style={styles.monpro}>
              MONPRO{' '}
            </Text>
            <Text variant="body" color={colors.secondary} style={styles.premium}>
              Premium
            </Text>
          </View>
          <Text variant="caption" color="rgba(255,255,255,0.7)" style={styles.desc}>
            {"Profitez d'avantages exclusifs et d'un service prioritaire."}
          </Text>
        </View>

        <Pressable
          style={styles.cta}
          onPress={() => Alert.alert('Bientôt disponible', 'MONPRO Premium arrive prochainement.')}
          accessibilityLabel="Voir les avantages Premium"
          accessibilityRole="button"
        >
          <Text variant="caption" color={colors.text} style={styles.ctaText}>
            Voir avantages
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.text} />
        </Pressable>

        <View style={styles.decoration}>
          <Ionicons name="ribbon" size={48} color={colors.secondaryMuted} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
  },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    overflow: 'hidden',
  },
  leftCol: {
    gap: spacing.xxs,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontWeight: '600',
  },
  rightCol: {
    flex: 1,
    gap: spacing.xxs,
  },
  premiumTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  monpro: {
    fontWeight: '700',
    fontSize: 15,
  },
  premium: {
    fontWeight: '700',
    fontSize: 15,
  },
  desc: {
    fontSize: 11,
    lineHeight: 15,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  ctaText: {
    fontWeight: '600',
    fontSize: 12,
  },
  decoration: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    opacity: 0.6,
  },
});
