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

const MENU_SECTIONS: { title: string; items: { icon: keyof typeof Ionicons.glyphMap; label: string; route: string }[] }[] = [
  {
    title: 'ACTIVITÉ',
    items: [
      { icon: 'briefcase-outline', label: 'Profil professionnel', route: '/(professional)/onboarding' },
      { icon: 'list-outline', label: 'Mes services', route: '/(professional)/services' },
      { icon: 'time-outline', label: 'Disponibilités', route: '/(professional)/availability' },
    ],
  },
  {
    title: 'RÉPUTATION',
    items: [
      { icon: 'star-outline', label: 'Avis clients', route: '/(professional)/reviews' },
      { icon: 'wallet-outline', label: 'Mes revenus', route: '/(professional)/revenue' },
    ],
  },
  {
    title: 'COMPTE',
    items: [
      { icon: 'notifications-outline', label: 'Notifications', route: '/(professional)/notifications' },
      { icon: 'settings-outline', label: 'Paramètres', route: '/(professional)/settings' },
    ],
  },
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
            <Skeleton width={72} height={72} borderRadius={36} />
            <View style={styles.skeletonInfo}>
              <Skeleton width="60%" height={22} />
              <Skeleton width="40%" height={16} />
              <Skeleton width="30%" height={20} />
            </View>
          </View>
          <Skeleton width="100%" height={80} style={styles.skeletonCard} />
          <View style={styles.skeletonMenu}>
            {[1, 2, 3, 4, 5].map((i) => (
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

        {/* Profile Identity */}
        <View style={styles.profileCard}>
          <Avatar uri={user?.avatarUrl} name={user?.fullName || ''} size={72} />
          <View style={styles.profileInfo}>
            <Text variant="h3">{user?.fullName || ''}</Text>
            {profile?.businessName && (
              <Text variant="bodyMedium" color={colors.primary}>{profile.businessName}</Text>
            )}
            {profile && (
              <VerificationStatus status={profile.verificationStatus} />
            )}
          </View>
        </View>

        {/* Stats */}
        {profile && (
          <View style={styles.statsCard}>
            <Pressable
              style={styles.stat}
              onPress={() => router.push('/(professional)/reviews' as never)}
              accessibilityLabel={`Note : ${profile.averageRating?.toFixed(1) || 'aucune'}`}
              accessibilityRole="button"
            >
              <Ionicons name="star" size={18} color={colors.warning} />
              <Text variant="h3">{profile.averageRating?.toFixed(1) || '-'}</Text>
              <Text variant="caption" color={colors.textSecondary}>Note</Text>
            </Pressable>
            <View style={styles.statDivider} />
            <Pressable
              style={styles.stat}
              onPress={() => router.push('/(professional)/reviews' as never)}
              accessibilityLabel={`${profile.totalReviews || 0} avis`}
              accessibilityRole="button"
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
              <Text variant="h3">{profile.totalReviews || 0}</Text>
              <Text variant="caption" color={colors.textSecondary}>Avis</Text>
            </Pressable>
            <View style={styles.statDivider} />
            <Pressable
              style={styles.stat}
              onPress={() => router.push('/(professional)/onboarding' as never)}
              accessibilityLabel={`${profile.experienceYears || 0} années d'expérience`}
              accessibilityRole="button"
            >
              <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
              <Text variant="h3">{profile.experienceYears || 0}</Text>
              <Text variant="caption" color={colors.textSecondary}>Ans exp.</Text>
            </Pressable>
          </View>
        )}

        {/* Setup Prompt */}
        {!profile && (
          <Pressable
            style={styles.setupCard}
            onPress={() => router.push('/(professional)/onboarding' as never)}
            accessibilityLabel="Compléter mon profil professionnel"
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

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.route}
                  style={[styles.menuItem, index < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={() => router.push(item.route as never)}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                >
                  <Ionicons name={item.icon} size={20} color={colors.text} />
                  <Text variant="body" style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

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

function VerificationStatus({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
    VERIFIED: { color: colors.success, label: 'Profil vérifié', icon: 'checkmark-circle' },
    PENDING: { color: colors.warning, label: 'En vérification', icon: 'time-outline' },
    REJECTED: { color: colors.error, label: 'Vérification refusée', icon: 'close-circle' },
    SUSPENDED: { color: colors.error, label: 'Compte suspendu', icon: 'ban' },
  };
  const c = config[status] || config.PENDING;

  return (
    <View
      style={[styles.verificationBadge, { backgroundColor: c.color + '15' }]}
      accessibilityLabel={`Statut : ${c.label}`}
    >
      <Ionicons name={c.icon} size={12} color={c.color} />
      <Text variant="caption" color={c.color}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  profileCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.lg, ...shadows.sm },
  profileInfo: { flex: 1, gap: spacing.xs },
  verificationBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.sm },
  statsCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.md, paddingVertical: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, ...shadows.sm },
  stat: { flex: 1, alignItems: 'center', gap: spacing.xs },
  statDivider: { width: 1, height: 30, backgroundColor: colors.borderLight },
  setupCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.md, ...shadows.sm },
  setupIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  setupCardText: { flex: 1, gap: spacing.xxs },
  menuSection: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  sectionTitle: { letterSpacing: 0.5, marginBottom: spacing.sm },
  menuCard: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', ...shadows.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md, minHeight: 52 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  menuLabel: { flex: 1 },
  logoutSection: { marginTop: spacing.xl, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.md, minHeight: 48 },
  // Skeleton
  skeletonContent: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  skeletonProfile: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  skeletonInfo: { flex: 1, gap: spacing.sm },
  skeletonCard: { borderRadius: radius.md },
  skeletonMenu: { gap: spacing.sm },
  skeletonMenuItem: { borderRadius: radius.sm },
});
