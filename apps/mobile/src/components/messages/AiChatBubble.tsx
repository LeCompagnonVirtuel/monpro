import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text } from '@/components/ui';
import { ChatMessage } from '@/api/ai';
import { formatRelativeDate } from '@/lib/format';

interface Props {
  message: ChatMessage;
}

export function AiChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={styles.userBubble}>
        <Text variant="body" color={colors.textInverse}>
          {message.content}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.aiRow}>
      <View style={styles.aiAvatar}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
      </View>
      <View style={styles.aiBubble}>
        <Text variant="body" color={colors.text}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.xs,
    padding: spacing.md,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    maxWidth: '85%',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiBubble: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
    padding: spacing.md,
  },
});
