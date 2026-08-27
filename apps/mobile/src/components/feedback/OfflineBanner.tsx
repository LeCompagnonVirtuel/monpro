import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text } from '@/components/ui';
import { useNetworkStatus } from '@/hooks/use-network-status';

export function OfflineBanner() {
  const status = useNetworkStatus();

  if (status !== 'offline') return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={16} color={colors.textInverse} />
      <Text variant="bodySmall" color={colors.textInverse}>
        Connexion internet indisponible
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.error,
  },
});
