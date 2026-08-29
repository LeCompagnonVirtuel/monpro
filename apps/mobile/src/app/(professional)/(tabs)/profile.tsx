import { StyleSheet, View, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Avatar, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuthStore } from '@/stores/auth.store';
import { useMe } from '@/hooks/use-me';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';

const MENU_ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string; route: string }[] = [
  { icon: 'briefcase-outline', label: 'Mon profil professionnel', route: '/(professional)/onboarding' },
  { icon: 'list-outline', label: 'Services', route: '/(professional)/services' },
  { icon: 'time-outline', label: 'Disponibilités', route: '/(professional)/availability' },
  { icon: 'star-outline', label: 'Avis', route: '/(professional)/reviews' },
  { icon: 'wallet-outline', label: 'Revenus', route: '/(professional)/revenue' },
  { icon: 'notifications-outline', label: 'Notifications', route: '/(professional)/notifications' },
  { icon: 'settings-outline', label: 'Paramètres', route: '/(professional)/settings' },
];

export default function ProfessionalProfileScreen() {
  const logout = useAuthStore((s) => s.logout);
  const { data: user, isLoading: userLoading, isError: userError, refetch: refetchUser, isRefetching: userRefetching } = useMe();
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile, isRefetching: profileRefetching } = useMyProfessionalProfile();

  const isLoading = userLoading || profileLoading;
  const isError = userError || profileError;

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
          <Text variant="h2">Mon profil</Text>
        </View>
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonProfile}>
            <Skeleton width={64} height={64} borderRadius={32} />
            <View style={styles.skeletonInfo}>
              <Skeleton width="60%" height={22} />
              <Skeleton width="40%" height={16} />
              <Skeleton width="30%" height={20} />
            </View>
          </View>
          <View style={styles.skeletonStats}>
            <Skeleton width="30%" height={50} style={styles.skeletonStatCard} />
            <Skeleton width="30%" height={50} style={styles.skeletonStatCard} />
            <Skeleton width="30%" height={50} style={styles.skeletonStatCard} />
          </View>
          <View style={styles.skeletonMenu}>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} width="100%" height={48} style={styles.skeletonMenuItem} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Mon profil</Text>
        </View>
        <ErrorState
          message="Impossible de charger votre profil professionnel."
          onRetry={() => {
            refetchUser();
            refetchProfile();
          }}
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
        <View style={styles.header}>
          <Text variant="h2">Mon profil</Text>
        </View>

        <View style={styles.profileSection}>
          <Avatar uri={user?.avatarUrl} name={user?.fullName || ''} size={64} />
          <View style={styles.profileInfo}>
            <Text variant="h3">{user?.fullName || ''}</Text>
            {profile?.businessName && (
              <Text variant="bodySmall" color={colors.textSecondary}>{profile.businessName}</Text>
            )}
            {profile && (
              <VerificationStatus status={profile.verificationStatus} />
            )}
          </View>
        </View>

        {profile && (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text variant="h3">{profile.averageRating?.toFixed(1) || '-'}</Text>
              <Text variant="caption" color={colors.textSecondary}>Note</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text variant="h3">{profile.totalReviews || 0}</Text>
              <Text variant="caption" color={colors.textSecondary}>Avis</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text variant="h3">{profile.experienceYears || 0}</Text>
              <Text variant="caption" color={colors.textSecondary}>Ans exp.</Text>
            </View>
          </View>
        )}

        {!profile && (
          <Pressable
            style={styles.setupCard}
            onPress={() => router.push('/(professional)/onboarding' as never)}
            accessibilityLabel="Compléter mon profil professionnel"
            accessibilityRole="button"
          >
            <Ionicons name="person-add-outline" size={24} color={colors.primary} />
            <View style={styles.setupCardText}>
              <Text variant="bodyMedium" color={colors.text}>Profil non configuré</Text>
              <Text variant="caption" color={colors.textSecondary}>
                Complétez votre profil pour recevoir des demandes.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        )}

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.route}
              style={styles.menuItem}
              onPress={() => router.push(item.route as never)}
              accessibilityLabel={item.label}
              accessibilityRole="button"
            >
              <Ionicons name={item.icon} size={22} color={colors.text} />
              <Text variant="body" style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        <View style={styles.logoutSection}>
          <Pressable
            style={styles.logoutBtn}
            onPress={handleLogout}
            accessibilityLabel="Se déconnecter"
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text variant="body" color={colors.error}>Déconnexion</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function VerificationStatus({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    VERIFIED: { color: colors.success, label: 'Profil vérifié' },
    PENDING: { color: colors.warning, label: 'En cours de vérification' },
    REJECTED: { color: colors.error, label: 'Vérification refusée' },
    SUSPENDED: { color: colors.error, label: 'Compte suspendu' },
  };
  const c = config[status] || config.PENDING;

  return (
    <View
      style={[styles.verificationBadge, { backgroundColor: c.color + '15' }]}
      accessibilityLabel={`Statut : ${c.label}`}
    >
      {status === 'VERIFIED' && <Ionicons name="checkmark-circle" size={12} color={c.color} />}
      <Text variant="caption" color={c.color}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  profileSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  profileInfo: { flex: 1, gap: spacing.xs },
  verificationBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.sm },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, ...shadows.sm },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.borderLight },
  setupCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.md, ...shadows.sm },
  setupCardText: { flex: 1, gap: spacing.xxs },
  menu: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md, minHeight: 52 },
  menuLabel: { flex: 1 },
  logoutSection: { marginTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingVertical: spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md, minHeight: 52 },
  // Skeleton styles
  skeletonContent: { paddingHorizontal: spacing.lg, gap: spacing.xl },
  skeletonProfile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  skeletonInfo: { flex: 1, gap: spacing.sm },
  skeletonStats: { flexDirection: 'row', justifyContent: 'space-between' },
  skeletonStatCard: { borderRadius: radius.md },
  skeletonMenu: { gap: spacing.sm },
  skeletonMenuItem: { borderRadius: radius.sm },
});
