import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Button, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAddresses, useCreateAddress, useDeleteAddress, useSetDefaultAddress } from '@/hooks/use-addresses';
import { getErrorMessage } from '@/lib/api-errors';

const QUICK_LABELS = ['Maison', 'Travail', 'Bureau'];

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const { data: addresses, isLoading, error, refetch } = useAddresses();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleUseCurrentLocation = useCallback(async () => {
    setGpsLoading(true);
    setGpsError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Autorisez la localisation dans les paramètres de votre téléphone pour utiliser cette fonctionnalité.');
        setGpsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      const [result] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (result) {
        const parts = [result.name, result.street, result.district, result.city, result.region, result.country].filter(Boolean);
        setFullAddress(parts.join(', '));
        if (!label) {
          setLabel(result.city || 'Ma position');
        }
      }
    } catch {
      setGpsError('Impossible d\'obtenir votre position. Vérifiez que la localisation est activée.');
    } finally {
      setGpsLoading(false);
    }
  }, [label]);

  const handleCreate = async () => {
    if (!fullAddress.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse ou utiliser votre position.');
      return;
    }
    try {
      await createAddress.mutateAsync({
        label: label || undefined,
        fullAddress: fullAddress.trim(),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      });
      setShowForm(false);
      setLabel('');
      setFullAddress('');
      setLatitude(null);
      setLongitude(null);
      setGpsError(null);
    } catch {
      Alert.alert('Erreur', "Impossible d'ajouter l'adresse.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer cette adresse ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress.mutateAsync(id);
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer.');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id);
    } catch {
      Alert.alert('Erreur', 'Impossible de définir par défaut.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header onAdd={() => setShowForm(!showForm)} />
        <View style={styles.loadingContent}>
          <Skeleton width="100%" height={80} />
          <Skeleton width="100%" height={80} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header onAdd={() => setShowForm(!showForm)} />
        <ErrorState message={getErrorMessage(error, 'Impossible de charger les adresses')} onRetry={refetch} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header onAdd={() => setShowForm(!showForm)} />

      {showForm && (
        <View style={styles.formCard}>
          {/* GPS Button */}
          <Pressable
            style={styles.gpsButton}
            onPress={handleUseCurrentLocation}
            disabled={gpsLoading}
            accessibilityLabel="Utiliser ma position actuelle"
            accessibilityRole="button"
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="location-outline" size={22} color={colors.primary} />
            )}
            <View style={styles.gpsButtonText}>
              <Text variant="bodyMedium" color={colors.primary}>
                {gpsLoading ? 'Localisation en cours...' : 'Utiliser ma position actuelle'}
              </Text>
              <Text variant="caption" color={colors.textTertiary}>
                GPS + géocodage automatique
              </Text>
            </View>
          </Pressable>

          {gpsError && (
            <View style={styles.gpsErrorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text variant="caption" color={colors.error}>{gpsError}</Text>
            </View>
          )}

          {latitude && longitude && (
            <View style={styles.coordsBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text variant="caption" color={colors.success}>
                Position captée ({latitude.toFixed(4)}, {longitude.toFixed(4)})
              </Text>
            </View>
          )}

          {/* Quick labels */}
          <View style={styles.quickLabels}>
            {QUICK_LABELS.map((ql) => (
              <Pressable
                key={ql}
                style={[styles.quickLabel, label === ql && styles.quickLabelActive]}
                onPress={() => setLabel(ql)}
              >
                <Text variant="caption" color={label === ql ? colors.primary : colors.textSecondary}>{ql}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Nom de l'adresse (ex: Maison)"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Nom de l'adresse"
          />
          <TextInput
            style={styles.input}
            value={fullAddress}
            onChangeText={setFullAddress}
            placeholder="Adresse complète"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Adresse complète"
          />
          <View style={styles.formActions}>
            <Button
              title="Annuler"
              onPress={() => { setShowForm(false); setLabel(''); setFullAddress(''); setLatitude(null); setLongitude(null); setGpsError(null); }}
              variant="outline"
              size="sm"
            />
            <Button
              title={createAddress.isPending ? 'Ajout...' : 'Ajouter'}
              onPress={handleCreate}
              disabled={createAddress.isPending || !fullAddress.trim()}
              size="sm"
            />
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!addresses || addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="location-outline" size={56} color={colors.textTertiary} />
            </View>
            <Text variant="h3" color={colors.text} align="center">
              Aucune adresse enregistrée
            </Text>
            <Text variant="body" color={colors.textSecondary} align="center" style={styles.emptyDescription}>
              Ajoutez vos adresses pour faciliter vos réservations de services.
            </Text>
            <Button
              title="Ajouter une adresse"
              onPress={() => setShowForm(true)}
              variant="primary"
              size="md"
              style={styles.addButton}
            />
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={[styles.addressCard, address.isDefault && styles.addressCardDefault]}>
              <View style={styles.addressHeader}>
                <View style={styles.addressInfo}>
                  {address.label && (
                    <Text variant="bodyMedium" color={colors.primary}>{address.label}</Text>
                  )}
                  <Text variant="body">{address.fullAddress}</Text>
                  {address.latitude != null && address.longitude != null && (
                    <Text variant="caption" color={colors.textTertiary}>
                      GPS: {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
                    </Text>
                  )}
                </View>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text variant="caption" color={colors.primary}>Par défaut</Text>
                  </View>
                )}
              </View>
              <View style={styles.addressActions}>
                {!address.isDefault && (
                  <Pressable onPress={() => handleSetDefault(address.id)} style={styles.actionBtn}>
                    <Ionicons name="star-outline" size={18} color={colors.textSecondary} />
                    <Text variant="caption" color={colors.textSecondary}>Par défaut</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => handleDelete(address.id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text variant="caption" color={colors.error}>Supprimer</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Header({ onAdd }: { onAdd: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Retour" accessibilityRole="button">
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.text}
          />
        </Pressable>
        <Text variant="h2" color={colors.text}>Adresses enregistrées</Text>
        <Pressable onPress={onAdd} style={styles.headerRight}>
          <Ionicons name="add" size={28} color={colors.secondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerRight: {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  formCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  gpsButtonText: {
    flex: 1,
  },
  gpsErrorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: radius.sm,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  quickLabels: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickLabel: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLabelActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyDescription: {
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  addButton: {
    marginTop: spacing.lg,
    minWidth: 200,
  },
  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  addressCardDefault: {
    borderColor: colors.primary,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  addressInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  defaultBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  addressActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
