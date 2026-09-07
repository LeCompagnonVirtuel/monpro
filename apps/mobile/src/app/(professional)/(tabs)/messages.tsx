import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, FlatList, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Avatar, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useConversations } from '@/hooks/use-conversations';
import { useAuthStore } from '@/stores/auth.store';
import { Conversation } from '@/api/messaging';
import { formatRelativeDate } from '@/lib/format';

type SortMode = 'recent' | 'unread';

export default function ProfessionalMessagesScreen() {
  const { data: conversations, isLoading, error, refetch } = useConversations();
  const userId = useAuthStore((s) => s.userId);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const toggleSort = useCallback(() => {
    setSortMode((prev) => (prev === 'recent' ? 'unread' : 'recent'));
  }, []);

  const sortedConversations = useMemo(() => {
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

  const unreadTotal = useMemo(() => {
    return (conversations || []).reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversations]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Messages</Text>
        </View>
        <View style={styles.loadingContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={52} height={52} borderRadius={26} />
              <View style={styles.skeletonText}>
                <Skeleton width="55%" height={16} />
                <Skeleton width="80%" height={13} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Messages</Text>
        </View>
        <ErrorState message="Impossible de charger les conversations" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (!sortedConversations.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Text variant="h2">Messages</Text>
        </Animated.View>
        <EmptyState
          title="Aucune conversation"
          description="Les conversations avec vos clients apparaîtront ici lorsqu'ils vous contacteront."
          icon="chatbubbles-outline"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="h2">Messages</Text>
            {unreadTotal > 0 && (
              <View style={styles.unreadBadge}>
                <Text variant="caption" color={colors.textInverse} style={styles.unreadBadgeText}>
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </Text>
              </View>
            )}
          </View>
          <Pressable
            style={styles.sortButton}
            onPress={toggleSort}
            accessibilityLabel={`Trier par ${sortMode === 'recent' ? 'non lus' : 'récents'}`}
            accessibilityRole="button"
          >
            <Text variant="caption" color={sortMode === 'unread' ? colors.primary : colors.textSecondary}>
              {sortMode === 'recent' ? 'Récents' : 'Non lus'}
            </Text>
            <Ionicons
              name={sortMode === 'unread' ? 'mail-unread-outline' : 'time-outline'}
              size={16}
              color={sortMode === 'unread' ? colors.primary : colors.textSecondary}
            />
          </Pressable>
        </View>
      </Animated.View>

      <FlatList
        data={sortedConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <ConversationRow conversation={item} currentUserId={userId} />
          </Animated.View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      />
    </SafeAreaView>
  );
}

function ConversationRow({ conversation, currentUserId }: { conversation: Conversation; currentUserId: string | null }) {
  const other = conversation.participants.find((p) => p.id !== currentUserId);
  const name = other?.fullName || 'Client';
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/(professional)/conversation', params: { conversationId: conversation.id } })}
      accessibilityLabel={`Conversation avec ${name}${hasUnread ? `, ${conversation.unreadCount} messages non lus` : ''}`}
      accessibilityRole="button"
    >
      <Avatar uri={other?.avatarUrl} name={name} size={52} />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text variant="body" numberOfLines={1} style={[styles.rowName, hasUnread && styles.rowNameBold]}>
            {name}
          </Text>
          {conversation.lastMessage && (
            <Text variant="caption" color={colors.textTertiary} style={styles.time}>
              {formatRelativeDate(conversation.lastMessage.createdAt)}
            </Text>
          )}
        </View>
        <View style={styles.rowBottom}>
          <Text
            variant="caption"
            color={hasUnread ? colors.text : colors.textSecondary}
            numberOfLines={2}
            style={styles.preview}
          >
            {conversation.lastMessage?.content || 'Nouvelle conversation'}
          </Text>
          <View style={styles.rightIndicators}>
            {hasUnread && (
              <View style={styles.badge}>
                <Text variant="caption" color={colors.textInverse} style={styles.badgeText}>
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '700' },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  loadingContent: { padding: spacing.xl, gap: spacing.lg },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  skeletonText: { flex: 1, gap: spacing.sm },
  listContent: { paddingBottom: spacing.xxxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowContent: { flex: 1, gap: spacing.xs },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { flex: 1 },
  rowNameBold: { fontWeight: '600' },
  time: { marginLeft: spacing.sm },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  preview: { flex: 1 },
  rightIndicators: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    ...shadows.sm,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
