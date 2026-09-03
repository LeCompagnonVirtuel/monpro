import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Button, Divider, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useBooking } from '@/hooks/use-bookings';
import { useCreateReview, useHasReviewed } from '@/hooks/use-create-review';

const RATING_LABELS = ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent'];

const DIMENSIONS: { key: string; label: string; field: 'qualityRating' | 'punctualityRating' | 'communicationRating' | 'valuePriceRating' }[] = [
  { key: 'quality', label: 'Qualité du travail', field: 'qualityRating' },
  { key: 'punctuality', label: 'Ponctualité', field: 'punctualityRating' },
  { key: 'communication', label: 'Communication', field: 'communicationRating' },
  { key: 'value', label: 'Rapport qualité/prix', field: 'valuePriceRating' },
];

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading: bookingLoading, isError: bookingError, refetch } = useBooking(bookingId);
  const createReview = useCreateReview();
  const { data: alreadyReviewed } = useHasReviewed(bookingId);

  const [overallRating, setOverallRating] = useState(0);
  const [dimensionRatings, setDimensionRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Note requise', 'Veuillez donner une note globale.');
      return;
    }

    try {
      await createReview.mutateAsync({
        bookingId,
        overallRating,
        qualityRating: dimensionRatings.quality || undefined,
        punctualityRating: dimensionRatings.punctuality || undefined,
        communicationRating: dimensionRatings.communication || undefined,
        valuePriceRating: dimensionRatings.value || undefined,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      Alert.alert('Erreur', 'Impossible de publier votre avis. Veuillez réessayer.');
    }
  };

  if (bookingLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.scrollContent}>
          <View style={styles.skeletonIntro}>
            <Skeleton width="80%" height={28} />
            <Skeleton width="50%" height={18} />
          </View>
          <View style={styles.skeletonRating}>
            <Skeleton width="40%" height={22} />
            <View style={styles.skeletonStars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} width={40} height={40} style={styles.skeletonStar} />
              ))}
            </View>
          </View>
          <View style={styles.skeletonDimensions}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonDimRow}>
                <Skeleton width="45%" height={16} />
                <Skeleton width="30%" height={24} />
              </View>
            ))}
          </View>
          <View style={styles.skeletonComment}>
            <Skeleton width="50%" height={22} />
            <Skeleton width="100%" height={100} />
          </View>
          <Skeleton width="100%" height={52} style={styles.skeletonCta} />
        </View>
      </SafeAreaView>
    );
  }

  if (bookingError || (!bookingLoading && !booking)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState
          message="Impossible de charger les informations de la réservation."
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  if (submitted || alreadyReviewed) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.successContent}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text variant="h2" align="center">Merci pour votre avis !</Text>
          <Text variant="body" color={colors.textSecondary} align="center">
            Votre retour aide les autres clients à faire leur choix.
          </Text>
          <Button
            title="Retour à l'accueil"
            onPress={() => router.replace('/(client)/(tabs)/home')}
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Text variant="h2">{"Comment s'est passée votre intervention ?"}</Text>
          {booking && (
            <Text variant="bodySmall" color={colors.textSecondary}>
              {booking.professional?.user?.fullName || booking.professional?.businessName}
            </Text>
          )}
        </View>

        <Divider />

        <View style={styles.ratingSection}>
          <Text variant="h3">Note globale</Text>
          <StarRating value={overallRating} onChange={setOverallRating} size={40} />
          {overallRating > 0 && (
            <Text variant="bodySmall" color={colors.textSecondary}>{RATING_LABELS[overallRating]}</Text>
          )}
        </View>

        <Divider />

        <View style={styles.dimensionsSection}>
          <Text variant="h3">Détails (optionnel)</Text>
          {DIMENSIONS.map((dim) => (
            <View key={dim.key} style={styles.dimensionRow}>
              <Text variant="bodySmall" color={colors.textSecondary} style={styles.dimensionLabel}>{dim.label}</Text>
              <StarRating
                value={dimensionRatings[dim.key] || 0}
                onChange={(v) => setDimensionRatings((prev) => ({ ...prev, [dim.key]: v }))}
                size={24}
              />
            </View>
          ))}
        </View>

        <Divider />

        <View style={styles.commentSection}>
          <Text variant="h3">Commentaire (optionnel)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Décrivez votre expérience..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={1000}
            accessibilityLabel="Commentaire"
          />
          <Text variant="bodySmall" color={colors.textTertiary} align="right">
            {comment.length}/1000
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Publier mon avis"
            onPress={handleSubmit}
            loading={createReview.isPending}
            disabled={overallRating === 0 || createReview.isPending}
            size="lg"
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StarRating({ value, onChange, size }: { value: number; onChange: (v: number) => void; size: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          accessibilityLabel={`${star} étoile${star > 1 ? 's' : ''}`}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={size}
            color={star <= value ? colors.secondary : colors.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Votre avis</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  successContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl, gap: spacing.lg },
  intro: { paddingVertical: spacing.xl, gap: spacing.sm },
  ratingSection: { paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.md },
  starRow: { flexDirection: 'row', gap: spacing.sm },
  dimensionsSection: { paddingVertical: spacing.lg, gap: spacing.md },
  dimensionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dimensionLabel: { flex: 1 },
  commentSection: { paddingVertical: spacing.lg, gap: spacing.sm },
  commentInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, minHeight: 100, textAlignVertical: 'top', fontSize: 14, color: colors.text, backgroundColor: colors.surface },
  actions: { paddingTop: spacing.xl },
  skeletonIntro: { paddingVertical: spacing.xl, gap: spacing.md },
  skeletonRating: { paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.lg },
  skeletonStars: { flexDirection: 'row', gap: spacing.sm },
  skeletonStar: { borderRadius: radius.sm },
  skeletonDimensions: { paddingVertical: spacing.lg, gap: spacing.lg },
  skeletonDimRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skeletonComment: { paddingVertical: spacing.lg, gap: spacing.md },
  skeletonCta: { marginTop: spacing.xl, borderRadius: radius.md },
});
