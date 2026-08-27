import { useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Avatar, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useProfessionalReviews, useRespondToReview } from '@/hooks/use-professional-reviews';
import { Review } from '@/api/reviews';
import { formatRelativeDate } from '@/lib/format';

export default function ReviewsScreen() {
  const { data: profile } = useMyProfessionalProfile();
  const { data, isLoading, error, refetch } = useProfessionalReviews(profile?.id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={100} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message="Impossible de charger les avis" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const reviews = data?.reviews || [];

  if (reviews.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <EmptyState title="Aucun avis" description="Les avis de vos clients apparaîtront ici." icon="star-outline" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />

      {profile && (
        <View style={styles.summaryBar}>
          <Ionicons name="star" size={18} color={colors.warning} />
          <Text variant="h3">{profile.rating?.toFixed(1) || '-'}</Text>
          <Text variant="bodySmall" color={colors.textSecondary}>({data?.total || 0} avis)</Text>
        </View>
      )}

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        contentContainerStyle={styles.listContent}
        onRefresh={refetch}
        refreshing={false}
      />
    </SafeAreaView>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const respondMutation = useRespondToReview();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleRespond = () => {
    if (!replyText.trim()) return;
    respondMutation.mutate({ id: review.id, response: replyText.trim() });
    setShowReply(false);
    setReplyText('');
  };

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Avatar uri={review.client?.avatarUrl} name={review.client?.fullName || 'Client'} size={36} />
        <View style={styles.reviewHeaderInfo}>
          <Text variant="body">{review.client?.fullName || 'Client'}</Text>
          <Text variant="bodySmall" color={colors.textTertiary}>{formatRelativeDate(review.createdAt)}</Text>
        </View>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons key={s} name={s <= review.overallRating ? 'star' : 'star-outline'} size={14} color={colors.warning} />
          ))}
        </View>
      </View>

      {review.comment && (
        <Text variant="body" color={colors.textSecondary}>{review.comment}</Text>
      )}

      {review.response && (
        <View style={styles.responseBox}>
          <Text variant="bodySmall" color={colors.textSecondary}>Votre réponse :</Text>
          <Text variant="bodySmall">{review.response}</Text>
        </View>
      )}

      {!review.response && !showReply && (
        <Pressable onPress={() => setShowReply(true)} style={styles.replyLink}>
          <Text variant="bodySmall" color={colors.primary}>Répondre</Text>
        </Pressable>
      )}

      {showReply && (
        <View style={styles.replySection}>
          <TextInput
            style={styles.replyInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Votre réponse..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={500}
            accessibilityLabel="Réponse à l'avis"
          />
          <View style={styles.replyActions}>
            <Pressable onPress={() => setShowReply(false)}>
              <Text variant="bodySmall" color={colors.textTertiary}>Annuler</Text>
            </Pressable>
            <Pressable onPress={handleRespond} disabled={!replyText.trim() || respondMutation.isPending}>
              <Text variant="bodySmall" color={colors.primary}>
                {respondMutation.isPending ? 'Envoi...' : 'Envoyer'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Mes avis</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  summaryBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  reviewCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewHeaderInfo: { flex: 1, gap: 0 },
  starsRow: { flexDirection: 'row', gap: 1 },
  responseBox: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm, padding: spacing.sm, gap: 2 },
  replyLink: { alignSelf: 'flex-start' },
  replySection: { gap: spacing.sm },
  replyInput: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm, padding: spacing.sm, fontSize: 14, color: colors.text, minHeight: 60, textAlignVertical: 'top' },
  replyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg },
});
