import { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { AiChatBubble, AiTypingIndicator } from '@/components/messages/AiChatBubble';
import { useAiChat } from '@/hooks/use-ai-chat';

export default function AiChatScreen() {
  const { messages, isLoading, error, sendMessage, sendImage } = useAiChat();
  const [text, setText] = useState('');
  const [pickingImage, setPickingImage] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setText('');
    await sendMessage(trimmed);
  }, [text, isLoading, sendMessage]);

  const handlePickImage = useCallback(async () => {
    if (isLoading || pickingImage) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.7,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    setPickingImage(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await sendImage(asset.uri, base64);
    } catch {
      // handled by hook
    } finally {
      setPickingImage(false);
    }
  }, [isLoading, pickingImage, sendImage]);

  const handleTakePhoto = useCallback(async () => {
    if (isLoading || pickingImage) return;

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    setPickingImage(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await sendImage(asset.uri, base64);
    } catch {
      // handled by hook
    } finally {
      setPickingImage(false);
    }
  }, [isLoading, pickingImage, sendImage]);

  const renderHeader = () => {
    if (messages.length > 0) return null;
    return (
      <Animated.View entering={FadeIn.duration(500)} style={styles.welcomeContainer}>
        <Animated.View entering={FadeInUp.delay(100).duration(400).springify()} style={styles.welcomeAvatar}>
          <Ionicons name="sparkles" size={32} color={colors.primary} />
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Text variant="h2" align="center">Assistant MONPRO</Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <Text variant="body" color={colors.textSecondary} align="center" style={styles.welcomeDesc}>
            Je vous aide à trouver le bon professionnel, diagnostiquer un problème ou estimer un prix.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.photoPrompt}>
          <View style={styles.photoPromptIcon}>
            <Ionicons name="camera" size={24} color={colors.primary} />
          </View>
          <View style={styles.photoPromptText}>
            <Text variant="bodyMedium">Analysez une photo</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Prenez ou envoyez une photo pour un diagnostic instantané
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.suggestions}>
          {[
            { text: 'Comment trouver un plombier ?', icon: 'search' as const },
            { text: "Quel est le prix d'une fuite ?", icon: 'cash-outline' as const },
            { text: "J'ai besoin d'un électricien", icon: 'flash-outline' as const },
          ].map((q) => (
            <Pressable
              key={q.text}
              style={styles.suggestionChip}
              onPress={() => { setText(q.text); }}
              accessibilityLabel={q.text}
              accessibilityRole="button"
            >
              <Ionicons name={q.icon} size={16} color={colors.primary} />
              <Text variant="bodySmall" color={colors.primary}>{q.text}</Text>
            </Pressable>
          ))}
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
          </View>
          <Text variant="h3">Assistant IA</Text>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.backBtn} />
      </Animated.View>

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
          ListFooterComponent={isLoading ? <AiTypingIndicator /> : null}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />

        {error && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.errorBar}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text variant="bodySmall" color={colors.error}>{error}</Text>
          </Animated.View>
        )}

        <View style={styles.composer}>
          <Pressable
            style={styles.attachBtn}
            onPress={handlePickImage}
            disabled={isLoading || pickingImage}
            accessibilityLabel="Envoyer une image"
            accessibilityRole="button"
          >
            {pickingImage ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="image-outline" size={22} color={colors.primary} />
            )}
          </Pressable>
          <Pressable
            style={styles.attachBtn}
            onPress={handleTakePhoto}
            disabled={isLoading || pickingImage}
            accessibilityLabel="Prendre une photo"
            accessibilityRole="button"
          >
            <Ionicons name="camera-outline" size={22} color={colors.primary} />
          </Pressable>
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
            <Ionicons name="send" size={20} color={text.trim() ? colors.textInverse : colors.textTertiary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  welcomeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  welcomeDesc: { maxWidth: 300 },
  photoPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  photoPromptIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPromptText: { flex: 1, gap: 2 },
  suggestions: { gap: spacing.sm, marginTop: spacing.md, width: '100%' },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '25',
    ...shadows.sm,
  },
  messagesContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.errorLight,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  attachBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendBtnDisabled: { backgroundColor: colors.border, ...shadows.sm },
});
