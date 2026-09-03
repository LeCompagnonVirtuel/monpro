import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text } from '@/components/ui';

const HISTORY_ITEMS = [
  { id: '1', type: 'request', title: 'Plomberie - Fuite cuisine', date: '28 août 2026', status: 'COMPLETED', amount: '15 000 FCFA' },
  { id: '2', type: 'booking', title: 'Électricité - Installation', date: '20 août 2026', status: 'COMPLETED', amount: '25 000 FCFA' },
  { id: '3', type: 'request', title: 'Peinture - Salon', date: '15 août 2026', status: 'CANCELLED', amount: null },
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  COMPLETED: { color: colors.success, label: 'Terminé' },
  CANCELLED: { color: colors.error, label: 'Annulé' },
  IN_PROGRESS: { color: colors.primary, label: 'En cours' },
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text variant="h3" style={styles.headerTitle}>Historique</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {HISTORY_ITEMS.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={40} color={colors.textTertiary} />
            </View>
            <Text variant="bodyMedium" align="center">Aucun historique</Text>
            <Text variant="bodySmall" color={colors.textSecondary} align="center">
              Vos demandes et interventions apparaîtront ici.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {HISTORY_ITEMS.map((item) => {
              const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.COMPLETED;
              return (
                <Pressable
                  key={item.id}
                  style={styles.historyCard}
                  onPress={() => {}}
                  accessibilityLabel={`${item.title}, ${statusCfg.label}`}
                  accessibilityRole="button"
                >
                  <View style={styles.cardLeft}>
                    <View style={[styles.typeIcon, { backgroundColor: statusCfg.color + '15' }]}>
                      <Ionicons
                        name={item.type === 'request' ? 'document-text-outline' : 'briefcase-outline'}
                        size={18}
                        color={statusCfg.color}
                      />
                    </View>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text variant="bodyMedium" numberOfLines={1}>{item.title}</Text>
                    <Text variant="caption" color={colors.textSecondary}>{item.date}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    {item.amount && (
                      <Text variant="caption" style={styles.amount}>{item.amount}</Text>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '12' }]}>
                      <Text variant="caption" color={statusCfg.color}>{statusCfg.label}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  emptyState: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxxxl },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  historyList: { gap: spacing.sm },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardLeft: {},
  typeIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 2 },
  cardRight: { alignItems: 'flex-end', gap: spacing.xxs },
  amount: { fontWeight: '600', color: colors.text },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.sm },
  bottomSpacer: { height: spacing.xxxl },
});
