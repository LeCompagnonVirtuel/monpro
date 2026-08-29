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
  const iconColor = isFirst ? colors.secondary : (CATEGORY_COLORS[key] || colors.primary);

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
          size={26}
          color={isFirst ? colors.secondary : iconColor}
        />
      </View>
      <Text
        variant="caption"
        align="center"
        numberOfLines={1}
        color={isFirst ? colors.primary : colors.text}
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
    width: 72,
    gap: spacing.xs,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  label: {
    fontWeight: '500',
  },
});
