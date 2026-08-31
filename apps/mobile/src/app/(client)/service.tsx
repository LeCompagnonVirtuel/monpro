import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text, Button, Card, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useService } from '@/hooks/use-services';
import { useProfessionalMatch } from '@/hooks/use-professionals';
import { useLocation } from '@/hooks/use-location';
import { Professional } from '@/api/professionals';

export default function ServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: service, isLoading: serviceLoading } = useService(id);
  const { location } = useLocation();
  const insets = useSafeAreaInsets();

  const matchParams = id ? {
    serviceId: id,
    ...(location ? { latitude: location.latitude, longitude: location.longitude } : {}),
  } : undefined;

  const { data: professionals, isLoading: prosLoading, error, refetch } = useProfessionalMatch(matchParams);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2" numberOfLines={1} style={styles.title}>
          {serviceLoading ? '...' : service?.name || 'Service'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {service?.description && (
        <View style={styles.descriptionSection}>
          <Text variant="body" color={colors.textSecondary}>
            {service.description}
          </Text>
        </View>
      )}

      <View style={styles.prosHeader}>
        <Text variant="h3">Professionnels disponibles</Text>
      </View>

      {prosLoading ? (
        <View style={styles.loadingList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={80} />
          ))}
        </View>
      ) : error ? (
        <ErrorState message="Erreur de chargement" onRetry={refetch} />
      ) : !professionals?.length ? (
        <EmptyState
          title="Aucun professionnel"
          description="Aucun professionnel ne propose ce service pour le moment."
        />
      ) : (
        <FlatList
          data={professionals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ProfessionalRow professional={item} />}
        />
      )}

      {id && (
        <View style={[styles.ctaContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Button
            title="Demander ce service"
            onPress={() => router.push({ pathname: '/(client)/create-request', params: { serviceId: id } })}
            size="lg"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function ProfessionalRow({ professional }: { professional: Professional }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(client)/professional', params: { id: professional.id } })}
      accessibilityLabel={professional.user?.fullName || professional.businessName || 'Professionnel'}
    >
      <Card style={styles.proCard}>
        <View style={styles.proInfo}>
          <View style={styles.proAvatar}>
            <Ionicons name="person" size={20} color={colors.textTertiary} />
          </View>
          <View style={styles.proDetails}>
            <View style={styles.proNameRow}>
              <Text variant="body" numberOfLines={1}>
                {professional.user?.fullName || professional.businessName || 'Professionnel'}
              </Text>
              {professional.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              )}
            </View>
            {professional.businessName && (
              <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {professional.businessName}
              </Text>
            )}
            <View style={styles.proMeta}>
              {professional.averageRating != null && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={colors.secondary} />
                  <Text variant="caption">{professional.averageRating.toFixed(1)}</Text>
                  <Text variant="caption" color={colors.textTertiary}>
                    ({professional.totalReviews || 0})
                  </Text>
                </View>
              )}
              {professional.experienceYears != null && (
                <Text variant="caption" color={colors.textSecondary}>
                  {professional.experienceYears} ans
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  descriptionSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  prosHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  loadingList: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxxl,
    gap: spacing.sm,
  },
  proCard: {
    padding: spacing.md,
  },
  proInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  proAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proDetails: {
    flex: 1,
    gap: spacing.xxs,
  },
  proNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  proMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  ctaContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
});
