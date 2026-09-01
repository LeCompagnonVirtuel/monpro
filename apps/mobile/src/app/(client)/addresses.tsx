import { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { Text, Button, Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAddresses, useCreateAddress, useDeleteAddress, useSetDefaultAddress } from '@/hooks/use-addresses';

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const { data: addresses, isLoading, error, refetch } = useAddresses();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [fullAddress, setFullAddress] = useState('');

  const handleCreate = async () => {
    if (!fullAddress.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse.');
      return;
    }
    try {
      await createAddress.mutateAsync({ label: label || undefined, fullAddress: fullAddress.trim() });
      setShowForm(false);
      setLabel('');
      setFullAddress('');
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
        <ErrorState message="Impossible de charger les adresses" onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header onAdd={() => setShowForm(!showForm)} />

      {showForm && (
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Label (ex: Maison, Bureau)"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            value={fullAddress}
            onChangeText={setFullAddress}
            placeholder="Adresse complète"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.formActions}>
            <Button
              title="Annuler"
              onPress={() => { setShowForm(false); setLabel(''); setFullAddress(''); }}
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
    </View>
  );
}

function Header({ onAdd }: { onAdd: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.headerRow}>
        <Ionicons
          name="chevron-back"
          size={24}
          color={colors.text}
          onPress={() => router.back()}
        />
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
