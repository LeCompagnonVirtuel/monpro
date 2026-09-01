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
        <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
        <Text variant="body" color={colors.textTertiary} style={styles.placeholder}>
          Rechercher un service ou un professionnel...
        </Text>
        <View style={styles.filterButton}>
          <Ionicons name="options-outline" size={18} color={colors.textInverse} />
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
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    height: 52,
    gap: spacing.sm,
    ...shadows.md,
  },
  placeholder: {
    flex: 1,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
