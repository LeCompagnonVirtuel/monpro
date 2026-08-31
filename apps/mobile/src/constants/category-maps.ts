import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
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

export const CATEGORY_COLORS: Record<string, string> = {
  plomberie: colors.secondary,
  electricite: colors.secondary,
  electricité: colors.secondary,
  nettoyage: colors.info,
  climatisation: colors.info,
  peinture: colors.warning,
  menuiserie: colors.success,
  serrurerie: colors.textSecondary,
  jardinage: colors.success,
  demenagement: colors.warning,
  déménagement: colors.warning,
};
