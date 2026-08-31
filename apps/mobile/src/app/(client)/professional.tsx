import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Button, Card, Badge, Skeleton, Divider } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessional } from '@/hooks/use-professionals';
import { useReviews } from '@/hooks/use-reviews';
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from '@/hooks/use-favorites';
import { Review } from '@/api/reviews';

export default function ProfessionalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pro, isLoading, error, refetch } = useProfessional(id);
  const { data: reviewsData } = useReviews(id, { limit: 5 });
  const { data: isFavorite } = useIsFavorite(id);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const insets = useSafeAreaInsets();

  const toggleFavorite = () => {
    if (!id) return;
    if (isFavorite) {
      removeFavorite.mutate(id);
    } else {
      addFavorite.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.loadingContent}>
          <Skeleton width="100%" height={120} />
          <Skeleton width="60%" height={24} />
          <Skeleton width="100%" height={80} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !pro) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <ErrorState message="Profil introuvable" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable onPress={toggleFavorite} accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? colors.error : colors.text}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={40} color={colors.textTertiary} />
          </View>
          <Text variant="h2">{pro.user?.fullName || 'Professionnel'}</Text>
          {pro.businessName && (
            <Text variant="body" color={colors.textSecondary}>{pro.businessName}</Text>
          )}
          <View style={styles.badgeRow}>
            {pro.isVerified && (
              <Badge label="Vérifié" variant="success" />
            )}
            {pro.isAvailable && (
              <Badge label="Disponible" variant="info" />
            )}
          </View>
          {pro.averageRating != null && (
            <View style={styles.ratingSection}>
              <Ionicons name="star" size={20} color={colors.secondary} />
              <Text variant="h3">{pro.averageRating.toFixed(1)}</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>
                ({pro.totalReviews || 0} avis)
              </Text>
            </View>
          )}
        </View>

        <Divider />

        {pro.description && (
          <View style={styles.section}>
            <Text variant="h3">À propos</Text>
            <Text variant="body" color={colors.textSecondary}>{pro.description}</Text>
          </View>
        )}

        {pro.experienceYears != null && (
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={18} color={colors.textSecondary} />
            <Text variant="body" color={colors.textSecondary}>
              {pro.experienceYears} {pro.experienceYears > 1 ? "ans d'expérience" : "an d'expérience"}
            </Text>
          </View>
        )}

        {pro.services && pro.services.length > 0 && (
          <View style={styles.section}>
            <Text variant="h3">Services proposés</Text>
            <View style={styles.servicesList}>
              {pro.services.map((s) => (
                <View key={s.id} style={styles.serviceChip}>
                  <Text variant="caption">{s.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {reviewsData && reviewsData.reviews.length > 0 && (
          <View style={styles.section}>
            <Text variant="h3">Avis ({reviewsData.total})</Text>
            {reviewsData.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.ctaContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button
          title="Demander un service"
          onPress={() => {
            const serviceId = pro.services?.[0]?.id;
            router.push({
              pathname: '/(client)/create-request',
              params: serviceId ? { serviceId, professionalId: id } : { professionalId: id },
            });
          }}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text variant="bodySmall">{review.client?.fullName || 'Client'}</Text>
        <View style={styles.ratingSmall}>
          <Ionicons name="star" size={12} color={colors.secondary} />
          <Text variant="caption">{review.overallRating}</Text>
        </View>
      </View>
      {review.comment && (
        <Text variant="bodySmall" color={colors.textSecondary} numberOfLines={3}>
          {review.comment}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  loadingContent: {
    padding: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  section: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  serviceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  reviewCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  bottomSpacer: {
    height: spacing.xxxxl,
  },
  ctaContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
});
