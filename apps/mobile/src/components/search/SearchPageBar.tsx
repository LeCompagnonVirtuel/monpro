import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

interface SearchPageBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onFilterPress: () => void;
}

export function SearchPageBar({ value, onChangeText, onClear, onFilterPress }: SearchPageBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
        <TextInput
          style={styles.input}
          placeholder="Rechercher un service ou un professionnel..."
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          accessibilityLabel="Rechercher un service ou un professionnel"
          accessibilityRole="search"
        />
        {value.length > 0 && (
          <Pressable onPress={onClear} accessibilityLabel="Effacer la recherche">
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </Pressable>
        )}
        <Pressable
          style={styles.filterButton}
          onPress={onFilterPress}
          accessibilityLabel="Ouvrir les filtres"
          accessibilityRole="button"
        >
          <Ionicons name="options-outline" size={16} color={colors.textInverse} />
          <Text variant="caption" color={colors.textInverse} style={styles.filterText}>
            Filtres
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterText: {
    fontWeight: '600',
    fontSize: 12,
  },
});
