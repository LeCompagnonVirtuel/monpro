import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { Text, Button, Skeleton, Divider, Badge } from '@/components/ui';
import { useBooking } from '@/hooks/use-bookings';
import { usePaymentForBooking, useInitiatePayment, usePollPaymentStatus } from '@/hooks/use-payments';
import { PaymentProvider, PaymentStatus } from '@/api/payments';
import { formatCurrency } from '@/lib/format';

const PROVIDERS: { value: PaymentProvider; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'ORANGE_MONEY', label: 'Orange Money', icon: 'phone-portrait-outline' },
  { value: 'MTN_MOMO', label: 'MTN Mobile Money', icon: 'phone-portrait-outline' },
  { value: 'MOOV_MONEY', label: 'Moov Money', icon: 'phone-portrait-outline' },
  { value: 'WAVE', label: 'Wave', icon: 'water-outline' },
];

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'error' }> = {
  PENDING: { label: 'En attente', variant: 'warning' },
  PROCESSING: { label: 'En cours de traitement', variant: 'info' },
  COMPLETED: { label: 'Payé', variant: 'success' },
  FAILED: { label: 'Échoué', variant: 'error' },
  REFUNDED: { label: 'Remboursé', variant: 'info' },
};

const TERMINAL_STATUSES: PaymentStatus[] = ['COMPLETED', 'FAILED', 'REFUNDED'];
const POLL_INTERVAL = 5000;
const POLL_TIMEOUT = 120000;

export default function PaymentScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading: bookingLoading } = useBooking(bookingId);
  const { data: existingPayment, isLoading: paymentLoading, refetch: refetchPayment } = usePaymentForBooking(bookingId);
  const initiateMutation = useInitiatePayment();

  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [polling, setPolling] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStart = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!existingPayment) return;

    if (TERMINAL_STATUSES.includes(existingPayment.status)) {
      setPolling(false);
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
      return;
    }

    if (!pollTimer.current) {
      setPolling(true);
      pollStart.current = Date.now();
      pollTimer.current = setInterval(() => {
        if (Date.now() - pollStart.current > POLL_TIMEOUT) {
          setPolling(false);
          if (pollTimer.current) {
            clearInterval(pollTimer.current);
            pollTimer.current = null;
          }
          return;
        }
        refetchPayment();
      }, POLL_INTERVAL);
    }
  }, [existingPayment, refetchPayment]);

  const handleInitiate = async () => {
    if (!selectedProvider || !bookingId) return;

    if (!phoneNumber || !/^\+\d{10,15}$/.test(phoneNumber)) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide au format +225XXXXXXXX');
      return;
    }

    try {
      await initiateMutation.mutateAsync({
        bookingId,
        provider: selectedProvider,
        phoneNumber,
      });
      refetchPayment();
    } catch {
      Alert.alert('Erreur', "Impossible d'initier le paiement.");
    }
  };

  if (bookingLoading || paymentLoading) {
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

  if (existingPayment) {
    const statusInfo = PAYMENT_STATUS_LABELS[existingPayment.status];
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.statusBanner}>
            <Ionicons
              name={existingPayment.status === 'COMPLETED' ? 'checkmark-circle' : existingPayment.status === 'FAILED' ? 'close-circle' : 'hourglass'}
              size={48}
              color={existingPayment.status === 'COMPLETED' ? colors.success : existingPayment.status === 'FAILED' ? colors.error : colors.warning}
            />
            <Text variant="h2" align="center">
              {existingPayment.status === 'COMPLETED' ? 'Paiement réussi' : existingPayment.status === 'FAILED' ? 'Paiement échoué' : 'Paiement en cours'}
            </Text>
            <Badge label={statusInfo.label} variant={statusInfo.variant} />
          </View>

          <Divider />

          <View style={styles.detailSection}>
            <DetailRow label="Montant" value={formatCurrency(existingPayment.amount)} />
            <DetailRow label="Moyen" value={existingPayment.provider ? (PROVIDERS.find((p) => p.value === existingPayment.provider)?.label || existingPayment.provider) : '-'} />
            {existingPayment.providerRef && <DetailRow label="Référence" value={existingPayment.providerRef} />}
            <DetailRow label="Statut" value={statusInfo.label} />
          </View>

          {polling && (
            <View style={styles.pollingBanner}>
              <Ionicons name="reload" size={16} color={colors.info} />
              <Text variant="bodySmall" color={colors.info}>Vérification en cours...</Text>
            </View>
          )}

          {existingPayment.status === 'COMPLETED' && (
            <View style={styles.actions}>
              <Button
                title="Laisser un avis"
                onPress={() => router.replace({ pathname: '/(client)/review', params: { bookingId } })}
                size="lg"
              />
              <Button
                title="Retour à l'accueil"
                onPress={() => router.replace('/(client)/(tabs)/home')}
                variant="outline"
                size="lg"
              />
            </View>
          )}

          {existingPayment.status === 'FAILED' && (
            <View style={styles.actions}>
              <Text variant="bodySmall" color={colors.error} align="center">
                Le paiement a échoué. Vous pouvez réessayer.
              </Text>
              <Button
                title="Réessayer"
                onPress={() => router.replace({ pathname: '/(client)/payment', params: { bookingId } })}
                size="lg"
              />
            </View>
          )}

          <DevNotice />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {booking && (
          <View style={styles.amountSection}>
            <Text variant="bodySmall" color={colors.textSecondary}>Montant à payer</Text>
            <Text variant="display" color={colors.primary}>{formatCurrency(booking.totalAmount)}</Text>
          </View>
        )}

        <Divider />

        <View style={styles.providerSection}>
          <Text variant="h3">Moyen de paiement</Text>
          <View style={styles.providerList}>
            {PROVIDERS.map((provider) => (
              <Pressable
                key={provider.value}
                style={[styles.providerCard, selectedProvider === provider.value && styles.providerCardSelected]}
                onPress={() => setSelectedProvider(provider.value)}
                accessibilityLabel={provider.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedProvider === provider.value }}
              >
                <Ionicons name={provider.icon} size={24} color={selectedProvider === provider.value ? colors.primary : colors.textSecondary} />
                <Text variant="bodySmall" color={selectedProvider === provider.value ? colors.primary : colors.text}>
                  {provider.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <DevNotice />

        <View style={styles.phoneSection}>
          <Text variant="h3">Numéro de téléphone</Text>
          <TextInput
            style={styles.phoneInput}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+225XXXXXXXX"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Payer"
            onPress={handleInitiate}
            loading={initiateMutation.isPending}
            disabled={!selectedProvider || !phoneNumber || initiateMutation.isPending}
            size="lg"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DevNotice() {
  return (
    <View style={styles.devNotice}>
      <Ionicons name="information-circle" size={16} color={colors.warning} />
      <Text variant="bodySmall" color={colors.warning}>
        Les paiements sont en mode développement. Aucune transaction réelle n{"'"}est effectuée.
      </Text>
    </View>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>Paiement</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="bodySmall" color={colors.textSecondary}>{label}</Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  loadingContent: { padding: spacing.xl, gap: spacing.lg },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  amountSection: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  statusBanner: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  detailSection: { paddingVertical: spacing.lg, gap: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  providerSection: { paddingVertical: spacing.lg, gap: spacing.md },
  providerList: { gap: spacing.sm },
  providerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  providerCardSelected: { borderColor: colors.primary, backgroundColor: colors.successLightest },
  pollingBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center', paddingVertical: spacing.md },
  devNotice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.warningLight, borderRadius: radius.md, marginTop: spacing.lg },
  phoneSection: { paddingVertical: spacing.lg, gap: spacing.md },
  phoneInput: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 16, color: colors.text },
  actions: { paddingTop: spacing.xl, gap: spacing.md },
});
