import { StyleSheet, View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Card, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useMe } from '@/hooks/use-me';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useProfessionalRequests } from '@/hooks/use-professional-requests';
import { useProfessionalBookings } from '@/hooks/use-professional-bookings';
import { useProfessionalWallet } from '@/hooks/use-professional-revenue';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';
import { formatCurrency } from '@/lib/format';
import { useState, useCallback } from 'react';

export default function DashboardScreen() {
  const { data: user, isError: userError, refetch: refetchUser } = useMe();
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useMyProfessionalProfile();
  const { data: requestsData, refetch: refetchRequests } = useProfessionalRequests({ limit: 5 });
  const { data: bookingsData, refetch: refetchBookings } = useProfessionalBookings(profile?.id, { status: 'CONFIRMED' });
  const { data: wallet, refetch: refetchWallet } = useProfessionalWallet();
  const { data: unreadCount } = useUnreadNotificationCount();
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.fullName?.split(' ')[0] || '';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      refetchUser(),
      refetchProfile(),
      refetchRequests(),
      refetchBookings(),
      refetchWallet(),
    ]);
    setRefreshing(false);
  }, [refetchUser, refetchProfile, refetchRequests, refetchBookings, refetchWallet]);

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonHeaderLeft}>
              <Skeleton width="60%" height={28} />
              <Skeleton width="30%" height={20} />
            </View>
            <Skeleton width={40} height={40} style={styles.skeletonNotif} />
          </View>
          <View style={styles.skeletonStats}>
            <Skeleton width="31%" height={80} style={styles.skeletonStatCard} />
            <Skeleton width="31%" height={80} style={styles.skeletonStatCard} />
            <Skeleton width="31%" height={80} style={styles.skeletonStatCard} />
          </View>
          <Skeleton width="100%" height={80} style={styles.skeletonRevenue} />
          <View style={styles.skeletonSection}>
            <Skeleton width="50%" height={22} />
            <Skeleton width="100%" height={56} style={styles.skeletonRequest} />
            <Skeleton width="100%" height={56} style={styles.skeletonRequest} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (profileError || userError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState
          message="Impossible de charger votre tableau de bord."
          onRetry={() => {
            refetchProfile();
            refetchUser();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="h2">Bonjour, {firstName}</Text>
            {profile && (
              <VerificationBadge status={profile.verificationStatus} />
            )}
          </View>
          <Pressable
            onPress={() => router.push('/(professional)/notifications' as never)}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            style={styles.notifBtn}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount ? (
              <View style={styles.notifBadge}>
                <Text variant="bodySmall" color={colors.textInverse} style={styles.notifBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {!profile && (
          <Card style={styles.onboardingCard}>
            <Ionicons name="person-add-outline" size={32} color={colors.primary} />
            <Text variant="body">Complétez votre profil professionnel pour recevoir des demandes.</Text>
            <Pressable
              style={styles.ctaBtn}
              onPress={() => router.push('/(professional)/onboarding' as never)}
              accessibilityLabel="Créer mon profil professionnel"
              accessibilityRole="button"
            >
              <Text variant="button" color={colors.textInverse}>Créer mon profil</Text>
            </Pressable>
          </Card>
        )}

        {profile && (
          <>
            <View style={styles.statsRow}>
              <Pressable
                style={styles.statCard}
                onPress={() => router.push('/(professional)/(tabs)/requests' as never)}
                accessibilityLabel={`${requestsData?.total || 0} demandes disponibles`}
                accessibilityRole="button"
              >
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                <Text variant="h3">{String(requestsData?.total || 0)}</Text>
                <Text variant="caption" color={colors.textSecondary}>Demandes</Text>
              </Pressable>
              <Pressable
                style={styles.statCard}
                onPress={() => router.push('/(professional)/(tabs)/interventions' as never)}
                accessibilityLabel={`${bookingsData?.total || 0} réservations confirmées`}
                accessibilityRole="button"
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text variant="h3">{String(bookingsData?.total || 0)}</Text>
                <Text variant="caption" color={colors.textSecondary}>Confirmées</Text>
              </Pressable>
              <Pressable
                style={styles.statCard}
                onPress={() => router.push('/(professional)/reviews' as never)}
                accessibilityLabel={`Note moyenne : ${profile.averageRating ? profile.averageRating.toFixed(1) : 'aucune'}`}
                accessibilityRole="button"
              >
                <Ionicons name="star-outline" size={20} color={colors.primary} />
                <Text variant="h3">{profile.averageRating ? profile.averageRating.toFixed(1) : '-'}</Text>
                <Text variant="caption" color={colors.textSecondary}>Note</Text>
              </Pressable>
            </View>

            {wallet && (
              <Pressable
                style={styles.revenueCard}
                onPress={() => router.push('/(professional)/revenue' as never)}
                accessibilityLabel={`Revenus disponibles : ${formatCurrency(wallet.balance)}`}
                accessibilityRole="button"
              >
                <View style={styles.revenueHeader}>
                  <Text variant="bodySmall" color={colors.textSecondary}>Revenus disponibles</Text>
                  <Text variant="bodySmall" color={colors.primary}>Voir tout</Text>
                </View>
                <Text variant="h2" color={colors.primary}>{formatCurrency(wallet.balance)}</Text>
              </Pressable>
            )}

            {requestsData && requestsData.requests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="h3">Demandes à traiter</Text>
                  <Pressable
                    onPress={() => router.push('/(professional)/(tabs)/requests' as never)}
                    accessibilityLabel="Voir toutes les demandes"
                    accessibilityRole="button"
                  >
                    <Text variant="bodySmall" color={colors.primary}>Voir tout</Text>
                  </Pressable>
                </View>
                {requestsData.requests.slice(0, 3).map((req) => (
                  <Pressable
                    key={req.id}
                    style={styles.requestCard}
                    onPress={() => router.push({ pathname: '/(professional)/request-detail', params: { id: req.id } } as never)}
                    accessibilityLabel={`Demande : ${req.title}`}
                    accessibilityRole="button"
                  >
                    <View style={styles.requestInfo}>
                      <Text variant="body" numberOfLines={1}>{req.title}</Text>
                      <Text variant="caption" color={colors.textSecondary}>{req.service?.name}</Text>
                    </View>
                    <UrgencyBadge urgency={req.urgency} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Quick actions */}
            <View style={styles.section}>
              <Text variant="h3" style={styles.quickActionsTitle}>Accès rapide</Text>
              <View style={styles.quickActionsGrid}>
                <QuickAction
                  icon="briefcase-outline"
                  label="Services"
                  onPress={() => router.push('/(professional)/services' as never)}
                />
                <QuickAction
                  icon="time-outline"
                  label="Disponibilités"
                  onPress={() => router.push('/(professional)/availability' as never)}
                />
                <QuickAction
                  icon="star-outline"
                  label="Avis"
                  onPress={() => router.push('/(professional)/reviews' as never)}
                />
                <QuickAction
                  icon="settings-outline"
                  label="Paramètres"
                  onPress={() => router.push('/(professional)/settings' as never)}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={styles.quickAction}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text variant="caption" color={colors.text} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function VerificationBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    VERIFIED: { color: colors.success, label: 'Vérifié' },
    PENDING: { color: colors.warning, label: 'En vérification' },
    REJECTED: { color: colors.error, label: 'Refusé' },
    SUSPENDED: { color: colors.error, label: 'Suspendu' },
  };
  const c = config[status] || config.PENDING;

  return (
    <View style={[styles.badge, { backgroundColor: c.color + '20' }]} accessibilityLabel={`Statut : ${c.label}`}>
      {status === 'VERIFIED' && <Ionicons name="checkmark-circle" size={12} color={c.color} />}
      <Text variant="caption" color={c.color}>{c.label}</Text>
    </View>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { color: string; label: string }> = {
    LOW: { color: colors.textTertiary, label: 'Basse' },
    NORMAL: { color: colors.info, label: 'Normale' },
    HIGH: { color: colors.warning, label: 'Haute' },
    URGENT: { color: colors.error, label: 'Urgente' },
  };
  const c = config[urgency] || config.NORMAL;

  return (
    <View style={[styles.urgencyBadge, { backgroundColor: c.color + '15' }]}>
      <Text variant="caption" color={c.color}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, gap: spacing.xs },
  notifBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: colors.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 9 },
  onboardingCard: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  ctaBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: spacing.xs, ...shadows.sm },
  revenueCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm, ...shadows.sm },
  revenueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.md, ...shadows.sm },
  requestInfo: { flex: 1, gap: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  urgencyBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  quickActionsTitle: { marginBottom: spacing.xs },
  quickActionsGrid: { flexDirection: 'row', gap: spacing.md },
  quickAction: { flex: 1, alignItems: 'center', gap: spacing.xs },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  // Skeleton styles
  skeletonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  skeletonHeaderLeft: { flex: 1, gap: spacing.sm },
  skeletonNotif: { borderRadius: radius.md },
  skeletonStats: { flexDirection: 'row', justifyContent: 'space-between' },
  skeletonStatCard: { borderRadius: radius.md },
  skeletonRevenue: { borderRadius: radius.md },
  skeletonSection: { gap: spacing.md },
  skeletonRequest: { borderRadius: radius.md },
});
