# MONPRO Mobile — Architecture

## Stack technique

| Couche | Technologie | Version |
|--------|------------|---------|
| Runtime | React Native + Expo | SDK 52 |
| Navigation | Expo Router | 4.x |
| Langage | TypeScript | 5.x |
| État serveur | TanStack Query | v5 |
| État local | Zustand | v5 |
| Formulaires | React Hook Form + Zod | |
| HTTP | Axios | |
| Real-time | Socket.IO Client | |
| Stockage sécurisé | expo-secure-store | |
| Push notifications | expo-notifications | |
| Réseau | @react-native-community/netinfo | |

## Principes architecturaux

### Séparation des données

- **TanStack Query** : TOUTES les données serveur (profils, bookings, messages, etc.)
- **Zustand** : UNIQUEMENT l'état d'authentification (`isAuthenticated`, `isLoading`, `role`, `userId`)
- **Pas d'AsyncStorage** pour les tokens — toujours `expo-secure-store`

### Source de vérité

- Le **backend** est la source de vérité pour toutes les données financières
- Ne jamais recalculer côté client (montants, commissions, soldes)
- Ne jamais présenter un paiement simulé comme réel

### API gelée

- Le backend API V1 est gelé — aucune modification côté serveur
- Les manques sont documentés dans `docs/API-GAPS.md`
- Pas de workarounds ni endpoints fictifs

## Structure des dossiers

```
apps/mobile/src/
├── api/              # Fonctions d'appel API (Axios)
│   ├── client.ts     # Instance Axios + intercepteur refresh
│   ├── auth.ts       # Endpoints auth
│   ├── errors.ts     # ApiError class + extractApiError
│   ├── messaging.ts  # Types et endpoints messages
│   └── ledger.ts     # Endpoints wallet/ledger
├── app/              # Routes Expo Router (file-based)
│   ├── (auth)/       # Écrans authentification
│   ├── (client)/     # Espace client
│   │   └── (tabs)/   # Navigation par onglets client
│   └── (professional)/ # Espace professionnel
│       └── (tabs)/   # Navigation par onglets pro
├── components/       # Composants réutilisables
│   ├── ui/           # Composants de base (Button, Text, Input)
│   └── feedback/     # Bannières, alertes (OfflineBanner)
├── hooks/            # Hooks React Query + hooks utilitaires
├── lib/              # Utilitaires (config, socket, query-client, storage)
├── stores/           # Zustand stores (auth uniquement)
├── theme/            # Couleurs, spacing, typography
├── types/            # Types TypeScript partagés
└── __tests__/        # Tests unitaires
```

## Flux d'authentification

```
App start → restoreSession()
  ├── Token absent → (auth)/welcome
  ├── Token présent + /users/me valide + isActive → redirect par rôle
  └── Token présent + /users/me échoue → clear tokens → (auth)/welcome

Login → phone → OTP → login(userId, role, accessToken, refreshToken)
  ├── CLIENT → /(client)/(tabs)/home
  └── PROFESSIONAL → /(professional)/(tabs)/dashboard
```

## Refresh token (single-flight)

1. Une requête reçoit 401
2. Si aucun refresh en cours → lance `POST /auth/refresh` (timeout 15s)
3. Si un refresh est déjà en cours → la requête est mise en queue
4. En cas de succès → toutes les requêtes en queue sont rejouées avec le nouveau token
5. En cas d'échec → `sessionExpiredHandler()` → `logout()` → clear tokens + cache

## Socket.IO

- Namespace : `/chat`
- Auth : `{ token }` dans `socket.auth`
- Sur `connect_error` : lecture d'un token frais depuis le storage
- Lifecycle : connexion à `isAuthenticated=true`, déconnexion à `false`
- Cache TanStack Query mis à jour en temps réel sur `newMessage`

## Gestion réseau

- `useNetworkStatus()` expose `'online' | 'offline' | 'unknown'`
- `OfflineBanner` affichée quand `status === 'offline'`
- TanStack Query gère automatiquement les retries (2 tentatives)

## Configuration centralisée

```typescript
// src/lib/config.ts
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://monpro-api.onrender.com/api/v1';
```

L'URL est configurable via :
1. `app.json` → `extra.apiUrl` (EAS build)
2. Variable d'environnement `EXPO_PUBLIC_API_URL`
3. Fallback production
