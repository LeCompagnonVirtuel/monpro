import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/constants/category-maps';

interface SearchCategoryChipProps {
  name: string;
  isActive: boolean;
  onPress: () => void;
}

export function SearchCategoryChip({ name, isActive, onPress }: SearchCategoryChipProps) {
  const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const iconName = CATEGORY_ICONS[key] || 'grid';
  const iconColor = isActive ? colors.secondary : (CATEGORY_COLORS[key] || colors.primary);

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityLabel={name}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <View style={[styles.circle, isActive ? styles.circleActive : styles.circleDefault]}>
        <Ionicons
          name={iconName}
          size={28}
          color={isActive ? colors.secondary : iconColor}
        />
      </View>
      <Text
        variant="caption"
        align="center"
        numberOfLines={1}
        color={isActive ? colors.primary : colors.text}
        style={styles.label}
      >
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 76,
    gap: spacing.xs,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: colors.primary,
  },
  circleDefault: {
    backgroundColor: colors.surface,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  label: {},
});
