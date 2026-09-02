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
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function EmailLoginScreen() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: response } = await authApi.loginEmail({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      const result = response.data;

      await login(
        result.user.id,
        result.user.role as 'CLIENT' | 'PROFESSIONAL',
        result.accessToken,
        result.refreshToken,
      );

      await new Promise((r) => setTimeout(r, 50));

      if (result.user.role === 'PROFESSIONAL') {
        router.replace('/(professional)/(tabs)/dashboard');
      } else {
        router.replace('/(client)/(tabs)/home');
      }
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
                Connexion par{'\n'}email
              </Text>
              <Text variant="body" color={colors.textSecondary}>
                Entrez votre adresse email et mot de passe.
              </Text>
            </View>

            {/* Email field */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputCard, errors.email && styles.inputCardErr]}>
                  <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Adresse email"
                    placeholderTextColor={colors.textTertiary}
                    value={value}
                    onChangeText={(t) => {
                      onChange(t);
                      setError(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    autoFocus
                    accessibilityLabel="Adresse email"
                  />
                </View>
              )}
            />
            {errors.email?.message && (
              <Text variant="bodySmall" color={colors.error}>
                {errors.email.message}
              </Text>
            )}

            {/* Password field */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputCard, errors.password && styles.inputCardErr]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mot de passe"
                    placeholderTextColor={colors.textTertiary}
                    value={value}
                    onChangeText={(t) => {
                      onChange(t);
                      setError(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    accessibilityLabel="Mot de passe"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                    accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </View>
              )}
            />
            {errors.password?.message && (
              <Text variant="bodySmall" color={colors.error}>
                {errors.password.message}
              </Text>
            )}

            {error && (
              <Text variant="bodySmall" color={colors.error}>
                {error}
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
              accessibilityLabel="Se connecter"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading }}
            >
              <Text variant="button" color={colors.primary}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Text>
              {!isLoading && (
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.primary}
                />
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/email-register')}
              style={styles.secondaryCta}
              accessibilityLabel="Créer un compte avec email"
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text variant="bodySmall" color={colors.textSecondary} align="center">
                {"Pas encore de compte ? "}
                <Text variant="bodySmall" color={colors.primary} style={styles.link}>
                  Créer un compte
                </Text>
              </Text>
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

  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 56,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  inputCardErr: { borderColor: colors.error },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    height: '100%',
  },

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
  secondaryCta: { alignItems: 'center', paddingVertical: spacing.xs },
  link: { fontWeight: '700', textDecorationLine: 'underline' },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
