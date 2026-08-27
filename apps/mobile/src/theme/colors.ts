export const colors = {
  // Navy — brand principal
  primary: '#071F49',
  primaryLight: '#0B2A5B',
  primaryDark: '#051636',
  // Gold — CTA, accents, elements actifs
  secondary: '#FFB800',
  secondaryLight: '#F5A623',
  accent: '#FFB800',
  // Surfaces
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F4FA',
  // Text
  text: '#10213D',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  // Borders
  border: '#E5EAF2',
  borderLight: '#F1F5F9',
  // Status
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;
