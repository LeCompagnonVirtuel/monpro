import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/use-notifications';
import { Notification } from '@/api/notifications';
import { formatRelativeDate } from '@/lib/format';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  message: 'chatbubble-outline',
  quote: 'document-text-outline',
  booking: 'calendar-outline',
  intervention: 'construct-outline',
  payment: 'card-outline',
  review: 'star-outline',
  request: 'document-text-outline',
  system: 'information-circle-outline',
};

function getDeepLink(notification: Notification): string | null {
  const data = notification.data as Record<string, string> | undefined;
  if (!data) return null;

  if (data.conversationId) return `/(professional)/conversation?conversationId=${data.conversationId}`;
  if (data.bookingId) return `/(professional)/intervention?bookingId=${data.bookingId}`;
  if (data.requestId) return `/(professional)/request-detail?id=${data.requestId}`;
  return null;
}

export default function ProfessionalNotificationsScreen() {
  const { data, isLoading, error, refetch } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications || [];
  const hasUnread = notifications.some((n) => !n.isRead);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header hasUnread={false} onMarkAllRead={() => {}} />
        <View style={styles.loadingContent}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} width="100%" height={60} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header hasUnread={false} onMarkAllRead={() => {}} />
        <ErrorState message="Impossible de charger les notifications" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header hasUnread={false} onMarkAllRead={() => {}} />
        <EmptyState title="Aucune notification" icon="notifications-outline" />
      </SafeAreaView>
    );
  }

  const handlePress = (notification: Notification) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    const link = getDeepLink(notification);
    if (link) {
      router.push(link as never);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header hasUnread={hasUnread} onMarkAllRead={() => markAllRead.mutate()} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationRow notification={item} onPress={() => handlePress(item)} />
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function Header({ hasUnread, onMarkAllRead }: { hasUnread: boolean; onMarkAllRead: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Notifications</Text>
      {hasUnread ? (
        <Pressable onPress={onMarkAllRead} accessibilityLabel="Tout marquer comme lu" style={styles.backBtn}>
          <Ionicons name="checkmark-done" size={22} color={colors.primary} />
        </Pressable>
      ) : (
        <View style={styles.backBtn} />
      )}
    </View>
  );
}

function NotificationRow({ notification, onPress }: { notification: Notification; onPress: () => void }) {
  const icon = TYPE_ICONS[notification.type] || 'notifications-outline';

  return (
    <Pressable
      style={[styles.notifRow, !notification.isRead && styles.notifRowUnread]}
      onPress={onPress}
      accessibilityLabel={`${notification.title}. ${notification.body}`}
    >
      <View style={[styles.notifIcon, !notification.isRead && styles.notifIconUnread]}>
        <Ionicons name={icon} size={20} color={notification.isRead ? colors.textTertiary : colors.primary} />
      </View>
      <View style={styles.notifContent}>
        <Text variant="bodySmall" numberOfLines={1} color={notification.isRead ? colors.textSecondary : colors.text}>
          {notification.title}
        </Text>
        <Text variant="bodySmall" color={colors.textTertiary} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
      <Text variant="bodySmall" color={colors.textTertiary}>
        {formatRelativeDate(notification.createdAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  listContent: { paddingBottom: spacing.xxxl },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  notifRowUnread: { backgroundColor: colors.surfaceSecondary },
  notifIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  notifIconUnread: { backgroundColor: colors.successLightest },
  notifContent: { flex: 1, gap: 2 },
});
