import { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text, Button, Input } from '@/components/ui';
import { authApi } from '@/api/auth';
import { extractApiError } from '@/api/errors';

function normalizePhoneInput(raw: string): string {
  return raw.replace(/[\s\-().]/g, '');
}

const phoneSchema = z.object({
  phone: z
    .string()
    .transform((val) => normalizePhoneInput(val))
    .refine(
      (val) => /^\+\d{10,15}$/.test(val),
      'Numéro de téléphone invalide. Format: +225 07 00 00 00 00',
    ),
});

type PhoneForm = z.infer<typeof phoneSchema>;

export default function PhoneScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '+225' },
  });

  const onSubmit = async (data: PhoneForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const normalizedPhone = normalizePhoneInput(data.phone);
      await authApi.requestOtp({ phone: normalizedPhone });
      router.push({ pathname: '/(auth)/otp', params: { phone: normalizedPhone } });
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text variant="h1">Connexion</Text>
            <Text variant="body" color={colors.textSecondary}>
              Entrez votre numéro de téléphone pour recevoir un code de vérification.
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Numéro de téléphone"
                  placeholder="+225 07 00 00 00 00"
                  keyboardType="phone-pad"
                  autoFocus
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.phone?.message}
                />
              )}
            />

            {error && (
              <Text variant="bodySmall" color={colors.error}>
                {error}
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              title="Recevoir le code"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  actions: {
    paddingBottom: spacing.xxxl,
  },
});
