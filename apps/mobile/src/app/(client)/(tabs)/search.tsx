import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Skeleton, Text } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SearchHeader } from '@/components/search/SearchHeader';
import { SearchPageBar } from '@/components/search/SearchPageBar';
import { SearchCategoryChip } from '@/components/search/SearchCategoryChip';
import { ProfessionalSearchCard } from '@/components/search/ProfessionalSearchCard';
import { SearchRequestBanner } from '@/components/search/SearchRequestBanner';
import { SectionHeader } from '@/components/home/SectionHeader';
import { useCategories } from '@/hooks/use-categories';
import { useProfessionals } from '@/hooks/use-professionals';
import { useDebounce } from '@/hooks/use-debounce';
import { Professional } from '@/api/professionals';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 400);

  const categories = useCategories();
  const selectedCategory = categories.data?.find((c) => c.id === selectedCategoryId);

  const hasSearchCriteria = debouncedQuery.length >= 2 || !!selectedCategoryId;

  const professionals = useProfessionals(
    hasSearchCriteria
      ? {
          ...(debouncedQuery.length >= 2 ? { search: debouncedQuery } : {}),
          ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
          limit: 20,
        }
      : { limit: 20 },
  );

  const proList = professionals.data?.professionals || [];
  const totalCount = professionals.data?.total || 0;

  const handleCategoryPress = useCallback((categoryId: string) => {
    setSelectedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  const handleRefresh = useCallback(() => {
    categories.refetch();
    professionals.refetch();
  }, [categories, professionals]);

  const resultsLabel = selectedCategory?.name
    || (debouncedQuery.length >= 2 ? debouncedQuery : null);

  const renderProfessional = useCallback(({ item }: { item: Professional }) => (
    <View style={styles.cardWrapper}>
      <ProfessionalSearchCard professional={item} />
    </View>
  ), []);

  const renderHeader = () => (
    <>
      <SearchHeader />

      <SearchPageBar
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
        onFilterPress={() => {}}
      />

      <View style={styles.categoriesSection}>
        <SectionHeader title="Catégories populaires" onSeeAll={() => {}} />
        {categories.isLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.categorySkeleton}>
                <Skeleton width={64} height={64} borderRadius={32} />
                <Skeleton width={50} height={12} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.data?.filter((c) => c.isActive).slice(0, 6).map((cat) => (
              <SearchCategoryChip
                key={cat.id}
                name={cat.name}
                isActive={selectedCategoryId === cat.id}
                onPress={() => handleCategoryPress(cat.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {hasSearchCriteria && !professionals.isLoading && (
        <View style={styles.resultsBar}>
          <Text variant="body" style={styles.resultsTitle} numberOfLines={1}>
            {'Résultats pour '}
            <Text variant="body" color={colors.primary} style={styles.resultsHighlight}>
              {`"${resultsLabel}"`}
            </Text>
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            {`${totalCount} résultat${totalCount !== 1 ? 's' : ''}`}
          </Text>
        </View>
      )}
    </>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <SearchRequestBanner categoryName={selectedCategory?.name} />
      <View style={styles.bottomSpacer} />
    </View>
  );

  if (professionals.isLoading && hasSearchCriteria) {
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderHeader()}
          <View style={styles.loadingList}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={180} borderRadius={16} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (hasSearchCriteria && proList.length === 0 && !professionals.isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderHeader()}
          <View style={styles.emptyContainer}>
            <EmptyState
              title="Aucun professionnel trouvé"
              description={`Aucun résultat${resultsLabel ? ` pour "${resultsLabel}"` : ''}. Essayez une autre recherche ou catégorie.`}
            />
          </View>
          <SearchRequestBanner categoryName={selectedCategory?.name} />
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={proList}
        keyExtractor={(item) => item.id}
        renderItem={renderProfessional}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={professionals.isRefetching || categories.isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.secondary}
          />
        }
        ItemSeparatorComponent={CardSeparator}
      />
    </View>
  );
}

function CardSeparator() {
  return <View style={styles.cardSeparator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  categoriesSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  categoryScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  categorySkeleton: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 76,
  },
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  resultsTitle: {
    fontWeight: '600',
    flex: 1,
  },
  resultsHighlight: {
    fontWeight: '700',
  },
  loadingList: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  emptyContainer: {
    paddingVertical: spacing.xxxl,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  cardWrapper: {
    paddingHorizontal: spacing.xl,
  },
  cardSeparator: {
    height: spacing.md,
  },
  footer: {
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
