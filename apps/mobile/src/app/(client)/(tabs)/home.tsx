import { useCallback } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeSearchBar } from '@/components/home/HomeSearchBar';
import { SectionHeader } from '@/components/home/SectionHeader';
import { CategoryCircle } from '@/components/home/CategoryCircle';
import { HeroCard } from '@/components/home/HeroCard';
import { ProfessionalHomeCard } from '@/components/home/ProfessionalHomeCard';
import { TrendingServiceCard } from '@/components/home/TrendingServiceCard';
import { useMe } from '@/hooks/use-me';
import { useCategories } from '@/hooks/use-categories';
import { useProfessionals } from '@/hooks/use-professionals';
import { useLocation } from '@/hooks/use-location';
import { useServices } from '@/hooks/use-services';

export default function HomeScreen() {
  const { data: user } = useMe();
  const { location } = useLocation();
  const categories = useCategories();
  const nearbyPros = useProfessionals(
    location
      ? { latitude: location.latitude, longitude: location.longitude, radiusKm: 10, limit: 10 }
      : { limit: 10 },
  );
  const services = useServices();

  const isRefreshing = categories.isRefetching || nearbyPros.isRefetching;

  const handleRefresh = useCallback(() => {
    categories.refetch();
    nearbyPros.refetch();
    services.refetch();
  }, [categories, nearbyPros, services]);

  const firstName = user?.fullName?.split(' ')[0] || '';
  const locationLabel = location ? 'Abidjan, Cocody' : undefined;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.secondary}
            progressViewOffset={80}
          />
        }
      >
        {/* Header with skyline background */}
        <HomeHeader firstName={firstName} locationLabel={locationLabel} />

        {/* Search bar overlapping header */}
        <HomeSearchBar />

        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader
            title="Catégories populaires"
            onSeeAll={() => router.push('/(client)/(tabs)/search')}
          />
          {categories.isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View key={i} style={styles.categorySkeleton}>
                  <Skeleton width={60} height={60} borderRadius={30} />
                  <Skeleton width={50} height={12} />
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

        {/* Hero */}
        <HeroCard />

        {/* Nearby professionals */}
        <View style={styles.section}>
          <SectionHeader
            title="Professionnels à proximité"
            onSeeAll={() => router.push('/(client)/(tabs)/search')}
          />
          {nearbyPros.isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.proScroll}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} width={160} height={200} borderRadius={16} />
              ))}
            </ScrollView>
          ) : nearbyPros.error ? (
            <ErrorState message="Erreur de chargement" onRetry={() => nearbyPros.refetch()} />
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

        {/* Trending services */}
        <View style={styles.section}>
          <SectionHeader
            title="Services tendance"
            onSeeAll={() => router.push('/(client)/(tabs)/search')}
          />
          {services.isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceScroll}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} width={140} height={140} borderRadius={16} />
              ))}
            </ScrollView>
          ) : services.error ? (
            <ErrorState message="Erreur de chargement" onRetry={() => services.refetch()} />
          ) : (
            <FlatList
              horizontal
              data={(services.data || []).slice(0, 8)}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.serviceScroll}
              renderItem={({ item }) => <TrendingServiceCard service={item} />}
            />
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  categoryScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  categorySkeleton: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 72,
  },
  proScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  serviceScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
