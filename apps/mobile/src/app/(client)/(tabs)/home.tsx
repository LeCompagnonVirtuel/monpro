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
import { HomeHeader } from '@/components/home/HomeHeader';
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
        <View style={styles.loadingWrap}>
          <Skeleton width={140} height={28} borderRadius={radius.md} />
          <Skeleton width={200} height={18} borderRadius={radius.sm} />
          <Skeleton width={160} height={14} borderRadius={radius.sm} />
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
            progressViewOffset={100}
          />
        }
      >
        <HomeHeader firstName={firstName} avatarUrl={user?.avatarUrl} />

        {/* ── Catégories ── */}
        <View style={styles.categoriesSection}>
          {categories.isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={styles.skelCat}>
                  <Skeleton width={58} height={58} borderRadius={29} />
                  <Skeleton width={48} height={10} borderRadius={5} />
                </View>
              ))}
            </ScrollView>
          ) : categories.error ? (
            <ErrorState message="Erreur de chargement" onRetry={() => categories.refetch()} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {categories.data?.filter((c) => c.isActive).slice(0, 5).map((cat, idx) => (
                <CategoryCircle
                  key={cat.id}
                  name={cat.name}
                  isFirst={idx === 0}
                  onPress={() => router.push({ pathname: '/(client)/category', params: { id: cat.id, name: cat.name } })}
                />
              ))}
              <CategoryCircle
                key="see-more"
                name="Voir plus"
                icon="ellipsis-horizontal"
                onPress={() => router.push('/(client)/(tabs)/search')}
              />
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} width={165} height={260} borderRadius={radius.xl} />
              ))}
            </ScrollView>
          ) : nearbyPros.error ? (
            <ErrorState message="Impossible de charger les professionnels" onRetry={() => nearbyPros.refetch()} />
          ) : (nearbyPros.data?.professionals || []).length === 0 ? (
            <View style={styles.emptyPad}>
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
              contentContainerStyle={styles.hScroll}
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
            <View style={styles.reqLoading}>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} width="100%" height={68} borderRadius={radius.lg} />
              ))}
            </View>
          ) : recentRequests.error ? (
            <ErrorState message="Impossible de charger vos demandes" onRetry={() => recentRequests.refetch()} />
          ) : (recentRequests.data?.requests || []).length === 0 ? (
            <View style={styles.emptyPad}>
              <Text variant="bodySmall" color={colors.textTertiary} align="center">
                Aucune demande pour le moment.{'\n'}Publiez votre première demande !
              </Text>
            </View>
          ) : (
            <View style={styles.reqList}>
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
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  categoriesSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  section: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  hScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  skelCat: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 70,
  },
  emptyPad: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  reqLoading: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  reqList: {
    gap: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
