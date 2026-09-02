import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

export function HomeSearchBar() {
  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push('/(client)/(tabs)/search')}
      accessibilityLabel="Rechercher un service ou un professionnel"
      accessibilityRole="search"
    >
      <View style={styles.bar}>
        <View style={styles.searchIcon}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
        </View>
        <Text variant="body" color={colors.textTertiary} style={styles.placeholder}>
          Rechercher un service ou un pro...
        </Text>
        <View style={styles.filterButton}>
          <Ionicons name="options-outline" size={16} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -(spacing.xxxl + spacing.xs),
    marginHorizontal: spacing.xl,
    zIndex: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    height: 50,
    gap: spacing.sm,
    ...shadows.lg,
  },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    flex: 1,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
