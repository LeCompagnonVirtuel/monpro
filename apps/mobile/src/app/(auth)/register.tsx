import { useState } from 'react';
import {
  Image,
  ImageBackground,
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

type RoleType = 'CLIENT' | 'PROFESSIONAL';

export default function RegisterScreen() {
  const { phone: phoneParam } = useLocalSearchParams<{ phone: string }>();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);

  const [role, setRole] = useState<RoleType>('CLIENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(phoneParam || '+225');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!firstName.trim()) return 'Veuillez renseigner votre prénom.';
    if (!lastName.trim()) return 'Veuillez renseigner votre nom.';
    if (!phone || phone.length < 10) return 'Veuillez renseigner un numéro de téléphone valide.';
    if (password && confirmPassword && password !== confirmPassword) {
      return 'Les mots de passe ne correspondent pas.';
    }
    if (!termsAccepted) {
      return "Veuillez accepter les Conditions d'utilisation et la Politique de confidentialité.";
    }
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

      if (role === 'PROFESSIONAL') {
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
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.sm }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </Pressable>

          {/* Branding with skyline */}
          <ImageBackground
            source={require('../../../assets/images/header-skyline.png')}
            style={styles.brandingZone}
            imageStyle={styles.skylineImage}
          >
            <Image
              source={require('../../../assets/adaptive-icon.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="MONPRO"
            />
            <Text variant="body" color={colors.textSecondary} style={styles.slogan}>
              Trouvez. Connectez. Réalisez.
            </Text>
          </ImageBackground>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text variant="h1" align="center" style={styles.title}>
              Créer votre compte
            </Text>
            <Text variant="body" color={colors.textSecondary} align="center">
              {"Rejoignez MONPRO et accédez à des milliers d'opportunités."}
            </Text>
          </View>

          {/* Role selector */}
          <View style={styles.roleSection}>
            <Text variant="body" style={styles.sectionLabel}>
              Vous êtes ?
            </Text>
            <View style={styles.roleRow}>
              <Pressable
                style={[styles.roleCard, role === 'CLIENT' && styles.roleCardActive]}
                onPress={() => setRole('CLIENT')}
                accessibilityLabel="Client, je recherche un professionnel"
                accessibilityRole="radio"
                accessibilityState={{ selected: role === 'CLIENT' }}
              >
                <Ionicons
                  name="person"
                  size={28}
                  color={role === 'CLIENT' ? colors.primary : colors.textTertiary}
                />
                <View style={styles.roleTextCol}>
                  <Text variant="body" style={styles.roleTitle}>Client</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    Je recherche{'\n'}un professionnel
                  </Text>
                </View>
                <View style={[styles.radio, role === 'CLIENT' && styles.radioActive]}>
                  {role === 'CLIENT' && <View style={styles.radioInner} />}
                </View>
              </Pressable>

              <Pressable
                style={[styles.roleCard, role === 'PROFESSIONAL' && styles.roleCardActive]}
                onPress={() => setRole('PROFESSIONAL')}
                accessibilityLabel="Professionnel, je propose mes services"
                accessibilityRole="radio"
                accessibilityState={{ selected: role === 'PROFESSIONAL' }}
              >
                <Ionicons
                  name="briefcase"
                  size={28}
                  color={role === 'PROFESSIONAL' ? colors.primary : colors.textTertiary}
                />
                <View style={styles.roleTextCol}>
                  <Text variant="body" style={styles.roleTitle}>Professionnel</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    Je propose{'\n'}mes services
                  </Text>
                </View>
                <View style={[styles.radio, role === 'PROFESSIONAL' && styles.radioActive]}>
                  {role === 'PROFESSIONAL' && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            </View>
          </View>

          {/* Personal information */}
          <View style={styles.formSection}>
            <Text variant="body" style={styles.sectionLabel}>
              Informations personnelles
            </Text>

            {/* First + Last name row */}
            <View style={styles.nameRow}>
              <View style={[styles.inputRow, styles.nameField]}>
                <Ionicons name="person-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Prénom"
                  placeholderTextColor={colors.textTertiary}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  accessibilityLabel="Prénom"
                />
              </View>
              <View style={[styles.inputRow, styles.nameField]}>
                <Ionicons name="person-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nom"
                  placeholderTextColor={colors.textTertiary}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  accessibilityLabel="Nom"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Email"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Numéro de téléphone"
                placeholderTextColor={colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                accessibilityLabel="Numéro de téléphone"
              />
            </View>

            {/* Password */}
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Mot de passe"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                accessibilityLabel="Mot de passe"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
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

            {/* Confirm password */}
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                accessibilityLabel="Confirmer le mot de passe"
              />
              <Pressable
                onPress={() => setShowConfirm(!showConfirm)}
                style={styles.eyeButton}
                accessibilityLabel={showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                accessibilityRole="button"
              >
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>

            {/* Terms checkbox */}
            <Pressable
              style={styles.termsRow}
              onPress={() => setTermsAccepted(!termsAccepted)}
              accessibilityLabel={"J'accepte les Conditions d'utilisation et la Politique de confidentialité"}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
              </View>
              <Text variant="caption" style={styles.termsText}>
                {"J'accepte les "}
                <Text variant="caption" color={colors.secondary} style={styles.termsLink}>
                  {"Conditions d'utilisation"}
                </Text>
                {' et la '}
                <Text variant="caption" color={colors.secondary} style={styles.termsLink}>
                  Politique de confidentialité
                </Text>
              </Text>
            </Pressable>

            {/* Error */}
            {error && (
              <Text variant="bodySmall" color={colors.error} style={styles.errorText}>
                {error}
              </Text>
            )}

            {/* Create account button */}
            <Pressable
              style={[styles.createButton, isLoading && styles.createButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              accessibilityLabel="Créer mon compte"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading }}
            >
              <Text variant="button" color={colors.textInverse}>
                {isLoading ? 'Création du compte...' : 'Créer mon compte'}
              </Text>
              {!isLoading && <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />}
            </Pressable>

            {/* Separator */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text variant="caption" color={colors.textTertiary} style={styles.separatorText}>
                ou
              </Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Google button */}
            <Pressable
              style={styles.googleButton}
              accessibilityLabel="S'inscrire avec Google"
              accessibilityRole="button"
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text variant="body" color={colors.primary} style={styles.googleLabel}>
                {"S'inscrire avec Google"}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.curveContainer}>
              <View style={styles.goldCurve} />
            </View>

            <View style={[styles.footerContent, { paddingBottom: insets.bottom + spacing.lg }]}>
              <View style={styles.loginRow}>
                <Text variant="body" color={colors.textInverse}>
                  Déjà un compte ?
                </Text>
                <Pressable
                  onPress={() => router.push('/(auth)/welcome')}
                  accessibilityLabel="Se connecter"
                  accessibilityRole="button"
                >
                  <Text variant="body" color={colors.secondary} style={styles.loginLink}>
                    Se connecter
                  </Text>
                </Pressable>
              </View>

              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.secondary} />
                  <Text variant="caption" color={colors.textInverse} style={styles.trustTitle}>
                    Sécurisé
                  </Text>
                  <Text variant="caption" color="rgba(255,255,255,0.7)" style={styles.trustDesc}>
                    Vos données sont protégées
                  </Text>
                </View>

                <View style={styles.trustDivider} />

                <View style={styles.trustItem}>
                  <Ionicons name="ribbon-outline" size={18} color={colors.secondary} />
                  <Text variant="caption" color={colors.textInverse} style={styles.trustTitle}>
                    Professionnels
                  </Text>
                  <Text variant="caption" color="rgba(255,255,255,0.7)" style={styles.trustDesc}>
                    Vérifiés et certifiés
                  </Text>
                </View>

                <View style={styles.trustDivider} />

                <View style={styles.trustItem}>
                  <Ionicons name="headset-outline" size={18} color={colors.secondary} />
                  <Text variant="caption" color={colors.textInverse} style={styles.trustTitle}>
                    Support
                  </Text>
                  <Text variant="caption" color="rgba(255,255,255,0.7)" style={styles.trustDesc}>
                    Assistance rapide et dédiée
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    marginLeft: spacing.lg,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingZone: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skylineImage: {
    opacity: 0.06,
    resizeMode: 'cover',
  },
  logo: {
    width: 140,
    height: 140,
  },
  slogan: {
    marginTop: spacing.xxs,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  titleSection: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.xs,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    fontSize: 24,
    color: colors.text,
  },
  roleSection: {
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  sectionLabel: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSecondary,
  },
  roleTextCol: {
    flex: 1,
    gap: spacing.xxs,
  },
  roleTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  formSection: {
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nameField: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    height: '100%',
  },
  eyeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },
  termsLink: {
    fontWeight: '600',
  },
  errorText: {
    marginTop: spacing.xs,
  },
  createButton: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    fontSize: 13,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    gap: spacing.md,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleLabel: {
    fontWeight: '500',
    fontSize: 15,
  },
  footer: {
    marginTop: spacing.xxl,
  },
  curveContainer: {
    height: 40,
    overflow: 'hidden',
  },
  goldCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    borderTopWidth: 3,
    borderTopColor: colors.secondary,
  },
  footerContent: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    gap: spacing.xxl,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loginLink: {
    fontWeight: '700',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  trustTitle: {
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
  },
  trustDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  trustDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: spacing.sm,
  },
});
