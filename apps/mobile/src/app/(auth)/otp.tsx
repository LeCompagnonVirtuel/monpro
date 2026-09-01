import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { authApi } from '@/api/auth';
import { extractApiError } from '@/api/errors';
import { useAuthStore } from '@/stores/auth.store';
import { formatPhone } from '@/lib/format';

const OTP_LENGTH = 6;
const RESEND_DELAY = 60;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [isResending, setIsResending] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const login = useAuthStore((s) => s.login);

  const cellScales = useRef(
    Array.from({ length: OTP_LENGTH }, () => new Animated.Value(1)),
  ).current;

  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [cursorOpacity]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const verifyCode = useCallback(
    async (otpCode: string) => {
      if (!phone) return;
      setIsLoading(true);
      setError(null);

      try {
        const { data: response } = await authApi.verifyOtp({
          phone,
          code: otpCode,
        });
        const result = response.data;

        if (result.isNewUser) {
          router.replace({
            pathname: '/(auth)/register',
            params: { phone: result.phone },
          });
        } else {
          await login(
            result.user.id,
            result.user.role,
            result.accessToken,
            result.refreshToken,
          );
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
        cellScales.forEach((s) => s.setValue(1));
      } finally {
        setIsLoading(false);
      }
    },
    [phone, login, cellScales],
  );

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);

    if (cleaned.length > code.length && cleaned.length <= OTP_LENGTH) {
      const idx = cleaned.length - 1;
      Animated.sequence([
        Animated.timing(cellScales[idx], {
          toValue: 1.15,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(cellScales[idx], {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }

    setCode(cleaned);
    setError(null);

    if (cleaned.length === OTP_LENGTH) {
      verifyCode(cleaned);
    }
  };

  const handleResend = async () => {
    if (!phone || resendTimer > 0) return;
    setIsResending(true);
    setError(null);

    try {
      await authApi.requestOtp({ phone });
      setResendTimer(RESEND_DELAY);
      setCode('');
      cellScales.forEach((s) => s.setValue(1));
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setIsResending(false);
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
                Vérification
              </Text>
              <Text variant="body" color={colors.textSecondary}>
                {'Entrez le code à 6 chiffres envoyé au\n'}
                <Text variant="bodyMedium" color={colors.text}>
                  {phone ? formatPhone(phone) : ''}
                </Text>
              </Text>
            </View>

            {/* OTP cells */}
            <View>
              <Pressable
                style={styles.otpRow}
                onPress={() => inputRef.current?.focus()}
              >
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.cell,
                      code.length === i && styles.cellActive,
                      code[i] != null && styles.cellFilled,
                      error && styles.cellError,
                      { transform: [{ scale: cellScales[i] }] },
                    ]}
                  >
                    <Text variant="h2" align="center">
                      {code[i] || ''}
                    </Text>
                    {code.length === i && (
                      <Animated.View
                        style={[styles.cursor, { opacity: cursorOpacity }]}
                      />
                    )}
                  </Animated.View>
                ))}
              </Pressable>

              <TextInput
                ref={inputRef}
                style={styles.hidden}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus
                textContentType="oneTimeCode"
                accessibilityLabel="Code de vérification à 6 chiffres"
              />
            </View>

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
                <Pressable
                  onPress={handleResend}
                  disabled={isResending}
                  hitSlop={8}
                  accessibilityLabel="Renvoyer le code"
                  accessibilityRole="button"
                >
                  <Text
                    variant="bodySmall"
                    color={colors.primary}
                    style={styles.resendLink}
                  >
                    {isResending ? 'Envoi...' : 'Renvoyer le code'}
                  </Text>
                </Pressable>
              )}
            </View>
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
                (code.length < OTP_LENGTH || isLoading) && styles.ctaOff,
                pressed &&
                  code.length === OTP_LENGTH &&
                  !isLoading &&
                  styles.ctaDown,
              ]}
              onPress={() => verifyCode(code)}
              disabled={code.length < OTP_LENGTH || isLoading}
              accessibilityLabel="Vérifier"
              accessibilityRole="button"
              accessibilityState={{
                disabled: code.length < OTP_LENGTH || isLoading,
              }}
            >
              <Text variant="button" color={colors.primary}>
                {isLoading ? 'Vérification...' : 'Vérifier'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.changeCta}
              accessibilityLabel="Modifier le numéro"
              accessibilityRole="button"
            >
              <Text
                variant="bodySmall"
                color={colors.primary}
                align="center"
                style={styles.changeLink}
              >
                Modifier le numéro
              </Text>
            </Pressable>
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
    gap: spacing.xxl,
    alignItems: 'center',
  },
  titleBlock: { gap: spacing.sm, alignSelf: 'stretch' },
  title: { fontWeight: '800', color: colors.text },

  otpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  cell: {
    flex: 1,
    maxWidth: 52,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cellActive: {
    borderColor: colors.secondary,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 184, 0, 0.04)',
  },
  cellFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSecondary,
  },
  cellError: {
    borderColor: colors.error,
  },
  cursor: {
    position: 'absolute',
    bottom: 10,
    width: 20,
    height: 2,
    backgroundColor: colors.secondary,
    borderRadius: 1,
  },
  hidden: { position: 'absolute', opacity: 0, height: 0, width: 0 },

  resendRow: { alignItems: 'center' },
  resendLink: { fontWeight: '600', textDecorationLine: 'underline' },

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
  changeCta: { alignItems: 'center', paddingVertical: spacing.xs },
  changeLink: { fontWeight: '600' },
});
