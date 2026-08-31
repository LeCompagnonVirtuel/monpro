import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text } from '@/components/ui';

interface SearchRequestBannerProps {
  categoryName?: string;
}

export function SearchRequestBanner({ categoryName }: SearchRequestBannerProps) {
  const subject = categoryName
    ? categoryName.toLowerCase()
    : 'professionnel';

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.shieldIcon}>
          <Ionicons name="shield-checkmark" size={28} color={colors.secondary} />
        </View>

        <View style={styles.textCol}>
          <Text variant="body" color={colors.textInverse} style={styles.title}>
            {`Besoin d'un ${subject} rapidement ?`}
          </Text>
          <Text variant="caption" color={colors.textInverseSoft} style={styles.subtitle}>
            {"Décrivez votre besoin et recevez des propositions de professionnels disponibles."}
          </Text>
        </View>

        <Pressable
          style={styles.cta}
          onPress={() => router.push('/(client)/create-request')}
          accessibilityLabel="Publier une demande"
          accessibilityRole="button"
        >
          <Text variant="caption" color={colors.primary} style={styles.ctaText}>
            Publier une demande
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
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  shieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondaryMuted,
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
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  cta: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  ctaText: {
    fontWeight: '700',
    fontSize: 11,
  },
});
