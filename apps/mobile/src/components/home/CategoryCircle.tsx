import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
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
  const iconColor = isFirst ? colors.textInverse : (CATEGORY_COLORS[key] || colors.primary);
  const bgColor = isFirst ? colors.primary : colors.surface;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      accessibilityLabel={name}
      accessibilityRole="button"
    >
      <View style={[styles.circle, { backgroundColor: bgColor }, isFirst && styles.circleShadow]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
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
    width: 70,
    gap: spacing.sm,
  },
  circle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  circleShadow: {
    borderWidth: 0,
    ...shadows.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
