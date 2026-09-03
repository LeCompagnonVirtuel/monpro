import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Text } from '@/components/ui';

export default function TermsScreen() {
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
          <Text variant="h3" style={styles.headerTitle}>Conditions d\u2019utilisation</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text variant="caption" color={colors.textTertiary}>Dernière mise à jour : 2 septembre 2026</Text>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>1. Acceptation des conditions</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            {"En utilisant MONPRO, vous acceptez les présentes conditions d\u2019utilisation. Si vous n\u2019acceptez pas ces conditions, veuillez ne pas utiliser l\u2019application."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>2. Description du service</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            {"MONPRO est une plateforme de mise en relation entre des clients recherchant des services et des professionnels vérifiés en Côte d\u2019Ivoire. La plateforme facilite la recherche, la demande de devis, la réservation et le paiement de services."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>3. Inscription</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            {"Pour utiliser MONPRO, vous devez créer un compte en fournissant des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>4. Obligations des utilisateurs</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            Vous vous engagez à :
          </Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Utiliser MONPRO de manière légale et respectueuse</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Ne pas fournir de fausses informations</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Ne pas harceler ou menacer les autres utilisateurs</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.listItem}>{'\u2022'} Respecter les droits des professionnels</Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>5. Paiements</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            {"Les paiements sont traités via les prestataires de paiement intégrés (Orange Money, MTN MoMo, Wave). MONPRO ne stocke pas vos informations bancaires. Les tarifs sont fixés par les professionnels."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>6. Annulations et remboursements</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            {"Les conditions d\u2019annulation et de remboursement sont définies par chaque professionnel. En cas de litige, MONPRO peut intervenir comme médiateur."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>7. Propriété intellectuelle</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            {"Tous les contenus de l\u2019application (logo, texte, design) sont la propriété de MONPRO et ne peuvent être reproduits sans autorisation."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>8. Limitation de responsabilité</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            {"MONPRO agit comme intermédiaire entre clients et professionnels. Nous ne sommes pas responsables de la qualité des services fournis par les professionnels."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>9. Modification des conditions</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            {"MONPRO se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront notifiés des changements importants."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>10. Contact</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.paragraph}>
            Pour toute question : legal@monpro.ci
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
