import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    icon: 'people-outline',
    title: 'Informations personnelles',
    subtitle: 'Gérez vos informations de profil',
    route: '/(client)/edit-profile',
  },
  {
    icon: 'location-outline',
    title: 'Adresses enregistrées',
    subtitle: 'Gérez vos adresses de localisation',
    route: '/(client)/addresses',
  },
  {
    icon: 'card-outline',
    title: 'Mes moyens de paiement',
    subtitle: 'Cartes, Mobile Money, etc.',
    route: '/(client)/payment-methods',
  },
  {
    icon: 'heart-outline',
    title: 'Mes favoris',
    subtitle: 'Professionnels et services enregistrés',
    route: '/(client)/favorites',
  },
  {
    icon: 'time-outline',
    title: 'Historique',
    subtitle: 'Demandes, paiements et activités',
    route: '/(client)/history',
  },
  {
    icon: 'settings-outline',
    title: 'Paramètres',
    subtitle: 'Préférences, confidentialité, notifications',
    route: '/(client)/settings',
  },
];

export function ProfileMenu() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {MENU_ITEMS.map((item, index) => (
          <View key={item.route}>
            <Pressable
              style={styles.row}
              onPress={() => router.push(item.route as never)}
              accessibilityLabel={item.title}
              accessibilityRole="button"
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
              </View>
              <View style={styles.textCol}>
                <Text variant="body" style={styles.title}>{item.title}</Text>
                <Text variant="caption" color={colors.textSecondary}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
            {index < MENU_ITEMS.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.lg + 36 + spacing.md,
    marginRight: spacing.lg,
  },
});
