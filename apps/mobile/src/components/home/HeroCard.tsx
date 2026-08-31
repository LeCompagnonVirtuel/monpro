import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text } from '@/components/ui';

export function HeroCard() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.content}>
          <Text variant="h2" color={colors.textInverse} style={styles.title}>
            {"Besoin d'un pro"}{'\n'}{"fiable et qualifié ?"}
          </Text>
          <Text variant="bodySmall" color={colors.textInverseSoft} style={styles.subtitle}>
            Trouvez le professionnel idéal{'\n'}près de chez vous en quelques clics.
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
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
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
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 180,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    lineHeight: 18,
    fontSize: 12,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  image: {
    width: 160,
    height: 200,
    marginTop: -20,
    marginRight: -10,
    marginBottom: -10,
  },
});
