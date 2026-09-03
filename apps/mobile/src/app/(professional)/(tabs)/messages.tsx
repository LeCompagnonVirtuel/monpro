import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Avatar, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useConversations } from '@/hooks/use-conversations';
import { useAuthStore } from '@/stores/auth.store';
import { Conversation } from '@/api/messaging';
import { formatRelativeDate } from '@/lib/format';

export default function ProfessionalMessagesScreen() {
  const { data: conversations, isLoading, error, refetch } = useConversations();
  const userId = useAuthStore((s) => s.userId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Messages</Text>
        </View>
        <View style={styles.loadingContent}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={48} height={48} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="80%" height={14} />
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

  if (!conversations || conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Messages</Text>
        </View>
        <EmptyState title="Aucune conversation" description="Les conversations avec vos clients apparaîtront ici." icon="chatbubbles-outline" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h2">Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationRow conversation={item} currentUserId={userId} />
        )}
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={conversations === undefined}
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
    >
      <Avatar uri={other?.avatarUrl} name={name} size={48} />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text variant="body" numberOfLines={1} style={[styles.rowName, hasUnread && styles.rowNameBold]}>
            {name}
          </Text>
          {conversation.lastMessage && (
            <Text variant="bodySmall" color={colors.textTertiary}>
              {formatRelativeDate(conversation.lastMessage.createdAt)}
            </Text>
          )}
        </View>
        <View style={styles.rowBottom}>
          <Text variant="bodySmall" color={hasUnread ? colors.text : colors.textSecondary} numberOfLines={1} style={{ flex: 1 }}>
            {conversation.lastMessage?.content || 'Nouvelle conversation'}
          </Text>
          {hasUnread && (
            <View style={styles.badge}>
              <Text variant="bodySmall" color={colors.textInverse}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  loadingContent: { padding: spacing.lg, gap: spacing.lg },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  listContent: { paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  rowContent: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { flex: 1 },
  rowNameBold: { fontWeight: '600' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { backgroundColor: colors.primary, borderRadius: radius.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
