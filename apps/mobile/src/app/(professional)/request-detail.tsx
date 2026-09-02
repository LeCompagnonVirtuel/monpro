import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton, Button } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalRequest } from '@/hooks/use-professional-requests';
import { formatDate, formatRelativeDate } from '@/lib/format';

const URGENCY_CONFIG: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  LOW: { color: colors.textTertiary, label: 'Basse', icon: 'arrow-down-outline' },
  NORMAL: { color: colors.info, label: 'Normale', icon: 'remove-outline' },
  HIGH: { color: colors.warning, label: 'Haute', icon: 'arrow-up-outline' },
  URGENT: { color: colors.error, label: 'Urgente', icon: 'alert-circle-outline' },
};

const STATUS_LABELS: Record<string, { color: string; label: string }> = {
  DRAFT: { color: colors.textTertiary, label: 'Brouillon' },
  SUBMITTED: { color: colors.info, label: 'Soumise' },
  MATCHING: { color: colors.info, label: 'Recherche' },
  QUOTED: { color: colors.warning, label: 'Devis envoyés' },
  ACCEPTED: { color: colors.success, label: 'Acceptée' },
  SCHEDULED: { color: colors.primary, label: 'Planifiée' },
  IN_PROGRESS: { color: colors.primary, label: 'En cours' },
  COMPLETED: { color: colors.success, label: 'Terminée' },
  CANCELLED: { color: colors.error, label: 'Annulée' },
  DISPUTED: { color: colors.error, label: 'Litige' },
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

  const urgency = URGENCY_CONFIG[request.urgency] || URGENCY_CONFIG.NORMAL;
  const status = STATUS_LABELS[request.status];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Title & Service */}
        <View style={styles.titleSection}>
          <Text variant="h2">{request.title}</Text>
          <View style={styles.serviceRow}>
            <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
            <Text variant="bodyMedium" color={colors.primary}>{request.service?.name || 'Service'}</Text>
          </View>
        </View>

        {/* Urgency & Status */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: urgency.color + '15' }]}>
            <Ionicons name={urgency.icon} size={14} color={urgency.color} />
            <Text variant="caption" color={urgency.color}>{urgency.label}</Text>
          </View>
          {status && (
            <View style={[styles.badge, { backgroundColor: status.color + '15' }]}>
              <Text variant="caption" color={status.color}>{status.label}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {request.description && (
          <View style={styles.section}>
            <Text variant="caption" color={colors.textSecondary}>DESCRIPTION</Text>
            <Text variant="body">{request.description}</Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.detailsCard}>
          {request.preferredDate && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text variant="caption" color={colors.textSecondary}>Date souhaitée</Text>
                <Text variant="bodyMedium">{formatDate(request.preferredDate)}</Text>
              </View>
            </View>
          )}

          {request.preferredTimeStart && request.preferredTimeEnd && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text variant="caption" color={colors.textSecondary}>Créneau horaire</Text>
                <Text variant="bodyMedium">{request.preferredTimeStart} — {request.preferredTimeEnd}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text variant="caption" color={colors.textSecondary}>Créée</Text>
              <Text variant="bodyMedium">{formatRelativeDate(request.createdAt)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Créer un devis"
          onPress={() => router.push({ pathname: '/(professional)/create-quote', params: { requestId: request.id, serviceName: request.service?.name || '' } })}
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
      <Text variant="h3" style={styles.headerTitle}>Demande</Text>
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
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  section: { gap: spacing.sm },
  detailsCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detailIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  detailInfo: { flex: 1, gap: 2 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
});
