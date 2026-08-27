import { StyleSheet, View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Card, Skeleton } from '@/components/ui';
import { useMe } from '@/hooks/use-me';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useProfessionalRequests } from '@/hooks/use-professional-requests';
import { useProfessionalBookings } from '@/hooks/use-professional-bookings';
import { useProfessionalWallet } from '@/hooks/use-professional-revenue';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';
import { formatCurrency } from '@/lib/format';
import { useState } from 'react';

export default function DashboardScreen() {
  const { data: user } = useMe();
  const { data: profile, isLoading: profileLoading } = useMyProfessionalProfile();
  const { data: requestsData } = useProfessionalRequests({ limit: 5 });
  const { data: bookingsData } = useProfessionalBookings(profile?.id, { status: 'CONFIRMED' });
  const { data: wallet } = useProfessionalWallet();
  const { data: unreadCount } = useUnreadNotificationCount();
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.fullName?.split(' ')[0] || '';

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <Skeleton width="60%" height={28} />
          <Skeleton width="100%" height={100} />
          <Skeleton width="100%" height={80} />
        </View>
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
          <Pressable onPress={() => router.push('/(professional)/notifications' as never)} accessibilityLabel="Notifications" style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount ? (
              <View style={styles.notifBadge}>
                <Text variant="bodySmall" color={colors.textInverse} style={{ fontSize: 9 }}>
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
            <Pressable style={styles.ctaBtn} onPress={() => router.push('/(professional)/onboarding' as never)}>
              <Text variant="button" color={colors.textInverse}>Créer mon profil</Text>
            </Pressable>
          </Card>
        )}

        {profile && (
          <>
            <View style={styles.statsRow}>
              <StatCard label="Demandes" value={String(requestsData?.total || 0)} icon="document-text-outline" />
              <StatCard label="Aujourd'hui" value={String(bookingsData?.total || 0)} icon="calendar-outline" />
              <StatCard label="Note" value={profile.rating ? profile.rating.toFixed(1) : '-'} icon="star-outline" />
            </View>

            {wallet && (
              <Card style={styles.revenueCard}>
                <View style={styles.revenueHeader}>
                  <Text variant="bodySmall" color={colors.textSecondary}>Revenus disponibles</Text>
                  <Pressable onPress={() => router.push('/(professional)/revenue' as never)}>
                    <Text variant="bodySmall" color={colors.primary}>Voir tout</Text>
                  </Pressable>
                </View>
                <Text variant="h2" color={colors.primary}>{formatCurrency(wallet.balance)}</Text>
              </Card>
            )}

            {requestsData && requestsData.requests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="h3">Demandes à traiter</Text>
                  <Pressable onPress={() => router.push('/(professional)/(tabs)/requests' as never)}>
                    <Text variant="bodySmall" color={colors.primary}>Voir tout</Text>
                  </Pressable>
                </View>
                {requestsData.requests.slice(0, 3).map((req) => (
                  <Pressable
                    key={req.id}
                    style={styles.requestCard}
                    onPress={() => router.push({ pathname: '/(professional)/request-detail', params: { id: req.id } } as never)}
                  >
                    <View style={styles.requestInfo}>
                      <Text variant="body" numberOfLines={1}>{req.title}</Text>
                      <Text variant="bodySmall" color={colors.textSecondary}>{req.service?.name}</Text>
                    </View>
                    <UrgencyBadge urgency={req.urgency} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text variant="h3">{value}</Text>
      <Text variant="bodySmall" color={colors.textSecondary}>{label}</Text>
    </View>
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
    <View style={[styles.badge, { backgroundColor: c.color + '20' }]}>
      {status === 'VERIFIED' && <Ionicons name="checkmark-circle" size={12} color={c.color} />}
      <Text variant="bodySmall" color={c.color}>{c.label}</Text>
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
      <Text variant="bodySmall" color={c.color}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, gap: spacing.xs },
  notifBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: colors.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  onboardingCard: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  ctaBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: spacing.xs },
  revenueCard: { padding: spacing.lg, gap: spacing.sm },
  revenueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.md },
  requestInfo: { flex: 1, gap: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  urgencyBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
});
