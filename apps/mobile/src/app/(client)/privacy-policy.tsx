import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text } from '@/components/ui';

export default function PrivacyPolicyScreen() {
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
          <Text variant="h3" style={styles.headerTitle}>Politique de confidentialité</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text variant="caption" color={colors.textTertiary}>Dernière mise à jour : 2 septembre 2026</Text>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>1. Collecte des données</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            {"MONPRO collecte les données personnelles que vous fournissez lors de votre inscription et de l'utilisation de nos services, notamment :"}
          </Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Nom et prénom</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Adresse email</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Numéro de téléphone</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Adresse de localisation</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Photo de profil</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Documents de vérification (KYC)</Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>2. Utilisation des données</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            Vos données sont utilisées pour :
          </Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Fournir et améliorer nos services</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Mettre en relation clients et professionnels</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Traitement des paiements</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Communication concernant vos demandes</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Sécurité et prévention de la fraude</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Conformité légale</Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>3. Partage des données</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            Vos données peuvent être partagées avec :
          </Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Le professionnel choisi pour une intervention</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Les prestataires de paiement</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Les autorités compétentes en cas d\u2019obligation légale</Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>4. Sécurité</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            {"Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, altération, divulgation ou destruction."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>5. Vos droits</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            Conformément à la réglementation en vigueur, vous disposez des droits suivants :
          </Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Droit d\u2019accès à vos données</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Droit de rectification</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Droit de suppression</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Droit d\u2019opposition au traitement</Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>6. Contact</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            Pour toute question concernant cette politique, contactez-nous à : privacy@monpro.ci
          </Text>
        </View>

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
  section: { marginTop: spacing.xl, gap: spacing.sm },
  sectionTitle: { letterSpacing: -0.2 },
  paragraph: { lineHeight: 22 },
  listItem: { lineHeight: 22, paddingLeft: spacing.sm },
  bottomSpacer: { height: spacing.xxxl },
});
