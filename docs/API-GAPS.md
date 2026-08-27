# MONPRO API V1 — Gaps identifiés pour le mobile

## GAP-1: Client bookings list

- **Endpoint manquant** : `GET /api/v1/bookings` (pour le client connecté)
- **Feature** : Écran "Mes réservations" côté client
- **Problème** : Seuls `GET /bookings/{id}` et `GET /bookings/professional/{professionalId}` existent. Un client ne peut pas lister ses propres réservations.
- **Données attendues** : Liste paginée des bookings du client avec statut, professionnel, date, montant
- **Pourquoi nécessaire** : Écran central du parcours client (historique, suivi)
- **Solution suggérée** : Ajouter `GET /api/v1/bookings` filtré par le userId du JWT (rôle CLIENT)

## GAP-2: Service favorites

- **Endpoint manquant** : `POST/DELETE /api/v1/favorites/services/{serviceId}`
- **Feature** : Favoris de services (pas seulement de professionnels)
- **Problème** : L'API supporte uniquement les favoris de professionnels
- **Données attendues** : CRUD favori sur un service
- **Pourquoi nécessaire** : Spécification mobile prévoit favoris services + professionnels
- **Solution suggérée** : Non bloquant — implémenter uniquement les favoris professionnels pour V1

## GAP-3: KYC submission

- **Endpoint manquant** : Endpoint dédié pour soumettre des documents KYC
- **Feature** : Onboarding professionnel — étape vérification identité
- **Problème** : Pas d'endpoint `POST /api/v1/kyc` ou similaire visible dans l'OpenAPI
- **Données attendues** : Upload document (CNI/passeport) + type + soumission pour review
- **Pourquoi nécessaire** : Un professionnel doit pouvoir soumettre ses documents pour passer VERIFIED
- **Solution suggérée** : Vérifier si la vérification passe par `PATCH /admin/verifications/{id}` uniquement (admin-initiated) ou s'il faut ajouter un endpoint de soumission côté pro

## GAP-4: Payment provider configuration

- **Endpoint manquant** : Aucun endpoint pour vérifier si les providers de paiement sont réellement configurés
- **Feature** : Paiement mobile money (Orange Money, MTN MoMo, Moov Money, Wave)
- **Problème** : Le backend utilise potentiellement un DevPaymentProvider en développement. Le mobile ne peut pas distinguer un paiement réel d'un paiement simulé.
- **Impact** : Le mobile affiche un avertissement "mode développement" sur l'écran de paiement
- **Solution suggérée** : Exposer `GET /payments/config` retournant les providers actifs et leur mode (live/sandbox/dev)

## GAP-5: Professional payout/withdrawal

- **Endpoint manquant** : `POST /api/v1/ledger/payout` ou équivalent
- **Domaine** : Ledger / Revenus professionnels
- **Feature** : Retrait des fonds par le professionnel
- **Problème** : `GET /ledger/wallet` permet de voir le solde mais aucun endpoint ne permet de demander un retrait
- **Impact** : Le professionnel voit ses revenus mais ne peut pas les retirer. Un message informatif est affiché.
- **Priorité** : HAUTE
- **Statut** : EN ATTENTE

## GAP-6: Professional statistics endpoint

- **Endpoint manquant** : `GET /api/v1/professionals/:id/stats`
- **Domaine** : Statistiques professionnelles
- **Feature** : Dashboard stats (taux d'acceptation, taux d'annulation, demandes reçues, etc.)
- **Problème** : Le dashboard calcule les compteurs à partir des listes (requests count, bookings count) mais n'a pas accès aux métriques agrégées comme le taux d'acceptation
- **Impact** : Le dashboard affiche uniquement les compteurs disponibles via les endpoints de liste
- **Priorité** : MOYENNE
- **Statut** : EN ATTENTE

## GAP-7: Professional portfolio/photos

- **Endpoint manquant** : `POST/GET /api/v1/professionals/:id/portfolio`
- **Domaine** : Profil professionnel
- **Feature** : Portfolio de photos de réalisations
- **Problème** : Pas d'endpoint dédié pour stocker/lister les photos de réalisations d'un professionnel (distinct des photos d'intervention)
- **Impact** : L'onboarding ne propose pas l'étape "photos de réalisations"
- **Priorité** : BASSE
- **Statut** : EN ATTENTE

## GAP-8: Professional pricing/tarifs

- **Endpoint manquant** : `GET/PUT /api/v1/professionals/:id/pricing`
- **Domaine** : Tarification
- **Feature** : Tarifs indicatifs par service du professionnel
- **Problème** : Pas d'endpoint pour stocker les tarifs indicatifs par service. Les devis sont ponctuels mais les tarifs de base ne sont pas exposés.
- **Impact** : Pas d'affichage "à partir de X FCFA" sur le profil professionnel
- **Priorité** : BASSE
- **Statut** : EN ATTENTE

## GAP-9: Professional self-profile endpoint

- **Endpoint manquant** : `GET /api/v1/professionals/me`
- **Domaine** : Profil professionnel
- **Feature** : Récupération du profil professionnel de l'utilisateur connecté
- **Problème** : Aucun endpoint ne permet de récupérer directement le profil professionnel par le userId du JWT. Le mobile doit lister tous les professionnels puis filtrer côté client par `userId`. Le champ `search` du `GET /professionals` ne supporte pas la recherche par userId (il cherche dans fullName, businessName, description uniquement).
- **Contournement actuel** : `GET /professionals?limit=100` + filtrage client par `professional.userId === currentUser.id`
- **Impact** : Fonctionne pour < 100 professionnels. Non scalable au-delà.
- **Solution suggérée** : Ajouter `GET /api/v1/professionals/me` qui utilise le userId du JWT pour faire `prisma.professional.findUnique({ where: { userId } })` avec les mêmes includes que `findOne`
- **Priorité** : HAUTE
- **Statut** : EN ATTENTE
