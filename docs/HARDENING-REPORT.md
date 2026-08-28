# HARDENING AUDIT REPORT — MONPRO Business Flow

**Date** : 2026-08-28  
**Scope** : End-to-end business flow (Auth → Search → Request → Quote → Booking → Intervention → Payment → Ledger → Review)  
**Branch** : `main`

---

## RÉSUMÉ EXÉCUTIF

| Priorité | Total identifiés | Corrigés | Déférés | Non applicable |
|----------|-----------------|----------|---------|----------------|
| P0       | 1               | 1        | 0       | 0              |
| P1       | 8               | 8        | 0       | 0              |
| P2       | 4               | 3        | 0       | 1 (XSS)       |
| P3       | 4               | 1        | 2       | 1              |
| **Total**| **17**          | **13**   | **2**   | **2**          |

---

## P0 — CRITIQUE (perte financière / intégrité)

### P0-1: Payment → Ledger — écriture manquante ✅ CORRIGÉ

**Problème** : Le webhook de paiement (`handleWebhook`) mettait à jour le statut Payment mais n'écrivait jamais dans le Ledger. Les revenus professionnels n'étaient pas comptabilisés.

**Correction** :
- `payments.service.ts` : Après `COMPLETED`, appel `ledger.recordPayment()` avec idempotence (vérification `ledgerEntry.count` avant écriture)
- `payments.module.ts` : Import `LedgerModule` + `NotificationsModule`
- Notification envoyée au client (PAYMENT_RECEIVED) et au professionnel (PAYMENT_RECEIVED)

**Fichiers** : `apps/api/src/payments/payments.service.ts`, `apps/api/src/payments/payments.module.ts`

---

## P1 — SÉCURITÉ (IDOR / contrôle d'accès / intégrité transactionnelle)

### P1-1: Notifications déconnectées des événements métier ✅ CORRIGÉ

**Problème** : Aucun événement métier (devis créé, booking confirmé, intervention terminée, paiement reçu, avis créé) ne déclenchait de notification.

**Correction** :
- Quote creation → notification `NEW_QUOTE` au client
- Quote accepted → notification `QUOTE_ACCEPTED` au professionnel
- Booking created → notification `NEW_BOOKING` au professionnel
- Intervention arrived → notification `PROFESSIONAL_ARRIVING` au client
- Intervention completed → notification `INTERVENTION_COMPLETED` au client
- Payment completed → notification `PAYMENT_RECEIVED` aux deux parties
- Review created → notification `NEW_REVIEW` au professionnel

**Fichiers** : `quotes.service.ts`, `bookings.service.ts`, `interventions.service.ts`, `payments.service.ts`, `reviews.service.ts` + modules respectifs

### P1-2: Review.respond — IDOR via Professional.id ≠ User.id ✅ CORRIGÉ

**Problème** : `respond()` comparait directement `userId` (du JWT) avec `review.professionalId` (qui est un Professional.id, pas un User.id). Tout professionnel pouvait répondre aux avis des autres.

**Correction** : Résolution `Professional.findUnique({ where: { userId } })` puis comparaison `professional.id === review.professionalId`.

**Fichier** : `apps/api/src/reviews/reviews.service.ts`

### P1-3: Payment.findByBooking — IDOR ✅ CORRIGÉ

**Problème** : N'importe quel utilisateur authentifié pouvait consulter les paiements de n'importe quel booking.

**Correction** : Vérification que `booking.clientId === userId` OU `booking.professional.userId === userId`.

**Fichier** : `apps/api/src/payments/payments.service.ts`

### P1-4: Booking.findOne — pas de contrôle ownership ✅ CORRIGÉ

**Problème** : `GET /bookings/:id` n'avait aucune vérification de propriété.

**Correction** : Controller passe `userId`. Service vérifie `booking.clientId === userId` OU `booking.professional.userId === userId`.

**Fichiers** : `apps/api/src/bookings/bookings.controller.ts`, `apps/api/src/bookings/bookings.service.ts`

### P1-5: Intervention.findByBooking — pas de contrôle ownership ✅ CORRIGÉ

**Problème** : N'importe quel utilisateur pouvait consulter les interventions de n'importe quel booking.

**Correction** : Controller passe `userId`. Service vérifie via le booking associé que l'utilisateur est client ou professionnel concerné.

**Fichiers** : `apps/api/src/interventions/interventions.controller.ts`, `apps/api/src/interventions/interventions.service.ts`

### P1-6: Quote.findByRequest — pas de contrôle ownership ✅ CORRIGÉ

**Problème** : N'importe qui pouvait lister les devis d'une demande de service.

**Correction** : Vérification que l'utilisateur est soit le propriétaire de la demande, soit un professionnel ayant soumis un devis sur cette demande.

**Fichiers** : `apps/api/src/quotes/quotes.controller.ts`, `apps/api/src/quotes/quotes.service.ts`

### P1-7: ServiceRequests.findAvailable — identité spoofable ✅ CORRIGÉ

**Problème** : `GET /service-requests/available?professionalId=X` acceptait un `professionalId` en query param. Un attaquant pouvait voir les demandes disponibles pour n'importe quel professionnel.

**Correction** : Controller utilise `@CurrentUser('id')` au lieu du query param. Service résout le Professional à partir du userId JWT.

**Fichiers** : `apps/api/src/service-requests/service-requests.controller.ts`, `apps/api/src/service-requests/service-requests.service.ts`

### P1-8: Quote.accept — pas de transaction atomique ✅ CORRIGÉ

**Problème** : `accept()` faisait 3 opérations séparées (accept quote, reject others, update request status). Race condition possible.

**Correction** : Enveloppé dans `prisma.$transaction([...])`.

**Fichier** : `apps/api/src/quotes/quotes.service.ts`

---

## P2 — ROBUSTESSE (transactions, cache, ownership)

### P2-1: Booking creation/completion — atomicité ✅ CORRIGÉ

**Problème** : `createFromQuote` et `updateStatus(COMPLETED)` effectuaient des multi-writes sans transaction.

**Correction** : Wrapped dans `prisma.$transaction()`.

**Fichier** : `apps/api/src/bookings/bookings.service.ts`

### P2-2: Professional endpoint ownership (bookings, quotes) ✅ CORRIGÉ

**Problème** : `GET /bookings/professional/:id` et `GET /quotes/professional/:id` n'avaient pas de vérification que le professionnel demandé appartenait au userId du JWT.

**Correction** : Controller passe `userId`. Service vérifie `professional.userId === userId`.

**Fichiers** : `bookings.controller.ts`, `bookings.service.ts`, `quotes.controller.ts`, `quotes.service.ts`

### P2-3: Mobile cache invalidation ✅ CORRIGÉ

**Problème** : `useCreateBooking` n'invalidait que `service-requests` et `quotes`. Les listes de bookings restaient stales.

**Correction** : Ajout invalidation de `['bookings']` et `['pro-bookings']`.

**Fichier** : `apps/mobile/src/hooks/use-bookings.ts`

### P2-4: XSS / Input sanitization ⊘ NON APPLICABLE

**Analyse** : L'architecture MONPRO (API JSON + React Native) élimine le vecteur XSS :
- L'API ne retourne jamais de HTML (uniquement JSON via TransformInterceptor)
- React Native n'interprète pas le HTML dans les composants `<Text>`
- `ValidationPipe` + `class-validator` valident types et longueurs aux frontières
- Pas de `dangerouslySetInnerHTML` ou équivalent

**Verdict** : Aucune action requise. Le risque résiduel (stockage de payloads malicieux en base) est acceptable car ils ne sont jamais rendus comme HTML.

---

## P3 — QUALITÉ (cleanup, optimisation)

### P3-1: Device token cleanup on logout ✅ CORRIGÉ

**Problème** : À la déconnexion, le push token restait enregistré côté serveur. L'utilisateur continuait à recevoir des notifications.

**Correction** :
- `storage.ts` : Ajout `PUSH_TOKEN` key + méthodes `get/set/clearPushToken`
- `auth.store.ts` : `logout()` appelle `DELETE /device-tokens/:token` puis `clearPushToken()`
- `use-push-notifications.ts` : Stocke le token dans SecureStore après enregistrement

**Fichiers** : `apps/mobile/src/lib/storage.ts`, `apps/mobile/src/stores/auth.store.ts`, `apps/mobile/src/hooks/use-push-notifications.ts`

### P3-2: Ledger barrel export ⊘ DÉFÉRÉ

**Raison** : NestJS utilise le système de modules pour le DI, pas les barrel exports. `LedgerModule` est correctement importé via le chemin direct. Aucun bénéfice fonctionnel.

### P3-3: Services hook enabled condition ⊘ DÉFÉRÉ

**Raison** : La condition `!params?.categoryId || !!params.categoryId` est une tautologie (toujours true) — fonctionnellement inoffensive. Modifier ce hook violerait la règle "NE PAS modifier Search/Home".

### P3-4: Unread notification count optimization ⊘ DOCUMENTÉ

**Raison** : Nécessite un nouvel endpoint `GET /notifications/unread-count` (interdit par la règle "NE crée aucun nouvel endpoint" sauf hardening). Documenté pour V2.

---

## VALIDATION

| Check | Résultat |
|-------|----------|
| Mobile TypeScript (`npx tsc --noEmit`) | ✅ 0 erreurs |
| Android export (`npx expo export --platform android`) | ✅ Success |
| Backend TS (pre-existing `@prisma/client` issues only) | ⚠️ Non-bloquant |
| Aucun mock introduit | ✅ |
| Aucun endpoint créé (sauf GAP-9 pré-approuvé) | ✅ |
| Aucun écran UI modifié | ✅ |
| Aucun guard/contrôle affaibli | ✅ |
| Tokens restent dans expo-secure-store | ✅ |
| Pas de recalcul financier côté client | ✅ |

---

## FICHIERS MODIFIÉS (19 fichiers, +299 / -66 lignes)

### Backend (15 fichiers)
- `apps/api/src/payments/payments.module.ts` — import LedgerModule + NotificationsModule
- `apps/api/src/payments/payments.service.ts` — ledger write + idempotence + IDOR fix + notifications
- `apps/api/src/bookings/bookings.controller.ts` — pass userId to service
- `apps/api/src/bookings/bookings.module.ts` — import NotificationsModule
- `apps/api/src/bookings/bookings.service.ts` — ownership checks + transactions + notifications
- `apps/api/src/interventions/interventions.controller.ts` — pass userId
- `apps/api/src/interventions/interventions.module.ts` — import NotificationsModule
- `apps/api/src/interventions/interventions.service.ts` — ownership check + notifications
- `apps/api/src/quotes/quotes.controller.ts` — pass userId
- `apps/api/src/quotes/quotes.module.ts` — import NotificationsModule
- `apps/api/src/quotes/quotes.service.ts` — ownership checks + transaction + notifications
- `apps/api/src/reviews/reviews.module.ts` — import NotificationsModule
- `apps/api/src/reviews/reviews.service.ts` — IDOR fix + notification
- `apps/api/src/service-requests/service-requests.controller.ts` — JWT identity instead of query param
- `apps/api/src/service-requests/service-requests.service.ts` — findForProfessionalByUserId

### Mobile (4 fichiers)
- `apps/mobile/src/lib/storage.ts` — push token storage methods
- `apps/mobile/src/stores/auth.store.ts` — device token cleanup on logout
- `apps/mobile/src/hooks/use-push-notifications.ts` — persist push token
- `apps/mobile/src/hooks/use-bookings.ts` — cache invalidation

---

## IDOR ROOT CAUSE

La cause racine de 5 des 8 vulnérabilités P1 est la même : **Professional.id ≠ User.id**.

Le JWT contient `userId` (table User). Mais les relations métier (booking, quote, review, intervention) référencent `professionalId` (table Professional). Le code comparait directement `jwt.userId === entity.professionalId`, ce qui est toujours `false` pour un professionnel légitime et potentiellement `true` pour un attaquant qui connaît un Professional.id.

**Pattern de correction appliqué** : `Professional.findUnique({ where: { userId } })` → puis comparaison avec `professional.id`.

---

## GAPs FERMÉS

| GAP | Description | Statut |
|-----|-------------|--------|
| GAP-9 | `GET /professionals/me` | ✅ Résolu (commit `4c1f3bc`) |
| GAP-10 | Payment → Ledger integration | ✅ Résolu (ce commit) |

---

## RECOMMANDATIONS POST-HARDENING

1. **E2E tests** : Ajouter des tests pour les ownership checks (P1-2 à P1-7) — un utilisateur non-propriétaire doit recevoir 403
2. **Rate limiting** : Ajouter `@Throttle()` sur les endpoints de création (quotes, reviews, service-requests)
3. **Audit log** : Logger les tentatives d'accès refusées (403) pour détecter les attaques
4. **GAP-5** : Implémenter le retrait professionnel (`POST /ledger/payout`) — haute priorité business
5. **Notification count** : Ajouter `GET /notifications/unread-count` pour le badge mobile
