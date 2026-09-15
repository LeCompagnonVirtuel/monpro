import { ActivityIndicator, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
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
          <LottieView source={WAITING_LOTTIE} autoPlay loop style={styles.lottie} />
        ) : (
          <ActivityIndicator size={size} color={color} />
        )}
      </View>
    );
  }
  if (lottie) {
    return <LottieView source={WAITING_LOTTIE} autoPlay loop style={styles.lottieInline} />;
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
