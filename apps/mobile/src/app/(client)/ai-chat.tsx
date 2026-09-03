import { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text } from '@/components/ui';
import { AiChatBubble } from '@/components/messages/AiChatBubble';
import { useAiChat } from '@/hooks/use-ai-chat';
import { ChatMessage } from '@/api/ai';

export default function AiChatScreen() {
  const { messages, isLoading, error, sendMessage, aiContact } = useAiChat();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setText('');
    await sendMessage(trimmed);
  }, [text, isLoading, sendMessage]);

  const renderHeader = () => {
    if (messages.length > 0) return null;
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeAvatar}>
          <Ionicons name="sparkles" size={32} color={colors.primary} />
        </View>
        <Text variant="h2" align="center">Assistant MONPRO</Text>
        <Text variant="body" color={colors.textSecondary} align="center" style={styles.welcomeDesc}>
          Je vous aide à trouver le bon professionnel, décrire votre besoin, ou estimer un prix.
        </Text>
        <View style={styles.suggestions}>
          {['Comment trouver un plombier ?', 'Quel est le prix d\'une fuite ?', 'J\'ai besoin d\'un électricien'].map((q) => (
            <Pressable
              key={q}
              style={styles.suggestionChip}
              onPress={() => { setText(q); }}
              accessibilityLabel={q}
              accessibilityRole="button"
            >
              <Text variant="bodySmall" color={colors.primary}>{q}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
          </View>
          <Text variant="h3">Assistant MONPRO</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => `msg-${i}`}
          renderItem={({ item }) => <AiChatBubble message={item} />}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
        />

        {error && (
          <View style={styles.errorBar}>
            <Text variant="bodySmall" color={colors.error}>{error}</Text>
          </View>
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Posez votre question..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={1000}
            editable={!isLoading}
            accessibilityLabel="Message"
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || isLoading}
            accessibilityLabel="Envoyer"
            accessibilityRole="button"
          >
            {isLoading ? (
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textInverse} />
            ) : (
              <Ionicons name="send" size={20} color={text.trim() ? colors.textInverse : colors.textTertiary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  headerAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceSecondary, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  welcomeContainer: { alignItems: 'center', paddingTop: spacing.xxxl * 2, paddingHorizontal: spacing.xl, gap: spacing.md },
  welcomeAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  welcomeDesc: { maxWidth: 300 },
  suggestions: { gap: spacing.sm, marginTop: spacing.lg, width: '100%' },
  suggestionChip: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.primary + '40' },
  messagesContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  errorBar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, backgroundColor: colors.errorLight },
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight, gap: spacing.sm },
  input: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.text },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.border },
});
