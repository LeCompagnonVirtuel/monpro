import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

let LottieView: any = null;
try {
  LottieView = require('lottie-react-native').default;
} catch {
  // lottie-react-native not available (Expo Go)
}

interface LottieAnimationProps {
  source: any;
  autoPlay?: boolean;
  loop?: boolean;
  style?: object;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  fallbackSize?: number;
  fallbackColor?: string;
}

export function LottieAnimation({
  source,
  autoPlay = true,
  loop = true,
  style,
  fallbackIcon = 'sparkles-outline',
  fallbackSize = 48,
  fallbackColor = colors.textTertiary,
}: LottieAnimationProps) {
  if (!LottieView) {
    return (
      <View style={[styles.fallback, style]}>
        <Ionicons name={fallbackIcon} size={fallbackSize} color={fallbackColor} />
      </View>
    );
  }

  return <LottieView source={source} autoPlay={autoPlay} loop={loop} style={style} />;
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
