import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  plomberie: 'build',
  electricite: 'flash',
  electricité: 'flash',
  nettoyage: 'sparkles',
  climatisation: 'snow',
  peinture: 'color-palette',
  menuiserie: 'hammer',
  serrurerie: 'key',
  jardinage: 'leaf',
  demenagement: 'cube',
  déménagement: 'cube',
  plus: 'grid',
};

const CATEGORY_COLORS: Record<string, string> = {
  plomberie: '#FFB800',
  electricite: '#FFB800',
  electricité: '#FFB800',
  nettoyage: '#2563EB',
  climatisation: '#2563EB',
  peinture: '#F59E0B',
  menuiserie: '#16A34A',
  serrurerie: '#64748B',
  jardinage: '#16A34A',
  demenagement: '#F59E0B',
  déménagement: '#F59E0B',
};

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
  label: {
    fontWeight: '500',
    fontSize: 11,
  },
});
