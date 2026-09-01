import { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
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

type SortOption = 'rating' | 'reviews' | undefined;

interface Filters {
  verified: boolean;
  available: boolean;
  sortBy: SortOption;
}

const DEFAULT_FILTERS: Filters = { verified: false, available: false, sortBy: undefined };

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterVisible, setFilterVisible] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  const activeFilterCount = (filters.verified ? 1 : 0) + (filters.available ? 1 : 0) + (filters.sortBy ? 1 : 0);

  const categories = useCategories();
  const selectedCategory = categories.data?.find((c) => c.id === selectedCategoryId);

  const hasSearchCriteria = debouncedQuery.length >= 2 || !!selectedCategoryId || filters.verified || filters.available || !!filters.sortBy;

  const professionals = useProfessionals({
    ...(debouncedQuery.length >= 2 ? { search: debouncedQuery } : {}),
    ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
    ...(filters.verified ? { verified: true } : {}),
    ...(filters.available ? { available: true } : {}),
    ...(filters.sortBy ? { sortBy: filters.sortBy } : {}),
    limit: 20,
  });

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
        onFilterPress={() => {
          setPendingFilters(filters);
          setFilterVisible(true);
        }}
      />

      <View style={styles.categoriesSection}>
        <SectionHeader
          title="Catégories populaires"
          onSeeAll={showAllCategories ? undefined : () => setShowAllCategories(true)}
        />
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
            {(showAllCategories
              ? categories.data?.filter((c) => c.isActive)
              : categories.data?.filter((c) => c.isActive).slice(0, 6)
            )?.map((cat) => (
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

  const handleApplyFilters = useCallback(() => {
    setFilters(pendingFilters);
    setFilterVisible(false);
  }, [pendingFilters]);

  const handleResetFilters = useCallback(() => {
    setPendingFilters(DEFAULT_FILTERS);
  }, []);

  const renderContent = () => {
    if (professionals.isLoading && hasSearchCriteria) {
      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderHeader()}
          <View style={styles.loadingList}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={180} borderRadius={16} />
            ))}
          </View>
        </ScrollView>
      );
    }

    if (hasSearchCriteria && proList.length === 0 && !professionals.isLoading) {
      return (
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
      );
    }

    return (
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
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}

      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text variant="h3">Filtres</Text>
              <Pressable
                onPress={() => setFilterVisible(false)}
                accessibilityLabel="Fermer les filtres"
                accessibilityRole="button"
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterInfo}>
                <Text variant="body">Professionnels vérifiés</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  Afficher uniquement les profils certifiés
                </Text>
              </View>
              <Switch
                value={pendingFilters.verified}
                onValueChange={(v) => setPendingFilters((p) => ({ ...p, verified: v }))}
                trackColor={{ false: colors.borderLight, true: colors.primary + '60' }}
                thumbColor={pendingFilters.verified ? colors.primary : colors.textTertiary}
                accessibilityLabel="Filtrer par profils vérifiés"
              />
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterInfo}>
                <Text variant="body">Disponibles maintenant</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  Afficher uniquement les professionnels disponibles
                </Text>
              </View>
              <Switch
                value={pendingFilters.available}
                onValueChange={(v) => setPendingFilters((p) => ({ ...p, available: v }))}
                trackColor={{ false: colors.borderLight, true: colors.primary + '60' }}
                thumbColor={pendingFilters.available ? colors.primary : colors.textTertiary}
                accessibilityLabel="Filtrer par disponibilité"
              />
            </View>

            <View style={styles.sortSection}>
              <Text variant="body" style={styles.sortSectionTitle}>Trier par</Text>
              <View style={styles.sortOptions}>
                {([
                  { value: undefined, label: 'Par défaut' },
                  { value: 'rating' as SortOption, label: 'Meilleure note' },
                  { value: 'reviews' as SortOption, label: 'Plus d\'avis' },
                ] as const).map((opt) => (
                  <Pressable
                    key={opt.label}
                    style={[styles.sortChip, pendingFilters.sortBy === opt.value && styles.sortChipActive]}
                    onPress={() => setPendingFilters((p) => ({ ...p, sortBy: opt.value }))}
                    accessibilityLabel={`Trier par ${opt.label}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: pendingFilters.sortBy === opt.value }}
                  >
                    <Text
                      variant="bodySmall"
                      color={pendingFilters.sortBy === opt.value ? colors.textInverse : colors.text}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.resetButton}
                onPress={handleResetFilters}
                accessibilityLabel="Réinitialiser les filtres"
                accessibilityRole="button"
              >
                <Text variant="body" color={colors.textSecondary}>Réinitialiser</Text>
              </Pressable>
              <Pressable
                style={styles.applyButton}
                onPress={handleApplyFilters}
                accessibilityLabel="Appliquer les filtres"
                accessibilityRole="button"
              >
                <Text variant="body" color={colors.textInverse}>Appliquer</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {activeFilterCount > 0 && (
        <View style={styles.filterBadge}>
          <Text variant="caption" color={colors.textInverse} style={styles.filterBadgeText}>
            {activeFilterCount}
          </Text>
        </View>
      )}
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
    flex: 1,
  },
  resultsHighlight: {},
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayLight,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxxl,
    ...shadows.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  modalClose: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterInfo: {
    flex: 1,
    gap: spacing.xxs,
    marginRight: spacing.md,
  },
  sortSection: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  sortSectionTitle: {},
  sortOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sortChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sortChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  resetButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  applyButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {},
});
