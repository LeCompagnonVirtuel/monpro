import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Skeleton, Button } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalRequest } from '@/hooks/use-professional-requests';
import { formatDate, formatRelativeDate } from '@/lib/format';

const URGENCY_LABELS: Record<string, { color: string; label: string }> = {
  LOW: { color: colors.textTertiary, label: 'Basse' },
  NORMAL: { color: colors.info, label: 'Normale' },
  HIGH: { color: colors.warning, label: 'Haute' },
  URGENT: { color: colors.error, label: 'Urgente' },
};

export default function ProfessionalRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: request, isLoading, error, refetch } = useProfessionalRequest(id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          <Skeleton width="80%" height={24} />
          <Skeleton width="100%" height={60} />
          <Skeleton width="100%" height={40} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message="Impossible de charger la demande" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const urgency = URGENCY_LABELS[request.urgency] || URGENCY_LABELS.NORMAL;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleSection}>
          <Text variant="h2">{request.title}</Text>
          <View style={styles.metaRow}>
            <Text variant="bodySmall" color={colors.textSecondary}>{request.service?.name}</Text>
            <View style={[styles.urgencyBadge, { backgroundColor: urgency.color + '15' }]}>
              <Text variant="bodySmall" color={urgency.color}>{urgency.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="body" color={colors.textSecondary}>Description</Text>
          <Text variant="body">{request.description}</Text>
        </View>

        {request.preferredDate && (
          <View style={styles.section}>
            <Text variant="body" color={colors.textSecondary}>Date souhaitée</Text>
            <Text variant="body">{formatDate(request.preferredDate)}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text variant="body" color={colors.textSecondary}>Créée</Text>
          <Text variant="body">{formatRelativeDate(request.createdAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text variant="body" color={colors.textSecondary}>Statut</Text>
          <Text variant="body">{request.status}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Envoyer un devis"
          onPress={() => router.push({ pathname: '/(professional)/create-quote', params: { requestId: request.id, serviceName: request.service?.name || '' } } as never)}
        />
      </View>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Détail demande</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  content: { padding: spacing.lg, gap: spacing.lg },
  titleSection: { gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  urgencyBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  section: { gap: spacing.xs },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
});
