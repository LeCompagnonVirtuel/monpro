import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Avatar } from '@/components/ui';
import { Professional } from '@/api/professionals';
import { useCreateConversation } from '@/hooks/use-conversations';

interface ProfessionalSuggestionCardProps {
  professional: Professional;
}

export function ProfessionalSuggestionCard({ professional }: ProfessionalSuggestionCardProps) {
  const name = professional.user?.fullName || professional.businessName || 'Professionnel';
  const profession = professional.services?.[0]?.name || 'Professionnel';
  const createConversation = useCreateConversation();

  const handleContact = async () => {
    if (!professional.userId) return;
    try {
      const conversation = await createConversation.mutateAsync(professional.userId);
      router.push({ pathname: '/(client)/conversation', params: { conversationId: conversation.id } });
    } catch {
      router.push({ pathname: '/(client)/professional', params: { id: professional.id } });
    }
  };

  return (
    <View style={styles.card}>
      <Avatar uri={professional.user?.avatarUrl} name={name} size={56} />

      <Text variant="body" numberOfLines={1} style={styles.name}>
        {name}
      </Text>

      <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
        {profession}
      </Text>

      {professional.rating != null && (
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={colors.secondary} />
          <Text variant="caption" style={styles.ratingValue}>
            {professional.rating.toFixed(1)}
          </Text>
          {professional.reviewCount != null && (
            <Text variant="caption" color={colors.textTertiary}>
              ({professional.reviewCount})
            </Text>
          )}
        </View>
      )}

      <Pressable
        style={styles.contactButton}
        onPress={handleContact}
        accessibilityLabel={`Contacter ${name}`}
        accessibilityRole="button"
      >
        <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
        <Text variant="caption" color={colors.primary} style={styles.contactText}>
          Contacter
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  name: {
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  ratingValue: {
    fontWeight: '600',
    fontSize: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  contactText: {
    fontWeight: '600',
    fontSize: 12,
  },
});
