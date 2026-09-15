import { useState, useRef } from 'react';
import {
  ActivityIndicator,
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
import Animated, { FadeInDown } from 'react-native-reanimated';
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
import { messages } from '@/constants/messages';

type RoleType = 'CLIENT' | 'PROFESSIONAL';

export default function RegisterScreen() {
  const { phone: phoneParam } = useLocalSearchParams<{ phone: string }>();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const lastNameRef = useRef<TextInput>(null);

  const [role, setRole] = useState<RoleType>('CLIENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone] = useState(phoneParam || '');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!firstName.trim()) return messages.auth.register.firstNameRequired;
    if (!lastName.trim()) return messages.auth.register.lastNameRequired;
    if (!termsAccepted)
      return messages.auth.register.termsRequired;
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const { data: response } = await authApi.register({
        phone: phone.trim(),
        fullName,
        role,
      });
      const result = response.data;

      await login(
        result.user.id,
        result.user.role as RoleType,
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

          {/* Content */}
          <View style={styles.content}>
            {/* Title */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.titleBlock}>
              <Text variant="h1" style={styles.title}>
                {messages.auth.register.title}
              </Text>
              <Text variant="body" color={colors.textSecondary}>
                {messages.auth.register.subtitle}
              </Text>
            </Animated.View>

            {/* Role selector */}
            <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>
                {messages.auth.register.roleLabel}
              </Text>

              <Pressable
                style={[
                  styles.roleCard,
                  role === 'CLIENT' && styles.roleCardActive,
                ]}
                onPress={() => setRole('CLIENT')}
                accessibilityLabel={`${messages.auth.register.client}, ${messages.auth.register.clientDesc}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: role === 'CLIENT' }}
              >
                <View
                  style={[
                    styles.roleIcon,
                    role === 'CLIENT' && styles.roleIconActive,
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={22}
                    color={
                      role === 'CLIENT' ? colors.secondary : colors.textTertiary
                    }
                  />
                </View>
                <View style={styles.roleText}>
                  <Text variant="bodyMedium" style={styles.roleName}>
                    {messages.auth.register.client}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {messages.auth.register.clientDesc}
                  </Text>
                </View>
                <View
                  style={[
                    styles.check,
                    role === 'CLIENT' && styles.checkActive,
                  ]}
                >
                  {role === 'CLIENT' && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.textInverse}
                    />
                  )}
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.roleCard,
                  role === 'PROFESSIONAL' && styles.roleCardActive,
                ]}
                onPress={() => setRole('PROFESSIONAL')}
                accessibilityLabel={`${messages.auth.register.professional}, ${messages.auth.register.professionalDesc}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: role === 'PROFESSIONAL' }}
              >
                <View
                  style={[
                    styles.roleIcon,
                    role === 'PROFESSIONAL' && styles.roleIconActive,
                  ]}
                >
                  <Ionicons
                    name="briefcase"
                    size={22}
                    color={
                      role === 'PROFESSIONAL'
                        ? colors.secondary
                        : colors.textTertiary
                    }
                  />
                </View>
                <View style={styles.roleText}>
                  <Text variant="bodyMedium" style={styles.roleName}>
                    {messages.auth.register.professional}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {messages.auth.register.professionalDesc}
                  </Text>
                </View>
                <View
                  style={[
                    styles.check,
                    role === 'PROFESSIONAL' && styles.checkActive,
                  ]}
                >
                  {role === 'PROFESSIONAL' && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.textInverse}
                    />
                  )}
                </View>
              </Pressable>
            </Animated.View>

            {/* Name fields */}
            <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>
                {messages.auth.register.sectionInfo}
              </Text>

              <View style={styles.nameRow}>
                <View style={[styles.inputCard, styles.nameField]}>
                  <TextInput
                    style={styles.input}
                    placeholder={messages.auth.register.firstNamePlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    value={firstName}
                    onChangeText={(t) => {
                      setFirstName(t);
                      setError(null);
                    }}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                    accessibilityLabel="Prénom"
                  />
                </View>
                <View style={[styles.inputCard, styles.nameField]}>
                  <TextInput
                    ref={lastNameRef}
                    style={styles.input}
                    placeholder={messages.auth.register.lastNamePlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    value={lastName}
                    onChangeText={(t) => {
                      setLastName(t);
                      setError(null);
                    }}
                    autoCapitalize="words"
                    returnKeyType="done"
                    accessibilityLabel="Nom"
                  />
                </View>
              </View>

              {/* Phone verified */}
              <View style={styles.phoneRow}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={colors.textTertiary}
                />
                <Text
                  variant="bodySmall"
                  color={colors.textSecondary}
                  style={styles.phoneText}
                >
                  {phone ? formatPhone(phone) : ''}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons
                    name="checkmark"
                    size={10}
                    color={colors.textInverse}
                  />
                </View>
                <Text variant="caption" color={colors.success}>
                  {messages.common.verified}
                </Text>
              </View>
            </Animated.View>

            {/* Terms */}
            <Pressable
              style={styles.termsRow}
              onPress={() => {
                setTermsAccepted(!termsAccepted);
                setError(null);
              }}
              accessibilityLabel="J'accepte les Conditions d'utilisation et la Politique de confidentialité"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
            >
              <View
                style={[
                  styles.checkbox,
                  termsAccepted && styles.checkboxActive,
                ]}
              >
                {termsAccepted && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={colors.textInverse}
                  />
                )}
              </View>
              <Text variant="caption" style={styles.termsText}>
                {messages.auth.register.termsPrefix}
                <Text
                  variant="caption"
                  color={colors.secondary}
                  style={styles.termsLink}
                  onPress={() => router.push('/(client)/terms')}
                >
                  {messages.auth.register.termsLink}
                </Text>
                {messages.auth.register.termsMiddle}
                <Text
                  variant="caption"
                  color={colors.secondary}
                  style={styles.termsLink}
                  onPress={() => router.push('/(client)/privacy-policy')}
                >
                  {messages.auth.register.privacyLink}
                </Text>
              </Text>
            </Pressable>

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
              onPress={handleRegister}
              disabled={isLoading}
              accessibilityLabel="Créer mon compte"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading }}
            >
              <Text variant="button" color={colors.primary}>
                {isLoading ? messages.auth.register.creating : messages.auth.register.createAccount}
              </Text>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.primary}
                />
              )}
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

  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    gap: spacing.xxl,
  },
  titleBlock: { gap: spacing.sm },
  title: { fontWeight: '800', color: colors.text },

  section: { gap: spacing.md },
  sectionLabel: { fontWeight: '700', color: colors.text },

  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSecondary,
    ...shadows.sm,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconActive: {
    backgroundColor: colors.goldTint,
  },
  roleText: { flex: 1, gap: spacing.xxs },
  roleName: { fontWeight: '700', color: colors.text },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  nameRow: { flexDirection: 'row', gap: spacing.md },
  nameField: { flex: 1 },
  inputCard: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  input: {
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 48,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
  },
  phoneText: { flex: 1 },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: { flex: 1, lineHeight: 18, color: colors.text },
  termsLink: { fontWeight: '600' },

  footer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
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
});
