import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text, Badge, Button, Skeleton, Divider } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useBooking, useCreateBooking, useCancelBooking } from '@/hooks/use-bookings';
import { useQuotesForRequest } from '@/hooks/use-quotes';
import { BookingStatus, CreateBookingPayload } from '@/api/bookings';
import { formatCurrency, formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/api-errors';
import { messages } from '@/constants/messages';

const STATUS_LABELS: Record<BookingStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'error' }> = {
  PENDING: { label: messages.status.pending, variant: 'warning' },
  CONFIRMED: { label: messages.status.confirmed, variant: 'success' },
  ARRIVING: { label: messages.status.enRoute, variant: 'info' },
  IN_PROGRESS: { label: messages.status.inProgress, variant: 'warning' },
  COMPLETED: { label: messages.status.completed, variant: 'success' },
  CANCELLED: { label: messages.status.cancelled, variant: 'error' },
  DISPUTED: { label: messages.status.dispute, variant: 'error' },
};

export default function BookingDetailScreen() {
  const { bookingId, quoteId, requestId } = useLocalSearchParams<{ bookingId?: string; quoteId?: string; requestId?: string }>();
  const { data: booking, isLoading: bookingLoading, error: bookingError, refetch, isRefetching } = useBooking(bookingId);
  const { data: quotes } = useQuotesForRequest(requestId);
  const createBooking = useCreateBooking();
  const cancelBooking = useCancelBooking();
  const [creating, setCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });

  const dateOptions = (() => {
    const options: { label: string; date: Date }[] = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayNum = d.getDate();
      const month = d.toLocaleDateString('fr-FR', { month: 'short' });
      options.push({ label: `${dayName} ${dayNum} ${month}`, date: d });
    }
    return options;
  })();

  const handleCancelBooking = () => {
    if (!booking) return;
    Alert.alert(
      messages.booking.cancelTitle,
      messages.booking.cancelMessage,
      [
        { text: messages.common.no, style: 'cancel' },
        {
          text: messages.booking.cancelYes,
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking.mutateAsync({ bookingId: booking.id });
              refetch();
            } catch {
              Alert.alert(messages.common.error, messages.errors.cancelBooking);
            }
          },
        },
      ],
    );
  };

  const acceptedQuote = quotes?.find((q) => q.id === quoteId && q.status === 'ACCEPTED');

  if (bookingId && bookingLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.loadingContent}>
          <Skeleton width="100%" height={80} />
          <Skeleton width="100%" height={150} />
        </View>
      </SafeAreaView>
    );
  }

  if (bookingId && (bookingError || !booking)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ErrorState message={getErrorMessage(bookingError, `${messages.booking.title}${messages.errors.notFound}`)} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (booking) {
    const statusInfo = STATUS_LABELS[booking.status];
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}>
          <View style={styles.confirmationBanner}>
            <LottieView source={require('../../../lotties/Validate button.json')} autoPlay loop={false} style={{ width: 100, height: 100 }} />
            <Text variant="h2" align="center">{messages.booking.confirmed}</Text>
            <Badge label={statusInfo.label} variant={statusInfo.variant} />
          </View>

          <Divider />

          <View style={styles.detailSection}>
            <DetailRow label={messages.booking.reference} value={booking.id.slice(0, 8).toUpperCase()} />
            <DetailRow label={messages.booking.professional} value={booking.professional?.user?.fullName || booking.professional?.businessName || '-'} />
            <DetailRow label={messages.booking.date} value={formatDate(booking.scheduledDate)} />
            {booking.scheduledTime && <DetailRow label={messages.booking.time} value={booking.scheduledTime} />}
            <DetailRow label={messages.booking.amount} value={formatCurrency(booking.totalAmount)} />
            <DetailRow label={messages.booking.status} value={statusInfo.label} />
            {booking.address?.fullAddress && (
              <DetailRow label={messages.booking.address} value={booking.address.fullAddress} />
            )}
          </View>

          <BookingTimeline status={booking.status} />

          <View style={styles.actions}>
            {booking.status === 'CONFIRMED' && (
              <>
                <Button
                  title={messages.booking.viewIntervention}
                  onPress={() => router.push({ pathname: '/(client)/intervention', params: { bookingId: booking.id } })}
                  size="lg"
                />
                <Button
                  title={messages.common.cancel}
                  onPress={handleCancelBooking}
                  variant="outline"
                  size="lg"
                  disabled={cancelBooking.isPending}
                />
              </>
            )}
            {(booking.status === 'IN_PROGRESS' || booking.status === 'ARRIVING') && (
              <Button
                title={messages.booking.followIntervention}
                onPress={() => router.push({ pathname: '/(client)/intervention', params: { bookingId: booking.id } })}
                size="lg"
              />
            )}
            {booking.status === 'COMPLETED' && (
              <>
                <Button
                  title={messages.booking.pay}
                  onPress={() => router.push({ pathname: '/(client)/payment', params: { bookingId: booking.id } })}
                  size="lg"
                />
                <Button
                  title={messages.booking.review}
                  onPress={() => router.push({ pathname: '/(client)/review', params: { bookingId: booking.id } })}
                  variant="outline"
                  size="lg"
                />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (acceptedQuote && !bookingId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}>
          <View style={styles.confirmationBanner}>
            <LottieView source={require('../../../lotties/Validate button.json')} autoPlay loop={false} style={{ width: 100, height: 100 }} />
            <Text variant="h2" align="center">{messages.booking.quoteAccepted}</Text>
            <Text variant="body" color={colors.textSecondary} align="center">
              {messages.booking.createPrompt}
            </Text>
          </View>

          <Divider />

          <View style={styles.detailSection}>
            <DetailRow label={messages.booking.professional} value={acceptedQuote.professional?.businessName || acceptedQuote.professional?.user?.fullName || '-'} />
            <DetailRow label={messages.booking.amount} value={formatCurrency(acceptedQuote.totalAmount)} />
            {acceptedQuote.estimatedDuration && (
              <DetailRow label={messages.booking.delay} value={acceptedQuote.estimatedDuration} />
            )}
          </View>

          <View style={styles.dateSection}>
            <Text variant="bodyMedium" style={styles.dateSectionTitle}>{messages.booking.chooseDate}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateChips}>
              {dateOptions.map((opt) => {
                const isSelected = opt.date.toDateString() === selectedDate.toDateString();
                return (
                  <Pressable
                    key={opt.date.toISOString()}
                    style={[styles.dateChip, isSelected && styles.dateChipActive]}
                    onPress={() => setSelectedDate(opt.date)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={opt.label}
                  >
                    <Text variant="bodySmall" color={isSelected ? colors.textInverse : colors.text}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.actions}>
            <Button
              title={messages.booking.create}
              onPress={() => handleCreateBooking()}
              loading={creating}
              disabled={creating}
              size="lg"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ErrorState message="Données insuffisantes pour afficher la réservation" onRetry={() => router.back()} />
    </SafeAreaView>
  );

  async function handleCreateBooking() {
    if (!acceptedQuote) return;
    setCreating(true);
    try {
      const payload: CreateBookingPayload = {
        quoteId: acceptedQuote.id,
        scheduledDate: selectedDate.toISOString().split('T')[0],
      };
      const newBooking = await createBooking.mutateAsync(payload);
      router.replace({ pathname: '/(client)/booking-detail', params: { bookingId: newBooking.id } });
    } catch {
      Alert.alert(messages.common.error, messages.quote.bookingError);
    } finally {
      setCreating(false);
    }
  }
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} accessibilityLabel={messages.common.back} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text variant="h3" style={styles.headerTitle}>{messages.booking.title}</Text>
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

function BookingTimeline({ status }: { status: BookingStatus }) {
  const steps: { key: BookingStatus; label: string }[] = [
    { key: 'CONFIRMED', label: messages.booking.timeline.confirmed },
    { key: 'ARRIVING', label: messages.booking.timeline.enRoute },
    { key: 'IN_PROGRESS', label: messages.booking.timeline.inProgress },
    { key: 'COMPLETED', label: messages.booking.timeline.completed },
  ];

  const statusOrder: BookingStatus[] = ['PENDING', 'CONFIRMED', 'ARRIVING', 'IN_PROGRESS', 'COMPLETED'];
  const currentIndex = statusOrder.indexOf(status);

  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => {
        const stepIndex = statusOrder.indexOf(step.key);
        const isDone = stepIndex <= currentIndex;
        const isCurrent = stepIndex === currentIndex;

        return (
          <View key={step.key} style={styles.timelineStep}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, isDone && styles.timelineDotDone, isCurrent && styles.timelineDotCurrent]}>
                {isDone && !isCurrent && <Ionicons name="checkmark" size={12} color={colors.textInverse} />}
              </View>
              {index < steps.length - 1 && (
                <View style={[styles.timelineVLine, isDone && styles.timelineVLineDone]} />
              )}
            </View>
            <Text
              variant="bodySmall"
              color={isDone ? colors.text : colors.textTertiary}
              style={styles.timelineLabel}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
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
  confirmationBanner: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  detailSection: { paddingVertical: spacing.lg, gap: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { paddingTop: spacing.xl, gap: spacing.md },
  timeline: { paddingVertical: spacing.lg, paddingLeft: spacing.md },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 44 },
  timelineLeft: { alignItems: 'center', width: 24 },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  timelineDotDone: { backgroundColor: colors.success },
  timelineDotCurrent: { backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.primaryLight },
  timelineVLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  timelineVLineDone: { backgroundColor: colors.success },
  timelineLabel: { marginLeft: spacing.md, paddingTop: 2 },
  dateSection: { paddingVertical: spacing.lg, gap: spacing.md },
  dateSectionTitle: { marginBottom: spacing.xs },
  dateChips: { gap: spacing.sm, paddingRight: spacing.lg },
  dateChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});
