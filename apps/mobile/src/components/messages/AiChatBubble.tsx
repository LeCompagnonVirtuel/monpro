import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';
import { AiChatMessage } from '@/hooks/use-ai-chat';

interface Props {
  message: AiChatMessage;
}

export function AiChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <Animated.View entering={FadeInRight.duration(300).springify()} style={styles.userBubble}>
        {message.imageUri && (
          <Image
            source={{ uri: message.imageUri }}
            style={styles.chatImage}
            contentFit="cover"
            accessibilityLabel="Photo envoyée pour analyse"
          />
        )}
        {message.content !== 'Analyse de photo' && (
          <Text variant="body" color={colors.textInverse}>
            {message.content}
          </Text>
        )}
        {message.imageUri && (
          <View style={styles.imageLabel}>
            <Ionicons name="camera" size={12} color={colors.textInverseMuted} />
            <Text variant="caption" color={colors.textInverseMuted}>Photo envoyée pour analyse</Text>
          </View>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInLeft.duration(300).springify()} style={styles.aiRow}>
      <View style={styles.aiAvatar}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
      </View>
      <View style={styles.aiContent}>
        {message.diagnosis ? (
          <View style={styles.diagnosisCard}>
            <View style={styles.diagnosisHeader}>
              <Ionicons name="medical" size={18} color={colors.primary} />
              <Text variant="bodyMedium" color={colors.primary}>Diagnostic IA</Text>
            </View>
            <Text variant="body" color={colors.text} style={styles.diagnosisIssue}>
              {message.diagnosis.issue}
            </Text>
            <View style={styles.diagnosisDetails}>
              <View style={styles.diagnosisRow}>
                <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
                <Text variant="bodySmall" color={colors.textSecondary}>{message.diagnosis.serviceSuggested}</Text>
              </View>
              <View style={styles.diagnosisRow}>
                <Ionicons name="folder-outline" size={14} color={colors.textSecondary} />
                <Text variant="bodySmall" color={colors.textSecondary}>{message.diagnosis.category}</Text>
              </View>
              <View style={styles.diagnosisRow}>
                <UrgencyIcon urgency={message.diagnosis.urgency} />
                <Text variant="bodySmall" color={urgencyColor(message.diagnosis.urgency)}>
                  {urgencyLabel(message.diagnosis.urgency)}
                </Text>
              </View>
            </View>
            <View style={styles.confidenceBar}>
              <View style={[styles.confidenceFill, { width: `${Math.round(message.diagnosis.confidence * 100)}%` }]} />
            </View>
            <Text variant="caption" color={colors.textTertiary}>
              Confiance : {Math.round(message.diagnosis.confidence * 100)}%
            </Text>
          </View>
        ) : (
          <View style={styles.aiBubble}>
            <Text variant="body" color={colors.text}>
              {message.content}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function UrgencyIcon({ urgency }: { urgency: string }) {
  const iconMap: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    URGENT: { name: 'alert-circle', color: colors.error },
    HIGH: { name: 'warning', color: colors.warning },
    NORMAL: { name: 'information-circle', color: colors.info },
    LOW: { name: 'checkmark-circle', color: colors.success },
  };
  const cfg = iconMap[urgency] || iconMap.NORMAL;
  return <Ionicons name={cfg.name} size={14} color={cfg.color} />;
}

function urgencyColor(urgency: string): string {
  const map: Record<string, string> = { URGENT: colors.error, HIGH: colors.warning, NORMAL: colors.info, LOW: colors.success };
  return map[urgency] || colors.info;
}

function urgencyLabel(urgency: string): string {
  const map: Record<string, string> = { URGENT: 'Urgent', HIGH: 'Prioritaire', NORMAL: 'Normal', LOW: 'Faible' };
  return map[urgency] || 'Normal';
}

export function AiTypingIndicator() {
  return (
    <Animated.View entering={FadeInLeft.duration(200)} style={styles.aiRow}>
      <View style={styles.aiAvatar}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    </Animated.View>
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
    gap: spacing.xs,
  },
  chatImage: {
    width: 200,
    height: 150,
    borderRadius: radius.md,
  },
  imageLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    opacity: 0.8,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    maxWidth: '90%',
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
  aiContent: {
    flex: 1,
  },
  aiBubble: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
    padding: spacing.md,
  },
  diagnosisCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    ...shadows.sm,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  diagnosisIssue: {
    lineHeight: 22,
  },
  diagnosisDetails: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  diagnosisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  typingBubble: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  typingDots: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.8 },
});
