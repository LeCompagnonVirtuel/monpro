import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/theme/colors';
import { Text } from './Text';

type LogoVariant = 'icon' | 'full' | 'text';
type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  color?: 'dark' | 'light';
}

const SIZES: Record<LogoSize, { icon: number; fontSize: number; tagline: number; gap: number }> = {
  sm: { icon: 28, fontSize: 16, tagline: 8, gap: 4 },
  md: { icon: 36, fontSize: 20, tagline: 10, gap: 6 },
  lg: { icon: 48, fontSize: 28, tagline: 12, gap: 8 },
  xl: { icon: 64, fontSize: 40, tagline: 14, gap: 10 },
};

export function Logo({ variant = 'full', size = 'md', color = 'dark' }: LogoProps) {
  const s = SIZES[size];
  const textColor = color === 'light' ? colors.textInverse : colors.primary;

  if (variant === 'icon') {
    return (
      <Image
        source={require('../../../assets/adaptive-icon.png')}
        style={{ width: s.icon, height: s.icon, borderRadius: s.icon * 0.2 }}
        contentFit="contain"
        accessibilityLabel="MONPRO"
      />
    );
  }

  if (variant === 'text') {
    return (
      <View style={[styles.textRow, { gap: s.gap }]}>
        <Text
          variant="h1"
          color={textColor}
          style={{ fontSize: s.fontSize, fontWeight: '800', letterSpacing: 2 }}
        >
          MON
        </Text>
        <Text
          variant="h1"
          color={colors.secondary}
          style={{ fontSize: s.fontSize, fontWeight: '800', letterSpacing: 2 }}
        >
          PRO
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { gap: s.gap }]}>
      <Image
        source={require('../../../assets/adaptive-icon.png')}
        style={{ width: s.icon, height: s.icon, borderRadius: s.icon * 0.2 }}
        contentFit="contain"
        accessibilityLabel="MONPRO"
      />
      <View style={[styles.textRow, { gap: 2 }]}>
        <Text
          variant="h1"
          color={textColor}
          style={{ fontSize: s.fontSize, fontWeight: '800', letterSpacing: 1.5 }}
        >
          MON
        </Text>
        <Text
          variant="h1"
          color={colors.secondary}
          style={{ fontSize: s.fontSize, fontWeight: '800', letterSpacing: 1.5 }}
        >
          PRO
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
