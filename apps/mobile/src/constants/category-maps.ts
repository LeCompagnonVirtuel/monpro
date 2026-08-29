import { Ionicons } from '@expo/vector-icons';

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
