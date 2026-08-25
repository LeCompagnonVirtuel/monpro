import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text, Button } from '@/components/ui';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="display" color={colors.primary}>
          MONPRO
        </Text>
        <Text variant="body" color={colors.textSecondary} align="center" style={styles.subtitle}>
          {t('auth.subtitle')}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button
          title={t('common.next')}
          onPress={() => router.push('/(auth)/phone')}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  actions: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
});
