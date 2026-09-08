import { StyleSheet, View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Card, Skeleton } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState } from '@/components/feedback/ErrorState';

import { useMe } from '@/hooks/use-me';
import { useMyProfessionalProfile, useUpdateProfessionalProfile } from '@/hooks/use-professional-profile';
import { useProfessionalRequests } from '@/hooks/use-professional-requests';
import { useProfessionalBookings } from '@/hooks/use-professional-bookings';
import { useProfessionalWallet } from '@/hooks/use-professional-revenue';
import { useProfessionalAvailability } from '@/hooks/use-professional-availability';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';
import { useConversations } from '@/hooks/use-conversations';
import { formatCurrency, formatRelativeDate } from '@/lib/format';
import { useState, useCallback, useMemo } from 'react';

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayName(dayOfWeek: number): string {
  return ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][dayOfWeek] || '';
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function DashboardScreen() {
  const { data: user, isError: userError, refetch: refetchUser } = useMe();
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useMyProfessionalProfile();
  const updateProfile = useUpdateProfessionalProfile();
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useProfessionalRequests({ limit: 5 });
  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useProfessionalBookings(profile?.id);
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useProfessionalWallet();
  const { data: unreadCount, refetch: refetchNotifications } = useUnreadNotificationCount();
  const { data: conversations, refetch: refetchConversations } = useConversations();
  const { data: availability, isLoading: availabilityLoading } = useProfessionalAvailability(profile?.id);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.fullName?.split(' ')[0] || '';

  const primaryService = useMemo(() => {
    if (profile?.services && profile.services.length > 0) {
      return profile.services[0].service?.name || null;
    }
    return null;
  }, [profile?.services]);

  const unreadMessages = useMemo(() => {
    if (!Array.isArray(conversations)) return 0;
    return conversations.reduce((sum, c) => sum + (c.unreadCount > 0 ? 1 : 0), 0);
  }, [conversations]);

  const todayBookings = useMemo(() => {
    if (!bookingsData?.bookings) return [];
    const today = getTodayString();
    return bookingsData.bookings.filter((b) => b.scheduledDate?.startsWith(today));
  }, [bookingsData?.bookings]);

  const locationText = useMemo(() => {
    if (!profile?.zones || profile.zones.length === 0) return null;
    const zone = profile.zones[0];
    return {
      name: zone.name || null,
      radiusKm: zone.radiusKm || null,
    };
  }, [profile?.zones]);

  const todayDayOfWeek = new Date().getDay();
  const todayAvailability = useMemo(() => {
    if (!availability) return null;
    return availability.find((s) => s.dayOfWeek === todayDayOfWeek && s.isActive) || null;
  }, [availability, todayDayOfWeek]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      refetchUser(),
      refetchProfile(),
      refetchRequests(),
      refetchBookings(),
      refetchWallet(),
      refetchNotifications(),
      refetchConversations(),
    ]);
    setRefreshing(false);
  }, [refetchUser, refetchProfile, refetchRequests, refetchBookings, refetchWallet, refetchNotifications, refetchConversations]);

  const handleToggleAvailability = useCallback(() => {
    if (!profile) return;
    updateProfile.mutate({ id: profile.id, isAvailable: !profile.isAvailable });
  }, [profile, updateProfile]);

  // --- Loading state ---
  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          {/* Skeleton header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Skeleton width="40%" height={14} />
              <Skeleton width="65%" height={28} />
              <Skeleton width="50%" height={14} />
            </View>
            <Skeleton width={44} height={44} style={{ borderRadius: 22 }} />
          </View>

          {/* Skeleton status + location */}
          <Skeleton width="100%" height={44} borderRadius={radius.md} />
          <Skeleton width="100%" height={44} borderRadius={radius.md} />

          {/* Skeleton banner */}
          <Skeleton width="100%" height={80} borderRadius={radius.lg} />

          {/* Skeleton stats */}
          <View style={styles.statsRow}>
            <Skeleton width="23%" height={88} borderRadius={radius.md} />
            <Skeleton width="23%" height={88} borderRadius={radius.md} />
            <Skeleton width="23%" height={88} borderRadius={radius.md} />
            <Skeleton width="23%" height={88} borderRadius={radius.md} />
          </View>

          {/* Skeleton quick actions */}
          <View style={styles.quickGrid}>
            <Skeleton width="48%" height={64} borderRadius={radius.md} />
            <Skeleton width="48%" height={64} borderRadius={radius.md} />
            <Skeleton width="48%" height={64} borderRadius={radius.md} />
            <Skeleton width="48%" height={64} borderRadius={radius.md} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- Error state ---
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

  // --- No profile (onboarding) ---
  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text variant="bodySmall" color={colors.textSecondary}>{getGreeting()},</Text>
              <Text variant="h1" style={styles.greeting}>{user?.fullName || ''}</Text>
            </View>
          </View>

          <Card style={styles.onboardingCard}>
            <View style={styles.onboardingIcon}>
              <Ionicons name="person-add-outline" size={28} color={colors.primary} />
            </View>
            <View style={styles.onboardingText}>
              <Text variant="bodyMedium">Créez votre profil professionnel</Text>
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
        </ScrollView>
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
        {/* ──────────── HEADER ──────────── */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Avatar uri={user?.avatarUrl} name={user?.fullName} size={56} />
            {profile.isAvailable && <View style={styles.onlineDot} />}
          </View>
          <View style={styles.headerLeft}>
            <Text variant="bodySmall" color={colors.textSecondary}>{getGreeting()},</Text>
            <Text variant="h2" style={styles.greeting}>{user?.fullName || ''}</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              {primaryService ? `${primaryService} • ` : ''}
              <VerificationLabel status={profile.verificationStatus} />
              {profile.verificationStatus === 'VERIFIED' && ' '}
              {profile.verificationStatus === 'VERIFIED' && (
                <Ionicons name="checkmark-circle" size={14} color={colors.info} />
              )}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => router.push('/(professional)/notifications')}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
              style={styles.iconBtn}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {(unreadCount ?? 0) > 0 && (
                <View style={styles.notifBadge}>
                  <Text variant="caption" color={colors.textInverse} style={styles.notifBadgeText}>
                    {unreadCount! > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => router.push('/(professional)/settings')}
              accessibilityLabel="Paramètres"
              accessibilityRole="button"
              style={styles.iconBtn}
            >
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* ──────────── STATUS + LOCATION ROW ──────────── */}
        <View style={styles.statusLocationRow}>
          <Pressable
            style={[styles.statusPill, profile.isAvailable ? styles.statusPillOnline : styles.statusPillOffline]}
            onPress={handleToggleAvailability}
            disabled={updateProfile.isPending}
            accessibilityLabel={`Disponibilité : ${profile.isAvailable ? 'activée' : 'désactivée'}`}
            accessibilityRole="switch"
          >
            <View style={[styles.statusDot, { backgroundColor: profile.isAvailable ? colors.success : colors.textTertiary }]} />
            <Text variant="bodySmall" color={profile.isAvailable ? colors.success : colors.textTertiary} style={styles.statusPillText}>
              {profile.isAvailable ? 'En ligne' : 'Hors ligne'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={profile.isAvailable ? colors.success : colors.textTertiary} />
          </Pressable>

          <Pressable
            style={styles.locationPill}
            onPress={() => router.push('/(professional)/onboarding')}
            accessibilityLabel="Modifier ma zone d'intervention"
            accessibilityRole="button"
          >
            <Ionicons name="location" size={16} color={colors.primary} />
            {locationText ? (
              <Text variant="bodySmall" color={colors.textSecondary}>
                {locationText.name}{locationText.radiusKm ? `\nRayon : ${locationText.radiusKm} km` : ''}
              </Text>
            ) : (
              <Text variant="bodySmall" color={colors.textTertiary}>Non définie</Text>
            )}
            <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* ──────────── BANNER ──────────── */}
        <Pressable
          style={styles.banner}
          onPress={() => router.push('/(professional)/(tabs)/requests')}
          accessibilityLabel="Voir les nouvelles demandes"
          accessibilityRole="button"
        >
          <View style={styles.bannerStarWrap}>
            <Ionicons name="star" size={22} color={colors.secondary} />
          </View>
          <View style={styles.bannerContent}>
            <Text variant="bodyMedium" color={colors.textInverse} style={styles.bannerTitle}>
              Continuez sur cette lancée !
            </Text>
            <Text variant="caption" color={colors.textInverseMuted} style={styles.bannerSubtitle}>
              {requestsLoading
                ? 'Chargement...'
                : (requestsData?.total ?? 0) > 0
                  ? `Vous avez ${requestsData!.total} nouvelle${requestsData!.total > 1 ? 's' : ''} demande${requestsData!.total > 1 ? 's' : ''} aujourd'hui.`
                  : 'Aucune nouvelle demande pour le moment.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textInverse} />
        </Pressable>

        {/* ──────────── STATS ──────────── */}
        <View style={styles.statsRow}>
          <Pressable
            style={styles.statCard}
            onPress={() => router.push('/(professional)/(tabs)/requests')}
            accessibilityLabel={`Nouvelles demandes : ${requestsData?.total ?? 0}`}
            accessibilityRole="button"
          >
            <View style={styles.statIconWrap}>
              <View style={[styles.statIcon, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="document-text-outline" size={16} color={colors.info} />
              </View>
              {(requestsData?.total ?? 0) > 0 && <View style={styles.statDot} />}
            </View>
            {requestsLoading ? (
              <Skeleton width={32} height={20} />
            ) : (
              <Text variant="h2" style={styles.statValue}>{requestsData?.total ?? 0}</Text>
            )}
            <Text variant="caption" color={colors.textSecondary}>Nouvelles{'\n'}demandes</Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() => router.push('/(professional)/(tabs)/interventions')}
            accessibilityLabel={`Interventions aujourd'hui : ${todayBookings.length}`}
            accessibilityRole="button"
          >
            <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
              <Ionicons name="calendar-outline" size={16} color={colors.success} />
            </View>
            {bookingsLoading ? (
              <Skeleton width={32} height={20} />
            ) : (
              <Text variant="h2" style={styles.statValue}>{todayBookings.length}</Text>
            )}
            <Text variant="caption" color={colors.textSecondary}>Interventions{'\n'}aujourd'hui</Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() => router.push('/(professional)/reviews')}
            accessibilityLabel={`Note moyenne : ${profile.averageRating ? profile.averageRating.toFixed(1) : 'aucune'}`}
            accessibilityRole="button"
          >
            <View style={[styles.statIcon, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="star" size={16} color={colors.warning} />
            </View>
            {profileLoading ? (
              <Skeleton width={32} height={20} />
            ) : (
              <Text variant="h2" style={styles.statValue}>
                {profile.averageRating ? profile.averageRating.toFixed(1) : '-'}
              </Text>
            )}
            <Text variant="caption" color={colors.textSecondary}>Note moyenne</Text>
            <Text variant="caption" color={colors.textTertiary} style={styles.statSubLabel}>
              ({profile.totalReviews || 0} avis)
            </Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() => router.push('/(professional)/revenue')}
            accessibilityLabel={`Revenus : ${formatCurrency(wallet?.availableBalance ?? 0)}`}
            accessibilityRole="button"
          >
            <View style={[styles.statIcon, { backgroundColor: colors.secondaryMuted }]}>
              <Ionicons name="wallet-outline" size={16} color={colors.secondary} />
            </View>
            {walletLoading ? (
              <Skeleton width={32} height={20} />
            ) : (
              <Text variant="h2" color={colors.primary} style={styles.statValue}>
                {formatCurrency(wallet?.totalPaidOut ?? 0)}
              </Text>
            )}
            <Text variant="caption" color={colors.textSecondary}>Total ce mois</Text>
          </Pressable>
        </View>

        {/* ──────────── QUICK ACTIONS ──────────── */}
        <View style={styles.quickGrid}>
          <Pressable
            style={styles.quickAction}
            onPress={() => router.push('/(professional)/services')}
            accessibilityLabel="Gérer mes services"
            accessibilityRole="button"
          >
            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            <Text variant="bodySmall" style={styles.quickActionLabel} numberOfLines={1}>Gérer mes services</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>

          <Pressable
            style={styles.quickAction}
            onPress={() => router.push('/(professional)/availability')}
            accessibilityLabel="Mes disponibilités"
            accessibilityRole="button"
          >
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text variant="bodySmall" style={styles.quickActionLabel} numberOfLines={1}>Mes disponibilités</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>

          <Pressable
            style={styles.quickAction}
            onPress={() => router.push('/(professional)/onboarding')}
            accessibilityLabel="Ma zone d'intervention"
            accessibilityRole="button"
          >
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <Text variant="bodySmall" style={styles.quickActionLabel} numberOfLines={1}>Ma zone d'intervention</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>

          <Pressable
            style={styles.quickAction}
            onPress={() => router.push('/(professional)/revenue')}
            accessibilityLabel="Mes revenus"
            accessibilityRole="button"
          >
            <Ionicons name="bar-chart-outline" size={20} color={colors.textSecondary} />
            <Text variant="bodySmall" style={styles.quickActionLabel} numberOfLines={1}>Mes revenus</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* ──────────── NEW REQUESTS ──────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="h3" style={styles.sectionTitle}>Nouvelles demandes</Text>
            <Pressable
              onPress={() => router.push('/(professional)/(tabs)/requests')}
              accessibilityLabel="Voir toutes les demandes"
              accessibilityRole="button"
              style={styles.seeAllBtn}
            >
              <Text variant="bodySmall" color={colors.primary} style={styles.seeAllText}>Voir toutes</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </Pressable>
          </View>
          {requestsLoading ? (
            <View style={styles.requestSkeletons}>
              <Skeleton width="100%" height={80} borderRadius={radius.lg} />
              <Skeleton width="100%" height={80} borderRadius={radius.lg} />
            </View>
          ) : requestsData && requestsData.requests.length > 0 ? (
            requestsData.requests.slice(0, 3).map((req) => (
              <Pressable
                key={req.id}
                style={styles.requestCard}
                onPress={() => router.push({ pathname: '/(professional)/request-detail', params: { id: req.id } })}
                accessibilityLabel={`Demande : ${req.title}`}
                accessibilityRole="button"
              >
                <View style={styles.requestIcon}>
                  <Ionicons name="construct-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.requestInfo}>
                  <Text variant="bodyMedium" numberOfLines={1} style={styles.requestTitle}>{req.title}</Text>
                  <View style={styles.requestMeta}>
                    <Ionicons name="location" size={12} color={colors.success} />
                    <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {req.address?.fullAddress || req.service?.name || 'Service'}
                    </Text>
                  </View>
                  <View style={styles.requestBottom}>
                    <Text variant="caption" color={colors.textTertiary}>{formatRelativeDate(req.createdAt)}</Text>
                    <UrgencyBadge urgency={req.urgency} />
                  </View>
                </View>
                <View style={styles.voirBtn}>
                  <Text variant="caption" color={colors.textInverse} style={styles.voirBtnText}>Voir</Text>
                  <Ionicons name="chevron-forward" size={12} color={colors.textInverse} />
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyRequest}>
              <Ionicons name="file-tray-outline" size={32} color={colors.textTertiary} />
              <Text variant="bodySmall" color={colors.textTertiary}>Aucune nouvelle demande</Text>
            </View>
          )}
        </View>

        {/* ──────────── TODAY'S PLANNING ──────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="h3" style={styles.sectionTitle}>Mon planning aujourd'hui</Text>
            <Pressable
              onPress={() => router.push('/(professional)/(tabs)/interventions')}
              accessibilityLabel="Voir tout le planning"
              accessibilityRole="button"
              style={styles.seeAllBtn}
            >
              <Text variant="bodySmall" color={colors.primary} style={styles.seeAllText}>Voir tout</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </Pressable>
          </View>
          {bookingsLoading ? (
            <View style={styles.requestSkeletons}>
              <Skeleton width="100%" height={72} borderRadius={radius.lg} />
            </View>
          ) : todayBookings.length > 0 ? (
            todayBookings.slice(0, 3).map((booking) => (
              <Pressable
                key={booking.id}
                style={styles.planningCard}
                onPress={() => router.push({ pathname: '/(professional)/booking-detail', params: { bookingId: booking.id } })}
                accessibilityLabel={`Intervention du ${booking.scheduledDate}`}
                accessibilityRole="button"
              >
                <Text variant="caption" color={colors.textSecondary} style={styles.planningTime}>
                  {booking.scheduledTime || '—'}
                </Text>
                <View style={styles.planningCheck}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                </View>
                <View style={styles.planningInfo}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {booking.serviceRequest?.title || booking.serviceRequest?.service?.name || 'Intervention'}
                  </Text>
                  <View style={styles.requestMeta}>
                    <Ionicons name="location" size={12} color={colors.primary} />
                    <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {booking.address?.fullAddress || ''}
                    </Text>
                  </View>
                </View>
                <BookingStatusBadge status={booking.status} />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyRequest}>
              <Ionicons name="calendar-outline" size={32} color={colors.textTertiary} />
              <Text variant="bodySmall" color={colors.textTertiary}>Aucune intervention prévue aujourd'hui</Text>
            </View>
          )}
        </View>

        {/* ──────────── TODAY'S AVAILABILITY ──────────── */}
        {todayAvailability && (
          <View style={styles.availabilityInfo}>
            <Ionicons name="time-outline" size={16} color={colors.success} />
            <Text variant="caption" color={colors.textSecondary}>
              Aujourd'hui ({getDayName(todayDayOfWeek)}) : {todayAvailability.startTime} — {todayAvailability.endTime}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────── SUB COMPONENTS ────────────

function VerificationLabel({ status }: { status: string }) {
  const labels: Record<string, string> = {
    VERIFIED: 'Professionnel vérifié',
    PENDING: 'Vérification en cours',
    REJECTED: 'Profil refusé',
    SUSPENDED: 'Profil suspendu',
  };
  return <>{labels[status] || 'Profil à compléter'}</>;
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { color: string; label: string }> = {
    LOW: { color: colors.textTertiary, label: 'Basse' },
    NORMAL: { color: colors.info, label: 'Normale' },
    HIGH: { color: colors.warning, label: 'Haute' },
    URGENT: { color: colors.error, label: 'Urgent' },
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
    PENDING: { color: colors.textTertiary, label: 'En attente' },
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

// ──────────── STYLES ────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: { position: 'relative' },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  headerLeft: { flex: 1, gap: 1 },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  greeting: { letterSpacing: -0.3 },
  iconBtn: {
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
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: { fontSize: 9, fontWeight: '700' },

  // Status + location row
  statusLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusPillOnline: {
    backgroundColor: colors.successLight,
    borderColor: colors.success + '40',
  },
  statusPillOffline: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.borderLight,
  },
  statusPillText: { fontWeight: '600' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    justifyContent: 'flex-end',
  },

  // Banner
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  bannerStarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: { flex: 1, gap: spacing.xxs },
  bannerTitle: { fontWeight: '700' },
  bannerSubtitle: { lineHeight: 18 },

  // Stats row
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  statIconWrap: { position: 'relative' },
  statDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { letterSpacing: -0.3, textAlign: 'center', fontSize: 22, fontWeight: '700' },
  statSubLabel: { fontSize: 10, marginTop: -2 },

  // Sections
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { letterSpacing: -0.2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  seeAllText: { fontWeight: '600' },

  // Quick actions
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAction: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  quickActionLabel: { flex: 1 },

  // Request cards
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  requestIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestInfo: { flex: 1, gap: 3 },
  requestTitle: { fontWeight: '600' },
  requestMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  requestBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  voirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  voirBtnText: { fontWeight: '700', fontSize: 12 },
  urgencyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  requestSkeletons: { gap: spacing.sm },

  // Planning cards
  planningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.successLight,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  planningTime: { fontWeight: '600', fontSize: 12 },
  planningCheck: {},
  planningInfo: { flex: 1, gap: 2 },

  // Empty state
  emptyRequest: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },

  // Availability info
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

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
});
