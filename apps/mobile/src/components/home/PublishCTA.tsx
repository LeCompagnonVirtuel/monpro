import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

export function PublishCTA() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.content}>
          <Text variant="h3" color={colors.textInverse} style={styles.title}>
            Vous avez un besoin spécifique ?
          </Text>
          <Text variant="bodySmall" color={colors.textInverseSoft} style={styles.subtitle}>
            Décrivez votre demande et recevez des devis de professionnels qualifiés.
          </Text>
        </View>

        <Pressable
          style={styles.ctaButton}
          onPress={() => router.push('/(client)/create-request')}
          accessibilityLabel="Publier une demande"
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text variant="bodyMedium" color={colors.primary} style={styles.ctaText}>
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
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.lg,
  },
  content: {
    gap: spacing.sm,
  },
  title: {
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  subtitle: {
    opacity: 0.8,
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    ...shadows.sm,
  },
  ctaText: {
    fontWeight: '700',
  },
});
