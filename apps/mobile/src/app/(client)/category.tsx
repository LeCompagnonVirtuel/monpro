import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useServices } from '@/hooks/use-services';
import { Service } from '@/api/services';

export default function CategoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { data: services, isLoading, error, refetch } = useServices({ categoryId: id });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text variant="h2" numberOfLines={1} style={styles.title}>{name || 'Catégorie'}</Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <View style={styles.loadingList}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={64} />
          ))}
        </View>
      ) : error ? (
        <ErrorState message="Impossible de charger les services" onRetry={refetch} />
      ) : !services?.length ? (
        <EmptyState title="Aucun service" description="Cette catégorie ne contient pas encore de services." />
      ) : (
        <FlatList
          data={services.filter(s => s.isActive)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ServiceRow service={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function ServiceRow({ service }: { service: Service }) {
  return (
    <Pressable
      style={styles.serviceRow}
      onPress={() => router.push({ pathname: '/(client)/service', params: { id: service.id } })}
      accessibilityLabel={service.name}
    >
      <View style={styles.serviceIcon}>
        <Ionicons name="construct-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.serviceText}>
        <Text variant="body" numberOfLines={1}>{service.name}</Text>
        {service.description && (
          <Text variant="caption" color={colors.textSecondary} numberOfLines={2}>
            {service.description}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
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
  loadingList: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceText: {
    flex: 1,
    gap: spacing.xxs,
  },
});
