import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { authApi } from '@/api/auth';
import { extractApiError } from '@/api/errors';

const phoneSchema = z.object({
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine(
      (val) => val.length >= 8 && val.length <= 12,
      'Numéro de téléphone invalide.',
    ),
});

type PhoneForm = z.infer<typeof phoneSchema>;

export default function PhoneScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = async (data: PhoneForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const normalizedPhone = `+225${data.phone}`;
      await authApi.requestOtp({ phone: normalizedPhone });
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: normalizedPhone },
      });
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable
              onPress={() => router.back()}
              style={styles.back}
              accessibilityLabel="Retour"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Main content */}
          <View style={styles.main}>
            <View style={styles.titleBlock}>
              <Text variant="h1" style={styles.title}>
                Quel est votre{'\n'}numéro ?
              </Text>
              <Text variant="body" color={colors.textSecondary}>
                Nous vous enverrons un code de vérification par SMS.
              </Text>
            </View>

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.phoneCard,
                    (errors.phone || error) && styles.phoneCardErr,
                  ]}
                >
                  <View style={styles.phoneRow}>
                    <View style={styles.country}>
                      <Text style={styles.flag}>🇨🇮</Text>
                      <Text variant="bodyMedium" color={colors.text}>
                        +225
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="07 00 00 00 00"
                      placeholderTextColor={colors.textTertiary}
                      value={value}
                      onChangeText={(t) => {
                        onChange(t);
                        setError(null);
                      }}
                      keyboardType="phone-pad"
                      autoFocus
                      autoComplete="tel"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                      accessibilityLabel="Numéro de téléphone"
                    />
                  </View>
                  <View style={styles.goldAccent} />
                </View>
              )}
            />

            {(errors.phone?.message || error) && (
              <Text variant="bodySmall" color={colors.error}>
                {errors.phone?.message || error}
              </Text>
            )}
          </View>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + spacing.xxl },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.cta,
                isLoading && styles.ctaOff,
                pressed && !isLoading && styles.ctaDown,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              accessibilityLabel="Continuer"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading }}
            >
              <Text variant="button" color={colors.primary}>
                {isLoading ? 'Envoi...' : 'Continuer'}
              </Text>
              {!isLoading && (
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.primary}
                />
              )}
            </Pressable>

            <View style={styles.secureRow}>
              <Ionicons
                name="lock-closed"
                size={14}
                color={colors.textTertiary}
              />
              <Text variant="caption" color={colors.textTertiary}>
                Connexion sécurisée et chiffrée
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },

  topBar: { paddingHorizontal: spacing.lg },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  main: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xl,
  },
  titleBlock: { gap: spacing.sm },
  title: { fontWeight: '800', color: colors.text },

  phoneCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  phoneCardErr: { borderColor: colors.error },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: spacing.lg,
  },
  country: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flag: { fontSize: 20 },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: 1,
    height: '100%',
  },
  goldAccent: { height: 2, backgroundColor: colors.secondary },

  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
  },
  cta: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: colors.secondary,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  ctaOff: { opacity: 0.6 },
  ctaDown: { opacity: 0.9 },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
