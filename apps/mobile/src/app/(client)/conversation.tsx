import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useMessages, useSendMessage } from '@/hooks/use-messages';
import { useConversations, useMarkConversationRead } from '@/hooks/use-conversations';
import { useAuthStore } from '@/stores/auth.store';
import { socketService } from '@/lib/socket';
import { Message } from '@/api/messaging';
import { formatRelativeDate } from '@/lib/format';
import { aiApi } from '@/api/ai';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const userId = useAuthStore((s) => s.userId);
  const { data: messages, isLoading, error, refetch, hasNextPage, fetchNextPage } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const sendMessageMutation = useSendMessage();
  const markRead = useMarkConversationRead();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversation = conversations?.find((c) => c.id === conversationId);
  const other = conversation?.participants.find((p) => p.id !== userId);

  useEffect(() => {
    if (conversationId) {
      socketService.joinConversation(conversationId);
      markRead.mutate(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    const unsub = socketService.onTyping(({ userId: tid }) => {
      if (tid !== userId) {
        setTypingUserId(tid);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingUserId(null), 3000);
      }
    });
    return () => { unsub(); };
  }, [userId]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !conversationId) return;

    setSending(true);
    try {
      await sendMessageMutation.mutateAsync({ conversationId, content: trimmed });
      setText('');
    } catch {
      // Keep text for retry
    } finally {
      setSending(false);
    }
  }, [text, sending, conversationId, sendMessageMutation]);

  const handleSummarize = useCallback(async () => {
    if (!conversationId || loadingSummary) return;
    setLoadingSummary(true);
    try {
      const { data: res } = await aiApi.getSummary(conversationId);
      setSummary(res.data.summary);
    } catch {
      setSummary('Impossible de générer le résumé.');
    } finally {
      setLoadingSummary(false);
    }
  }, [conversationId, loadingSummary]);

  const handleTextChange = (value: string) => {
    setText(value);
    if (conversationId) {
      socketService.emitTyping(conversationId);
    }
  };

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100;
    const atBottom = contentSize.height - layoutMeasurement.height - contentOffset.y < paddingToBottom;
    setIsNearBottom(atBottom);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header name={other?.fullName} />
        <View style={styles.loadingContent}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="60%" height={40} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header name={other?.fullName} />
        <ErrorState message="Impossible de charger les messages" onRetry={refetch} />
      </SafeAreaView>
    );
  }

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header name={other?.fullName} onSummarize={handleSummarize} loadingSummary={loadingSummary} />
        <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.senderId === userId} />
          )}
          ListHeaderComponent={summary ? (
            <View style={styles.summaryCard}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text variant="bodySmall" color={colors.text}>{summary}</Text>
            </View>
          ) : undefined}
          contentContainerStyle={styles.messagesContent}
          onScroll={handleScroll}
          onContentSizeChange={() => {
            if (isNearBottom) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          inverted={false}
        />

        {typingUserId && (
          <View style={styles.typingBar}>
            <Text variant="bodySmall" color={colors.textTertiary}>
              {other?.fullName || 'En train'} est en train d{"'"}écrire...
            </Text>
          </View>
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Écrire un message..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
            accessibilityLabel="Message"
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            accessibilityLabel="Envoyer"
            accessibilityRole="button"
          >
            <Ionicons name="send" size={20} color={text.trim() && !sending ? colors.textInverse : colors.textTertiary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ name, onSummarize, loadingSummary }: { name?: string; onSummarize?: () => void; loadingSummary?: boolean }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" numberOfLines={1} style={styles.headerTitle}>
        {name || 'Conversation'}
      </Text>
      {onSummarize && (
        <Pressable
          onPress={onSummarize}
          disabled={loadingSummary}
          accessibilityLabel="Résumé IA"
          accessibilityRole="button"
          style={styles.summaryBtn}
        >
          <Ionicons name={loadingSummary ? 'hourglass-outline' : 'sparkles'} size={18} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
      <Text variant="body" color={isOwn ? colors.textInverse : colors.text}>
        {message.content}
      </Text>
      <Text variant="bodySmall" color={isOwn ? colors.textInverseMuted : colors.textTertiary} align="right">
        {formatRelativeDate(message.createdAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: 'flex-end' },
  messagesContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  bubble: { maxWidth: '78%', padding: spacing.md, borderRadius: radius.lg, gap: 4 },
  bubbleOwn: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: radius.xs },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: colors.surfaceSecondary, borderBottomLeftRadius: radius.xs },
  typingBar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight, gap: spacing.sm },
  input: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.text },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.border },
  summaryBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.secondaryMuted, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
});
