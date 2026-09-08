import { useCallback } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Skeleton } from '@/components/ui';
import { Text } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeSearchBar } from '@/components/home/HomeSearchBar';
import { SectionHeader } from '@/components/home/SectionHeader';
import { CategoryCircle } from '@/components/home/CategoryCircle';
import { VerifiedBanner } from '@/components/home/VerifiedBanner';
import { ProfessionalHomeCard } from '@/components/home/ProfessionalHomeCard';
import { RecentRequestCard } from '@/components/home/RecentRequestCard';
import { PublishCTA } from '@/components/home/PublishCTA';
import { useMe } from '@/hooks/use-me';
import { useCategories } from '@/hooks/use-categories';
import { useProfessionals } from '@/hooks/use-professionals';
import { useLocation } from '@/hooks/use-location';
import { useServiceRequests } from '@/hooks/use-service-requests';

export default function HomeScreen() {
  const { data: user, isLoading: isLoadingUser, error: userError, refetch: refetchUser } = useMe();
  const { location } = useLocation();
  const categories = useCategories();
  const nearbyPros = useProfessionals(
    location
      ? { latitude: location.latitude, longitude: location.longitude, radiusKm: 25, limit: 10, verified: true }
      : { limit: 10, verified: true },
  );
  const recentRequests = useServiceRequests({ limit: 3 });

  const isRefreshing = categories.isRefetching || nearbyPros.isRefetching || recentRequests.isRefetching;

  const handleRefresh = useCallback(() => {
    categories.refetch();
    nearbyPros.refetch();
    recentRequests.refetch();
  }, [categories, nearbyPros, recentRequests]);

  const firstName = user?.fullName?.split(' ')[0] || '';

  if (isLoadingUser) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Skeleton width={120} height={32} />
          <Skeleton width={180} height={20} />
          <Skeleton width={140} height={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (userError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState message="Impossible de charger votre profil" onRetry={() => refetchUser()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            progressViewOffset={80}
          />
        }
      >
        <HomeHeader firstName={firstName} avatarUrl={user?.avatarUrl} />

        <HomeSearchBar />

        {/* ── Catégories ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Catégories"
            onSeeAll={() => router.push('/(client)/(tabs)/search')}
          />
          {categories.isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={styles.categorySkeleton}>
                  <Skeleton width={56} height={56} borderRadius={28} />
                  <Skeleton width={48} height={10} />
                </View>
              ))}
            </ScrollView>
          ) : categories.error ? (
            <ErrorState message="Erreur de chargement" onRetry={() => categories.refetch()} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.data?.filter((c) => c.isActive).slice(0, 6).map((cat, idx) => (
                <CategoryCircle
                  key={cat.id}
                  name={cat.name}
                  isFirst={idx === 0}
                  onPress={() => router.push({ pathname: '/(client)/category', params: { id: cat.id, name: cat.name } })}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Bandeau professionnels vérifiés ── */}
        <VerifiedBanner />

        {/* ── Professionnels recommandés ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Professionnels recommandés"
            onSeeAll={() => router.push('/(client)/(tabs)/search')}
          />
          {nearbyPros.isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.proScroll}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} width={160} height={200} borderRadius={radius.lg} />
              ))}
            </ScrollView>
          ) : nearbyPros.error ? (
            <ErrorState message="Impossible de charger les professionnels" onRetry={() => nearbyPros.refetch()} />
          ) : (nearbyPros.data?.professionals || []).length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text variant="bodySmall" color={colors.textTertiary} align="center">
                Aucun professionnel recommandé pour le moment.
              </Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={nearbyPros.data?.professionals || []}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.proScroll}
              renderItem={({ item }) => <ProfessionalHomeCard professional={item} />}
            />
          )}
        </View>

        {/* ── Vos demandes récentes ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Vos demandes récentes"
            onSeeAll={() => router.push('/(client)/(tabs)/requests')}
          />
          {recentRequests.isLoading ? (
            <View style={styles.requestsLoading}>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} width="100%" height={64} borderRadius={radius.md} />
              ))}
            </View>
          ) : recentRequests.error ? (
            <ErrorState message="Impossible de charger vos demandes" onRetry={() => recentRequests.refetch()} />
          ) : (recentRequests.data?.requests || []).length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text variant="bodySmall" color={colors.textTertiary} align="center">
                Aucune demande pour le moment. Publiez votre première demande !
              </Text>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {(recentRequests.data?.requests || []).map((req) => (
                <RecentRequestCard key={req.id} request={req} />
              ))}
            </View>
          )}
        </View>

        {/* ── CTA Publier ── */}
        <PublishCTA />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  section: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  categoryScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  categorySkeleton: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 68,
  },
  proScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  requestsLoading: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  requestsList: {
    gap: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
