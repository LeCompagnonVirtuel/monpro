import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/constants/category-maps';

interface CategoryCircleProps {
  name: string;
  isFirst?: boolean;
  onPress: () => void;
}

export function CategoryCircle({ name, isFirst, onPress }: CategoryCircleProps) {
  const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const iconName = CATEGORY_ICONS[key] || 'grid';
  const iconColor = isFirst ? colors.primary : (CATEGORY_COLORS[key] || colors.primary);

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityLabel={name}
      accessibilityRole="button"
    >
      <View style={[styles.circle, isFirst ? styles.circleActive : styles.circleDefault]}>
        <Ionicons
          name={iconName}
          size={22}
          color={isFirst ? colors.textInverse : iconColor}
        />
      </View>
      <Text
        variant="caption"
        align="center"
        numberOfLines={1}
        color={colors.text}
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
    width: 68,
    gap: spacing.xs,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  circleDefault: {
    backgroundColor: colors.surface,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  label: {
    fontSize: 11,
  },
});
