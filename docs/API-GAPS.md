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
