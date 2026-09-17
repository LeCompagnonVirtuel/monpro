import { useCallback } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Skeleton } from '@/components/ui';
import { Text } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { HomeHeader } from '@/components/home/HomeHeader';
import { getErrorMessage } from '@/lib/api-errors';
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
import { messages } from '@/constants/messages';

function QuickActions() {
  const actions = [
    { icon: 'add-circle-outline', label: 'Publier', color: colors.primary, bg: colors.primaryLight + '20', route: '/(client)/create-request' },
    { icon: 'map-outline', label: 'Carte', color: colors.info, bg: colors.infoLight, route: '/(client)/(tabs)/map' },
    { icon: 'grid-outline', label: 'Services', color: colors.secondary, bg: colors.secondaryMuted, route: '/(client)/(tabs)/search' },
  ];

  return (
    <View style={styles.quickActionsRow}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          style={styles.quickActionBtn}
          onPress={() => router.push(action.route as any)}
          accessibilityLabel={action.label}
          accessibilityRole="button"
        >
          <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
            <Ionicons name={action.icon as any} size={24} color={action.color} />
          </View>
          <Text variant="caption" color={colors.text} style={styles.quickActionLabel}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function EmptyProCard() {
  return (
    <View style={styles.emptyProCard}>
      <Ionicons name="people-outline" size={32} color={colors.textTertiary} />
      <Text variant="bodySmall" color={colors.textTertiary} align="center">
        {messages.empty.noProfessionals}
      </Text>
      <Pressable
        style={styles.emptyProBtn}
        onPress={() => router.push('/(client)/(tabs)/search')}
      >
        <Text variant="caption" color={colors.primary}>Découvrir les services</Text>
      </Pressable>
    </View>
  );
}

function EmptyRequestCard() {
  return (
    <View style={styles.emptyRequestCard}>
      <Ionicons name="document-text-outline" size={32} color={colors.textTertiary} />
      <Text variant="bodySmall" color={colors.textTertiary} align="center">
        {messages.home.emptyRequests}
      </Text>
      <Pressable
        style={styles.emptyRequestBtn}
        onPress={() => router.push('/(client)/create-request')}
      >
        <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
        <Text variant="caption" color={colors.primary}>Publier ma première demande</Text>
      </Pressable>
    </View>
  );
}

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
        <ErrorState message={getErrorMessage(userError, messages.errors.loadProfile)} onRetry={() => refetchUser()} />
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

        {/* ── Quick Actions ── */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.quickActionsSection}>
          <QuickActions />
        </Animated.View>

        {/* ── Catégories ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.categoriesSection}>
          <SectionHeader
            title="Services"
            onSeeAll={() => router.push('/(client)/(tabs)/search')}
          />
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
            <ErrorState message={getErrorMessage(categories.error, messages.errors.generic)} onRetry={() => categories.refetch()} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {categories.data?.filter((c) => c.isActive).slice(0, 6).map((cat, idx) => (
                <CategoryCircle
                  key={cat.id}
                  name={cat.name}
                  isFirst={idx === 0}
                  onPress={() => router.push({ pathname: '/(client)/category', params: { id: cat.id, name: cat.name } })}
                />
              ))}
              <CategoryCircle
                key="see-more"
                name={messages.home.seeMore}
                icon="ellipsis-horizontal"
                onPress={() => router.push('/(client)/(tabs)/search')}
              />
            </ScrollView>
          )}
        </Animated.View>

        {/* ── Bandeau professionnels vérifiés ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <VerifiedBanner />
        </Animated.View>

        {/* ── Professionnels recommandés ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <SectionHeader
            title={messages.home.recommendedPros}
            onSeeAll={() => router.push('/(client)/(tabs)/search')}
          />
          {nearbyPros.isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} width={165} height={260} borderRadius={radius.xl} />
              ))}
            </ScrollView>
          ) : nearbyPros.error ? (
            <ErrorState message={getErrorMessage(nearbyPros.error, messages.errors.loadProfessionals)} onRetry={() => nearbyPros.refetch()} />
          ) : (nearbyPros.data?.professionals || []).length === 0 ? (
            <EmptyProCard />
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
        </Animated.View>

        {/* ── Vos demandes récentes ── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <SectionHeader
            title={messages.home.recentRequests}
            onSeeAll={() => router.push('/(client)/(tabs)/requests')}
          />
          {recentRequests.isLoading ? (
            <View style={styles.reqLoading}>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} width="100%" height={68} borderRadius={radius.lg} />
              ))}
            </View>
          ) : recentRequests.error ? (
            <ErrorState message={getErrorMessage(recentRequests.error, messages.errors.loadRequests)} onRetry={() => recentRequests.refetch()} />
          ) : (recentRequests.data?.requests || []).length === 0 ? (
            <EmptyRequestCard />
          ) : (
            <View style={styles.reqList}>
              {(recentRequests.data?.requests || []).map((req) => (
                <RecentRequestCard key={req.id} request={req} />
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── CTA Publier ── */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <PublishCTA />
        </Animated.View>

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
  quickActionsSection: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontWeight: '600',
  },
  categoriesSection: {
    marginTop: spacing.xl,
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
  emptyProCard: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyProBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryMuted,
  },
  emptyRequestCard: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryMuted,
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
