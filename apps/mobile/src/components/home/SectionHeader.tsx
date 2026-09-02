import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text } from '@/components/ui';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.title}>{title}</Text>
      {onSeeAll && (
        <Pressable
          onPress={onSeeAll}
          style={styles.seeAll}
          accessibilityLabel={`Voir tout ${title}`}
          accessibilityRole="button"
        >
          <Text variant="bodySmall" color={colors.primary} style={styles.seeAllText}>
            Tout voir
          </Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    letterSpacing: -0.2,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  seeAllText: {
    fontWeight: '600',
  },
});
