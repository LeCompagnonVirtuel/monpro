# MONPRO Mobile — Stratégie de tests

## Stack de tests

- **Jest** : test runner
- **@testing-library/react-native** : (disponible pour composants)
- Tests unitaires sur la logique métier, stores, et API

## Exécution

```bash
# Tous les tests
npx jest

# Un fichier spécifique
npx jest src/__tests__/auth-store.test.ts

# Avec couverture
npx jest --coverage

# Watch mode
npx jest --watch
```

## Organisation

```
src/__tests__/
├── auth-store.test.ts         # Store Zustand auth
├── auth-flow.test.ts          # Flux auth complet (phone, OTP, routing, errors)
├── client-core.test.ts        # Hooks client (bookings, categories, requests)
├── communication.test.ts      # Messages, socket, notifications
├── marketplace.test.ts        # Recherche, favoris, filtres
├── professional.test.ts       # Hooks professionnel (dashboard, quotes, interventions)
├── phase8-production.test.ts  # Tests production (config, erreurs, guards, socket)
└── ...
```

## Conventions de mock

### expo-secure-store
```typescript
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
```

### API modules
```typescript
jest.mock('../api/auth', () => ({
  authApi: { logout: jest.fn().mockResolvedValue({}) },
}));
```

### Query client
```typescript
jest.mock('../lib/query-client', () => ({
  queryClient: { clear: jest.fn(), setQueryData: jest.fn() },
}));
```

## Ce qui est testé

| Domaine | Tests | Couverture |
|---------|-------|-----------|
| Auth store | login, logout, restoreSession, guards | 6 tests |
| Auth flow | phone validation, OTP, error mapping, routing, secure storage | 19 tests |
| Client hooks | bookings, categories, requests, profiles | 25 tests |
| Communication | socket, messages, conversations, notifications | 28 tests |
| Marketplace | search, favorites, filters, categories | 54 tests |
| Professional | dashboard, quotes, bookings, interventions, revenue | 48 tests |
| Phase 8 production | config, error codes, role routing, socket, refresh, payments | 26 tests |
| **Total** | | **206 tests** |

## Règles

1. Ne jamais mocker ce qui peut être testé directement
2. Les tokens ne doivent JAMAIS apparaître dans les assertions en clair (utiliser des placeholders)
3. Tester les cas d'erreur autant que les cas nominaux
4. Un test = un comportement vérifié
5. Pas de `test.skip` ni `test.todo` laissés indéfiniment

## CI

```bash
# Pipeline minimale
npx tsc --noEmit && npx eslint src --ext .ts,.tsx --max-warnings 0 && npx jest --no-coverage
```
