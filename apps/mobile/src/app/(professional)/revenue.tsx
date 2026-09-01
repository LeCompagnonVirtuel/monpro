import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Skeleton } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useProfessionalWallet } from '@/hooks/use-professional-revenue';
import { formatCurrency } from '@/lib/format';

export default function RevenueScreen() {
  const { data: wallet, isLoading, error, refetch } = useProfessionalWallet();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={80} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message="Impossible de charger vos revenus" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (!wallet) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <EmptyState title="Aucun revenu" description="Vos revenus apparaîtront après vos premières interventions." icon="wallet-outline" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text variant="caption" color={colors.textInverse}>SOLDE DISPONIBLE</Text>
          <Text variant="h1" color={colors.textInverse}>{formatCurrency(wallet.balance)}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statInfo}>
              <Ionicons name="trending-up-outline" size={18} color={colors.success} />
              <Text variant="body" color={colors.textSecondary}>Total gagné</Text>
            </View>
            <Text variant="bodyMedium">{formatCurrency(wallet.totalEarned)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <View style={styles.statInfo}>
              <Ionicons name="cash-outline" size={18} color={colors.error} />
              <Text variant="body" color={colors.textSecondary}>Commissions</Text>
            </View>
            <Text variant="bodyMedium" color={colors.error}>-{formatCurrency(wallet.totalCommission)}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text variant="bodySmall" color={colors.textSecondary}>
            Les retraits seront disponibles prochainement. Vos revenus sont sécurisés.
          </Text>
        </View>
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
      <Text variant="h3" style={styles.headerTitle}>Mes revenus</Text>
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
  balanceCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  statsCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  divider: { height: 1, backgroundColor: colors.borderLight },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.infoLight, borderRadius: radius.md, padding: spacing.lg },
});
