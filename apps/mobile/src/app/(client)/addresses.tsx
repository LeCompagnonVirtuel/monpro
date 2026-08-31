import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Button } from '@/components/ui';

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.text}
            onPress={() => router.back()}
          />
          <Text variant="h2" color={colors.text}>Adresses enregistrées</Text>
          <View style={styles.headerRight}>
            <Ionicons name="add" size={28} color={colors.secondary} />
          </View>
        </View>
      </View>

      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="location-outline" size={56} color={colors.textTertiary} />
        </View>
        <Text variant="h3" color={colors.text} align="center">
          Aucune adresse enregistrée
        </Text>
        <Text variant="body" color={colors.textSecondary} align="center" style={styles.emptyDescription}>
          Ajoutez vos adresses pour faciliter vos réservations de services.
        </Text>
        <Button
          title="Ajouter une adresse"
          onPress={() => {}}
          variant="primary"
          size="md"
          style={styles.addButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerRight: {
    marginLeft: 'auto',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyDescription: {
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  addButton: {
    marginTop: spacing.lg,
    minWidth: 200,
  },
});
