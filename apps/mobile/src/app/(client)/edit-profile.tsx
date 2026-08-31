import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Input, Spinner } from '@/components/ui';
import { useMe } from '@/hooks/use-me';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { uploadsApi } from '@/api/uploads';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const updateProfile = useUpdateProfile();
  const [isUploading, setIsUploading] = useState(false);

  const user = me.data;
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [fullNameError, setFullNameError] = useState('');
  const [city, setCity] = useState('');

  const isSaving = updateProfile.isPending || isUploading;

  const handleAvatarPress = useCallback(async () => {
    if (isUploading) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Veuillez autoriser l'accès à la galerie pour modifier votre photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const name = uri.split('/').pop() || 'avatar.jpg';
    const type = asset.mimeType || 'image/jpeg';

    setIsUploading(true);
    try {
      const { data: uploadResponse } = await uploadsApi.uploadImage({ uri, name, type }, 'avatars');
      await updateProfile.mutateAsync({ avatarUrl: uploadResponse.data.url });
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour votre photo. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, updateProfile]);

  const validate = useCallback(() => {
    let valid = true;
    if (!fullName.trim()) {
      setFullNameError('Le nom complet est requis');
      valid = false;
    } else {
      setFullNameError('');
    }
    return valid;
  }, [fullName]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    try {
      await updateProfile.mutateAsync({ fullName: fullName.trim() });
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications. Veuillez réessayer.');
    }
  }, [fullName, validate, updateProfile]);

  if (me.isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Text variant="h2" color={colors.text}>Modifier le profil</Text>
        </View>
        <View style={styles.loadingContent}>
          <View style={styles.avatarSkeleton} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLineShort} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.text}
            onPress={() => router.back()}
          />
          <Text variant="h2" color={colors.text}>Modifier le profil</Text>
          <View style={styles.headerRight}>
            {isSaving ? (
              <Spinner size="small" color={colors.secondary} />
            ) : (
              <Text
                variant="body"
                color={colors.secondary}
                onPress={handleSave}
                style={styles.saveButton}
              >
                Modifier
              </Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {user?.avatarUrl ? (
              <View style={styles.avatarCircle}>
                <View style={styles.avatarPlaceholder}>
                  <Text variant="button" color={colors.textInverse}>
                    {user.fullName?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.avatarCircle}>
                <View style={styles.avatarPlaceholder}>
                  <Text variant="button" color={colors.textInverse}>
                    {user?.fullName?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={20} color={colors.textInverse} />
            </View>
          </View>
          <Text variant="bodySmall" color={colors.textSecondary} onPress={handleAvatarPress} style={styles.changePhotoLink}>
            Modifier la photo
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.card}>
            <Input
              label="Nom complet"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Votre nom complet"
              error={fullNameError}
              autoCapitalize="words"
            />

            <View style={styles.phoneRow}>
              <Input
                label="Téléphone"
                value={user?.phone || ''}
                editable={false}
                style={styles.phoneInput}
              />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text variant="caption" color={colors.success}>Vérifié</Text>
              </View>
            </View>

            <Input
              label="Ville"
              value={city}
              onChangeText={setCity}
              placeholder="Votre ville"
              autoCapitalize="words"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerRight: {
    marginLeft: 'auto',
    minWidth: 60,
    alignItems: 'flex-end',
  },
  saveButton: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  loadingContent: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.md,
  },
  avatarSkeleton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceSecondary,
  },
  skeletonLine: {
    width: 180,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  skeletonLineShort: {
    width: 120,
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  changePhotoLink: {
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  phoneRow: {
    position: 'relative',
  },
  phoneInput: {
    opacity: 0.6,
  },
  verifiedBadge: {
    position: 'absolute',
    right: spacing.lg,
    top: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
