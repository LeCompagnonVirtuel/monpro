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

  const isProfileNotFound = profileError && (profileError as any)?.response?.status === 404;

  if (profileLoading && !isProfileNotFound) {
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
          <Skeleton width="100%" height={56} style={styles.skeletonCard} />
          <View style={styles.skeletonSection}>
            <Skeleton width="50%" height={22} />
            <Skeleton width="100%" height={80} style={styles.skeletonCard} />
            <Skeleton width="100%" height={80} style={styles.skeletonCard} />
          </View>
          <View style={styles.skeletonSection}>
            <Skeleton width="50%" height={22} />
            <Skeleton width="100%" height={56} style={styles.skeletonCard} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if ((profileError && !isProfileNotFound) || userError) {
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
            onPress={() => router.push('/(professional)/notifications')}
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
              onPress={() => router.push('/(professional)/onboarding')}
              accessibilityLabel="Créer mon profil professionnel"
              accessibilityRole="button"
            >
              <Text variant="button" color={colors.textInverse}>Créer mon profil</Text>
            </Pressable>
          </Card>
        )}

        {profile && (
          <>
            {/* Availability Status */}
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
                trackColor={{ false: colors.borderLight, true: colors.primary + '60' }}
                thumbColor={profile.isAvailable ? colors.primary : colors.textTertiary}
                disabled={updateProfile.isPending}
                accessibilityLabel={`Disponibilité : ${profile.isAvailable ? 'activée' : 'désactivée'}`}
                accessibilityRole="switch"
              />
            </View>

            {/* À faire maintenant */}
            {(requestsData?.total || 0) + unreadMessages > 0 && (
              <View style={styles.section}>
                <Text variant="h3">À faire maintenant</Text>
                <View style={styles.actionCards}>
                  {(requestsData?.total || 0) > 0 && (
                    <Pressable
                      style={styles.actionCard}
                      onPress={() => router.push('/(professional)/(tabs)/requests')}
                      accessibilityLabel={`${requestsData?.total} demandes en attente`}
                      accessibilityRole="button"
                    >
                      <View style={[styles.actionIcon, { backgroundColor: colors.warningLight }]}>
                        <Ionicons name="document-text-outline" size={20} color={colors.warning} />
                      </View>
                      <View style={styles.actionInfo}>
                        <Text variant="bodyMedium">Demandes en attente</Text>
                        <Text variant="caption" color={colors.textSecondary}>{requestsData?.total} demande{(requestsData?.total || 0) > 1 ? 's' : ''}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Pressable>
                  )}
                  {unreadMessages > 0 && (
                    <Pressable
                      style={styles.actionCard}
                      onPress={() => router.push('/(professional)/(tabs)/messages')}
                      accessibilityLabel={`${unreadMessages} conversations avec nouveaux messages`}
                      accessibilityRole="button"
                    >
                      <View style={[styles.actionIcon, { backgroundColor: colors.infoLight }]}>
                        <Ionicons name="chatbubble-outline" size={20} color={colors.info} />
                      </View>
                      <View style={styles.actionInfo}>
                        <Text variant="bodyMedium">Messages non lus</Text>
                        <Text variant="caption" color={colors.textSecondary}>{unreadMessages} conversation{unreadMessages > 1 ? 's' : ''}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* Recent Requests */}
            {requestsData && requestsData.requests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="h3">Opportunités récentes</Text>
                  <Pressable
                    onPress={() => router.push('/(professional)/(tabs)/requests')}
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
                    onPress={() => router.push({ pathname: '/(professional)/request-detail', params: { id: req.id } })}
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

            {/* Active Work */}
            {bookingsData && bookingsData.bookings.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="h3">Interventions actives</Text>
                  <Pressable
                    onPress={() => router.push('/(professional)/(tabs)/interventions')}
                    accessibilityLabel="Voir toutes les interventions"
                    accessibilityRole="button"
                  >
                    <Text variant="bodySmall" color={colors.primary}>Voir tout</Text>
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
                      <Text variant="body">{booking.quote?.totalAmount ? formatCurrency(booking.quote.totalAmount) : 'Intervention'}</Text>
                      <Text variant="caption" color={colors.textSecondary}>{booking.scheduledDate}</Text>
                    </View>
                    <BookingStatusBadge status={booking.status} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Business Snapshot */}
            <View style={styles.section}>
              <Text variant="h3">Activité</Text>
              <View style={styles.snapshotRow}>
                <Pressable
                  style={styles.snapshotCard}
                  onPress={() => router.push('/(professional)/reviews')}
                  accessibilityLabel={`Note moyenne : ${profile.averageRating ? profile.averageRating.toFixed(1) : 'aucune'}, ${profile.totalReviews} avis`}
                  accessibilityRole="button"
                >
                  <Ionicons name="star" size={18} color={colors.warning} />
                  <Text variant="h3">{profile.averageRating ? profile.averageRating.toFixed(1) : '-'}</Text>
                  <Text variant="caption" color={colors.textSecondary}>{profile.totalReviews || 0} avis</Text>
                </Pressable>
                {wallet && (
                  <Pressable
                    style={styles.snapshotCard}
                    onPress={() => router.push('/(professional)/revenue')}
                    accessibilityLabel={`Solde disponible : ${formatCurrency(wallet.balance)}`}
                    accessibilityRole="button"
                  >
                    <Ionicons name="wallet-outline" size={18} color={colors.primary} />
                    <Text variant="h3" color={colors.primary}>{formatCurrency(wallet.balance)}</Text>
                    <Text variant="caption" color={colors.textSecondary}>Solde</Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.snapshotCard}
                  onPress={() => router.push('/(professional)/services')}
                  accessibilityLabel={`${profile.services?.length || 0} services actifs`}
                  accessibilityRole="button"
                >
                  <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
                  <Text variant="h3">{profile.services?.length || 0}</Text>
                  <Text variant="caption" color={colors.textSecondary}>Services</Text>
                </Pressable>
              </View>
            </View>

            {/* Quick Navigation */}
            <View style={styles.section}>
              <View style={styles.navGrid}>
                <NavAction
                  icon="time-outline"
                  label="Disponibilités"
                  onPress={() => router.push('/(professional)/availability')}
                />
                <NavAction
                  icon="document-text-outline"
                  label="Devis"
                  onPress={() => router.push('/(professional)/(tabs)/requests')}
                />
                <NavAction
                  icon="star-outline"
                  label="Avis"
                  onPress={() => router.push('/(professional)/reviews')}
                />
                <NavAction
                  icon="settings-outline"
                  label="Paramètres"
                  onPress={() => router.push('/(professional)/settings')}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NavAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={styles.navAction}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={styles.navActionIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>{label}</Text>
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
  availabilityCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, ...shadows.sm },
  availabilityInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  availabilityDot: { width: 10, height: 10, borderRadius: 5 },
  availabilityText: { flex: 1, gap: 2 },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionCards: { gap: spacing.sm },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.md, ...shadows.sm },
  actionIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actionInfo: { flex: 1, gap: 2 },
  requestCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.md, ...shadows.sm },
  requestInfo: { flex: 1, gap: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  urgencyBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  snapshotRow: { flexDirection: 'row', gap: spacing.sm },
  snapshotCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: spacing.xs, ...shadows.sm },
  navGrid: { flexDirection: 'row', gap: spacing.md },
  navAction: { flex: 1, alignItems: 'center', gap: spacing.xs },
  navActionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  // Skeleton styles
  skeletonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  skeletonHeaderLeft: { flex: 1, gap: spacing.sm },
  skeletonNotif: { borderRadius: radius.md },
  skeletonCard: { borderRadius: radius.md },
  skeletonSection: { gap: spacing.md },
});
