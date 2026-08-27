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
      <Text variant="h3">{title}</Text>
      {onSeeAll && (
        <Pressable
          onPress={onSeeAll}
          style={styles.seeAll}
          accessibilityLabel={`Voir tout ${title}`}
          accessibilityRole="button"
        >
          <Text variant="bodySmall" color={colors.secondary}>
            Voir tout
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
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
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
