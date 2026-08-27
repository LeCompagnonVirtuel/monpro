import { ViewStyle } from 'react-native';

export const shadows = {
  sm: {
    shadowColor: '#071F49',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#071F49',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#071F49',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} satisfies Record<string, ViewStyle>;

export type ShadowKey = keyof typeof shadows;
