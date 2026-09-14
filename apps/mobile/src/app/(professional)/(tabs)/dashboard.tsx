import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
import { formatCurrency, formatRelativeDate } from '@/lib/format';

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

function compactCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (amount >= 10_000) return `${Math.round(amount / 1000)}k`;
  return formatCurrency(amount);
}

export default function DashboardScreen() {
  const { data: user, isError: userError, refetch: refetchUser } = useMe();
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useMyProfessionalProfile();
  const updateProfile = useUpdateProfessionalProfile();
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useProfessionalRequests({ limit: 5 });
  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useProfessionalBookings(profile?.id);
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useProfessionalWallet();
  const { data: unreadCount, refetch: refetchNotifications } = useUnreadNotificationCount();
  const { data: availability } = useProfessionalAvailability(profile?.id);
  const [refreshing, setRefreshing] = useState(false);

  const primaryService = useMemo(() => {
    return profile?.services?.[0]?.service?.name || null;
  }, [profile?.services]);

  const todayBookings = useMemo(() => {
    if (!bookingsData?.bookings) return [];
    const today = getTodayString();
    return bookingsData.bookings.filter((b) => b.scheduledDate?.startsWith(today));
  }, [bookingsData?.bookings]);

  const locationText = useMemo(() => {
    if (!profile?.zones?.length) return null;
    const zone = profile.zones[0];
    return { name: zone.name || null, radiusKm: zone.radiusKm || null };
  }, [profile?.zones]);

  const todayDayOfWeek = new Date().getDay();
  const todayAvailability = useMemo(() => {
    if (!availability) return null;
    return availability.find((s) => s.dayOfWeek === todayDayOfWeek && s.isActive) || null;
  }, [availability, todayDayOfWeek]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      refetchUser(), refetchProfile(), refetchRequests(),
      refetchBookings(), refetchWallet(), refetchNotifications(),
    ]);
    setRefreshing(false);
  }, [refetchUser, refetchProfile, refetchRequests, refetchBookings, refetchWallet, refetchNotifications]);

  const handleToggleAvailability = useCallback(() => {
    if (!profile) return;
    updateProfile.mutate({ id: profile.id, isAvailable: !profile.isAvailable });
  }, [profile, updateProfile]);

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Skeleton width={56} height={56} borderRadius={28} />
            <View style={styles.headerLeft}>
              <Skeleton width={80} height={12} />
              <Skeleton width={160} height={22} />
              <Skeleton width={140} height={12} />
            </View>
            <Skeleton width={42} height={42} borderRadius={21} />
          </View>
          <View style={styles.statusLocationRow}>
            <Skeleton width={110} height={36} borderRadius={radius.full} />
            <Skeleton width={160} height={16} />
          </View>
          <Skeleton width="100%" height={72} borderRadius={radius.xl} />
          <View style={styles.statsRow}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} width="23%" height={110} borderRadius={radius.lg} />
            ))}
          </View>
          <View style={styles.quickGrid}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} width="48%" height={52} borderRadius={radius.lg} />
            ))}
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
          onRetry={() => { refetchProfile(); refetchUser(); }}
        />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <View style={[styles.header, { justifyContent: 'flex-start' }]}>
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

  const isVerified = profile.verificationStatus === 'VERIFIED';
  const newRequestCount = requestsData?.total ?? 0;

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
            <Text variant="h2" style={styles.greeting} numberOfLines={1}>{user?.fullName || ''}</Text>
            <View style={styles.verifiedRow}>
              <Text variant="bodySmall" color={colors.textSecondary} numberOfLines={1}>
                {primaryService ? `${primaryService} • ` : ''}
                <VerificationLabel status={profile.verificationStatus} />
              </Text>
              {isVerified && <Ionicons name="checkmark-circle" size={14} color={colors.info} />}
            </View>
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

        {/* ──────────── STATUS + LOCATION ──────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statusLocationRow}>
          <Pressable
            style={[styles.statusPill, profile.isAvailable ? styles.statusPillOn : styles.statusPillOff]}
            onPress={handleToggleAvailability}
            disabled={updateProfile.isPending}
            accessibilityLabel={`Disponibilité : ${profile.isAvailable ? 'activée' : 'désactivée'}`}
            accessibilityRole="switch"
          >
            <View style={[styles.statusDot, { backgroundColor: profile.isAvailable ? colors.success : colors.textTertiary }]} />
            <Text variant="bodySmall" color={profile.isAvailable ? colors.success : colors.textTertiary} style={styles.statusPillLabel}>
              {profile.isAvailable ? 'En ligne' : 'Hors ligne'}
            </Text>
            <Ionicons name={profile.isAvailable ? 'radio-button-on' : 'radio-button-off'} size={14} color={profile.isAvailable ? colors.success : colors.textTertiary} />
          </Pressable>

          {locationText?.name && (
            <Pressable
              style={styles.locationChip}
              onPress={() => router.push('/(professional)/onboarding')}
              accessibilityLabel="Modifier ma zone"
              accessibilityRole="button"
            >
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {locationText.name}
              </Text>
              {locationText.radiusKm && (
                <Text variant="caption" color={colors.textTertiary}>
                  Rayon : {locationText.radiusKm} km
                </Text>
              )}
              <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />
            </Pressable>
          )}
        </Animated.View>

        {/* ──────────── BANNER ──────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Pressable
          style={styles.banner}
          onPress={() => router.push('/(professional)/(tabs)/requests')}
          accessibilityLabel="Voir les nouvelles demandes"
          accessibilityRole="button"
        >
          <View style={styles.bannerStar}>
            <Ionicons name="star" size={22} color="#fff" />
          </View>
          <View style={styles.bannerContent}>
            <Text variant="bodyMedium" color={colors.textInverse} style={styles.bannerTitle}>
              Continuez sur cette lancée !
            </Text>
            <Text variant="caption" color={colors.textInverseMuted}>
              {requestsLoading
                ? 'Chargement...'
                : newRequestCount > 0
                  ? `Vous avez ${newRequestCount} nouvelle${newRequestCount > 1 ? 's' : ''} demande${newRequestCount > 1 ? 's' : ''} aujourd'hui.`
                  : 'Aucune nouvelle demande pour le moment.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
        </Pressable>
        </Animated.View>

        {/* ──────────── STATS ──────────── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statsRow}>
          <StatCard
            icon="document-text-outline"
            iconBg={colors.infoLight}
            iconColor={colors.info}
            value={requestsLoading ? null : String(newRequestCount)}
            label={'Nouvelles\ndemandes'}
            showDot={newRequestCount > 0}
            onPress={() => router.push('/(professional)/(tabs)/requests')}
          />
          <StatCard
            icon="calendar-outline"
            iconBg={colors.successLight}
            iconColor={colors.success}
            value={bookingsLoading ? null : String(todayBookings.length)}
            label={'Interventions\naujourd\'hui'}
            onPress={() => router.push('/(professional)/(tabs)/interventions')}
          />
          <StatCard
            icon="star"
            iconBg={colors.warningLight}
            iconColor={colors.warning}
            value={profile.averageRating ? profile.averageRating.toFixed(1) : '-'}
            label="Note moyenne"
            subLabel={`(${profile.totalReviews || 0} avis)`}
            onPress={() => router.push('/(professional)/reviews')}
          />
          <StatCard
            icon="wallet-outline"
            iconBg={colors.secondaryMuted}
            iconColor={colors.secondary}
            value={walletLoading ? null : compactCurrency(wallet?.totalPaidOut ?? 0)}
            valueColor={colors.primary}
            label="Total ce mois"
            onPress={() => router.push('/(professional)/revenue')}
          />
        </Animated.View>

        {/* ──────────── QUICK ACTIONS ──────────── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.quickGrid}>
          <QuickAction icon="document-text-outline" label="Gérer mes services" onPress={() => router.push('/(professional)/services')} />
          <QuickAction icon="calendar-outline" label="Mes disponibilités" onPress={() => router.push('/(professional)/availability')} />
          <QuickAction icon="location-outline" label="Ma zone d'intervention" onPress={() => router.push('/(professional)/onboarding')} />
          <QuickAction icon="bar-chart-outline" label="Mes revenus" onPress={() => router.push('/(professional)/revenue')} />
        </Animated.View>

        {/* ──────────── NOUVELLES DEMANDES ──────────── */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <SectionHead title="Nouvelles demandes" actionLabel="Voir toutes" onAction={() => router.push('/(professional)/(tabs)/requests')} />
          {requestsLoading ? (
            <View style={styles.skeletonCol}>
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
                <View style={styles.requestIconWrap}>
                  <Ionicons name="construct-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.requestInfo}>
                  <Text variant="bodyMedium" numberOfLines={1} style={styles.bold}>{req.title}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="location" size={11} color={colors.success} />
                    <Text variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.metaFlex}>
                      {req.address?.fullAddress || req.service?.name || 'Service'}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
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
            <EmptyBlock icon="file-tray-outline" text="Aucune nouvelle demande" />
          )}
        </Animated.View>

        {/* ──────────── PLANNING ──────────── */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.section}>
          <SectionHead title="Mon planning aujourd'hui" actionLabel="Voir tout" onAction={() => router.push('/(professional)/(tabs)/interventions')} />
          {bookingsLoading ? (
            <Skeleton width="100%" height={68} borderRadius={radius.lg} />
          ) : todayBookings.length > 0 ? (
            todayBookings.slice(0, 3).map((booking) => (
              <Pressable
                key={booking.id}
                style={styles.planningCard}
                onPress={() => router.push({ pathname: '/(professional)/booking-detail', params: { bookingId: booking.id } })}
                accessibilityLabel={`Intervention : ${booking.serviceRequest?.title || ''}`}
                accessibilityRole="button"
              >
                <Text variant="caption" color={colors.textSecondary} style={styles.planningTime}>
                  {booking.scheduledTime || '—'}
                </Text>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <View style={styles.planningInfo}>
                  <Text variant="bodyMedium" numberOfLines={1} style={styles.bold}>
                    {booking.serviceRequest?.title || booking.serviceRequest?.service?.name || 'Intervention'}
                  </Text>
                  {booking.address?.fullAddress ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="location" size={11} color={colors.primary} />
                      <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>{booking.address.fullAddress}</Text>
                    </View>
                  ) : null}
                </View>
                <BookingStatusBadge status={booking.status} />
              </Pressable>
            ))
          ) : (
            <EmptyBlock icon="calendar-outline" text="Aucune intervention prévue aujourd'hui" />
          )}
        </Animated.View>

        {/* ──────────── DISPONIBILITÉS ──────────── */}
        {todayAvailability && (
          <View style={styles.availRow}>
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

// ──────────── EXTRACTED COMPONENTS ────────────

function StatCard({ icon, iconBg, iconColor, value, valueColor, label, subLabel, showDot, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  value: string | null;
  valueColor?: string;
  label: string;
  subLabel?: string;
  showDot?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.statCard} onPress={onPress} accessibilityRole="button">
      <View style={styles.statIconWrap}>
        <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        {showDot && <View style={styles.statDot} />}
      </View>
      {value === null ? (
        <Skeleton width={28} height={22} />
      ) : (
        <Text style={[styles.statValue, valueColor ? { color: valueColor } : undefined]} numberOfLines={1}>{value}</Text>
      )}
      <Text variant="caption" color={colors.textSecondary} align="center">{label}</Text>
      {subLabel && <Text variant="caption" color={colors.textTertiary} style={styles.statSub}>{subLabel}</Text>}
    </Pressable>
  );
}

function QuickAction({ icon, label, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress} accessibilityLabel={label} accessibilityRole="button">
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text variant="bodySmall" style={styles.quickLabel} numberOfLines={1}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

function SectionHead({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <Text variant="h3" style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onAction} style={styles.seeAllBtn} accessibilityRole="button">
        <Text variant="bodySmall" color={colors.primary} style={styles.seeAllText}>{actionLabel}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function EmptyBlock({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.emptyBlock}>
      <Ionicons name={icon} size={32} color={colors.textTertiary} />
      <Text variant="bodySmall" color={colors.textTertiary}>{text}</Text>
    </View>
  );
}

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
  const cfg: Record<string, { color: string; label: string }> = {
    LOW: { color: colors.textTertiary, label: 'Basse' },
    NORMAL: { color: colors.info, label: 'Normale' },
    HIGH: { color: colors.warning, label: 'Haute' },
    URGENT: { color: colors.error, label: 'Urgent' },
  };
  const c = cfg[urgency] || cfg.NORMAL;
  return (
    <View style={[styles.urgencyBadge, { backgroundColor: c.color + '14' }]}>
      <Text variant="caption" color={c.color} style={styles.urgencyLabel}>{c.label}</Text>
    </View>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; label: string }> = {
    PENDING: { color: colors.textTertiary, bg: colors.surfaceSecondary, label: 'En attente' },
    CONFIRMED: { color: colors.info, bg: colors.infoLight, label: 'Confirmée' },
    ARRIVING: { color: colors.warning, bg: colors.warningLight, label: 'En route' },
    IN_PROGRESS: { color: colors.primary, bg: colors.primaryLight, label: 'En cours' },
    COMPLETED: { color: colors.success, bg: colors.successLight, label: 'Terminée' },
    CANCELLED: { color: colors.error, bg: colors.errorLight, label: 'Annulée' },
  };
  const c = cfg[status] || cfg.CONFIRMED;
  return (
    <View style={[styles.bookingBadge, { backgroundColor: c.bg }]}>
      <Text variant="caption" color={c.color} style={styles.bookingBadgeText}>{c.label}</Text>
      <Ionicons name="chevron-forward" size={10} color={c.color} />
    </View>
  );
}

// ──────────── STYLES ────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: { position: 'relative' },
  onlineDot: {
    position: 'absolute', bottom: 2, left: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2.5, borderColor: colors.background,
  },
  headerLeft: { flex: 1, gap: 1 },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  greeting: { letterSpacing: -0.3 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  notifBadge: {
    position: 'absolute', top: -1, right: -1,
    backgroundColor: colors.error, borderRadius: radius.full,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: colors.surface,
  },
  notifBadgeText: { fontSize: 9, fontWeight: '700' },

  // Status + location
  statusLocationRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: spacing.md,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1,
  },
  statusPillOn: { backgroundColor: colors.successLight, borderColor: colors.success + '40' },
  statusPillOff: { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight },
  statusPillLabel: { fontWeight: '600' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  locationChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    flex: 1, justifyContent: 'flex-end',
  },

  // Banner
  banner: {
    backgroundColor: colors.primary, borderRadius: radius.xl,
    padding: spacing.lg, flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, ...shadows.md,
  },
  bannerStar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerContent: { flex: 1, gap: 2 },
  bannerTitle: { fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xs,
    alignItems: 'center', gap: spacing.xs, ...shadows.sm,
  },
  statIconWrap: { position: 'relative' },
  statDot: {
    position: 'absolute', top: -2, right: -2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: {
    fontSize: 22, fontWeight: '700', letterSpacing: -0.5,
    textAlign: 'center', color: colors.text,
  },
  statSub: { fontSize: 10, marginTop: -4 },

  // Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickAction: {
    width: '48%', flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md, ...shadows.sm,
  },
  quickLabel: { flex: 1 },

  // Sections
  section: { gap: spacing.sm },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { letterSpacing: -0.2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontWeight: '600' },
  skeletonCol: { gap: spacing.sm },

  // Request cards
  requestCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    gap: spacing.md, ...shadows.sm,
  },
  requestIconWrap: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  requestInfo: { flex: 1, gap: 3 },
  bold: { fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  metaFlex: { flex: 1 },
  voirBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  voirBtnText: { fontWeight: '700', fontSize: 12 },
  urgencyBadge: { paddingHorizontal: spacing.sm, paddingVertical: 1, borderRadius: radius.sm, marginLeft: spacing.xs },
  urgencyLabel: { fontSize: 10, fontWeight: '600' },

  // Planning
  planningCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.successLight, borderRadius: radius.lg, gap: spacing.sm,
  },
  planningTime: { fontWeight: '700', fontSize: 11, minWidth: 50, textAlign: 'center' },
  planningInfo: { flex: 1, gap: 2 },
  bookingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  bookingBadgeText: { fontSize: 10, fontWeight: '600' },

  // Empty
  emptyBlock: {
    alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl,
    backgroundColor: colors.surface, borderRadius: radius.lg,
  },

  // Availability
  availRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  // Onboarding
  onboardingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  onboardingIcon: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  onboardingText: { flex: 1, gap: spacing.xxs },
  ctaBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
});
