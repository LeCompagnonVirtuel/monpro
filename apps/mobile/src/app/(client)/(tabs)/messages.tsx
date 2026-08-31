import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, FlatList, Pressable, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MessagesHeader } from '@/components/messages/MessagesHeader';
import { MessageFilterChips } from '@/components/messages/MessageFilterChips';
import { SecurityBanner } from '@/components/messages/SecurityBanner';
import { ConversationRow } from '@/components/messages/ConversationRow';
import { ProfessionalSuggestionCard } from '@/components/messages/ProfessionalSuggestionCard';
import { useConversations } from '@/hooks/use-conversations';
import { useAuthStore } from '@/stores/auth.store';
import { useProfessionals } from '@/hooks/use-professionals';
import { useUnreadNotificationCount } from '@/hooks/use-notifications';
import { Conversation } from '@/api/messaging';

type FilterType = 'all' | 'requests' | 'projects' | 'notifications';
type SortMode = 'recent' | 'unread';

export default function MessagesScreen() {
  const { data: conversations, isLoading, error, refetch } = useConversations();
  const userId = useAuthStore((s) => s.userId);
  const { data: notifCount } = useUnreadNotificationCount();
  const { data: prosData } = useProfessionals({ limit: 6, verified: true });

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showBanner, setShowBanner] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const handleDismissBanner = useCallback(() => setShowBanner(false), []);

  const toggleSort = useCallback(() => {
    setSortMode((prev) => (prev === 'recent' ? 'unread' : 'recent'));
  }, []);

  const filteredConversations = useMemo(() => {
    const list = conversations || [];
    if (sortMode === 'unread') {
      return [...list].sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        const dateA = a.lastMessage?.createdAt || a.createdAt;
        const dateB = b.lastMessage?.createdAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    }
    return [...list].sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || a.createdAt;
      const dateB = b.lastMessage?.createdAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [conversations, sortMode]);

  const renderHeader = () => (
    <View>
      <MessageFilterChips
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        notificationCount={notifCount}
      />

      {showBanner && <SecurityBanner onDismiss={handleDismissBanner} />}

      <View style={styles.sectionRow}>
        <Text variant="h3" style={styles.sectionTitle}>Conversations</Text>
        <Pressable
          style={styles.sortButton}
          onPress={toggleSort}
          accessibilityLabel={`Trier par ${sortMode === 'recent' ? 'non lus' : 'récents'}`}
          accessibilityRole="button"
        >
          <Text variant="caption" color={sortMode === 'unread' ? colors.primary : colors.textSecondary} style={styles.sortText}>
            {sortMode === 'recent' ? 'Récents' : 'Non lus'}
          </Text>
          <Ionicons name={sortMode === 'unread' ? 'mail-unread-outline' : 'time-outline'} size={16} color={sortMode === 'unread' ? colors.primary : colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );

  const renderFooter = () => {
    const professionals = prosData?.professionals || [];
    if (professionals.length === 0) return <View style={styles.bottomSpacer} />;

    return (
      <View style={styles.suggestionsSection}>
        <View style={styles.suggestionsHeader}>
          <Text variant="h3" style={styles.sectionTitle}>Suggestions de professionnels</Text>
          <Pressable
            onPress={() => router.push('/(client)/(tabs)/search')}
            accessibilityLabel="Voir tous les professionnels"
            accessibilityRole="button"
          >
            <View style={styles.seeAllRow}>
              <Text variant="caption" color={colors.textSecondary}>Voir tout</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
            </View>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScroll}
        >
          {professionals.map((pro) => (
            <ProfessionalSuggestionCard key={pro.id} professional={pro} />
          ))}
        </ScrollView>

        <View style={styles.bottomSpacer} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <MessagesHeader />
        <View style={styles.loadingContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={56} height={56} borderRadius={28} />
              <View style={styles.skeletonText}>
                <Skeleton width="55%" height={16} />
                <Skeleton width="80%" height={13} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <MessagesHeader />
        <ErrorState message="Impossible de charger vos conversations" onRetry={refetch} />
      </View>
    );
  }

  if (!filteredConversations.length) {
    return (
      <View style={styles.container}>
        <MessagesHeader />
        {renderHeader()}
        <EmptyState
          title="Aucune conversation"
          description="Vos conversations apparaîtront ici lorsque vous contacterez un professionnel."
          icon="chatbubbles-outline"
        />
        {renderFooter()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MessagesHeader />
      <FlatList
        data={filteredConversations}
        keyExtractor={(item: Conversation) => item.id}
        renderItem={({ item }) => (
          <ConversationRow conversation={item} currentUserId={userId} />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(client)/(tabs)/search')}
        accessibilityLabel="Créer une nouvelle conversation"
        accessibilityRole="button"
      >
        <Ionicons name="create-outline" size={22} color={colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContent: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  skeletonText: {
    flex: 1,
    gap: spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sortText: {
    fontWeight: '500',
    fontSize: 13,
  },
  suggestionsSection: {
    marginTop: spacing.xxl,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  suggestionsScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxxxl + spacing.xxxl,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxxxl + spacing.xl,
    right: spacing.xl,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
});
