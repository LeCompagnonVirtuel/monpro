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
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { authApi } from '@/api/auth';
import { extractApiError } from '@/api/errors';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('+225');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!phone || phone.length < 10) {
      setError('Veuillez renseigner votre numéro de téléphone.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authApi.requestOtp({ phone });
      router.push({ pathname: '/(auth)/otp', params: { phone } });
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
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding zone with subtle skyline */}
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

          {/* Welcome text */}
          <View style={styles.welcomeSection}>
            <Text variant="h1" style={styles.welcomeTitle}>
              Bienvenue !
            </Text>
            <Text variant="body" color={colors.textSecondary}>
              Connectez-vous à votre compte
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Phone field */}
            <View style={styles.fieldGroup}>
              <Text variant="bodySmall" style={styles.fieldLabel}>
                Numéro de téléphone
              </Text>
              <View style={styles.inputRow}>
                <Ionicons name="call-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="+225 07 00 00 00 00"
                  placeholderTextColor={colors.textTertiary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  accessibilityLabel="Numéro de téléphone"
                />
              </View>
            </View>

            {/* Error */}
            {error && (
              <Text variant="bodySmall" color={colors.error} style={styles.errorText}>
                {error}
              </Text>
            )}

            {/* Login button */}
            <Pressable
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              accessibilityLabel="Se connecter"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading }}
            >
              <Text variant="button" color={colors.textInverse}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            {/* Gold curve separator */}
            <View style={styles.curveContainer}>
              <View style={styles.goldCurve} />
            </View>

            <View style={[styles.footerContent, { paddingBottom: insets.bottom + spacing.lg }]}>
              {/* Registration link */}
              <View style={styles.registerRow}>
                <Text variant="body" color={colors.textInverse}>
                  Pas encore de compte ?
                </Text>
                <Pressable
                  onPress={() => router.push('/(auth)/phone')}
                  accessibilityLabel="Créer un compte"
                  accessibilityRole="button"
                >
                  <Text variant="body" color={colors.secondary} style={styles.registerLink}>
                    {"S'inscrire"}
                  </Text>
                </Pressable>
              </View>

              {/* Trust indicators */}
              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <View style={styles.trustIconWrap}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={colors.secondary} />
                  </View>
                  <Text variant="caption" color={colors.textInverse} style={styles.trustTitle}>
                    Sécurisé
                  </Text>
                  <Text variant="caption" color={colors.textInverseMuted} style={styles.trustDesc}>
                    Vos données sont protégées
                  </Text>
                </View>

                <View style={styles.trustDivider} />

                <View style={styles.trustItem}>
                  <View style={styles.trustIconWrap}>
                    <Ionicons name="ribbon-outline" size={18} color={colors.secondary} />
                  </View>
                  <Text variant="caption" color={colors.textInverse} style={styles.trustTitle}>
                    Professionnels
                  </Text>
                  <Text variant="caption" color={colors.textInverseMuted} style={styles.trustDesc}>
                    Vérifiés et certifiés
                  </Text>
                </View>

                <View style={styles.trustDivider} />

                <View style={styles.trustItem}>
                  <View style={styles.trustIconWrap}>
                    <Ionicons name="headset-outline" size={18} color={colors.secondary} />
                  </View>
                  <Text variant="caption" color={colors.textInverse} style={styles.trustTitle}>
                    Support
                  </Text>
                  <Text variant="caption" color={colors.textInverseMuted} style={styles.trustDesc}>
                    Assistance rapide et dédiée
                  </Text>
                </View>
              </View>
            </View>
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  brandingZone: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  skylineImage: {
    opacity: 0.08,
    resizeMode: 'cover',
  },
  logo: {
    width: 160,
    height: 160,
  },
  slogan: {
    marginTop: spacing.xs,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  welcomeSection: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  welcomeTitle: {
    fontWeight: '800',
    fontSize: 26,
    color: colors.text,
  },
  form: {
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
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
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  errorText: {
    marginTop: spacing.xs,
  },
  loginButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  loginButtonDisabled: {
    opacity: 0.6,
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
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  registerLink: {
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
  trustIconWrap: {
    marginBottom: spacing.xs,
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
    backgroundColor: colors.borderInverse,
    marginHorizontal: spacing.sm,
  },
});
