import { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

export interface MapFilters {
  radiusKm: number;
  verifiedOnly: boolean;
  availableOnly: boolean;
  minRating: number;
}

const DEFAULT_FILTERS: MapFilters = {
  radiusKm: 10,
  verifiedOnly: false,
  availableOnly: false,
  minRating: 0,
};

interface MapFiltersPanelProps {
  filters: MapFilters;
  onApply: (filters: MapFilters) => void;
  onClose: () => void;
}

export function MapFiltersPanel({ filters, onApply, onClose }: MapFiltersPanelProps) {
  const [local, setLocal] = useState(filters);

  const RADIUS_OPTIONS = [2, 5, 10, 15, 25, 50];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="bodyMedium" style={styles.title}>Filtres</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>RAYON</Text>
          <View style={styles.chipsRow}>
            {RADIUS_OPTIONS.map((km) => (
              <Pressable
                key={km}
                style={[styles.chip, local.radiusKm === km && styles.chipActive]}
                onPress={() => setLocal({ ...local, radiusKm: km })}
              >
                <Text variant="caption" color={local.radiusKm === km ? colors.primary : colors.textSecondary}>
                  {km} km
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>NOTE MINIMUM</Text>
          <View style={styles.chipsRow}>
            {[0, 3, 3.5, 4, 4.5].map((r) => (
              <Pressable
                key={r}
                style={[styles.chip, local.minRating === r && styles.chipActive]}
                onPress={() => setLocal({ ...local, minRating: r })}
              >
                <Text variant="caption" color={local.minRating === r ? colors.primary : colors.textSecondary}>
                  {r === 0 ? 'Toutes' : `${r}+`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            style={styles.toggleRow}
            onPress={() => setLocal({ ...local, verifiedOnly: !local.verifiedOnly })}
          >
            <View style={styles.toggleLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
              <Text variant="body">Vérifiés uniquement</Text>
            </View>
            <View style={[styles.toggle, local.verifiedOnly && styles.toggleActive]}>
              <View style={[styles.toggleThumb, local.verifiedOnly && styles.toggleThumbActive]} />
            </View>
          </Pressable>

          <Pressable
            style={styles.toggleRow}
            onPress={() => setLocal({ ...local, availableOnly: !local.availableOnly })}
          >
            <View style={styles.toggleLeft}>
              <Ionicons name="radio-outline" size={20} color={colors.text} />
              <Text variant="body">Disponibles uniquement</Text>
            </View>
            <View style={[styles.toggle, local.availableOnly && styles.toggleActive]}>
              <View style={[styles.toggleThumb, local.availableOnly && styles.toggleThumbActive]} />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <Pressable style={styles.applyBtn} onPress={() => onApply(local)}>
        <Text variant="bodyMedium" color={colors.textInverse}>Appliquer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '60%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: { fontWeight: '600' },
  closeBtn: { padding: spacing.xs },
  content: { paddingHorizontal: spacing.lg },
  section: { paddingVertical: spacing.md },
  sectionTitle: { letterSpacing: 0.5, marginBottom: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.goldTint,
    borderColor: colors.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: { backgroundColor: colors.primary + '30' },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textTertiary,
  },
  toggleThumbActive: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  applyBtn: {
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
});
