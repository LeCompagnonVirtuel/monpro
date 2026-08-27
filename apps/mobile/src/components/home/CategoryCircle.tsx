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
