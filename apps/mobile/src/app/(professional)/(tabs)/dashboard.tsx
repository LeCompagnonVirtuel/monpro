import { StyleSheet, View, ScrollView, Pressable, RefreshControl, Switch } from 'react-native';
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
import { useMyProfessionalProfile, useUpdateProfessionalProfile } from '@/hooks/use-professional-profile';
import { useProfessionalRequests } from '@/hooks/use-professional-requests';
import { useProfessionalBookings } from '@/hooks/use-professional-bookings';
import { useProfessionalWallet } from '@/hooks/use-professional-revenue';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';
import { useConversations } from '@/hooks/use-conversations';
import { formatCurrency } from '@/lib/format';
import { useState, useCallback, useMemo } from 'react';

export default function DashboardScreen() {
  const { data: user, isError: userError, refetch: refetchUser } = useMe();
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useMyProfessionalProfile();
  const updateProfile = useUpdateProfessionalProfile();
  const { data: requestsData, refetch: refetchRequests } = useProfessionalRequests({ limit: 5 });
  const { data: bookingsData, refetch: refetchBookings } = useProfessionalBookings(profile?.id, { status: 'CONFIRMED' });
  const { data: wallet, refetch: refetchWallet } = useProfessionalWallet();
  const { data: unreadCount } = useUnreadNotificationCount();
  const { data: conversations } = useConversations();
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.fullName?.split(' ')[0] || '';

  const unreadMessages = useMemo(() => {
    if (!conversations) return 0;
    return conversations.reduce((sum, c) => sum + (c.unreadCount > 0 ? 1 : 0), 0);
  }, [conversations]);

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

  const handleToggleAvailability = useCallback(() => {
    if (!profile) return;
    updateProfile.mutate({ id: profile.id, isAvailable: !profile.isAvailable });
  }, [profile, updateProfile]);

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonHeaderLeft}>
              <Skeleton width="55%" height={26} />
              <Skeleton width="25%" height={16} />
            </View>
            <Skeleton width={40} height={40} style={styles.skeletonNotif} />
          </View>
          <View style={styles.skeletonStats}>
            <Skeleton width="31%" height={80} borderRadius={12} />
            <Skeleton width="31%" height={80} borderRadius={12} />
            <Skeleton width="31%" height={80} borderRadius={12} />
          </View>
          <Skeleton width="100%" height={52} borderRadius={12} />
          <View style={styles.skeletonSection}>
            <Skeleton width="40%" height={18} />
            <Skeleton width="100%" height={72} borderRadius={12} />
            <Skeleton width="100%" height={72} borderRadius={12} />
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
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="bodySmall" color={colors.textSecondary}>Tableau de bord</Text>
            <Text variant="h1" style={styles.greeting}>Bonjour, {firstName}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(professional)/notifications')}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            style={styles.notifBtn}
          >
            <View style={styles.notifCircle}>
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {unreadCount ? (
                <View style={styles.notifBadge}>
                  <Text variant="caption" color={colors.textInverse} style={styles.notifBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>

        {/* Verification badge */}
        {profile && (
          <VerificationBadge status={profile.verificationStatus} />
        )}

        {/* Onboarding card */}
        {!profile && (
          <Card style={styles.onboardingCard}>
            <View style={styles.onboardingIcon}>
              <Ionicons name="person-add-outline" size={28} color={colors.primary} />
            </View>
            <View style={styles.onboardingText}>
              <Text variant="bodyMedium">Complétez votre profil</Text>
              <Text variant="caption" color={colors.textSecondary}>
                Recevez des demandes et développez votre activité.
              </Text>
            </View>
            <Pressable
              style={styles.ctaBtn}
              onPress={() => router.push('/(professional)/onboarding')}
              accessibilityLabel="Créer mon profil professionnel"
              accessibilityRole="button"
            >
              <Text variant="buttonSmall" color={colors.textInverse}>Créer</Text>
            </Pressable>
          </Card>
        )}

        {profile && (
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <Pressable
                style={styles.statCard}
                onPress={() => router.push('/(professional)/reviews')}
                accessibilityLabel={`Note : ${profile.averageRating ? profile.averageRating.toFixed(1) : 'aucune'}`}
                accessibilityRole="button"
              >
                <View style={[styles.statIcon, { backgroundColor: colors.warningLight }]}>
                  <Ionicons name="star" size={16} color={colors.warning} />
                </View>
                <Text variant="h3" style={styles.statValue}>
                  {profile.averageRating ? profile.averageRating.toFixed(1) : '-'}
                </Text>
                <Text variant="caption" color={colors.textSecondary}>{profile.totalReviews || 0} avis</Text>
              </Pressable>

              {wallet && (
                <Pressable
                  style={styles.statCard}
                  onPress={() => router.push('/(professional)/revenue')}
                  accessibilityLabel={`Solde : ${formatCurrency(wallet.balance)}`}
                  accessibilityRole="button"
                >
                  <View style={[styles.statIcon, { backgroundColor: colors.infoLight }]}>
                    <Ionicons name="wallet-outline" size={16} color={colors.info} />
                  </View>
                  <Text variant="h3" color={colors.primary} style={styles.statValue}>
                    {formatCurrency(wallet.balance)}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary}>Solde</Text>
                </Pressable>
              )}

              <Pressable
                style={styles.statCard}
                onPress={() => router.push('/(professional)/services')}
                accessibilityLabel={`${profile.services?.length || 0} services`}
                accessibilityRole="button"
              >
                <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="briefcase-outline" size={16} color={colors.success} />
                </View>
                <Text variant="h3" style={styles.statValue}>{profile.services?.length || 0}</Text>
                <Text variant="caption" color={colors.textSecondary}>Services</Text>
              </Pressable>
            </View>

            {/* Availability */}
            <View style={styles.availabilityCard}>
              <View style={styles.availabilityInfo}>
                <View style={[styles.availabilityDot, { backgroundColor: profile.isAvailable ? colors.success : colors.textTertiary }]} />
                <View style={styles.availabilityText}>
                  <Text variant="bodyMedium">{profile.isAvailable ? 'Disponible' : 'Indisponible'}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {profile.isAvailable ? 'Vous recevez les demandes' : 'Vous ne recevez pas de demandes'}
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

            {/* Quick actions */}
            <View style={styles.section}>
              <Text variant="h3" style={styles.sectionTitle}>Accès rapides</Text>
              <View style={styles.quickGrid}>
                <QuickAction
                  icon="time-outline"
                  label="Horaires"
                  color={colors.info}
                  onPress={() => router.push('/(professional)/availability')}
                />
                <QuickAction
                  icon="document-text-outline"
                  label="Demandes"
                  color={colors.warning}
                  badge={(requestsData?.total || 0) > 0 ? requestsData?.total : undefined}
                  onPress={() => router.push('/(professional)/(tabs)/requests')}
                />
                <QuickAction
                  icon="chatbubble-outline"
                  label="Messages"
                  color={colors.primary}
                  badge={unreadMessages > 0 ? unreadMessages : undefined}
                  onPress={() => router.push('/(professional)/(tabs)/messages')}
                />
                <QuickAction
                  icon="star-outline"
                  label="Avis"
                  color={colors.secondary}
                  onPress={() => router.push('/(professional)/reviews')}
                />
              </View>
            </View>

            {/* Recent requests */}
            {requestsData && requestsData.requests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="h3" style={styles.sectionTitle}>Demandes récentes</Text>
                  <Pressable
                    onPress={() => router.push('/(professional)/(tabs)/requests')}
                    accessibilityLabel="Voir toutes les demandes"
                    accessibilityRole="button"
                    style={styles.seeAllBtn}
                  >
                    <Text variant="bodySmall" color={colors.primary} style={styles.seeAllText}>Tout voir</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </Pressable>
                </View>
                {requestsData.requests.slice(0, 3).map((req) => (
                  <Pressable
                    key={req.id}
                    style={styles.requestCard}
                    onPress={() => router.push({ pathname: '/(professional)/request-detail', params: { id: req.id } })}
                    accessibilityLabel={`Demande : ${req.title}`}
                    accessibilityRole="button"
                  >
                    <View style={styles.requestInfo}>
                      <Text variant="bodyMedium" numberOfLines={1}>{req.title}</Text>
                      <Text variant="caption" color={colors.textSecondary}>{req.service?.name}</Text>
                    </View>
                    <UrgencyBadge urgency={req.urgency} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Active interventions */}
            {bookingsData && bookingsData.bookings.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="h3" style={styles.sectionTitle}>Interventions</Text>
                  <Pressable
                    onPress={() => router.push('/(professional)/(tabs)/interventions')}
                    accessibilityLabel="Voir toutes les interventions"
                    accessibilityRole="button"
                    style={styles.seeAllBtn}
                  >
                    <Text variant="bodySmall" color={colors.primary} style={styles.seeAllText}>Tout voir</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </Pressable>
                </View>
                {bookingsData.bookings.slice(0, 2).map((booking) => (
                  <Pressable
                    key={booking.id}
                    style={styles.requestCard}
                    onPress={() => router.push({ pathname: '/(professional)/booking-detail', params: { bookingId: booking.id } })}
                    accessibilityLabel={`Intervention du ${booking.scheduledDate}`}
                    accessibilityRole="button"
                  >
                    <View style={styles.requestInfo}>
                      <Text variant="bodyMedium">
                        {booking.quote?.totalAmount ? formatCurrency(booking.quote.totalAmount) : 'Intervention'}
                      </Text>
                      <Text variant="caption" color={colors.textSecondary}>{booking.scheduledDate}</Text>
                    </View>
                    <BookingStatusBadge status={booking.status} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Settings link */}
            <Pressable
              style={styles.settingsLink}
              onPress={() => router.push('/(professional)/settings')}
              accessibilityLabel="Paramètres"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
              <Text variant="bodySmall" color={colors.textSecondary}>Paramètres</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, color, badge, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.quickAction}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
        {badge ? (
          <View style={styles.quickBadge}>
            <Text variant="caption" color={colors.textInverse} style={styles.quickBadgeText}>
              {badge > 9 ? '9+' : badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function VerificationBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
    VERIFIED: { color: colors.success, label: 'Profil vérifié', icon: 'checkmark-circle' },
    PENDING: { color: colors.warning, label: 'En vérification', icon: 'time-outline' },
    REJECTED: { color: colors.error, label: 'Profil refusé', icon: 'close-circle' },
    SUSPENDED: { color: colors.error, label: 'Profil suspendu', icon: 'pause-circle' },
  };
  const c = config[status] || config.PENDING;

  return (
    <View style={[styles.verificationBadge, { backgroundColor: c.color + '12' }]}>
      <Ionicons name={c.icon} size={14} color={c.color} />
      <Text variant="caption" color={c.color} style={styles.verificationText}>{c.label}</Text>
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
    <View style={[styles.urgencyBadge, { backgroundColor: c.color + '12' }]}>
      <Text variant="caption" color={c.color}>{c.label}</Text>
    </View>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    CONFIRMED: { color: colors.info, label: 'Confirmée' },
    ARRIVING: { color: colors.warning, label: 'En route' },
    IN_PROGRESS: { color: colors.primary, label: 'En cours' },
    COMPLETED: { color: colors.success, label: 'Terminée' },
    CANCELLED: { color: colors.error, label: 'Annulée' },
  };
  const c = config[status] || config.CONFIRMED;

  return (
    <View style={[styles.urgencyBadge, { backgroundColor: c.color + '12' }]}>
      <Text variant="caption" color={c.color}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { gap: spacing.xxs },
  greeting: { letterSpacing: -0.3 },
  notifBtn: {},
  notifCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: { fontSize: 9, fontWeight: '700' },

  // Verification
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  verificationText: { fontWeight: '600' },

  // Onboarding
  onboardingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  onboardingIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingText: { flex: 1, gap: spacing.xxs },
  ctaBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm },
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
  statValue: { letterSpacing: -0.3 },

  // Availability
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadows.sm,
  },
  availabilityInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  availabilityDot: { width: 10, height: 10, borderRadius: 5 },
  availabilityText: { flex: 1, gap: 2 },

  // Sections
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { letterSpacing: -0.2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  seeAllText: { fontWeight: '600' },

  // Quick actions
  quickGrid: { flexDirection: 'row', gap: spacing.sm },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quickBadgeText: { fontSize: 9, fontWeight: '700' },

  // Request cards
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  requestInfo: { flex: 1, gap: 2 },
  urgencyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },

  // Settings
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },

  // Skeleton
  skeletonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  skeletonHeaderLeft: { flex: 1, gap: spacing.sm },
  skeletonNotif: { borderRadius: radius.md },
  skeletonStats: { flexDirection: 'row', gap: spacing.sm },
  skeletonSection: { gap: spacing.md },
});
