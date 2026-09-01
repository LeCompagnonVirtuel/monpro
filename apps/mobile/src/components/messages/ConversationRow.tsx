import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Avatar } from '@/components/ui';
import { Conversation } from '@/api/messaging';

interface ConversationRowProps {
  conversation: Conversation;
  currentUserId: string | null;
}

export function ConversationRow({ conversation, currentUserId }: ConversationRowProps) {
  const other = conversation.participants.find((p) => p.id !== currentUserId);
  const name = other?.fullName || 'Utilisateur';
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/(client)/conversation', params: { conversationId: conversation.id } })}
      accessibilityLabel={`Ouvrir la conversation avec ${name}${hasUnread ? `, ${conversation.unreadCount} messages non lus` : ''}`}
      accessibilityRole="button"
    >
      <Avatar uri={other?.avatarUrl} name={name} size={56} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text variant="body" numberOfLines={1} style={[styles.name, hasUnread && styles.nameBold]}>
            {name}
          </Text>
          {conversation.lastMessage && (
            <Text variant="caption" color={colors.textTertiary} style={styles.time}>
              {formatConversationDate(conversation.lastMessage.createdAt)}
            </Text>
          )}
        </View>
        <View style={styles.bottomRow}>
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

function formatConversationDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Hier';
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  content: {
    flex: 1,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flex: 1,
  },
  nameBold: {},
  time: {
    marginLeft: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  preview: {
    flex: 1,
  },
  rightIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {},
});
