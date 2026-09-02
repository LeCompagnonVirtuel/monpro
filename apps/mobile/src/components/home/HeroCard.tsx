import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

export function HeroCard() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.content}>
          <View style={styles.tag}>
            <Ionicons name="flash" size={10} color={colors.primary} />
            <Text variant="caption" color={colors.primary} style={styles.tagText}>RAPIDE & Fiable</Text>
          </View>
          <Text variant="h2" color={colors.textInverse} style={styles.title}>
            {"Besoin d'un pro\nfiable ?"}
          </Text>
          <Text variant="bodySmall" color={colors.textInverseSoft} style={styles.subtitle}>
            Trouvez le professionnel idéal près de chez vous.
          </Text>
          <Pressable
            style={styles.cta}
            onPress={() => router.push('/(client)/(tabs)/search')}
            accessibilityLabel="Trouver un pro"
            accessibilityRole="button"
          >
            <Text variant="buttonSmall" color={colors.primary}>
              Trouver un pro
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </Pressable>
        </View>

        <Image
          source={require('../../../assets/images/hero-technicians.png')}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel="Techniciens MONPRO"
        />
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
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 170,
    ...shadows.lg,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: 'rgba(255,184,0,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.full,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  subtitle: {
    opacity: 0.75,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  image: {
    width: 140,
    height: 180,
    marginTop: -10,
    marginRight: -5,
    marginBottom: -10,
  },
});
