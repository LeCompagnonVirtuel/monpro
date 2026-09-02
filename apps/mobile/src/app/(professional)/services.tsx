import { StyleSheet, View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useState, useCallback } from 'react';

export default function ServicesScreen() {
  const { data: profile, isLoading, isError, refetch } = useMyProfessionalProfile();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.skeletonContent}>
          <Skeleton width="40%" height={16} />
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={20} height={20} borderRadius={10} />
              <View style={styles.skeletonCardText}>
                <Skeleton width="70%" height={18} />
                <Skeleton width="40%" height={14} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState
          message="Impossible de charger vos services."
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  const services = profile?.services || [];

  if (services.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <EmptyState
          title="Aucun service configuré"
          description="Vos services apparaîtront ici une fois configurés dans votre profil professionnel."
          icon="list-outline"
        />
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Pressable
            style={styles.editBtn}
            onPress={() => router.push('/(professional)/onboarding')}
            accessibilityLabel="Configurer mes services via l'onboarding"
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text variant="bodyMedium" color={colors.primary}>Configurer mes services</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.countLabel}>
          {services.length} service{services.length > 1 ? 's' : ''} actif{services.length > 1 ? 's' : ''}
        </Text>
        {services.map((svc) => (
          <View
            key={svc.id}
            style={styles.serviceCard}
            accessibilityLabel={`Service : ${svc.name}`}
          >
            <View style={styles.serviceIcon}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
            <View style={styles.serviceInfo}>
              <Text variant="body">{svc.name}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          style={styles.editBtn}
          onPress={() => router.push('/(professional)/onboarding')}
          accessibilityLabel="Modifier mes services via l'onboarding"
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
          <Text variant="bodyMedium" color={colors.primary}>Modifier mes services</Text>
        </Pressable>
        <Text variant="caption" color={colors.textTertiary} align="center" style={styles.footerHint}>
          La gestion des services se fait lors de la configuration du profil.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Retour"
        accessibilityRole="button"
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Mes services</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: { padding: spacing.lg, gap: spacing.sm },
  countLabel: { marginBottom: spacing.xs },
  serviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, minHeight: 56, ...shadows.sm },
  serviceIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  serviceInfo: { flex: 1 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight, gap: spacing.sm },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 48 },
  footerHint: { marginTop: spacing.xxs },
  // Skeleton styles
  skeletonContent: { padding: spacing.lg, gap: spacing.md },
  skeletonCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg },
  skeletonCardText: { flex: 1, gap: spacing.sm },
});
