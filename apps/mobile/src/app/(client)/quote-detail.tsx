import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text, Badge, Button, Avatar, Skeleton, Divider } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useQuotesForRequest, useAcceptQuote, useRejectQuote } from '@/hooks/use-quotes';
import { formatCurrency, formatDate } from '@/lib/format';

export default function QuoteDetailScreen() {
  const { quoteId, requestId } = useLocalSearchParams<{ quoteId: string; requestId: string }>();
  const { data: quotes, isLoading, error, refetch } = useQuotesForRequest(requestId);
  const acceptMutation = useAcceptQuote();
  const rejectMutation = useRejectQuote();
  const [actionInProgress, setActionInProgress] = useState(false);

  const quote = quotes?.find((q) => q.id === quoteId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          <Skeleton width="100%" height={80} />
          <Skeleton width="100%" height={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !quote) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message="Devis introuvable" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const proName = quote.professional?.businessName || quote.professional?.user?.fullName || 'Professionnel';

  const handleAccept = () => {
    Alert.alert(
      'Accepter ce devis ?',
      `Vous allez accepter le devis de ${proName} pour ${formatCurrency(quote.totalAmount)}. Les autres devis seront automatiquement refusés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            setActionInProgress(true);
            try {
              const accepted = await acceptMutation.mutateAsync(quote.id);
              router.replace({ pathname: '/(client)/booking-detail', params: { quoteId: accepted.id, requestId } });
            } catch {
              Alert.alert('Erreur', 'Impossible d\'accepter ce devis. Veuillez réessayer.');
            } finally {
              setActionInProgress(false);
            }
          },
        },
      ],
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Refuser ce devis ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            setActionInProgress(true);
            try {
              await rejectMutation.mutateAsync(quote.id);
              router.back();
            } catch {
              Alert.alert('Erreur', 'Impossible de refuser ce devis. Veuillez réessayer.');
            } finally {
              setActionInProgress(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.proSection}>
          <Avatar uri={quote.professional?.user?.avatarUrl} name={proName} size={56} />
          <View style={styles.proInfo}>
            <View style={styles.proNameRow}>
              <Text variant="h3" numberOfLines={1}>{proName}</Text>
              {quote.professional?.isVerified && (
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              )}
            </View>
            {quote.professional?.averageRating != null && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={colors.secondary} />
                <Text variant="bodySmall" color={colors.textSecondary}>
                  {quote.professional.averageRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          <Badge
            label={quote.status === 'PENDING' ? 'En attente' : quote.status === 'ACCEPTED' ? 'Accepté' : quote.status === 'REJECTED' ? 'Refusé' : 'Expiré'}
            variant={quote.status === 'ACCEPTED' ? 'success' : quote.status === 'REJECTED' ? 'error' : 'info'}
          />
        </View>

        <Divider />

        <View style={styles.priceSection}>
          <Text variant="h1" color={colors.primary}>{formatCurrency(quote.totalAmount)}</Text>
          <View style={styles.priceBreakdown}>
            <PriceRow label="Main-d'œuvre" amount={quote.laborCost} />
            {quote.materialCost != null && quote.materialCost > 0 && (
              <PriceRow label="Matériel" amount={quote.materialCost} />
            )}
            {quote.transportCost != null && quote.transportCost > 0 && (
              <PriceRow label="Déplacement" amount={quote.transportCost} />
            )}
          </View>
        </View>

        <Divider />

        <View style={styles.infoSection}>
          {quote.estimatedDuration && (
            <InfoRow icon="time-outline" label="Délai estimé" value={quote.estimatedDuration} />
          )}
          {quote.validUntil && (
            <InfoRow icon="calendar-outline" label="Valide jusqu'au" value={formatDate(quote.validUntil)} />
          )}
          <InfoRow icon="document-text-outline" label="Date du devis" value={formatDate(quote.createdAt)} />
        </View>

        {quote.description && (
          <>
            <Divider />
            <View style={styles.descSection}>
              <Text variant="h3">Notes du professionnel</Text>
              <Text variant="body" color={colors.textSecondary}>{quote.description}</Text>
            </View>
          </>
        )}

        {quote.status === 'PENDING' && (
          <View style={styles.actions}>
            <Button
              title="Accepter ce devis"
              onPress={handleAccept}
              loading={acceptMutation.isPending}
              disabled={actionInProgress}
              size="lg"
            />
            <Button
              title="Refuser"
              onPress={handleReject}
              loading={rejectMutation.isPending}
              disabled={actionInProgress}
              size="lg"
              variant="outline"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Détail du devis</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

function PriceRow({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.priceRow}>
      <Text variant="body" color={colors.textSecondary}>{label}</Text>
      <Text variant="body">{formatCurrency(amount)}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text variant="bodySmall" color={colors.textSecondary} style={{ flex: 1 }}>{label}</Text>
      <Text variant="bodySmall">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.xl, gap: spacing.lg },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  proSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  proInfo: { flex: 1, gap: 2 },
  proNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  priceSection: { paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.lg },
  priceBreakdown: { width: '100%', gap: spacing.sm, paddingHorizontal: spacing.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoSection: { paddingVertical: spacing.lg, gap: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  descSection: { paddingVertical: spacing.lg, gap: spacing.md },
  actions: { paddingTop: spacing.xl, gap: spacing.md },
});
