import { StyleSheet, View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text, Avatar, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useFavorites, useRemoveFavorite } from '@/hooks/use-favorites';
import { Professional } from '@/api/professionals';

export default function FavoritesScreen() {
  const { data: favorites, isLoading, error, refetch } = useFavorites();
  const removeFavorite = useRemoveFavorite();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={60} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message="Impossible de charger vos favoris" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <EmptyState title="Aucun favori" icon="heart-outline" description="Les professionnels que vous ajoutez en favoris apparaîtront ici." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FavoriteRow
            professional={item}
            onPress={() => router.push({ pathname: '/(client)/professional', params: { id: item.id } })}
            onRemove={() => removeFavorite.mutate(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Mes favoris</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

function FavoriteRow({ professional, onPress, onRemove }: { professional: Professional; onPress: () => void; onRemove: () => void }) {
  const name = professional.user?.fullName || professional.businessName || 'Professionnel';

  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityLabel={`Voir ${name}`}>
      <Avatar uri={professional.user?.avatarUrl} name={name} size={48} />
      <View style={styles.rowContent}>
        <Text variant="body" numberOfLines={1}>{name}</Text>
        {professional.services && professional.services.length > 0 && (
          <Text variant="bodySmall" color={colors.textSecondary} numberOfLines={1}>
            {professional.services.map((s) => s.name).join(', ')}
          </Text>
        )}
        {professional.rating && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text variant="bodySmall" color={colors.textSecondary}>
              {professional.rating.toFixed(1)} ({professional.reviewCount || 0} avis)
            </Text>
          </View>
        )}
      </View>
      <Pressable onPress={onRemove} accessibilityLabel={`Retirer ${name} des favoris`} style={styles.heartBtn}>
        <Ionicons name="heart" size={22} color={colors.error} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.lg, gap: spacing.md },
  listContent: { paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  rowContent: { flex: 1, gap: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heartBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
