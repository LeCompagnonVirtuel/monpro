import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

export function PublishCTA() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Image
          source={require('../../../assets/images/hero-technicians.png')}
          style={styles.bgImage}
          contentFit="cover"
        />
        <View style={styles.overlay} />

        <View style={styles.content}>
          <View style={styles.iconRow}>
            <View style={styles.iconBadge}>
              <Ionicons name="megaphone" size={20} color={colors.secondary} />
            </View>
          </View>

          <Text variant="h3" color={colors.textInverse} style={styles.title}>
            Vous avez un besoin spécifique ?
          </Text>

          <Text variant="bodySmall" color={colors.textInverseSoft} style={styles.subtitle}>
            Décrivez votre demande et recevez des devis de professionnels qualifiés en quelques minutes.
          </Text>

          <Pressable
            style={styles.ctaBtn}
            onPress={() => router.push('/(client)/create-request')}
            accessibilityLabel="Publier une demande"
            accessibilityRole="button"
          >
            <Ionicons name="add-circle" size={22} color={colors.primary} />
            <Text variant="bodyMedium" color={colors.primary} style={styles.ctaText}>
              Publier une demande
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  card: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    height: 200,
    ...shadows.lg,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,31,73,0.85)',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
    zIndex: 1,
  },
  iconRow: {
    flexDirection: 'row',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,184,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  subtitle: {
    opacity: 0.8,
    lineHeight: 20,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    ...shadows.md,
  },
  ctaText: {
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
