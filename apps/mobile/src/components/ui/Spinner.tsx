import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LottieAnimation } from './LottieAnimation';
import { colors } from '@/theme/colors';

const WAITING_LOTTIE = require('../../../lotties/Settings.json');

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  lottie?: boolean;
}

export function Spinner({ size = 'large', color = colors.primary, fullScreen = false, lottie = false }: SpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        {lottie ? (
          <LottieAnimation source={WAITING_LOTTIE} autoPlay loop style={styles.lottie} fallbackIcon="hourglass-outline" />
        ) : (
          <ActivityIndicator size={size} color={color} />
        )}
      </View>
    );
  }
  if (lottie) {
    return <LottieAnimation source={WAITING_LOTTIE} autoPlay loop style={styles.lottieInline} fallbackIcon="hourglass-outline" fallbackSize={32} />;
  }
  return <ActivityIndicator size={size} color={color} />;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 180,
    height: 180,
  },
  lottieInline: {
    width: 80,
    height: 80,
  },
});
