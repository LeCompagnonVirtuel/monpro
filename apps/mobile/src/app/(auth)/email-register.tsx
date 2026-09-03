import { useState, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { authApi } from '@/api/auth';
import { extractApiError } from '@/api/errors';
import { useAuthStore } from '@/stores/auth.store';

type RoleType = 'CLIENT' | 'PROFESSIONAL';

export default function EmailRegisterScreen() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [role, setRole] = useState<RoleType>('CLIENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!firstName.trim()) return 'Veuillez renseigner votre prénom.';
    if (!lastName.trim()) return 'Veuillez renseigner votre nom.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return 'Adresse email invalide.';
    if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!termsAccepted)
      return "Veuillez accepter les Conditions d'utilisation et la Politique de confidentialité.";
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
      const { data: response } = await authApi.registerEmail({
        email: email.trim().toLowerCase(),
        password,
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
            <View style={styles.titleBlock}>
              <Text variant="h1" style={styles.title}>
                Créez votre compte
              </Text>
              <Text variant="body" color={colors.textSecondary}>
                Inscrivez-vous avec votre adresse email.
              </Text>
            </View>

            {/* Role selector */}
            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>
                Vous êtes
              </Text>

              <Pressable
                style={[
                  styles.roleCard,
                  role === 'CLIENT' && styles.roleCardActive,
                ]}
                onPress={() => setRole('CLIENT')}
                accessibilityLabel="Client, je recherche un professionnel"
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
                    Client
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    Je recherche un professionnel
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
                accessibilityLabel="Professionnel, je propose mes services"
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
                    Professionnel
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    Je propose mes services
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
            </View>

            {/* Name fields */}
            <View style={styles.section}>
              <Text variant="bodyMedium" style={styles.sectionLabel}>
                Informations
              </Text>

              <View style={styles.nameRow}>
                <View style={[styles.inputCard, styles.nameField]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom"
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
                    placeholder="Nom"
                    placeholderTextColor={colors.textTertiary}
                    value={lastName}
                    onChangeText={(t) => {
                      setLastName(t);
                      setError(null);
                    }}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    accessibilityLabel="Nom"
                  />
                </View>
              </View>

              {/* Email field */}
              <View style={[styles.inputCard, styles.fullField]}>
                <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="Adresse email"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  accessibilityLabel="Adresse email"
                />
              </View>

              {/* Password field */}
              <View style={[styles.inputCard, styles.fullField]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Mot de passe (8 caractères min.)"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
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
            </View>

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
                {"J'accepte les "}
                <Text
                  variant="caption"
                  color={colors.secondary}
                  style={styles.termsLink}
                  onPress={() => router.push('/(client)/terms')}
                >
                  {"Conditions d'utilisation"}
                </Text>
                {' et la '}
                <Text
                  variant="caption"
                  color={colors.secondary}
                  style={styles.termsLink}
                  onPress={() => router.push('/(client)/privacy-policy')}
                >
                  Politique de confidentialité
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
                {isLoading ? 'Création...' : 'Créer mon compte'}
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
              onPress={() => router.push('/(auth)/email-login')}
              style={styles.secondaryCta}
              accessibilityLabel="J'ai déjà un compte, se connecter"
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text variant="bodySmall" color={colors.textSecondary} align="center">
                {"J'ai déjà un compte ? "}
                <Text variant="bodySmall" color={colors.primary} style={styles.link}>
                  Se connecter
                </Text>
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
    backgroundColor: 'rgba(255,184,0,0.12)',
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
  fullField: { gap: spacing.md },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
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
});
