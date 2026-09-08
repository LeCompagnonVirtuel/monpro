import { StyleSheet, View, ScrollView, Pressable, Alert, RefreshControl, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useMe } from '@/hooks/use-me';
import { getErrorMessage } from '@/lib/api-errors';
import { useMyProfessionalProfile, useUpdateProfessionalProfile } from '@/hooks/use-professional-profile';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { useProfessionalWallet } from '@/hooks/use-professional-revenue';
import { useProfessionalBookings } from '@/hooks/use-professional-bookings';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';
import { useAuthStore } from '@/stores/auth.store';
import { uploadsApi } from '@/api/uploads';
import { formatCurrency } from '@/lib/format';
import { useMemo, useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

export default function ProfessionalProfileScreen() {
  const logout = useAuthStore((s) => s.logout);
  const { data: user, isLoading: userLoading, isError: userError, refetch: refetchUser, isRefetching: userRefetching } = useMe();
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile, isRefetching: profileRefetching } = useMyProfessionalProfile();
  const updateProfile = useUpdateProfessionalProfile();
  const updateUserProfile = useUpdateProfile();
  const { data: wallet } = useProfessionalWallet();
  const { data: bookingsData } = useProfessionalBookings(profile?.id);
  const { data: unreadNotifCount } = useUnreadNotificationCount();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarPress = useCallback(async () => {
    if (isUploadingAvatar) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie pour modifier votre photo.');
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

    setIsUploadingAvatar(true);
    try {
      const { data: uploadResponse } = await uploadsApi.uploadImage({ uri, name, type }, 'avatars');
      await updateUserProfile.mutateAsync({ avatarUrl: uploadResponse.data.url });
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour votre photo. Veuillez réessayer.');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [isUploadingAvatar, updateUserProfile]);

  const isLoading = userLoading || profileLoading;
  const isError = userError || profileError;

  const completedCount = useMemo(() => {
    if (!bookingsData?.bookings) return 0;
    return bookingsData.bookings.filter((b) => b.status === 'COMPLETED').length;
  }, [bookingsData?.bookings]);

  const primaryService = useMemo(() => {
    if (profile?.services && profile.services.length > 0) {
      return profile.services[0].service?.name || null;
    }
    return null;
  }, [profile?.services]);

  const locationText = useMemo(() => {
    if (!profile?.zones || profile.zones.length === 0) return null;
    const zone = profile.zones[0];
    return {
      name: zone.name || null,
      radiusKm: zone.radiusKm || null,
    };
  }, [profile?.zones]);

  const handleToggleAvailability = () => {
    if (!profile) return;
    updateProfile.mutate({ id: profile.id, isAvailable: !profile.isAvailable });
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Skeleton width="30%" height={26} />
            <Skeleton width="60%" height={14} />
          </View>
          <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
        </View>
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonProfileCard}>
            <Skeleton width={80} height={80} borderRadius={40} />
            <View style={styles.skeletonProfileInfo}>
              <Skeleton width="55%" height={20} />
              <Skeleton width="35%" height={14} />
              <Skeleton width="45%" height={14} />
            </View>
          </View>
          <Skeleton width="100%" height={60} borderRadius={radius.md} />
          <View style={styles.skeletonStats}>
            <Skeleton width="23%" height={80} borderRadius={radius.md} />
            <Skeleton width="23%" height={80} borderRadius={radius.md} />
            <Skeleton width="23%" height={80} borderRadius={radius.md} />
            <Skeleton width="23%" height={80} borderRadius={radius.md} />
          </View>
          <Skeleton width="100%" height={200} borderRadius={radius.md} />
          <Skeleton width="100%" height={200} borderRadius={radius.md} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState
          message={getErrorMessage(isError ? new Error() : undefined, 'Impossible de charger votre profil.')}
          onRetry={() => { refetchUser(); refetchProfile(); }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={userRefetching || profileRefetching}
            onRefresh={() => { refetchUser(); refetchProfile(); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="h2">Profil</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Gérez vos informations personnelles et professionnelles.
            </Text>
          </View>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/(professional)/settings')}
            accessibilityLabel="Paramètres"
            accessibilityRole="button"
          >
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Pressable onPress={handleAvatarPress} accessibilityLabel="Changer la photo de profil" accessibilityRole="button">
              <Avatar uri={user?.avatarUrl} name={user?.fullName || ''} size={80} />
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={12} color={colors.textInverse} />
              </View>
            </Pressable>
            <View style={styles.profileInfo}>
              <Text variant="h3">{user?.fullName || ''}</Text>
              {profile && <VerificationStatus status={profile.verificationStatus} />}
              {primaryService && (
                <Text variant="bodySmall" color={colors.textSecondary}>{primaryService}</Text>
              )}
              {profile && profile.averageRating ? (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text variant="bodySmall" color={colors.textSecondary}>
                    {profile.averageRating.toFixed(1)}
                    {profile.totalReviews ? ` (${profile.totalReviews} avis)` : ''}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {profile && profile.experienceYears ? (
            <View style={styles.profileDetail}>
              <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
              <Text variant="caption" color={colors.textSecondary}>
                {profile.experienceYears} an{profile.experienceYears > 1 ? 's' : ''} d'expérience
              </Text>
            </View>
          ) : null}

          {locationText ? (
            <View style={styles.profileDetail}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text variant="caption" color={colors.textSecondary}>
                {locationText.name}
                {locationText.radiusKm ? ` • Rayon ${locationText.radiusKm} km` : ''}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={styles.editBtn}
            onPress={() => router.push('/(professional)/onboarding')}
            accessibilityLabel="Modifier le profil"
            accessibilityRole="button"
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text variant="bodySmall" color={colors.primary}>Éditer</Text>
          </Pressable>
        </View>

        {/* Online Status */}
        {profile && (
          <View style={styles.statusCard}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: profile.isAvailable ? colors.success : colors.textTertiary }]} />
              <View>
                <Text variant="bodyMedium">
                  {profile.isAvailable ? 'En ligne' : 'Hors ligne'}
                </Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {profile.isAvailable
                    ? 'Vous recevez des demandes de clients'
                    : 'Vous ne recevez pas actuellement de nouvelles demandes'}
                </Text>
              </View>
            </View>
            <Switch
              value={profile.isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: colors.borderLight, true: colors.success + '40' }}
              thumbColor={profile.isAvailable ? colors.success : colors.textTertiary}
              disabled={updateProfile.isPending}
              accessibilityLabel={`Disponibilité : ${profile.isAvailable ? 'activée' : 'désactivée'}`}
              accessibilityRole="switch"
            />
          </View>
        )}

        {/* Stats */}
        {profile && (
          <View style={styles.statsRow}>
            <Pressable
              style={styles.statCard}
              onPress={() => router.push('/(professional)/services')}
              accessibilityLabel={`${profile.services?.length || 0} services`}
              accessibilityRole="button"
            >
              <View style={[styles.statIcon, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="briefcase-outline" size={16} color={colors.info} />
              </View>
              <Text variant="h3" style={styles.statValue}>{profile.services?.length || 0}</Text>
              <Text variant="caption" color={colors.textSecondary}>Services</Text>
            </Pressable>

            <Pressable
              style={styles.statCard}
              onPress={() => router.push('/(professional)/(tabs)/interventions')}
              accessibilityLabel={`${completedCount} interventions`}
              accessibilityRole="button"
            >
              <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="construct-outline" size={16} color={colors.success} />
              </View>
              <Text variant="h3" style={styles.statValue}>{completedCount}</Text>
              <Text variant="caption" color={colors.textSecondary}>Interventions</Text>
            </Pressable>

            <Pressable
              style={styles.statCard}
              onPress={() => router.push('/(professional)/reviews')}
              accessibilityLabel={`Note : ${profile.averageRating?.toFixed(1) || 'aucune'}`}
              accessibilityRole="button"
            >
              <View style={[styles.statIcon, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="star" size={16} color={colors.warning} />
              </View>
              <Text variant="h3" style={styles.statValue}>
                {profile.averageRating ? profile.averageRating.toFixed(1) : '-'}
              </Text>
              <Text variant="caption" color={colors.textSecondary}>Note</Text>
            </Pressable>

            <Pressable
              style={styles.statCard}
              onPress={() => router.push('/(professional)/revenue')}
              accessibilityLabel={`Revenus : ${formatCurrency(wallet?.totalPaidOut ?? 0)}`}
              accessibilityRole="button"
            >
              <View style={[styles.statIcon, { backgroundColor: colors.secondaryMuted }]}>
                <Ionicons name="wallet-outline" size={16} color={colors.secondary} />
              </View>
              <Text variant="h3" color={colors.primary} style={styles.statValue}>
                {formatCurrency(wallet?.totalPaidOut ?? 0)}
              </Text>
              <Text variant="caption" color={colors.textSecondary}>Revenus</Text>
            </Pressable>
          </View>
        )}

        {/* No profile prompt */}
        {!profile && (
          <Pressable
            style={styles.setupCard}
            onPress={() => router.push('/(professional)/onboarding')}
            accessibilityLabel="Créer mon profil professionnel"
            accessibilityRole="button"
          >
            <View style={styles.setupIcon}>
              <Ionicons name="person-add-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.setupCardText}>
              <Text variant="bodyMedium">Profil non configuré</Text>
              <Text variant="caption" color={colors.textSecondary}>
                Complétez votre profil pour recevoir des demandes.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        )}

        {/* Mon compte */}
        <MenuSection title="MON COMPTE">
          <MenuItem
            icon="person-outline"
            label="Informations personnelles"
            onPress={() => router.push('/(professional)/onboarding')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Sécurité et confidentialité"
            onPress={() => router.push('/(professional)/settings')}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            badge={unreadNotifCount}
            onPress={() => router.push('/(professional)/notifications')}
          />
        </MenuSection>

        {/* Mon activité professionnelle */}
        <MenuSection title="MON ACTIVITÉ PROFESSIONNELLE">
          <MenuItem
            icon="briefcase-outline"
            label="Mes services"
            onPress={() => router.push('/(professional)/services')}
          />
          <MenuItem
            icon="time-outline"
            label="Mes disponibilités"
            onPress={() => router.push('/(professional)/availability')}
          />
          <MenuItem
            icon="location-outline"
            label="Ma zone d'intervention"
            onPress={() => router.push('/(professional)/onboarding')}
          />
          <MenuItem
            icon="wallet-outline"
            label="Mes revenus"
            onPress={() => router.push('/(professional)/revenue')}
          />
          <MenuItem
            icon="star-outline"
            label="Mes avis"
            onPress={() => router.push('/(professional)/reviews')}
          />
        </MenuSection>

        {/* Aide et support */}
        <MenuSection title="AIDE ET SUPPORT">
          <MenuItem
            icon="help-circle-outline"
            label="Centre d'aide"
            onPress={() => router.push('/(professional)/settings')}
          />
          <MenuItem
            icon="mail-outline"
            label="Nous contacter"
            onPress={() => router.push('/(professional)/settings')}
          />
        </MenuSection>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Pressable
            style={styles.logoutBtn}
            onPress={handleLogout}
            accessibilityLabel="Se déconnecter"
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text variant="body" color={colors.error}>Déconnexion</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────── SUB COMPONENTS ────────────

function VerificationStatus({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
    VERIFIED: { color: colors.success, label: 'Profil vérifié', icon: 'checkmark-circle' },
    PENDING: { color: colors.warning, label: 'Vérification en cours', icon: 'time-outline' },
    REJECTED: { color: colors.error, label: 'Vérification refusée', icon: 'close-circle' },
    SUSPENDED: { color: colors.error, label: 'Compte suspendu', icon: 'ban' },
  };
  const c = config[status] || config.PENDING;

  return (
    <View style={[styles.verificationBadge, { backgroundColor: c.color + '15' }]}>
      <Ionicons name={c.icon} size={12} color={c.color} />
      <Text variant="caption" color={c.color}>{c.label}</Text>
    </View>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.menuSection}>
      <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuCard}>{children}</View>
    </View>
  );
}

function MenuItem({ icon, label, badge, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.menuItem}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text variant="body" style={styles.menuLabel}>{label}</Text>
      <View style={styles.menuRight}>
        {badge !== undefined && badge > 0 && (
          <View style={styles.menuBadge}>
            <Text variant="caption" color={colors.textInverse} style={styles.menuBadgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

// ──────────── STYLES ────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxxl },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: { flex: 1, gap: spacing.xxs },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  // Profile card
  profileCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfo: { flex: 1, gap: spacing.xxs },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignSelf: 'flex-start',
  },

  // Status card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { letterSpacing: -0.3, textAlign: 'center' },

  // Setup card
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  setupIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupCardText: { flex: 1, gap: spacing.xxs },

  // Menu
  menuSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: { letterSpacing: 0.5, marginBottom: spacing.sm },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuLabel: { flex: 1 },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuBadge: {
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  menuBadgeText: { fontSize: 10, fontWeight: '700', color: colors.textInverse },

  // Verification
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },

  // Logout
  logoutSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: 48,
  },

  // Skeleton
  skeletonContent: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  skeletonProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: spacing.lg,
  },
  skeletonProfileInfo: { flex: 1, gap: spacing.sm },
  skeletonStats: { flexDirection: 'row', gap: spacing.sm },
});
