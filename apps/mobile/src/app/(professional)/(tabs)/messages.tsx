import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, FlatList, Pressable, TextInput, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useConversations } from '@/hooks/use-conversations';
import { useNotifications, useUnreadNotificationCount } from '@/hooks/use-notifications';
import { useAuthStore } from '@/stores/auth.store';
import { Conversation } from '@/api/messaging';
import { formatRelativeDate } from '@/lib/format';

type FilterTab = 'all' | 'unread' | 'clients' | 'notifications';

export default function ProfessionalMessagesScreen() {
  const { data: conversations, isLoading, error, refetch, isRefetching } = useConversations();
  const { data: notificationsData } = useNotifications({ limit: 50 });
  const { data: unreadNotifCount } = useUnreadNotificationCount();
  const userId = useAuthStore((s) => s.userId);

  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allConversations = useMemo(() => conversations || [], [conversations]);
  const allNotifications = useMemo(() => notificationsData?.notifications || [], [notificationsData]);

  const unreadMsgCount = useMemo(
    () => allConversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [allConversations],
  );

  const clientsCount = useMemo(() => allConversations.length, [allConversations]);

  const filteredConversations = useMemo(() => {
    let list = allConversations;

    if (filter === 'unread') {
      list = list.filter((c) => c.unreadCount > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => {
        const other = c.participants.find((p) => p.id !== userId);
        const name = other?.fullName || '';
        const lastMsg = c.lastMessage?.content || '';
        return name.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
      });
    }

    return [...list].sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || a.createdAt;
      const dateB = b.lastMessage?.createdAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [allConversations, filter, searchQuery, userId]);

  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return allNotifications;
    const q = searchQuery.toLowerCase();
    return allNotifications.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
    );
  }, [allNotifications, searchQuery]);

  const showNotifications = filter === 'notifications';

  const renderConversation = useCallback(({ item }: { item: Conversation }) => (
    <ConversationRow conversation={item} currentUserId={userId} />
  ), [userId]);

  const renderNotification = useCallback(({ item }: { item: { id: string; title: string; body: string; createdAt: string; isRead: boolean } }) => (
    <NotificationRow notification={item} />
  ), []);

  const keyExtractor = useCallback((item: Conversation | { id: string }) => item.id, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Skeleton width="35%" height={26} />
            <Skeleton width="65%" height={14} />
          </View>
          <View style={styles.headerActions}>
            <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
            <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
          </View>
        </View>
        <View style={styles.tabsRow}>
          <Skeleton width="18%" height={32} borderRadius={radius.lg} />
          <Skeleton width="22%" height={32} borderRadius={radius.lg} />
          <Skeleton width="18%" height={32} borderRadius={radius.lg} />
          <Skeleton width="30%" height={32} borderRadius={radius.lg} />
        </View>
        <View style={styles.listContent}>
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
        <ErrorState
          message="Impossible de charger vos conversations."
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="h2">Messages</Text>
          <Text variant="bodySmall" color={colors.textSecondary}>
            Échangez avec vos clients et gérez vos conversations.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setSearchVisible(!searchVisible)}
            accessibilityLabel="Rechercher"
            accessibilityRole="button"
          >
            <Ionicons name={searchVisible ? 'close-outline' : 'search-outline'} size={20} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/(professional)/notifications')}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            {(unreadNotifCount ?? 0) > 0 && (
              <View style={styles.notifBadge}>
                <Text variant="caption" color={colors.textInverse} style={styles.notifBadgeText}>
                  {unreadNotifCount! > 9 ? '9+' : unreadNotifCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Search */}
      {searchVisible && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher..."
            placeholderTextColor={colors.textTertiary}
            autoFocus
            accessibilityLabel="Rechercher des conversations"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} accessibilityLabel="Effacer">
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <FilterTabBtn label="Tous" count={clientsCount} active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterTabBtn label="Non lus" count={unreadMsgCount} active={filter === 'unread'} onPress={() => setFilter('unread')} />
        <FilterTabBtn label="Clients" count={clientsCount} active={filter === 'clients'} onPress={() => setFilter('clients')} />
        <FilterTabBtn label="Notifications" count={unreadNotifCount} active={filter === 'notifications'} onPress={() => setFilter('notifications')} />
      </View>

      {/* Banner */}
      {!showNotifications && (
        <View style={styles.banner}>
          <View style={styles.bannerIconWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.bannerContent}>
            <Text variant="bodyMedium">Répondez rapidement !</Text>
            <Text variant="caption" color={colors.textSecondary}>
              Une bonne communication renforce la confiance et augmente vos chances d'obtenir plus d'interventions.
            </Text>
          </View>
        </View>
      )}

      {/* List */}
      {showNotifications ? (
        filteredNotifications.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title="Aucune notification"
            description="Vos notifications apparaîtront ici."
          />
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContent}
            onRefresh={refetch}
            refreshing={isRefetching}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : filteredConversations.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title={filter === 'unread' ? 'Aucun message non lu' : 'Aucune conversation'}
          description={
            filter === 'unread'
              ? 'Tous vos messages ont été lus.'
              : 'Vos échanges avec les clients apparaîtront ici.'
          }
        />
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={keyExtractor}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isRefetching}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ──────────── SUB COMPONENTS ────────────

function FilterTabBtn({ label, count, active, onPress }: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text variant="caption" color={active ? colors.primary : colors.textSecondary}>
        {label}{count !== undefined && count > 0 ? ` ${count}` : ''}
      </Text>
    </Pressable>
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
      <View style={styles.avatarWrap}>
        <Avatar uri={other?.avatarUrl} name={name} size={52} />
        {hasUnread && <View style={styles.unreadDot} />}
      </View>
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
            numberOfLines={1}
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

function NotificationRow({ notification }: { notification: { id: string; title: string; body: string; createdAt: string; isRead: boolean } }) {
  return (
    <View style={[styles.row, !notification.isRead && styles.rowUnread]}>
      <View style={[styles.notifIconWrap, { backgroundColor: notification.isRead ? colors.surfaceSecondary : colors.primaryLight }]}>
        <Ionicons
          name={notification.isRead ? 'notifications-outline' : 'notifications'}
          size={20}
          color={notification.isRead ? colors.textTertiary : colors.primary}
        />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={[styles.rowName, !notification.isRead && styles.rowNameBold]}
          >
            {notification.title}
          </Text>
          <Text variant="caption" color={colors.textTertiary} style={styles.time}>
            {formatRelativeDate(notification.createdAt)}
          </Text>
        </View>
        <Text variant="caption" color={colors.textSecondary} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
    </View>
  );
}

// ──────────── STYLES ────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: { flex: 1, gap: spacing.xxs },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: { fontSize: 9, fontWeight: '700' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  tabActive: {
    backgroundColor: colors.primaryLight,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  bannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: { flex: 1, gap: spacing.xxs },

  // List
  listContent: {
    paddingBottom: spacing.xxxl,
  },

  // Conversation row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowUnread: {
    backgroundColor: colors.primaryLight + '08',
  },
  avatarWrap: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.background,
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

  // Notification row
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Skeleton
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  skeletonText: { flex: 1, gap: spacing.sm },
});
