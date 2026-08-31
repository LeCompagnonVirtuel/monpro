import { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Button } from '@/components/ui';
import { authApi } from '@/api/auth';
import { extractApiError } from '@/api/errors';
import { useAuthStore } from '@/stores/auth.store';
import { formatPhone } from '@/lib/format';

const OTP_LENGTH = 6;
const RESEND_DELAY = 60;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [isResending, setIsResending] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(cleaned);
    setError(null);

    if (cleaned.length === OTP_LENGTH) {
      verifyCode(cleaned);
    }
  };

  const verifyCode = useCallback(async (otpCode: string) => {
    if (!phone) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data: response } = await authApi.verifyOtp({ phone, code: otpCode });
      const result = response.data;

      if (result.isNewUser) {
        router.replace({ pathname: '/(auth)/register', params: { phone: result.phone } });
      } else {
        await login(result.user.id, result.user.role, result.accessToken, result.refreshToken);
        if (result.user.role === 'PROFESSIONAL') {
          router.replace('/(professional)/(tabs)/dashboard');
        } else {
          router.replace('/(client)/(tabs)/home');
        }
      }
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
      setCode('');
    } finally {
      setIsLoading(false);
    }
  }, [phone, login]);

  const handleResend = async () => {
    if (!phone || resendTimer > 0) return;
    setIsResending(true);
    setError(null);

    try {
      await authApi.requestOtp({ phone });
      setResendTimer(RESEND_DELAY);
      setCode('');
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setIsResending(false);
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
            <Text variant="h1">Vérification</Text>
            <Text variant="body" color={colors.textSecondary}>
              Entrez le code à 6 chiffres envoyé au{'\n'}
              <Text variant="body" color={colors.text}>
                {phone ? formatPhone(phone) : ''}
              </Text>
            </Text>
          </View>

          <View style={styles.otpSection}>
            <Pressable style={styles.otpContainer} onPress={() => inputRef.current?.focus()}>
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.otpCell,
                    code.length === i && styles.otpCellActive,
                    error && styles.otpCellError,
                  ]}
                >
                  <Text variant="h2" align="center">
                    {code[i] || ''}
                  </Text>
                </View>
              ))}
            </Pressable>

            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              autoFocus
              textContentType="oneTimeCode"
              accessibilityLabel="Code de vérification à 6 chiffres"
            />

            {error && (
              <Text variant="bodySmall" color={colors.error} align="center">
                {error}
              </Text>
            )}

            <View style={styles.resendRow}>
              {resendTimer > 0 ? (
                <Text variant="bodySmall" color={colors.textTertiary}>
                  Renvoyer dans {resendTimer}s
                </Text>
              ) : (
                <Pressable onPress={handleResend} disabled={isResending}>
                  <Text variant="bodySmall" color={colors.primary}>
                    {isResending ? 'Envoi...' : 'Renvoyer le code'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Vérifier"
              onPress={() => verifyCode(code)}
              loading={isLoading}
              disabled={code.length < OTP_LENGTH || isLoading}
              size="lg"
            />
            <Pressable onPress={() => router.back()}>
              <Text variant="bodySmall" color={colors.primary} align="center">
                Modifier le numéro
              </Text>
            </Pressable>
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
    paddingTop: spacing.xxxxl,
    gap: spacing.sm,
  },
  otpSection: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  otpCell: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  otpCellActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  otpCellError: {
    borderColor: colors.error,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  resendRow: {
    alignItems: 'center',
  },
  actions: {
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
});
