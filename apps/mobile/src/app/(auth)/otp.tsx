import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OtpScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="h1">Vérification OTP</Text>
        <Text variant="bodySmall" color={colors.textSecondary}>
          Écran à compléter en Phase 3
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xxl, justifyContent: 'center', gap: spacing.md },
});
